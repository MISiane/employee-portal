const express = require('express');
const router = express.Router();
const trivia = require('../controllers/triviaController');

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Everyone signed in
router.get('/today', trivia.getTodayQuestion);
router.post('/answer', trivia.submitAnswer);
router.get('/leaderboard', trivia.getLeaderboard);

// Admin (HR) management
router.get('/admin/questions', isAdmin, trivia.listQuestions);
router.post('/admin/questions', isAdmin, trivia.createQuestion);
router.put('/admin/questions/:id', isAdmin, trivia.updateQuestion);
router.delete('/admin/questions/:id', isAdmin, trivia.deleteQuestion);
router.post('/admin/import', isAdmin, trivia.importQuestions);
router.post('/admin/schedule', isAdmin, trivia.scheduleQuestions);

module.exports = router;
