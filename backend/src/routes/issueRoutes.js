const express = require('express');
const router = express.Router();
const {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue
} = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, restrictViewerMutations } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', getIssues);
router.post('/', restrictViewerMutations, createIssue);
router.put('/:id', restrictViewerMutations, updateIssue);
router.delete('/:id', restrictViewerMutations, deleteIssue);

module.exports = router;
