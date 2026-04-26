const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
  updateProfile,
  deleteEmployee,
  resetEmployeePassword,
  getDepartments,
  getEmployeeStats,
  getDepartmentDistribution,
  getUpcomingBirthdays,
  getTodayBirthdays,
  getBirthdayComments,   
  addBirthdayComment,   
  deleteBirthdayComment,
  getEmployeeDirectory,
  giveHighFive,
  getHighFiveCount,
  getHighFiveLeaderboard,
  hasHighFived,
  getTodayAnniversaries
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Specific routes first (before dynamic routes)
router.get('/stats', getEmployeeStats);
router.get('/departments', getDepartments);
router.get('/department-distribution', getDepartmentDistribution);
router.get('/upcoming-birthdays', getUpcomingBirthdays);
router.get('/today-birthdays', getTodayBirthdays); 
router.get('/directory', getEmployeeDirectory);
router.get('/today-anniversaries', getTodayAnniversaries);


// Birthday comments routes
router.get('/birthdays/:userId/comments', getBirthdayComments);
router.post('/birthdays/:userId/comments', addBirthdayComment);
router.delete('/birthdays/comments/:commentId', deleteBirthdayComment);

// High-five routes
router.post('/:id/high-five', giveHighFive);
router.get('/:id/high-five-count', getHighFiveCount);
router.get('/:id/has-high-fived', hasHighFived);
router.get('/leaderboard/high-fives', getHighFiveLeaderboard);


router.get('/profile', getEmployeeById);
router.get('/me', getEmployeeById);

// Employee code lookup (by code, not ID)
router.get('/code/:employeeCode', getEmployeeByCode);

// Main list route
router.get('/', getEmployees);

// Create route
router.post('/', createEmployee);

// Profile update route
router.put('/profile', updateProfile);

// Password reset route (specific: /:id/reset-password before /:id)
router.post('/:id/reset-password', resetEmployeePassword);

// Dynamic routes (must be last - these catch any :id param)
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;