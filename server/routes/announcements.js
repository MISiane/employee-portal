const express = require('express');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getLatestAnnouncements
} = require('../controllers/announcementController');
const authMiddleware = require('../middleware/auth');
const announcementUpload = require('../middleware/announcementUpload');  // ← NEW

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (for both admin and employees)
router.get('/', getAnnouncements);
router.get('/latest', getLatestAnnouncements);
router.get('/:id', getAnnouncementById);

// ===== Admin only routes - WITH FILE UPLOAD =====
// 'attachment' is the form field name that frontend will use
router.post(
  '/', 
  announcementUpload.single('attachment'),  // ← NEW: Handle file upload
  createAnnouncement
);

router.put(
  '/:id', 
  announcementUpload.single('attachment'),  // ← NEW: Handle file upload
  updateAnnouncement
);

router.delete('/:id', deleteAnnouncement);

module.exports = router;