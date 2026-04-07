const express = require('express');
const {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
} = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Feedback routes
router.post('/feedback', submitFeedback);
router.get('/feedback/my', getMyFeedback);
router.get('/feedback/all', getAllFeedback);  // Changed from /admin/feedback
router.put('/feedback/:id/status', updateFeedbackStatus);  // Changed from /admin/feedback/:id/status

// FAQ routes
router.get('/faqs', getFAQs);
router.post('/faqs', createFAQ);  // Changed from /admin/faqs
router.put('/faqs/:id', updateFAQ);  // Changed from /admin/faqs/:id
router.delete('/faqs/:id', deleteFAQ);  // Changed from /admin/faqs/:id

module.exports = router;