const express = require('express');
const router = express.Router();
const {
  getMyWorkspaces,
  createWorkspace,
  switchWorkspace,
  getWorkspaceDetails,
  updateWorkspace,
  getWorkspaceMembers,
  inviteMember,
  updateMember,
  removeMember,
  getWorkspaceActivity
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, requireRoles, restrictViewerMutations } = require('../middleware/workspace');

router.use(protect);

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);
router.post('/switch/:workspaceId', switchWorkspace);

// Workspace scoped subroutes
router.get('/:workspaceId', requireWorkspaceMember, getWorkspaceDetails);
router.put('/:workspaceId', requireWorkspaceMember, requireRoles(['Owner', 'Admin']), updateWorkspace);

router.get('/:workspaceId/members', requireWorkspaceMember, getWorkspaceMembers);
router.post('/:workspaceId/invitations', requireWorkspaceMember, requireRoles(['Owner', 'Admin', 'Project Manager']), inviteMember);
router.put('/:workspaceId/members/:memberId', requireWorkspaceMember, requireRoles(['Owner', 'Admin']), updateMember);
router.delete('/:workspaceId/members/:memberId', requireWorkspaceMember, requireRoles(['Owner', 'Admin']), removeMember);

router.get('/:workspaceId/activity', requireWorkspaceMember, getWorkspaceActivity);

module.exports = router;
