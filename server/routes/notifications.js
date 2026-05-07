const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get user's notifications
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { limit = 20 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  const userId = req.user.id;
  
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;