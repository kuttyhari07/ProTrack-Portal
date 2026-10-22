const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createProjectOrder,
  verifyAndCreateProject,
  getPaymentHistory
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, requireRoles } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/config', getPaymentConfig);
router.get('/history', getPaymentHistory);
router.post('/razorpay/create-order', requireRoles(['Owner', 'Admin', 'Project Manager']), createProjectOrder);
router.post('/razorpay/verify', requireRoles(['Owner', 'Admin', 'Project Manager']), verifyAndCreateProject);

module.exports = router;
