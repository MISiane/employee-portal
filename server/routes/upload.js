const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const profileUpload = require('../middleware/profileUpload');
const authMiddleware = require('../middleware/auth');

// Upload profile picture
router.post('/upload-avatar', authMiddleware, profileUpload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const avatarUrl = req.file.path;
    const avatarFilename = req.file.originalname;
    
    await pool.query(
      `UPDATE users 
       SET avatar_url = $1, 
           avatar_filename = $2, 
           avatar_uploaded_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [avatarUrl, avatarFilename, req.user.id]
    );
    
    res.json({ 
      success: true, 
      avatarUrl,
      message: 'Profile picture updated successfully!'
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete profile picture
router.delete('/delete-avatar', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE users 
       SET avatar_url = NULL, 
           avatar_filename = NULL, 
           avatar_uploaded_at = NULL
       WHERE id = $1`,
      [req.user.id]
    );
    
    res.json({ success: true, message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;