const express = require('express');
const {
  getMyLeaveBalances,
  getUserLeaveBalances,
  updateLeaveBalances,
  getMyLeaveRequests,
  createLeaveRequest,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  editLeaveRequest,
  adminEditLeaveRequest
} = require('../controllers/leaveController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============ ADMIN ROUTES (put these FIRST) ============
router.put('/requests/:id/admin', authMiddleware, adminEditLeaveRequest);  // Full admin edit
router.put('/requests/:id/status', authMiddleware, updateLeaveRequestStatus);  // Approve/reject only
router.get('/all-requests', getAllLeaveRequests);
router.get('/balances/:userId', getUserLeaveBalances);
router.put('/balances/:userId', updateLeaveBalances);

// ============ EMPLOYEE ROUTES (put these LAST) ============
router.get('/balances', getMyLeaveBalances);
router.get('/requests', getMyLeaveRequests);
router.post('/requests', authMiddleware, upload.single('medical_certificate'), createLeaveRequest);
router.put('/requests/:id', authMiddleware, upload.single('medical_certificate'), editLeaveRequest);  // ← Employee edit

module.exports = router;