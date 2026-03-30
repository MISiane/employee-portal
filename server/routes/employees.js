const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateProfile,
  deleteEmployee,
  getDepartments,
  getEmployeeStats,
  getDepartmentDistribution,
  getUpcomingBirthdays
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Specific routes first
router.get('/stats', getEmployeeStats);
router.get('/departments', getDepartments);
router.get('/department-distribution', getDepartmentDistribution);
router.get('/upcoming-birthdays', getUpcomingBirthdays);
router.get('/profile', getEmployeeById);
router.get('/me', getEmployeeById);

// Main list route
router.get('/', getEmployees);

// Create route
router.post('/', createEmployee);

// Profile update route
router.put('/profile', updateProfile);

// Dynamic routes (must be last)
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;