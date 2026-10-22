const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');
const { evaluateProjectHealth } = require('../services/automationService');

// @desc    Get milestones
// @route   GET /api/milestones
// @access  Private (Workspace Member)
const getMilestones = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    const query = { workspace: req.workspaceId };

    if (projectId && projectId !== 'all') {
      query.project = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const milestones = await Milestone.find(query)
      .populate('project', 'name projectCode')
      .populate('relatedTasks', 'title status priority taskNumber progress')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1 });

    // Mark delayed dynamically if past dueDate and not completed
    const now = new Date();
    const evaluated = milestones.map((m) => {
      const obj = m.toObject();
      if (obj.status !== 'completed' && new Date(obj.dueDate) < now) {
        obj.isOverdue = true;
      } else {
        obj.isOverdue = false;
      }
      return obj;
    });

    res.json({
      success: true,
      count: evaluated.length,
      milestones: evaluated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create milestone
// @route   POST /api/milestones
// @access  Private (Workspace Member - restrict Viewer)
const createMilestone = async (req, res, next) => {
  try {
    const { projectId, title, description, dueDate, status, relatedTaskIds } = req.body;

    if (!projectId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Project, title, and due date are required'
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

    const milestone = await Milestone.create({
      workspace: req.workspaceId,
      project: projectId,
      title: title.trim(),
      description: description || '',
      dueDate,
      status: status || 'upcoming',
      relatedTasks: Array.isArray(relatedTaskIds) ? relatedTaskIds : [],
      createdBy: req.user._id,
      completedAt: status === 'completed' ? new Date() : null
    });

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'milestone',
      entityId: milestone._id,
      entityTitle: milestone.title
    });

    await evaluateProjectHealth(project._id);

    const populated = await Milestone.findById(milestone._id)
      .populate('project', 'name projectCode')
      .populate('relatedTasks', 'title status priority taskNumber progress');

    res.status(201).json({
      success: true,
      milestone: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private (Workspace Member - restrict Viewer)
const updateMilestone = async (req, res, next) => {
  try {
    const { title, description, dueDate, status, relatedTaskIds } = req.body;

    const milestone = await Milestone.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (title) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description;
    if (dueDate) milestone.dueDate = dueDate;
    if (relatedTaskIds !== undefined) milestone.relatedTasks = relatedTaskIds;

    if (status && status !== milestone.status) {
      milestone.status = status;
      if (status === 'completed') {
        milestone.completedAt = new Date();
      } else {
        milestone.completedAt = null;
      }
    }

    await milestone.save();

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: milestone.project,
      userId: req.user._id,
      action: 'updated',
      entityType: 'milestone',
      entityId: milestone._id,
      entityTitle: milestone.title,
      details: { status: milestone.status }
    });

    await evaluateProjectHealth(milestone.project);

    const populated = await Milestone.findById(milestone._id)
      .populate('project', 'name projectCode')
      .populate('relatedTasks', 'title status priority taskNumber progress');

    res.json({
      success: true,
      milestone: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private (Workspace Member - restrict Viewer)
const deleteMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    await Milestone.findByIdAndDelete(milestone._id);

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: milestone.project,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'milestone',
      entityId: milestone._id,
      entityTitle: milestone.title
    });

    await evaluateProjectHealth(milestone.project);

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
};
