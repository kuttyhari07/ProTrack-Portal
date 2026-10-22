const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  toggleArchiveProject,
  deleteProject,
  getProjectHealth,
  getProjectAISummary,
  getProjectAIRiskInsights
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, restrictViewerMutations, requireRoles } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/health', getProjectHealth);
router.post('/:id/ai-summary', getProjectAISummary);
router.post('/:id/ai-risk-insights', getProjectAIRiskInsights);
router.post('/', restrictViewerMutations, createProject);
router.put('/:id', restrictViewerMutations, updateProject);
router.patch('/:id/archive', requireRoles(['Owner', 'Admin', 'Project Manager']), toggleArchiveProject);
router.delete('/:id', requireRoles(['Owner', 'Admin']), deleteProject);

module.exports = router;
