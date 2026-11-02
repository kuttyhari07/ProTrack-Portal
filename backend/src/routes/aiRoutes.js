const express = require('express');
const router = express.Router();
const {
  chatWithAI,
  publicChatWithAI,
  parseVoiceTask,
  runAIAutoPilot,
  generateProjectPlan,
  breakdownTaskWithAI,
  diagnoseIssueWithAI,
  getDailyBriefing
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/workspace');

// Public AI Chat (Available to visitors & landing page users)
router.post('/public-chat', publicChatWithAI);

// Private Workspace AI Automation & Chat (Authenticated workspace members)
router.use(protect);
router.use(requireWorkspaceMember);

router.post('/chat', chatWithAI);
router.post('/parse-voice-task', parseVoiceTask);
router.post('/auto-pilot', runAIAutoPilot);
router.post('/generate-project-plan', generateProjectPlan);
router.post('/breakdown-task', breakdownTaskWithAI);
router.post('/diagnose-issue', diagnoseIssueWithAI);
router.get('/daily-briefing', getDailyBriefing);

module.exports = router;
