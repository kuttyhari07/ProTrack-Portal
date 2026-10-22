const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');

/**
 * Generate AI-assisted or Rule-based Project Summary
 */
const generateProjectSummary = async (projectId) => {
  const project = await Project.findById(projectId).populate('owner', 'name email');
  if (!project) throw new Error('Project not found');

  const tasks = await Task.find({ project: projectId }).populate('assignee', 'name');
  const milestones = await Milestone.find({ project: projectId });
  const issues = await Issue.find({ project: projectId });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'todo');
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  );

  const openIssues = issues.filter((i) => i.status === 'open' || i.status === 'in_progress');
  const criticalIssues = openIssues.filter((i) => i.priority === 'critical');

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a project intelligence assistant. Analyze this verified project data and generate a concise executive summary with bullet points.
Project Name: ${project.name} (${project.projectCode})
Status: ${project.status}, Health: ${project.health}, Progress: ${project.progress}%
Total Tasks: ${totalTasks} (Completed: ${completedTasks.length}, In Progress: ${inProgressTasks.length}, Pending: ${pendingTasks.length}, Overdue: ${overdueTasks.length})
Milestones: ${milestones.length} total, ${milestones.filter(m => m.status === 'completed').length} completed
Active Issues: ${openIssues.length} (${criticalIssues.length} critical)
Rules: Do NOT invent fake numbers. Ground strictly in the above data. Separate verified facts from recommendations.`;

      const modelsToTry = [
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemma-4-26b-a4b-it',
        'gemini-3.8-flash',
        'gemini-3.5-flash'
      ];
      let generatedText = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const parts = data.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              const textPart = parts.find((p) => p.text && !p.thought);
              generatedText = textPart?.text || parts[0]?.text;
              if (generatedText) break;
            }
          }
        } catch (mErr) {
          // continue to next model
        }
      }

      if (generatedText) {
        return {
          source: 'Gemini AI Intelligence',
          summary: generatedText,
          timestamp: new Date()
        };
      }
    } catch (err) {
      console.warn('[AI Service] External AI call skipped, using deterministic engine:', err.message);
    }
  }

  // Factual deterministic fallback
  const summaryBullets = [
    `Project "${project.name}" is currently ${project.status.toUpperCase()} with an aggregate deliverable completion rate of ${project.progress}%.`,
    `Team progress: ${completedTasks.length} of ${totalTasks} deliverables completed, ${inProgressTasks.length} active in development, and ${pendingTasks.length} in backlog.`,
    overdueTasks.length > 0
      ? `Timeline attention: ${overdueTasks.length} deliverable(s) are currently past due date.`
      : `Timeline health: All active tasks are progressing within scheduled target deadlines.`,
    criticalIssues.length > 0
      ? `Critical risk blocker: ${criticalIssues.length} high-severity issue(s) require immediate remediation.`
      : `Issue status: ${openIssues.length} active issue(s), with zero critical blockers.`
  ];

  return {
    source: 'Verified Project Intelligence Engine',
    summary: summaryBullets.join('\n\n'),
    timestamp: new Date()
  };
};

/**
 * Generate AI-assisted Risk & Mitigation Insights
 */
const generateRiskInsights = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  const tasks = await Task.find({ project: projectId }).populate('assignee', 'name email');
  const issues = await Issue.find({ project: projectId });
  const milestones = await Milestone.find({ project: projectId });

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  );
  const criticalIssues = issues.filter(
    (i) => (i.status === 'open' || i.status === 'in_progress') && i.priority === 'critical'
  );
  const upcomingDeadlines = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= new Date(now.getTime() + 48 * 60 * 60 * 1000) && t.status !== 'completed'
  );

  const insights = [];

  if (overdueTasks.length > 0) {
    insights.push({
      severity: 'high',
      title: 'Schedule Slippage Detected',
      reason: `${overdueTasks.length} task(s) including "${overdueTasks[0].title}" have exceeded their allocated deadline.`,
      recommendation: 'Reassign critical path tasks or adjust milestone target dates with stakeholders.'
    });
  }

  if (criticalIssues.length > 0) {
    insights.push({
      severity: 'critical',
      title: 'Blocker Issue Needs Immediate Intervention',
      reason: `Issue "${criticalIssues[0].title}" is marked critical and unresolved.`,
      recommendation: 'Direct developer resources to isolate and resolve this blocker to prevent downstream delays.'
    });
  }

  if (upcomingDeadlines.length > 0) {
    insights.push({
      severity: 'medium',
      title: 'Approaching Deliverables (Next 48 Hours)',
      reason: `${upcomingDeadlines.length} task(s) due within 48 hours.`,
      recommendation: 'Confirm deliverable readiness with assigned team members.'
    });
  }

  if (insights.length === 0) {
    insights.push({
      severity: 'low',
      title: 'Optimal Project Velocity',
      reason: 'No overdue tasks, blockers, or critical schedule risks detected.',
      recommendation: 'Continue regular sprint reviews to sustain current momentum.'
    });
  }

  return {
    source: 'Verified Risk Assessment',
    health: project.health,
    insights,
    evaluatedAt: new Date()
  };
};

module.exports = {
  generateProjectSummary,
  generateRiskInsights
};
