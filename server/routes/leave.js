const express = require('express');
const {
  getMyLeaveBalances,
  getUserLeaveBalances,
  updateLeaveBalances,
  getMyLeaveRequests,
  createLeaveRequest,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  editLeaveRequest
} = require('../controllers/leaveController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes (accessible by both admin and employees, but filtered by user ID)
router.get('/balances', getMyLeaveBalances);  // Get current user's balances
router.get('/requests', getMyLeaveRequests);   // Get current user's leave requests
router.post('/requests', createLeaveRequest);   // Create leave request
router.put('/requests/:id/edit', editLeaveRequest);

// Admin only routes
router.get('/all-requests', getAllLeaveRequests);           // Get all leave requests
router.get('/balances/:userId', getUserLeaveBalances);      // Get specific user's balances
router.put('/balances/:userId', updateLeaveBalances);       // Update specific user's balances
router.put('/requests/:id', updateLeaveRequestStatus);      // Approve/reject leave request

module.exports = router;