const pool = require('../config/database');

// Submit feedback
const submitFeedback = async (req, res) => {
  const { type, title, description, url, user_agent } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await pool.query(
      `INSERT INTO feedback (user_id, type, title, description, url, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [userId, type, title, description, url || null, user_agent || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get FAQs
const getFAQs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM faqs 
       WHERE is_active = true 
       ORDER BY display_order ASC, created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting FAQs:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get user's own feedback
const getMyFeedback = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const result = await pool.query(
      `SELECT * FROM feedback 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM feedback WHERE user_id = $1`,
      [userId]
    );
    
    res.json({
      feedback: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all feedback (admin only)
const getAllFeedback = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT f.*, u.email, u.role,
             ep.first_name, ep.last_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND f.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    if (type) {
      query += ` AND f.type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    const countResult = await pool.query(`SELECT COUNT(*) FROM feedback`);
    
    res.json({
      feedback: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update feedback status (admin only) - FIXED VERSION
const updateFeedbackStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { id } = req.params;
  const { status, resolution_notes } = req.body;
  
  try {
    // First check if feedback exists
    const checkResult = await pool.query(
      'SELECT id FROM feedback WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    // Simple update without resolved_by (avoids foreign key issues)
    const result = await pool.query(
      `UPDATE feedback 
       SET status = $1, 
           resolution_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, resolution_notes || null, id]
    );
    
    res.json({
      success: true,
      message: 'Feedback status updated',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Admin: Create FAQ
const createFAQ = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { question, answer, category, display_order } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO faqs (question, answer, category, display_order, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [question, answer, category || 'general', display_order || 0, req.user.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Update FAQ
const updateFAQ = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { id } = req.params;
  const { question, answer, category, display_order, is_active } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE faqs 
       SET question = COALESCE($1, question),
           answer = COALESCE($2, answer),
           category = COALESCE($3, category),
           display_order = COALESCE($4, display_order),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [question, answer, category, display_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Delete FAQ
const deleteFAQ = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `DELETE FROM faqs WHERE id = $1 RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
};