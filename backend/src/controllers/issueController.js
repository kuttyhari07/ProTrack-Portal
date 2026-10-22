const Issue = require('../models/Issue');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/activityService');
const { emitToUser, emitToWorkspace } = require('../services/socketService');
const { evaluateProjectHealth } = require('../services/automationService');

// @desc    Get issues with filtering
// @route   GET /api/issues
// @access  Private (Workspace Member)
const getIssues = async (req, res, next) => {
  try {
    const { projectId, status, priority, category, assigneeId, search } = req.query;
    const query = { workspace: req.workspaceId };

    if (projectId && projectId !== 'all') {
      query.project = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (assigneeId && assigneeId !== 'all') {
      query.assignee = assigneeId;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const issues = await Issue.find(query)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('reporter', 'name email avatar')
      .sort({ priority: 1, createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create issue
// @route   POST /api/issues
// @access  Private (Workspace Member - restrict Viewer)
const createIssue = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description,
      priority = 'medium',
      category = 'risk',
      assigneeId,
      dueDate
    } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Project and issue title are required'
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspaceId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in workspace'
      });
    }

    const issue = await Issue.create({
      workspace: req.workspaceId,
      project: projectId,
      title: title.trim(),
      description: description || '',
      priority,
      category,
      assignee: assigneeId || null,
      reporter: req.user._id,
      dueDate: dueDate || null
    });

    if (assigneeId && assigneeId.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        workspace: req.workspaceId,
        recipient: assigneeId,
        sender: req.user._id,
        type: 'issue_assigned',
        title: `Issue Assigned: [${priority.toUpperCase()}]`,
        message: `${req.user.name} assigned issue "${issue.title}" to you in ${project.name}`,
        link: `/projects/${project._id}?tab=issues`
      });
      emitToUser(assigneeId, 'notification_new', notif);
    }

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'issue',
      entityId: issue._id,
      entityTitle: issue.title,
      details: { priority, category }
    });

    await evaluateProjectHealth(project._id);

    const populated = await Issue.findById(issue._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('reporter', 'name email avatar');

    emitToWorkspace(req.workspaceId, 'issue_created', populated);

    res.status(201).json({
      success: true,
      issue: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private (Workspace Member - restrict Viewer)
const updateIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      assigneeId,
      status,
      dueDate,
      resolutionNotes
    } = req.body;

    const issue = await Issue.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const prevStatus = issue.status;

    if (title) issue.title = title.trim();
    if (description !== undefined) issue.description = description;
    if (priority) issue.priority = priority;
    if (category) issue.category = category;
    if (assigneeId !== undefined) issue.assignee = assigneeId || null;
    if (dueDate !== undefined) issue.dueDate = dueDate;
    if (resolutionNotes !== undefined) issue.resolutionNotes = resolutionNotes;

    if (status && status !== issue.status) {
      issue.status = status;
      if (status === 'resolved' || status === 'closed') {
        issue.resolvedAt = new Date();
      } else {
        issue.resolvedAt = null;
      }
    }

    await issue.save();

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: issue.project,
      userId: req.user._id,
      action: prevStatus !== issue.status ? 'status_change' : 'updated',
      entityType: 'issue',
      entityId: issue._id,
      entityTitle: issue.title,
      details: { from: prevStatus, to: issue.status, priority: issue.priority }
    });

    await evaluateProjectHealth(issue.project);

    const populated = await Issue.findById(issue._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title')
      .populate('reporter', 'name email avatar');

    emitToWorkspace(req.workspaceId, 'issue_updated', populated);

    res.json({
      success: true,
      issue: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Workspace Member - restrict Viewer)
const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    await Issue.findByIdAndDelete(issue._id);

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: issue.project,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'issue',
      entityId: issue._id,
      entityTitle: issue.title
    });

    await evaluateProjectHealth(issue.project);

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue
};
