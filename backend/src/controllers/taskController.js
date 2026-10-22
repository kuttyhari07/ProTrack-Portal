const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/activityService');
const { emitToUser, emitToWorkspace } = require('../services/socketService');
const { evaluateProjectHealth } = require('../services/automationService');
const { sendTaskAssignedEmail } = require('../services/emailService');
const { checkAndSendDueDateReminders } = require('../services/reminderService');

// @desc    Get tasks with rich filtering, searching & pagination
// @route   GET /api/tasks
// @access  Private (Workspace Member)
const getTasks = async (req, res, next) => {
  try {
    const {
      projectId,
      assigneeId,
      status,
      priority,
      search,
      label,
      filter, // 'my_tasks', 'overdue', 'upcoming'
      sortBy = 'order',
      order = 'asc',
      limit,
      page = 1
    } = req.query;

    const query = { workspace: req.workspaceId };

    if (projectId && projectId !== 'all') {
      query.project = projectId;
    }

    if (assigneeId && assigneeId !== 'all') {
      query.assignee = assigneeId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (label) {
      query.labels = label;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const now = new Date();
    if (filter === 'my_tasks') {
      query.assignee = req.user._id;
    } else if (filter === 'overdue') {
      query.status = { $ne: 'completed' };
      query.dueDate = { $lt: now };
    } else if (filter === 'upcoming') {
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query.status = { $ne: 'completed' };
      query.dueDate = { $gte: now, $lte: in7Days };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    let taskQuery = Task.find(query)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort(sortOptions);

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      const skip = (parseInt(page, 10) - 1) * parsedLimit;
      taskQuery = taskQuery.skip(skip).limit(parsedLimit);
    }

    const [tasks, total] = await Promise.all([
      taskQuery,
      Task.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private (Workspace Member)
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    })
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('comments.user', 'name email avatar title')
      .populate('dependencies', 'title status taskNumber');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Workspace Member - restrict Viewer)
const createTask = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description,
      assigneeId,
      priority = 'medium',
      status = 'todo',
      startDate,
      dueDate,
      labels,
      dependencies
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Task title and project are required'
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspaceId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this workspace'
      });
    }

    // Determine auto taskNumber within project
    const lastTask = await Task.findOne({ project: projectId }).sort({ taskNumber: -1 });
    const taskNumber = lastTask && lastTask.taskNumber ? lastTask.taskNumber + 1 : 1;

    // Determine Kanban order
    const lastInCol = await Task.findOne({ project: projectId, status }).sort({ order: -1 });
    const order = lastInCol && lastInCol.order !== undefined ? lastInCol.order + 1 : 0;

    const task = await Task.create({
      workspace: req.workspaceId,
      project: projectId,
      title: title.trim(),
      taskNumber,
      description: description || '',
      assignee: assigneeId || null,
      creator: req.user._id,
      priority,
      status,
      startDate: startDate || new Date(),
      dueDate: dueDate || null,
      progress: status === 'completed' ? 100 : 0,
      labels: Array.isArray(labels) ? labels : [],
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      order,
      completedAt: status === 'completed' ? new Date() : null
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && assigneeId.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        workspace: req.workspaceId,
        recipient: assigneeId,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you to task: "${task.title}"`,
        link: `/projects/${project._id}?tab=tasks`
      });
      emitToUser(assigneeId, 'notification_new', notif);

      // Email notification
      const assigneeUser = await User.findById(assigneeId);
      if (assigneeUser && assigneeUser.email && assigneeUser.preferences?.emailNotifications !== false) {
        await sendTaskAssignedEmail({
          recipientEmail: assigneeUser.email,
          recipientName: assigneeUser.name,
          taskTitle: task.title,
          projectName: project.name,
          assignerName: req.user.name,
          dueDate: task.dueDate,
          priority: task.priority
        });
      }
    }

    // Log activity
    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { taskNumber, status, priority }
    });

    // Re-evaluate project health
    await evaluateProjectHealth(project._id);

    const populated = await Task.findById(task._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar');

    emitToWorkspace(req.workspaceId, 'task_created', populated);

    res.status(201).json({
      success: true,
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Workspace Member - restrict Viewer)
const updateTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assigneeId,
      priority,
      status,
      startDate,
      dueDate,
      progress,
      labels,
      dependencies,
      order
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const previousAssignee = task.assignee ? task.assignee.toString() : null;
    const previousStatus = task.status;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (priority) task.priority = priority;
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels !== undefined) task.labels = Array.isArray(labels) ? labels : [];
    if (dependencies !== undefined) task.dependencies = dependencies;
    if (order !== undefined) task.order = Number(order);

    if (status && status !== task.status) {
      task.status = status;
      if (status === 'completed') {
        task.progress = 100;
        task.completedAt = new Date();
      } else if (previousStatus === 'completed') {
        task.completedAt = null;
        if (progress === undefined || progress === 100) {
          task.progress = 50;
        }
      }
    }

    if (progress !== undefined) {
      task.progress = Number(progress);
      if (task.progress === 100 && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date();
      }
    }

    await task.save();

    // Notify new assignee if changed
    if (assigneeId && assigneeId.toString() !== previousAssignee && assigneeId.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        workspace: req.workspaceId,
        recipient: assigneeId,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to task: "${task.title}"`,
        link: `/projects/${task.project}?tab=tasks`
      });
      emitToUser(assigneeId, 'notification_new', notif);

      const assigneeUser = await User.findById(assigneeId);
      const proj = await Project.findById(task.project);
      if (assigneeUser && assigneeUser.email && assigneeUser.preferences?.emailNotifications !== false) {
        await sendTaskAssignedEmail({
          recipientEmail: assigneeUser.email,
          recipientName: assigneeUser.name,
          taskTitle: task.title,
          projectName: proj ? proj.name : 'Project',
          assignerName: req.user.name,
          dueDate: task.dueDate,
          priority: task.priority
        });
      }
    }

    // Log activity
    await logActivity({
      workspaceId: req.workspaceId,
      projectId: task.project,
      userId: req.user._id,
      action: previousStatus !== task.status ? 'status_change' : 'updated',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { previousStatus, newStatus: task.status, progress: task.progress }
    });

    // Re-evaluate project health
    await evaluateProjectHealth(task.project);

    const populated = await Task.findById(task._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    emitToWorkspace(req.workspaceId, 'task_updated', populated);

    res.json({
      success: true,
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update status & order for Kanban board drag-and-drop
// @route   PATCH /api/tasks/:id/status
// @access  Private (Workspace Member - restrict Viewer)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order, progress } = req.body;

    if (!status && progress === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status or progress is required'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const previousStatus = task.status;
    if (status) {
      task.status = status;
    }

    if (order !== undefined) {
      task.order = Number(order);
    }

    if (progress !== undefined) {
      const parsedProg = Math.max(0, Math.min(100, Number(progress)));
      task.progress = parsedProg;
      if (parsedProg === 100) {
        task.status = 'completed';
        task.completedAt = new Date();
      } else if (task.status === 'completed' && parsedProg < 100) {
        task.status = 'in_progress';
        task.completedAt = null;
      }
    } else if (status === 'completed') {
      task.progress = 100;
      task.completedAt = new Date();
    } else if (previousStatus === 'completed' && status !== 'completed') {
      task.completedAt = null;
      task.progress = 50;
    }

    await task.save();

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: task.project,
      userId: req.user._id,
      action: 'status_change',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { from: previousStatus, to: status }
    });

    await evaluateProjectHealth(task.project);

    const populated = await Task.findById(task._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title');

    emitToWorkspace(req.workspaceId, 'task_updated', populated);

    res.json({
      success: true,
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private (Workspace Member)
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await task.save();

    // Notify assignee if not the commenter
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        workspace: req.workspaceId,
        recipient: task.assignee,
        sender: req.user._id,
        type: 'comment_added',
        title: 'New Task Comment',
        message: `${req.user.name} commented on "${task.title}": "${text.substring(0, 50)}..."`,
        link: `/projects/${task.project}?tab=tasks`
      });
      emitToUser(task.assignee, 'notification_new', notif);
    }

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: task.project,
      userId: req.user._id,
      action: 'commented',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { textSnippet: text.substring(0, 80) }
    });

    const populated = await Task.findById(task._id)
      .populate('comments.user', 'name email avatar title');

    res.status(201).json({
      success: true,
      comments: populated.comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private (Workspace Member)
const deleteComment = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment author or admin/owner can delete comment
    if (comment.user.toString() !== req.user._id.toString() && !['Owner', 'Admin'].includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    comment.deleteOne();
    await task.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Workspace Member - restrict Viewer)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(task._id);

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: task.project,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title
    });

    await evaluateProjectHealth(task.project);

    emitToWorkspace(req.workspaceId, 'task_deleted', { id: task._id, projectId: task.project });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger automated due date reminders & overdue notifications for workspace
