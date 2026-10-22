const express = require('express');
const router = express.Router();
const { chatWithAI, publicChatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/workspace');

// Public AI Chat (Available to visitors & landing page users)
router.post('/public-chat', publicChatWithAI);

// Private Workspace AI Chat (Context-aware for authenticated workspace members)
router.use(protect);
router.use(requireWorkspaceMember);
router.post('/chat', chatWithAI);

module.exports = router;
