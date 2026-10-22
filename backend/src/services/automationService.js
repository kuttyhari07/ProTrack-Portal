const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const socketService = require('./socketService');

/**
 * Calculates project health and returns risk factors
 */
const evaluateProjectHealth = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  if (project.status === 'completed' || project.isArchived) {
    return {
      health: 'completed',
      riskScore: 0,
      factors: [],
      healthSummary: 'Project is marked as completed or archived with all primary objectives met.',
      calculatedProgress: project.progress || 100,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasksCount: 0,
      criticalIssuesCount: 0,
    };
  }

  const now = new Date();
  const tasks = await Task.find({ project: projectId });
  const openIssues = await Issue.find({
    project: projectId,
    status: { $in: ['open', 'in_progress'] }
  });
  const milestones = await Milestone.find({ project: projectId });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  );
  const criticalIssues = openIssues.filter((i) => i.priority === 'critical');
  const highIssues = openIssues.filter((i) => i.priority === 'high');

  // Calculate actual completion percentage from tasks if tasks exist
  let calculatedProgress = project.progress;
  if (totalTasks > 0) {
    calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
    if (project.progress !== calculatedProgress) {
      project.progress = calculatedProgress;
    }
  }

  const factors = [];
  let riskPoints = 0;

  // Timeline analysis
  const startDate = new Date(project.startDate || project.createdAt);
  const dueDate = new Date(project.dueDate);
  const totalDuration = Math.max(1, dueDate - startDate);
  const elapsed = Math.max(0, now - startDate);
  const percentTimeElapsed = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  if (now > dueDate && calculatedProgress < 100) {
    riskPoints += 50;
    factors.push(`Project deadline passed (${dueDate.toLocaleDateString()}) with ${100 - calculatedProgress}% work remaining.`);
  } else if (percentTimeElapsed > 70 && calculatedProgress < 50) {
    riskPoints += 35;
    factors.push(`Pacing gap: ${percentTimeElapsed}% of project schedule elapsed, but only ${calculatedProgress}% completed.`);
  }

  if (overdueTasks.length > 0) {
    riskPoints += Math.min(30, overdueTasks.length * 10);
    factors.push(`${overdueTasks.length} task(s) currently past deadline.`);
  }

  if (criticalIssues.length > 0) {
    riskPoints += criticalIssues.length * 25;
    factors.push(`${criticalIssues.length} critical blocker issue(s) unresolved.`);
  }

  if (highIssues.length > 0) {
    riskPoints += highIssues.length * 10;
    factors.push(`${highIssues.length} high-priority issue(s) active.`);
  }

  const overdueMilestones = milestones.filter(
    (m) => m.dueDate && new Date(m.dueDate) < now && m.status !== 'completed'
  );
  if (overdueMilestones.length > 0) {
    riskPoints += 20;
    factors.push(`${overdueMilestones.length} milestone(s) behind schedule.`);
  }

  let determinedHealth = 'on_track';
  if (now > dueDate && calculatedProgress < 100) {
    determinedHealth = 'delayed';
  } else if (riskPoints >= 45 || criticalIssues.length > 0 || (overdueTasks.length >= 3)) {
    determinedHealth = 'at_risk';
  } else if (riskPoints >= 15 || overdueTasks.length > 0 || highIssues.length > 0 || overdueMilestones.length > 0) {
    determinedHealth = 'needs_attention';
  } else if (calculatedProgress === 100) {
    determinedHealth = 'completed';
  }

  if (project.health !== determinedHealth) {
    project.health = determinedHealth;
  }
  await project.save();

  let healthSummary = 'All project deliverables and milestones are currently on schedule.';
  if (determinedHealth === 'delayed') {
    healthSummary = `Delayed: Project deadline elapsed on ${dueDate.toLocaleDateString()} with ${100 - calculatedProgress}% of tasks incomplete.`;
  } else if (determinedHealth === 'at_risk') {
    healthSummary = `At Risk: ${factors.slice(0, 2).join(' ')}`;
  } else if (determinedHealth === 'needs_attention') {
    healthSummary = `Needs Attention: ${factors.slice(0, 2).join(' ')}`;
  }

  return {
    health: determinedHealth,
    riskScore: Math.min(100, riskPoints),
    healthSummary,
    factors,
    calculatedProgress,
    totalTasks,
    completedTasks,
    overdueTasksCount: overdueTasks.length,
    criticalIssuesCount: criticalIssues.length,
    highIssuesCount: highIssues.length,
    overdueMilestonesCount: overdueMilestones.length,
    percentTimeElapsed
  };
};

