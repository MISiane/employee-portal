const pool = require('../config/database');

// Helper function to sanitize date values
const sanitizeDate = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  return value;
};

// Get all announcements (with optional filters)
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

// Get single announcement by ID
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

// Create announcement (Admin only)
const createAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { title, content, expires_at } = req.body;
  const userId = req.user.id;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, user_id, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, expires_at, created_at, user_id, is_active`,
      [title, content, userId, sanitizeDate(expires_at), true]
    );
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: result.rows[0],
      id: result.rows[0].id  // Explicitly include ID for poll creation
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update announcement (Admin only)
const updateAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const { title, content, expires_at, is_active } = req.body;
  
  try {
    // Build update query dynamically to handle optional fields
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
      // Convert empty string to null
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
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE announcements 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, content, expires_at, created_at, updated_at, user_id, is_active
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
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

// Delete announcement (Admin only)
const deleteAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
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

// Get latest announcements for dashboard
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