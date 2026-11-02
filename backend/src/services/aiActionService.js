const Task = require('../models/Task');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { logActivity } = require('./activityService');
const { emitToWorkspace } = require('./socketService');
const { evaluateProjectHealth } = require('./automationService');

/**
 * Intelligent Action Parser & Executor for ProTrack AI Copilot
 */

/**
 * Helper to calculate target Date from natural language
 */
const parseNaturalDueDate = (text) => {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) {
    return new Date(now.setHours(23, 59, 59, 999));
  }
  if (lower.includes('tomorrow') || lower.includes('naalaiku')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (lower.includes('next week') || lower.includes('adutha vaaram')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (lower.includes('friday') || lower.includes('vellikizhamai')) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (lower.includes('monday') || lower.includes('thingatkizhamai')) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (1 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(18, 0, 0, 0);
    return d;
  }

  // Matches "in 3 days", "3 naal la"
  const dayMatch = lower.match(/(?:in\s+)?(\d+)\s*(?:days?|naal)/);
  if (dayMatch) {
    const daysToAdd = parseInt(dayMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(18, 0, 0, 0);
    return d;
  }

  // Default to 4 days from now
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 4);
  fallback.setHours(18, 0, 0, 0);
  return fallback;
};

/**
 * Detect priority from text
 */
const detectPriority = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('avaram')) return 'urgent';
  if (lower.includes('critical')) return 'urgent';
  if (lower.includes('high') || lower.includes('mukkiyam')) return 'high';
  if (lower.includes('low') || lower.includes('easy')) return 'low';
  return 'medium';
};

/**
 * Attempt to execute action based on user intent
 */
