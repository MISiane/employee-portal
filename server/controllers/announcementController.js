const pool = require('../config/database');
const cloudinary = require('cloudinary').v2;

// Helper function to sanitize date values
const sanitizeDate = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  return value;
};

// Helper: Determine attachment type from mimetype
const getAttachmentType = (mimetype) => {
  if (!mimetype) return null;
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  return null;
};

// Helper: Delete attachment from Cloudinary
const deleteFromCloudinary = async (url, type) => {
  try {
    if (!url) return;
    
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/xxx/image/upload/v123/announcements/announcement-1-123.jpg
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    
    const resourceType = type === 'pdf' ? 'raw' : 'image';
    const fullPublicId = `announcements/${publicId}`;
    
    await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });
    
  } catch (error) {
    // Don't fail the request if Cloudinary delete fails
    console.error('⚠️ Error deleting from Cloudinary:', error.message);
  }
};

// ===== Get all announcements =====
const getAnnouncements = async (req, res) => {
  const { limit = 10, page = 1, active_only = 'true' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT a.*, u.email, ep.first_name, ep.last_name,
        EXISTS(SELECT 1 FROM polls WHERE announcement_id = a.id) as has_poll
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    if (active_only === 'true') {
      query += ` AND (a.is_active = true OR a.is_active IS NULL)`;
      query += ` AND (a.expires_at IS NULL OR a.expires_at >= CURRENT_DATE)`;
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = `SELECT COUNT(*) FROM announcements WHERE 1=1`;
    if (active_only === 'true') {
      countQuery += ` AND (is_active = true OR is_active IS NULL)`;
      countQuery += ` AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)`;
    }
    
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      announcements: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting announcements:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Get single announcement by ID =====
const getAnnouncementById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT a.*, u.email, ep.first_name, ep.last_name,
        EXISTS(SELECT 1 FROM polls WHERE announcement_id = a.id) as has_poll
       FROM announcements a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Create announcement (Admin only) - WITH ATTACHMENT =====
const createAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { title, content, expires_at } = req.body;
  const userId = req.user.id;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  // ===== Handle Cloudinary attachment =====
  let attachmentUrl = null;
  let attachmentFilename = null;
  let attachmentType = null;
  let attachmentSize = null;
  
  if (req.file) {
    attachmentUrl = req.file.path;  // Cloudinary URL
    attachmentFilename = req.file.originalname;
    attachmentType = getAttachmentType(req.file.mimetype);
    attachmentSize = req.file.size;
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO announcements 
        (title, content, user_id, expires_at, is_active,
         attachment_url, attachment_filename, attachment_type, attachment_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, content, expires_at, created_at, user_id, is_active,
                 attachment_url, attachment_filename, attachment_type, attachment_size`,
      [
        title, 
        content, 
        userId, 
        sanitizeDate(expires_at), 
        true,
        attachmentUrl,
        attachmentFilename,
        attachmentType,
        attachmentSize
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: result.rows[0],
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    
    // If DB insert fails, clean up the uploaded file
    if (attachmentUrl) {
      await deleteFromCloudinary(attachmentUrl, attachmentType);
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Update announcement (Admin only) - WITH ATTACHMENT =====
const updateAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const { title, content, expires_at, is_active, remove_attachment } = req.body;
  
  try {
    // Get existing announcement first (need attachment info)
    const existing = await pool.query(
      'SELECT attachment_url, attachment_type FROM announcements WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const oldAttachment = existing.rows[0];
    
    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    
    if (content !== undefined) {
      updateFields.push(`content = $${paramCount}`);
      values.push(content);
      paramCount++;
    }
    
    if (expires_at !== undefined) {
      const sanitizedExpiry = sanitizeDate(expires_at);
      updateFields.push(`expires_at = $${paramCount}`);
      values.push(sanitizedExpiry);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    // ===== Handle attachment changes =====
    const shouldRemove = remove_attachment === 'true' || remove_attachment === true;
    
    if (req.file) {
      // New file uploaded → replace old attachment
      const newUrl = req.file.path;
      const newType = getAttachmentType(req.file.mimetype);
      
      updateFields.push(`attachment_url = $${paramCount}`);
      values.push(newUrl);
      paramCount++;
      
      updateFields.push(`attachment_filename = $${paramCount}`);
      values.push(req.file.originalname);
      paramCount++;
      
      updateFields.push(`attachment_type = $${paramCount}`);
      values.push(newType);
      paramCount++;
      
      updateFields.push(`attachment_size = $${paramCount}`);
      values.push(req.file.size);
      paramCount++;
      
      // Delete old attachment AFTER successful update (or do it now)
      // We'll delete after the DB update to be safe
      
    } else if (shouldRemove && oldAttachment.attachment_url) {
      // Explicitly remove attachment
      updateFields.push(`attachment_url = NULL`);
      updateFields.push(`attachment_filename = NULL`);
      updateFields.push(`attachment_type = NULL`);
      updateFields.push(`attachment_size = NULL`);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE announcements 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, content, expires_at, created_at, updated_at, user_id, is_active,
                attachment_url, attachment_filename, attachment_type, attachment_size
    `;
    
    const result = await pool.query(query, values);
    
    // ===== Clean up old Cloudinary file =====
    // Delete old file if:
    // 1. New file was uploaded (replace), OR
    // 2. remove_attachment was requested
    if (oldAttachment.attachment_url && (req.file || shouldRemove)) {
      await deleteFromCloudinary(oldAttachment.attachment_url, oldAttachment.attachment_type);
    }
    
    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Delete announcement (Admin only) - WITH ATTACHMENT CLEANUP =====
const deleteAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `DELETE FROM announcements 
       WHERE id = $1 
       RETURNING id, attachment_url, attachment_type`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    // Clean up Cloudinary file
    const deleted = result.rows[0];
    if (deleted.attachment_url) {
      await deleteFromCloudinary(deleted.attachment_url, deleted.attachment_type);
    }
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Get latest announcements for dashboard =====
const getLatestAnnouncements = async (req, res) => {
  const { limit = 3 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT a.*, u.email, ep.first_name, ep.last_name
       FROM announcements a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE (a.is_active = true OR a.is_active IS NULL)
         AND (a.expires_at IS NULL OR a.expires_at >= CURRENT_DATE)
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting latest announcements:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getLatestAnnouncements
};