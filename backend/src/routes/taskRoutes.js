const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  addComment,
  deleteComment,
  deleteTask,
  triggerReminders,
  triggerMyReminders
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, restrictViewerMutations, requireRoles } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', getTasks);
router.post('/reminders/trigger', requireRoles(['Owner', 'Admin', 'Project Manager']), triggerReminders);
router.post('/my-reminders/trigger', restrictViewerMutations, triggerMyReminders);
router.get('/:id', getTaskById);
router.post('/', requireRoles(['Owner', 'Admin', 'Project Manager']), createTask);
router.put('/:id', requireRoles(['Owner', 'Admin', 'Project Manager']), updateTask);
router.patch('/:id/status', restrictViewerMutations, updateTaskStatus);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.delete('/:id', requireRoles(['Owner', 'Admin', 'Project Manager']), deleteTask);

module.exports = router;
