const express = require('express');
const router = express.Router();
const {
  getAutomationOverview,
  triggerAutomationRun,
  getProjectRisk
} = require('../controllers/automationController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/insights', getAutomationOverview);
router.post('/run', triggerAutomationRun);
router.get('/projects/:id/risk', getProjectRisk);

module.exports = router;