/**
 * Scans workspace and produces actionable smart automation recommendations
 */
const runWorkspaceAutomation = async (workspaceId) => {
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 1. Overdue tasks
  const overdueTasks = await Task.find({
    workspace: workspaceId,
    status: { $ne: 'completed' },
    dueDate: { $lt: now }
  })
    .populate('project', 'name projectCode')
    .populate('assignee', 'name email')
    .sort({ dueDate: 1 })
    .limit(10);

  // 2. Upcoming tasks (next 48h)
  const upcomingTasks = await Task.find({
    workspace: workspaceId,
    status: { $ne: 'completed' },
    dueDate: { $gte: now, $lte: in48Hours }
  })
    .populate('project', 'name projectCode')
    .populate('assignee', 'name email')
    .sort({ dueDate: 1 })
    .limit(10);

  // 3. Critical & High open issues
  const criticalIssues = await Issue.find({
    workspace: workspaceId,
    status: { $in: ['open', 'in_progress'] },
    priority: { $in: ['critical', 'high'] }
  })
    .populate('project', 'name projectCode')
    .populate('assignee', 'name email')
    .sort({ priority: 1, createdAt: -1 })
    .limit(10);

  // 4. Projects at risk or delayed
  const projects = await Project.find({
    workspace: workspaceId,
    status: { $in: ['active', 'planning'] },
    isArchived: false
  });

  const analyzedProjects = [];
  for (const proj of projects) {
    const analysis = await evaluateProjectHealth(proj._id);
    if (analysis) {
      analyzedProjects.push({
        project: proj,
        ...analysis
      });
    }
  }

  const atRiskProjects = analyzedProjects.filter(
    (p) => p.health === 'at_risk' || p.health === 'delayed'
  );

  // 5. Generate deterministic, practical smart recommendations
  const recommendations = [];

  if (overdueTasks.length > 0) {
    recommendations.push({
      type: 'warning',
      category: 'Schedule Slippage',
      title: `${overdueTasks.length} task(s) overdue`,
      description: `Tasks such as "${overdueTasks[0].title}" in ${overdueTasks[0].project?.name || 'Project'} have passed their due dates. Reassign or revise timeline to keep milestones on track.`,
      actionLabel: 'Review Overdue Tasks',
      actionRoute: '/tasks?filter=overdue'
    });
  }

  if (criticalIssues.length > 0) {
    recommendations.push({
      type: 'error',
      category: 'Risk Mitigation',
      title: `${criticalIssues.length} high-severity issue(s) require intervention`,
      description: `Critical issue "${criticalIssues[0].title}" is unresolved. Ensure an assignee is actively remediating this blocker.`,
      actionLabel: 'View Blocker Issues',
      actionRoute: '/issues?priority=critical'
    });
  }

  if (atRiskProjects.length > 0) {
    recommendations.push({
      type: 'warning',
      category: 'Project Pacing',
      title: `Project "${atRiskProjects[0].project.name}" flagged as ${atRiskProjects[0].health.replace('_', ' ')}`,
      description: atRiskProjects[0].factors[0] || 'Progress pace is lagging behind the milestone schedule.',
      actionLabel: 'Open Project Workspace',
      actionRoute: `/projects/${atRiskProjects[0].project._id}`
    });
  }

  if (upcomingTasks.length > 0) {
    recommendations.push({
      type: 'info',
      category: 'Upcoming Deadlines',
      title: `${upcomingTasks.length} task deadline(s) approaching within 48 hours`,
      description: `Check in with assignees for upcoming deliverables including "${upcomingTasks[0].title}".`,
      actionLabel: 'View Upcoming Deadlines',
      actionRoute: '/tasks?filter=upcoming'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      category: 'Optimal Velocity',
      title: 'All deliverables on track',
      description: 'No overdue tasks or critical blockers detected across active workspace projects. Pace and schedule are aligned.',
      actionLabel: 'Explore Dashboard',
      actionRoute: '/dashboard'
    });
  }

  return {
    overdueTasks,
    upcomingTasks,
    criticalIssues,
    atRiskProjects,
    recommendations,
    lastEvaluated: new Date()
  };
};

module.exports = {
  evaluateProjectHealth,
  runWorkspaceAutomation
};
