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

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (for both admin and employees)
router.get('/', getAnnouncements);
router.get('/latest', getLatestAnnouncements);
router.get('/:id', getAnnouncementById);

// Admin only routes
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;