const tryExecuteCopilotAction = async ({ message, workspaceId, user, userRole }) => {
  const lower = message.toLowerCase().trim();

  // 1. ACTION: Postpone Overdue Tasks
  if (
    (lower.includes('postpone') || lower.includes('shift') || lower.includes('extend') || lower.includes('maathu')) &&
    (lower.includes('overdue') || lower.includes('late') || lower.includes('deadline'))
  ) {
    const now = new Date();
    const overdueTasks = await Task.find({
      workspace: workspaceId,
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    if (overdueTasks.length === 0) {
      return {
        executed: true,
        reply: `🎉 Great news, **${user.name}**! There are currently **no overdue tasks** in this workspace to postpone. Everything is on schedule!`,
        actionTaken: null
      };
    }

    // Determine shift days (default 3 days)
    const match = lower.match(/(\d+)\s*days?/);
    const shiftDays = match ? parseInt(match[1], 10) : 3;

    for (const task of overdueTasks) {
      const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
      const newDue = new Date(Math.max(currentDue.getTime(), now.getTime()) + shiftDays * 24 * 60 * 60 * 1000);
      task.dueDate = newDue;
      await task.save();
    }

    return {
      executed: true,
      reply: `✅ **Successfully rescheduled ${overdueTasks.length} overdue task(s)!**\n\nAll past-due deliverables have been extended by **+${shiftDays} days** so your team can focus on execution without timeline stress.\n\n*Updated tasks:* ${overdueTasks.map((t) => `\`${t.title}\``).slice(0, 4).join(', ')}${overdueTasks.length > 4 ? ` and ${overdueTasks.length - 4} more` : ''}.`,
      actionTaken: {
        type: 'postpone_tasks',
        count: overdueTasks.length,
        shiftDays
      }
    };
  }

  // 2. ACTION: Mark / Update Task Status
  if (
    (lower.includes('mark') || lower.includes('move') || lower.includes('update') || lower.includes('mudichuten') || lower.includes('complete')) &&
    (lower.includes('task') || lower.includes('completed') || lower.includes('in progress') || lower.includes('done'))
  ) {
    // Check for task identifier like PRO-12 or #12
    const codeMatch = lower.match(/([a-z]{2,10})-(\d+)/i) || lower.match(/#(\d+)/);
    let targetTask = null;

    if (codeMatch) {
      const num = parseInt(codeMatch[2] || codeMatch[1], 10);
      targetTask = await Task.findOne({ workspace: workspaceId, taskNumber: num });
    }

    // If no code, try finding by title keyword
    if (!targetTask) {
      const quoted = message.match(/["']([^"']+)["']/);
      if (quoted) {
        targetTask = await Task.findOne({
          workspace: workspaceId,
          title: new RegExp(quoted[1], 'i')
        });
      }
    }

    if (targetTask) {
      const newStatus = (lower.includes('in progress') || lower.includes('start')) ? 'in_progress' : 'completed';
      const prevStatus = targetTask.status;
      targetTask.status = newStatus;
      if (newStatus === 'completed') {
        targetTask.progress = 100;
        targetTask.completedAt = new Date();
      } else {
        targetTask.completedAt = null;
        if (targetTask.progress === 0) targetTask.progress = 30;
      }
      await targetTask.save();

      await logActivity({
        workspaceId,
        projectId: targetTask.project,
        userId: user._id,
        action: 'status_change',
        entityType: 'task',
        entityId: targetTask._id,
        entityTitle: targetTask.title,
        details: { from: prevStatus, to: newStatus, via: 'ai_copilot' }
      });

      await evaluateProjectHealth(targetTask.project);

      const populated = await Task.findById(targetTask._id)
        .populate('project', 'name projectCode')
        .populate('assignee', 'name email avatar');

      emitToWorkspace(workspaceId, 'task_updated', populated);

      return {
        executed: true,
        reply: `🎯 **Task Status Updated by AI Copilot!**\n\n• **Task:** "${targetTask.title}" (\`${populated.project?.projectCode || 'PRO'}-${targetTask.taskNumber}\`)\n• **New Status:** \`${newStatus.toUpperCase()}\`\n• **Progress:** ${targetTask.progress}%\n\nThe project Kanban board and deliverable metrics have been refreshed in real-time!`,
        actionTaken: {
          type: 'update_task_status',
          task: populated
        }
      };
    }
  }

  // 3. ACTION: Create Task via Natural Language Prompt
  if (
    (lower.startsWith('create task') || lower.startsWith('add task') || lower.includes('create a task') || lower.includes('puthu task') || lower.includes('task create pannu')) &&
    !lower.includes('how to') && !lower.includes('mudiyuma')
  ) {
    // Permission rule check: Members are restricted from creating tasks directly
    if (userRole === 'Member' || userRole === 'Viewer') {
      return {
        executed: true,
        reply: `🔒 **Permission Notice:** In ProTrack, team **Members** cannot create new tasks directly to prevent sprint scope creep.\n\nPlease ask your **Project Manager** or **Admin** to create this deliverable, or you can log it as an **Issue / Suggestion** in the Issues tab!`,
        actionTaken: null
      };
    }

    // Find the primary or first active project in workspace
    const project = await Project.findOne({ workspace: workspaceId, isArchived: false, status: { $ne: 'completed' } })
      .sort({ createdAt: -1 });

    if (!project) {
      return {
        executed: true,
        reply: `⚠️ Cannot create task yet: No active projects found in this workspace. Please create a project first!`,
        actionTaken: null
      };
    }

    // Extract title: remove prefixes like "create task", "add task"
    let rawTitle = message
      .replace(/^(create\s+task|add\s+task|create\s+a\s+task|puthu\s+task\s+create\s+pannu|task\s+create\s+pannu|puthu\s+task)\s*[:\-]?\s*/i, '')
      .trim();

    // Check if priority is embedded in prompt
    const priority = detectPriority(rawTitle);
    const dueDate = parseNaturalDueDate(rawTitle);

    // Clean up title text
    let cleanTitle = rawTitle
      .replace(/\b(with|set)?\s*(urgent|high|medium|low)\s*(priority)?\b/gi, '')
      .replace(/\b(for|by|due)\s*(tomorrow|today|next week|friday|monday|\d+\s*days?)\b/gi, '')
      .replace(/^[:\-,\s]+|[:\-,\s]+$/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      cleanTitle = 'New Deliverable via ProTrack AI';
    }

    // Calculate next taskNumber
    const lastTask = await Task.findOne({ workspace: workspaceId, project: project._id }).sort({ taskNumber: -1 });
    const taskNumber = (lastTask?.taskNumber || 0) + 1;

    const newTask = await Task.create({
      workspace: workspaceId,
      project: project._id,
      title: cleanTitle.slice(0, 150),
      taskNumber,
      description: `Automatically created by ProTrack AI Copilot upon request from ${user.name}.`,
      priority,
      status: 'todo',
      startDate: new Date(),
      dueDate,
      creator: user._id,
      assignee: user._id, // Assign to creator by default
      progress: 0,
      labels: ['AI-Created', 'Copilot']
    });

    await logActivity({
      workspaceId,
      projectId: project._id,
      userId: user._id,
      action: 'created',
      entityType: 'task',
      entityId: newTask._id,
      entityTitle: newTask.title,
      details: { via: 'ai_copilot', taskNumber }
    });

    await evaluateProjectHealth(project._id);

    const populated = await Task.findById(newTask._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar');

    emitToWorkspace(workspaceId, 'task_created', populated);

    return {
      executed: true,
      reply: `🚀 **Task Created Successfully by AI Copilot!**\n\n• **Title:** ${populated.title}\n• **Code:** \`${project.projectCode}-${taskNumber}\`\n• **Project:** ${project.name}\n• **Priority:** \`${priority.toUpperCase()}\`\n• **Due Date:** ${dueDate.toLocaleDateString()}\n• **Assigned To:** ${user.name}\n\n*The deliverable is now live in your workspace Kanban board and Tasks registry!*`,
      actionTaken: {
        type: 'create_task',
        task: populated
      }
    };
  }

  // 4. ACTION: Report Critical Blocker / Issue
  if (
    (lower.startsWith('report issue') || lower.startsWith('create issue') || lower.includes('blocker report') || lower.includes('issue report pannu') || lower.includes('report blocker')) &&
    !lower.includes('how to')
  ) {
    const project = await Project.findOne({ workspace: workspaceId, isArchived: false }).sort({ createdAt: -1 });
    if (!project) {
      return {
        executed: true,
        reply: `⚠️ No active projects found in this workspace to attach the issue to.`,
        actionTaken: null
      };
    }

    let rawTitle = message
      .replace(/^(report\s+issue|create\s+issue|report\s+blocker|blocker\s+report|issue\s+report\s+pannu)\s*[:\-]?\s*/i, '')
      .trim();

    const priority = detectPriority(rawTitle) === 'medium' ? 'high' : detectPriority(rawTitle);

    let cleanTitle = rawTitle
      .replace(/\b(with|set)?\s*(urgent|high|medium|low|critical)\s*(priority|severity)?\b/gi, '')
      .replace(/^[:\-,\s]+|[:\-,\s]+$/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      cleanTitle = 'Impediment logged via ProTrack AI';
    }

    const newIssue = await Issue.create({
      workspace: workspaceId,
      project: project._id,
      title: cleanTitle.slice(0, 150),
      description: `Reported via ProTrack AI Copilot by ${user.name}.`,
      priority,
      category: 'blocker',
      reporter: user._id,
      status: 'open'
    });

    await logActivity({
      workspaceId,
      projectId: project._id,
      userId: user._id,
      action: 'created',
      entityType: 'issue',
      entityId: newIssue._id,
      entityTitle: newIssue.title,
      details: { via: 'ai_copilot', priority }
    });

    await evaluateProjectHealth(project._id);

    return {
      executed: true,
      reply: `⚠️ **Blocker Issue Reported by AI Copilot!**\n\n• **Issue:** ${newIssue.title}\n• **Project:** ${project.name}\n• **Severity:** \`${priority.toUpperCase()}\`\n• **Status:** \`OPEN\`\n\n*The project health diagnostics and team notification channels have been alerted!*`,
      actionTaken: {
        type: 'create_issue',
        issue: newIssue
      }
    };
  }

  return { executed: false };
};

/**
 * Parse Voice Transcript into Structured Task Data
 */
const parseVoiceTranscriptToTask = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return {
      title: 'New Voice Deliverable',
      description: '',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };
  }

  const priority = detectPriority(transcript);
  const dueDate = parseNaturalDueDate(transcript);

  // Extract clean title
  let cleanTitle = transcript
    .replace(/\b(create|add|new)\s*(urgent|high|medium|low)?\s*task\s*(for|to)?\b/gi, '')
    .replace(/\b(by|due|before)\s*(tomorrow|today|next week|friday|monday|\d+\s*days?)\b/gi, '')
    .replace(/\b(with|set)?\s*(urgent|high|medium|low)\s*(priority)?\b/gi, '')
    .replace(/^[:\-,\s]+|[:\-,\s]+$/g, '')
    .trim();

  if (!cleanTitle || cleanTitle.length < 3) {
    cleanTitle = transcript.slice(0, 80);
  }

  // Capitalize first letter
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: cleanTitle,
    description: `Created via voice input: "${transcript}"`,
    priority,
    dueDate
  };
};

module.exports = {
  tryExecuteCopilotAction,
  parseVoiceTranscriptToTask,
  parseNaturalDueDate,
  detectPriority
};

