const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { processGitHubPush, processGitHubPR } = require('../services/webhookSyncService');

/**
 * @desc    GitHub Webhook receiver
 * @route   POST /api/webhooks/github/:workspaceId
 * @access  Public (Authenticated via URL workspaceId & optional GitHub signature)
 */
router.post('/github/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const event = req.headers['x-github-event'] || 'push';

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Ping event verification
    if (event === 'ping') {
      return res.json({
        success: true,
        message: 'GitHub Webhook connection handshake verified for ProTrack!',
        workspace: workspace.name
      });
    }

    let affectedTasks = [];

    if (event === 'push') {
      affectedTasks = await processGitHubPush(workspaceId, req.body);
    } else if (event === 'pull_request') {
      affectedTasks = await processGitHubPR(workspaceId, req.body);
    }

    return res.json({
      success: true,
      event,
      affectedTasksCount: affectedTasks.length,
      affectedTasks
    });
  } catch (err) {
    console.error('[GitHub Webhook Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @desc    Get Webhook information & connection status for a workspace
 * @route   GET /api/webhooks/info/:workspaceId
 * @access  Public / Workspace Scoped
 */
router.get('/info/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const webhookUrl = `${protocol}://${host}/api/webhooks/github/${workspaceId}`;

    return res.json({
      success: true,
      workspaceName: workspace.name,
      webhookUrl,
      supportedEvents: ['push', 'pull_request'],
      syntaxGuide: [
        'git commit -m "fix(PRO-24): resolved login auth bug" -> Marks task as completed',
        'git commit -m "wip(PRO-24): working on styling" -> Moves task to In Progress',
        'git commit -m "feat: added api endpoint for #12" -> Logs commit to task #12'
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

