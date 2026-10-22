const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');
const Membership = require('../models/Membership');

// @desc    Get aggregate analytics & report data for workspace
// @route   GET /api/reports/workspace
// @access  Private (Workspace Member)
const getWorkspaceReportData = async (req, res, next) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const now = new Date();

    const projectFilter = { workspace: req.workspaceId };
    if (projectId && projectId !== 'all') {
      projectFilter._id = projectId;
    }

    const taskFilter = { workspace: req.workspaceId };
    if (projectId && projectId !== 'all') {
      taskFilter.project = projectId;
    }
    if (startDate || endDate) {
      taskFilter.createdAt = {};
      if (startDate) taskFilter.createdAt.$gte = new Date(startDate);
      if (endDate) taskFilter.createdAt.$lte = new Date(endDate);
    }

    const [projects, tasks, milestones, issues, membersCount] = await Promise.all([
      Project.find(projectFilter).populate('owner', 'name email'),
      Task.find(taskFilter).populate('assignee', 'name email').populate('project', 'name projectCode'),
      Milestone.find(projectId && projectId !== 'all' ? { workspace: req.workspaceId, project: projectId } : { workspace: req.workspaceId }),
      Issue.find(projectId && projectId !== 'all' ? { workspace: req.workspaceId, project: projectId } : { workspace: req.workspaceId }),
      Membership.countDocuments({ workspace: req.workspaceId, status: 'active' })
    ]);

    // 1. Project status metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const planningProjects = projects.filter((p) => p.status === 'planning').length;
    const atRiskProjects = projects.filter((p) => p.health === 'at_risk' || p.health === 'delayed').length;

    // 2. Task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const inReviewTasks = tasks.filter((t) => t.status === 'in_review').length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;
    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Task priority breakdown
    const priorityBreakdown = {
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length
    };

    // 4. Milestone metrics
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
    const overdueMilestones = milestones.filter((m) => m.status !== 'completed' && new Date(m.dueDate) < now).length;
    const milestoneRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // 5. Issue metrics
    const totalIssues = issues.length;
    const openIssues = issues.filter((i) => i.status === 'open' || i.status === 'in_progress').length;
    const resolvedIssues = issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const criticalIssues = issues.filter((i) => (i.status === 'open' || i.status === 'in_progress') && i.priority === 'critical').length;
    const issueResolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    // 6. Project progress comparison array for charts
    const projectProgressList = projects.slice(0, 8).map((p) => ({
      name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
      code: p.projectCode,
      progress: p.progress,
      health: p.health,
      status: p.status
    }));

    // 7. Team workload distribution (tasks per assignee)
    const workloadMap = {};
    tasks.forEach((t) => {
      const name = t.assignee ? t.assignee.name : 'Unassigned';
      if (!workloadMap[name]) {
        workloadMap[name] = { name, total: 0, completed: 0, overdue: 0 };
      }
      workloadMap[name].total += 1;
      if (t.status === 'completed') workloadMap[name].completed += 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed') {
        workloadMap[name].overdue += 1;
      }
    });
    const teamWorkload = Object.values(workloadMap);

    res.json({
      success: true,
      metrics: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        atRiskProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        todoTasks,
        overdueTasks,
        taskCompletionRate,
        totalMilestones,
        completedMilestones,
        overdueMilestones,
        milestoneRate,
        totalIssues,
        openIssues,
        resolvedIssues,
        criticalIssues,
        issueResolutionRate,
        membersCount
      },
      charts: {
        taskStatus: [
          { name: 'To Do', value: todoTasks, color: '#9CA3AF' },
          { name: 'In Progress', value: inProgressTasks, color: '#4F46E5' },
          { name: 'In Review', value: inReviewTasks, color: '#D97706' },
          { name: 'Completed', value: completedTasks, color: '#16A34A' }
        ],
        taskPriority: [
          { name: 'Urgent', count: priorityBreakdown.urgent, color: '#DC2626' },
          { name: 'High', count: priorityBreakdown.high, color: '#EA580C' },
          { name: 'Medium', count: priorityBreakdown.medium, color: '#4F46E5' },
          { name: 'Low', count: priorityBreakdown.low, color: '#0D9488' }
        ],
        projectProgress: projectProgressList,
        teamWorkload
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export project / workspace task data to CSV
// @route   GET /api/reports/export-csv
// @access  Private (Workspace Member)
const exportCSV = async (req, res, next) => {
  try {
    const { projectId, type = 'tasks' } = req.query;

    if (type === 'projects') {
      const projects = await Project.find({ workspace: req.workspaceId })
        .populate('owner', 'name email');

      const headers = ['Code', 'Name', 'Status', 'Health', 'Progress (%)', 'Priority', 'Owner', 'Start Date', 'Due Date'];
      const rows = projects.map((p) => [
        `"${p.projectCode}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.status}"`,
        `"${p.health}"`,
        p.progress,
        `"${p.priority}"`,
        `"${p.owner?.name || 'Unassigned'}"`,
        p.startDate ? p.startDate.toISOString().split('T')[0] : '',
        p.dueDate ? p.dueDate.toISOString().split('T')[0] : ''
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=protrack_projects_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    // Default: Export tasks
    const taskQuery = { workspace: req.workspaceId };
    if (projectId && projectId !== 'all') {
      taskQuery.project = projectId;
    }

    const tasks = await Task.find(taskQuery)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Project Code',
      'Project Name',
      'Task Number',
      'Title',
      'Status',
      'Priority',
      'Progress (%)',
      'Assignee',
      'Creator',
      'Due Date',
      'Created Date'
    ];

    const rows = tasks.map((t) => [
      `"${t.project?.projectCode || ''}"`,
      `"${(t.project?.name || '').replace(/"/g, '""')}"`,
      t.taskNumber,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      t.progress,
      `"${t.assignee?.name || 'Unassigned'}"`,
      `"${t.creator?.name || ''}"`,
      t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
      t.createdAt ? t.createdAt.toISOString().split('T')[0] : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=protrack_tasks_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaceReportData,
  exportCSV
};
