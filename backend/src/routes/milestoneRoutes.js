const express = require('express');
const router = express.Router();
const {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, restrictViewerMutations } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', getMilestones);
router.post('/', restrictViewerMutations, createMilestone);
router.put('/:id', restrictViewerMutations, updateMilestone);
router.delete('/:id', restrictViewerMutations, deleteMilestone);

module.exports = router;
