const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getAllWorkspaces,
  deleteWorkspace,
  getAllProjects,
  getAllFeedbacks,
  updateFeedback,
  deleteFeedback,
  getAllPayments,
  getActivityLogs
} = require('../controllers/adminController');

// All admin routes require authentication AND system_admin privilege
router.use(protect);
router.use(requireAdmin);

// Platform stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

// Workspaces & Projects
router.get('/workspaces', getAllWorkspaces);
router.delete('/workspaces/:id', deleteWorkspace);
router.get('/projects', getAllProjects);

// User Feedbacks management
router.get('/feedbacks', getAllFeedbacks);
router.put('/feedbacks/:id', updateFeedback);
router.delete('/feedbacks/:id', deleteFeedback);

// Payments & Activity Logs
router.get('/payments', getAllPayments);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
