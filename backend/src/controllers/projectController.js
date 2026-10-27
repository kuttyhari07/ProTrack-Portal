const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const { logActivity } = require('../services/activityService');
const { evaluateProjectHealth } = require('../services/automationService');
const { generateProjectSummary, generateRiskInsights } = require('../services/aiService');

// @desc    Get all projects in workspace with filtering & sorting
// @route   GET /api/projects
// @access  Private (Workspace Member)
const getProjects = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      health,
      search,
      tag,
      sortBy = 'createdAt',
      order = 'desc',
      includeArchived = 'false'
    } = req.query;

    const query = { workspace: req.workspaceId };

    if (includeArchived !== 'true') {
      query.isArchived = false;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (health && health !== 'all') {
      query.health = health;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { projectCode: regex }, { description: regex }];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar title')
      .populate('members.user', 'name email avatar title')
      .sort(sortOptions);

    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID with full tab statistics
// @route   GET /api/projects/:id
// @access  Private (Workspace Member)
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    })
      .populate('owner', 'name email avatar title')
      .populate('members.user', 'name email avatar title');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this workspace'
      });
    }

    // Evaluate dynamic health & progress
    const healthEvaluation = await evaluateProjectHealth(project._id);

    // Summary counts for tabs
    const [tasksCount, milestonesCount, issuesCount, filesCount] = await Promise.all([
      Task.countDocuments({ project: project._id }),
      Milestone.countDocuments({ project: project._id }),
      Issue.countDocuments({ project: project._id }),
      Document.countDocuments({ project: project._id })
    ]);

    res.json({
      success: true,
      project: {
        ...project.toObject(),
        healthEvaluation,
        counts: {
          tasks: tasksCount,
          milestones: milestonesCount,
          issues: issuesCount,
          files: filesCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Workspace Member - restrict Viewer)
const createProject = async (req, res, next) => {
  try {
    const { name, projectCode, description, startDate, dueDate, priority, status, tags, memberIds } = req.body;

    if (!name || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Project name and due date are required'
      });
    }

    // Generate or format projectCode
    let code = projectCode;
    if (!code || !code.trim()) {
      const count = await Project.countDocuments({ workspace: req.workspaceId });
      code = `PRJ-${String(count + 1).padStart(3, '0')}`;
    } else {
      code = code.trim().toUpperCase();
      const existing = await Project.findOne({ workspace: req.workspaceId, projectCode: code });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Project code ${code} is already in use in this workspace`
        });
      }
    }

    const members = [{ user: req.user._id, role: 'Lead' }];
    if (Array.isArray(memberIds)) {
      memberIds.forEach((uid) => {
        if (uid.toString() !== req.user._id.toString()) {
          members.push({ user: uid, role: 'Contributor' });
        }
      });
    }

    const project = await Project.create({
      workspace: req.workspaceId,
      name: name.trim(),
      projectCode: code,
      description: description || '',
      owner: req.user._id,
      members,
      startDate: startDate || new Date(),
      dueDate,
      priority: priority || 'medium',
      status: status || 'active',
      tags: Array.isArray(tags) ? tags : []
    });

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar title')
      .populate('members.user', 'name email avatar title');

    res.status(201).json({
      success: true,
      project: populatedProject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Workspace Member - restrict Viewer)
const updateProject = async (req, res, next) => {
  try {
    const { name, description, startDate, dueDate, priority, status, progress, tags, memberIds } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (progress !== undefined) project.progress = Number(progress);
    if (tags !== undefined) project.tags = Array.isArray(tags) ? tags : [];

    if (Array.isArray(memberIds)) {
      // Re-map members maintaining owner
      const newMembers = [{ user: project.owner, role: 'Lead' }];
      memberIds.forEach((uid) => {
        if (uid.toString() !== project.owner.toString()) {
          newMembers.push({ user: uid, role: 'Contributor' });
        }
      });
      project.members = newMembers;
    }

    await project.save();

    // Re-evaluate health
    await evaluateProjectHealth(project._id);

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name
    });

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar title')
      .populate('members.user', 'name email avatar title');

    res.json({
      success: true,
      project: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive / unarchive project
// @route   PATCH /api/projects/:id/archive
// @access  Private (Owner, Admin, Project Manager)
const toggleArchiveProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.isArchived = !project.isArchived;
    if (project.isArchived) {
      project.status = 'archived';
    } else {
      project.status = 'active';
    }
    await project.save();

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: project._id,
      userId: req.user._id,
      action: 'archived',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name,
      details: { isArchived: project.isArchived }
    });

    res.json({
      success: true,
      message: `Project ${project.isArchived ? 'archived' : 'restored'} successfully`,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner, Admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await Promise.all([
      Project.findByIdAndDelete(project._id),
      Task.deleteMany({ project: project._id }),
      Milestone.deleteMany({ project: project._id }),
      Issue.deleteMany({ project: project._id }),
      Document.deleteMany({ project: project._id })
    ]);

    await logActivity({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name
    });

    res.json({
      success: true,
      message: 'Project and all associated items deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed project health diagnostics & risk factors
// @route   GET /api/projects/:id/health
// @access  Private (Workspace Member)
const getProjectHealth = async (req, res, next) => {
  try {
    const healthData = await evaluateProjectHealth(req.params.id);
    if (!healthData) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, health: healthData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI-assisted or Rule-based Project Summary
// @route   POST /api/projects/:id/ai-summary
// @access  Private (Workspace Member)
const getProjectAISummary = async (req, res, next) => {
  try {
    const summaryData = await generateProjectSummary(req.params.id);
    res.json({ success: true, ...summaryData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI-assisted Risk & Mitigation Insights
// @route   POST /api/projects/:id/ai-risk-insights
// @access  Private (Workspace Member)
const getProjectAIRiskInsights = async (req, res, next) => {
  try {
    const insightsData = await generateRiskInsights(req.params.id);
    res.json({ success: true, ...insightsData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated project report data for export (PDF / DOC)
// @route   GET /api/projects/:id/report
// @access  Private (Owner, Admin, Project Manager or Project Owner)
const getProjectReportData = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    })
      .populate('owner', 'name email avatar title')
      .populate('members.user', 'name email avatar title');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this workspace'
      });
    }

    // Check authorization: Owner, Admin, Project Manager, or Project Owner
    const isAuthorized =
      ['Owner', 'Admin', 'Project Manager'].includes(req.userRole) ||
      (project.owner && project.owner._id.toString() === req.user._id.toString()) ||
      ['admin', 'superadmin'].includes(req.user.role);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only Project Managers, Workspace Admins, and Project Owners can download project reports.'
      });
    }

    // Fetch related records in parallel
    const [tasks, milestones, issues, healthData] = await Promise.all([
      Task.find({ project: project._id })
        .populate('assignee', 'name email avatar')
        .populate('creator', 'name email')
        .sort({ status: 1, dueDate: 1 }),
      Milestone.find({ project: project._id }).sort({ dueDate: 1 }),
      Issue.find({ project: project._id })
        .populate('assignee', 'name email')
        .populate('reporter', 'name email')
        .sort({ priority: -1, createdAt: -1 }),
      evaluateProjectHealth(project._id)
    ]);

    // Compute task breakdown
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const inReviewTasks = tasks.filter((t) => t.status === 'in_review').length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    );

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);

    // Compute milestone stats
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

    // Compute issue stats
    const totalIssues = issues.length;
    const openIssues = issues.filter((i) => ['open', 'in_progress'].includes(i.status)).length;
    const criticalIssues = issues.filter((i) => i.priority === 'critical' && i.status !== 'closed').length;

    res.json({
      success: true,
      report: {
        project,
        workspace: {
          _id: req.workspace._id,
          name: req.workspace.name,
          slug: req.workspace.slug
        },
        generatedBy: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.userRole || req.user.role
        },
        generatedAt: new Date().toISOString(),
        healthData,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          todoTasks,
          overdueTasksCount: overdueTasks.length,
          completionRate,
          totalMilestones,
          completedMilestones,
          totalIssues,
          openIssues,
          criticalIssues
        },
        tasks,
        milestones,
        issues
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  toggleArchiveProject,
  deleteProject,
  getProjectHealth,
  getProjectAISummary,
  getProjectAIRiskInsights,
  getProjectReportData
};
