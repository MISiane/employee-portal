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
const {
  getMySupervisorInfo,
  getSupervisorRequests,
  decideAsSupervisor,
  getSupervisorAssignments,
  setSupervisorDepartments
} = require('../controllers/supervisorController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============ ADMIN ROUTES (put these FIRST) ============
router.put('/requests/:id/admin', adminEditLeaveRequest);  // Full admin edit
router.put('/requests/:id/status', updateLeaveRequestStatus);  // Approve/reject only
router.get('/all-requests', getAllLeaveRequests);
router.get('/balances/:userId', getUserLeaveBalances);
router.put('/balances/:userId', updateLeaveBalances);
router.get('/supervisors', getSupervisorAssignments);  // Who supervises what
router.put('/supervisors/:userId', setSupervisorDepartments);  // Assign departments

// ============ SUPERVISOR ROUTES ============
router.get('/supervisor/me', getMySupervisorInfo);
router.get('/supervisor/requests', getSupervisorRequests);
router.put('/requests/:id/supervisor', decideAsSupervisor);

// ============ EMPLOYEE ROUTES (put these LAST) ============
router.get('/balances', getMyLeaveBalances);
router.get('/requests', getMyLeaveRequests);
router.post('/requests', upload.single('medical_certificate'), createLeaveRequest);
router.put('/requests/:id', upload.single('medical_certificate'), editLeaveRequest);  // ← Employee edit

module.exports = router;