// @route   POST /api/tasks/reminders/trigger
// @access  Private (Owner, Admin, Project Manager)
const triggerReminders = async (req, res, next) => {
  try {
    const result = await checkAndSendDueDateReminders(req.workspaceId);
    res.json({
      success: true,
      message: `Triggered deadline checks. ${result.remindersSent} reminder notification(s) sent.`,
      result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger deadline email reminders for currently logged in member's tasks
// @route   POST /api/tasks/my-reminders/trigger
// @access  Private (Workspace Member)
const triggerMyReminders = async (req, res, next) => {
  try {
    const { sendDueDateReminderEmail } = require('../services/emailService');
    const now = new Date();
    // Scan all active tasks assigned to this user
    const tasks = await Task.find({
      workspace: req.workspaceId,
      assignee: req.user._id,
      status: { $ne: 'completed' }
    }).populate('project', 'name projectCode');

    let sentCount = 0;
    for (const task of tasks) {
      const isOverdue = task.dueDate && new Date(task.dueDate) < now;
      await sendDueDateReminderEmail({
        recipientEmail: req.user.email,
        recipientName: req.user.name,
        taskTitle: task.title,
        projectName: task.project?.name || 'Project',
        dueDate: task.dueDate,
        priority: task.priority,
        isOverdue
      });
      sentCount++;
    }

    res.json({
      success: true,
      message: `Due date reminder email sent to ${req.user.email} for ${sentCount} task(s).`,
      count: sentCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
