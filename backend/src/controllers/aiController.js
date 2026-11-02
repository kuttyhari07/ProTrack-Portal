const Task = require('../models/Task');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const { emitToWorkspace } = require('../services/socketService');
const { evaluateProjectHealth } = require('../services/automationService');

/**
 * MASTER PROTRACK PLATFORM KNOWLEDGE BASE
 */
const PROTRACK_PLATFORM_KNOWLEDGE = `
=== PROTRACK PLATFORM MASTER KNOWLEDGE BASE ===
1. PLATFORM IDENTITY & MISSION:
- Brand Name: ProTrack
- Tagline: "Plan Smarter. Track Progress. Deliver Better."
- Purpose: SaaS project management, sprint planning, and team delivery platform for engineering teams and startups.
2. MODULES:
- Dashboard (/dashboard): Metric cards, project progress benchmarking, live activity streams.
- Kanban Board (/kanban): Drag-and-drop workflow across To Do, In Progress, In Review, Completed.
- Global Tasks (/tasks): Centralized deliverable registry with multi-dimensional filtering, AI Voice input.
- Projects & Milestones (/projects, /projects/:id): Overview, Tasks, Kanban, Gantt Timeline, Milestones, Issues, Files, Health & AI Insights.
- Document Repository (/documents): Secure file storage with in-app preview for images, PDFs, code.
- DevOps & Webhooks: Two-way GitHub/GitLab commit & PR sync, Slack and Discord webhook alert dispatchers.
- AI Copilot: Natural language task creation, overdue rescheduling, autonomous workspace optimization.
3. PERMISSIONS:
- Master Admin (protrack24@gmail.com): Full governance over all workspaces and platform users.
- Workspace Owner / Project Manager: Create projects, milestones, define and assign tasks.
- Member: Update task progress, report blockers in Issues, upload documents. Members do not create empty projects.
- Viewer: Read-only access.
4. MULTILINGUAL INTELLIGENCE:
- Fluently understands English, Tamil, and Tanglish (e.g. "machi", "vanakkam", "enna velai", "status enna", "next enna", "sprint epdi pogudhu").
- Always friendly, crisp, polite, and never repeats static boilerplate text.
`;

/**
 * Call Gemini Generative Language API with smart model cascade and conversation history
 */
async function callGemini(systemPrompt, userQuery, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) return null;

  // Real production Google Gemini API models in v1beta
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro'
  ];

  // Format multi-turn conversational history
  const formattedContents = [];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach((h) => {
      const role = h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
      const text = h.content || h.text || '';
      if (text.trim()) {
        formattedContents.push({
          role,
          parts: [{ text: text.slice(0, 500) }]
        });
      }
    });
  }

  // Current turn with complete system prompt and context
  formattedContents.push({
    role: 'user',
    parts: [{ text: `[System Context & Instructions]:\n${systemPrompt}\n\n[User Message]:\n${userQuery}` }]
  });

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          const textPart = parts.find((p) => p.text && !p.thought);
          const replyText = textPart?.text || parts[0]?.text;
          if (replyText && replyText.trim().length > 0) {
            return replyText.trim();
          }
        }
      }
    } catch (err) {
      // Continue to next model fallback
    }
  }
  return null;
}

/**
 * Dynamic Context-Aware Conversational Generator (Zero Static Repetition!)
 * Analyzes exact user questions, conversational history, and live database facts.
 */
function generateDynamicContextReply({
  message,
  history = [],
  user,
  userRole,
  workspaceName,
  myTasks = [],
  allWorkspaceTasks = [],
  projects = [],
  openIssues = [],
  teamMembers = [],
  allPlatformUsers = [],
  isSuperAdmin
}) {
  const lower = message.toLowerCase().trim();
  const now = new Date();

  // 1. Casual Greetings & Chit-chat (Tamil & English)
  if (
    /^(hi|hello|hey|vanakkam|machi|bro|da|sollu|eppadi irukka|how are you|super|thanks|nandri)\b/i.test(lower) ||
    lower === 'machi' ||
    lower === 'vanakkam' ||
    lower === 'hi' ||
    lower === 'hello'
  ) {
    const greetings = [
      `Vanakkam **${user.name}**! 👋 Machi, ProTrack AI Copilot ready-ah irukken. Un active workspace **${workspaceName}**-la ellame live-ah monitor aagudhu.\n\nInnaiku un deliverable status paakanuma, illa ethavathu task create/postpone pannanuma? Sollu, instant-ah panniduvom!`,
      `Hey **${user.name}**! What's up? I'm your ProTrack workspace copilot.\n\nWe have **${projects.length} active project(s)** and **${openIssues.length} open blocker(s)** in **${workspaceName}**. What would you like to work on right now?`,
      `Machi **${user.name}**! Welcome back. Unakku ippo **${myTasks.length} task(s)** assign aayirukku. Enna pannanum nu sollu — task update pannanuma, sprint status paakanuma, illa autonomous optimization run pannanuma?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 2. "What should I do next?" / Next priority task recommendation
  if (
    lower.includes('next') ||
    lower.includes('aduthu') ||
    lower.includes('priority') ||
    lower.includes('enna pannanum') ||
    lower.includes('what to do') ||
    lower.includes('today') ||
    lower.includes('focus')
  ) {
    const pendingMyTasks = myTasks.filter((t) => t.status !== 'completed');
    if (pendingMyTasks.length > 0) {
      // Sort by priority (urgent -> high -> medium -> low)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...pendingMyTasks].sort(
        (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      );
      const top = sorted[0];
      const dueStr = top.dueDate ? new Date(top.dueDate).toLocaleDateString() : 'Flexible';
      const isOverdue = top.dueDate && new Date(top.dueDate) < now;

      return `🎯 **Machi, un adutha main priority focus idho:**\n\n` +
        `• **Task:** "${top.title}" (\`${top.project?.projectCode || 'PRO'}-${top.taskNumber}\`)\n` +
        `• **Project:** ${top.project?.name || 'Initiative'}\n` +
        `• **Priority:** \`${top.priority.toUpperCase()}\` ${top.priority === 'urgent' ? '🔥' : '⚡'}\n` +
        `• **Target Due:** **${dueStr}** ${isOverdue ? '⚠️ *(OVERDUE - needs immediate attention)*' : '🟢'}\n` +
        `• **Current Progress:** ${top.progress || 0}%\n\n` +
        `💡 *Recommendation:* Idhula start pannina un sprint velocity super-ah boost aagum! Mudichutu enakku sollu, status auto-update pannidaren.`;
    }

    // If no assigned tasks, check unassigned tasks in workspace
    const unassigned = allWorkspaceTasks.filter((t) => !t.assignee && t.status !== 'completed');
    if (unassigned.length > 0) {
      return `Machi, unakku direct-ah tasks ethuvum assign aagala, but workspace-la **${unassigned.length} unassigned task(s)** irukku:\n\n` +
        `• **Next in backlog:** "${unassigned[0].title}" (${unassigned[0].project?.name || 'Project'})\n\n` +
        `Neenga Dashboard-la irukura **"⚡ AI Auto-Pilot"** click pannina, unga team workload analyze panni automatic-ah tasks assign pannidum!`;
    }

    return `🎉 Great work **${user.name}**! You have **zero pending tasks** right now. Everything assigned to you is completed. Enjoy the clear slate or pick a new story from the Kanban backlog!`;
  }

  // 3. Status / Velocity / Progress ("Enna aachu" / "Sprint epdi pogudhu")
  if (
    lower.includes('status') ||
    lower.includes('progress') ||
    lower.includes('enna aachu') ||
    lower.includes('epdi pogudhu') ||
    lower.includes('update') ||
    lower.includes('overall') ||
    lower.includes('sprint')
  ) {
    const totalWTasks = allWorkspaceTasks.length;
    const completedWTasks = allWorkspaceTasks.filter((t) => t.status === 'completed').length;
    const overdueWTasks = allWorkspaceTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
    const overallVelocity = totalWTasks > 0 ? Math.round((completedWTasks / totalWTasks) * 100) : 0;

    let response = `📊 **Live Workspace Delivery Diagnostics for "${workspaceName}":**\n\n`;
    response += `• **Sprint Velocity:** **${overallVelocity}%** (${completedWTasks} of ${totalWTasks} deliverables completed)\n`;
    response += `• **Active Projects:** ${projects.length} project(s) in progress\n`;

    if (projects.length > 0) {
      response += `\n**Key Project Health:**\n`;
      projects.slice(0, 3).forEach((p) => {
        response += `  - **${p.name}** (\`${p.projectCode}\`): ${p.progress}% completed • Health: \`${p.health}\`\n`;
      });
    }

    if (overdueWTasks > 0) {
      response += `\n⚠️ **Timeline Alert:** ${overdueWTasks} task(s) are currently past due date. You can type *"Postpone overdue tasks by 3 days"* to auto-reschedule them!`;
    } else {
      response += `\n🟢 **Timeline Health:** All active tasks are progressing within scheduled deadlines.`;
    }

    if (openIssues.length > 0) {
      response += `\n🚨 **Active Impediments:** ${openIssues.length} blocker issue(s) logged.`;
    }

    return response;
  }

  // 4. Blockers & Issues Remediation ("Prachanai / Blocker / Bug")
  if (
    lower.includes('blocker') ||
    lower.includes('issue') ||
    lower.includes('bug') ||
    lower.includes('problem') ||
    lower.includes('prachanai') ||
    lower.includes('error') ||
    lower.includes('stuck')
  ) {
    if (openIssues.length === 0) {
      return `🎉 **Zero Blockers in ${workspaceName}!**\n\nThere are currently no active bugs or technical blockers reported. The team is executing smoothly. If you encounter any impediment, you can say *"Report blocker [issue title]"* and I will log it with high severity immediately!`;
    }

    let response = `⚠️ **Active Team Blockers & Remediation Plan (${openIssues.length} Total):**\n\n`;
    openIssues.slice(0, 4).forEach((iss, idx) => {
      response += `${idx + 1}. **[${iss.priority.toUpperCase()}]** "${iss.title}" in *${iss.project?.name || 'Project'}*\n`;
      response += `   • *Category:* \`${iss.category}\` | *Status:* \`${iss.status}\`\n`;
      if (iss.priority === 'critical') {
        response += `   • 🚨 *Action:* Needs urgent attention from lead developer to unblock sprint roadmap.\n`;
      }
    });

    response += `\n💡 *Pro-tip:* You can resolve an issue directly from the Issues tab or ask me to diagnose it!`;
    return response;
  }

  // 5. Team & Users Directory ("Aalu / Members / Yaar")
  if (
    lower.includes('user') ||
    lower.includes('member') ||
    lower.includes('team') ||
    lower.includes('name') ||
    lower.includes('ellarum') ||
    lower.includes('aalu') ||
    lower.includes('yaar')
  ) {
    if (isSuperAdmin && allPlatformUsers.length > 0) {
      return `👥 **All Platform Users Directory (${allPlatformUsers.length} Total):**\n\n` +
        allPlatformUsers.slice(0, 10).map((u, i) => `${i + 1}. **${u.name}** (\`${u.email}\`) — *${u.role || 'Member'}* (${u.title || 'Contributor'})`).join('\n') +
        `\n\n🛡️ *Super Admin Oversight: Manage permissions in the Admin Console (\`/admin\`).*`;
    }

    if (teamMembers.length > 0) {
      return `👥 **Active Team Members in ${workspaceName} (${teamMembers.length} Members):**\n\n` +
        teamMembers.map((m, i) => `${i + 1}. **${m.user?.name || 'Teammate'}** (\`${m.user?.email}\`) — *${m.role}* (${m.user?.title || 'Contributor'})`).join('\n') +
        `\n\n💡 *Project Managers can invite additional teammates from Workspace Settings.*`;
    }
  }

  // 6. AI Automation Capabilities ("Enna automate pannalam" / "AI features")
  if (
    lower.includes('automate') ||
    lower.includes('automation') ||
    lower.includes('autopilot') ||
    lower.includes('features') ||
    lower.includes('what can you do') ||
    lower.includes('mudiyum')
  ) {
    return `⚡ **ProTrack AI Autonomous Platform Capabilities:**\n\n` +
      `You can automate the entire workspace right from this chat or with 1-click on the website:\n\n` +
      `1. 🤖 **AI Auto-Pilot:** Click "Run AI Auto-Pilot" on the Dashboard to auto-reschedule overdue tasks & auto-assign backlog deliverables.\n` +
      `2. 📋 **Natural Language Execution:** Say *"Create urgent task for Stripe checkout"*, *"Postpone overdue tasks by 3 days"*, or *"Mark task PRO-12 completed"*.\n` +
      `3. 🎙️ **Voice AI Input:** Click the pulsing mic on task creation and speak in Tamil or English.\n` +
      `4. 🐙 **GitHub Two-Way Sync:** Push commits like \`git commit -m "fix(PRO-24): bug"\` to auto-complete tasks.\n` +
      `5. 🔔 **Slack & Discord Webhooks:** Live alerts for completed deliverables and critical blockers.\n` +
      `6. 📊 **Gantt Roadmap:** Live interactive timeline with dependency management.`;
  }

  // 7. General Dynamic Conversational Synthesis
  return `Hello **${user.name}**! 👋 In active workspace **${workspaceName}**, you have:\n\n` +
    `• **${myTasks.length} task(s) assigned to you** (${myTasks.filter(t => t.status === 'completed').length} completed, ${myTasks.filter(t => t.status !== 'completed').length} active)\n` +
    `• **${projects.length} ongoing project(s)** across the team\n` +
    `• **${openIssues.length} active blocker(s)**\n\n` +
    `How can I assist your sprint right now? You can ask me to **reschedule tasks**, **report blockers**, **breakdown deliverables**, or **generate new project plans**!`;
}

/**
 * Handle AI Chat messages for ProTrack Workspace (Private)
 * @route POST /api/ai/chat
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const workspaceId = req.workspaceId;
    const user = req.user;
    const isSuperAdmin = user.role === 'system_admin' || user.email?.toLowerCase() === 'protrack24@gmail.com';

    // 1. Fetch relevant workspace context
    const [workspace, membership, myTasks, allWorkspaceTasks, projects, openIssues, teamMembers, allPlatformUsers] =
      await Promise.all([
        Workspace.findById(workspaceId).select('name description teamType'),
        Membership.findOne({ workspace: workspaceId, user: user._id }).select('role'),
        Task.find({ workspace: workspaceId, assignee: user._id })
          .populate('project', 'name projectCode')
          .sort({ dueDate: 1 })
          .limit(10),
        Task.find({ workspace: workspaceId })
          .populate('project', 'name projectCode')
          .select('title taskNumber priority status dueDate progress assignee project'),
        Project.find({ workspace: workspaceId, isArchived: false })
          .select('name projectCode health progress status dueDate')
          .limit(8),
        Issue.find({ workspace: workspaceId, status: { $in: ['open', 'in_progress'] } })
          .populate('project', 'name')
          .sort({ priority: 1 })
          .limit(5),
        Membership.find({ workspace: workspaceId })
          .populate('user', 'name email role title')
          .sort({ role: 1 }),
        isSuperAdmin
          ? User.find({}).select('name email role title createdAt').sort({ createdAt: -1 })
          : Promise.resolve([])
      ]);

    const userRole = membership?.role || 'Member';
    const workspaceName = workspace?.name || 'Workspace';

    // 2. Check for actionable Copilot commands (create task, postpone overdue, update status, report blocker)
    const { tryExecuteCopilotAction } = require('../services/aiActionService');
    const copilotActionResult = await tryExecuteCopilotAction({
      message,
      workspaceId,
      user,
      userRole
    });

    if (copilotActionResult.executed) {
      return res.json({
        success: true,
        reply: copilotActionResult.reply,
        actionTaken: copilotActionResult.actionTaken,
        provider: 'ai-copilot-action'
      });
    }

    // 3. Try Gemini Generative AI with complete database context and conversational history
    const taskSummaries = myTasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
      const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
      return `- "${t.title}" (${t.project?.name || 'Project'}) | Status: ${t.status} | Priority: ${t.priority} | Due: ${dueStr} ${isOverdue ? '[OVERDUE!]' : ''}`;
    });

    const projectSummaries = projects.map(
      (p) => `- "${p.name}" (${p.projectCode}) | Health: ${p.health} | Progress: ${p.progress}% | Status: ${p.status}`
    );

    const systemPrompt = `You are ProTrack AI, the intelligent, conversational engineering copilot embedded in ProTrack SaaS.
Current User: ${user.name} (Role: ${userRole}).
Active Workspace: "${workspaceName}".

${PROTRACK_PLATFORM_KNOWLEDGE}

DATABASE CONTEXT:
Assigned Tasks:
${taskSummaries.length > 0 ? taskSummaries.join('\n') : 'No assigned tasks currently.'}

Active Projects:
${projectSummaries.length > 0 ? projectSummaries.join('\n') : 'No active projects.'}

Open Issues:
${openIssues.map((i) => `- [${i.priority.toUpperCase()}] ${i.title} (${i.status})`).join('\n') || 'None'}

CONVERSATION RULES:
- If asked in Tamil or Tanglish (e.g. "machi", "vanakkam", "enna status", "aduthu enna pannanum"), respond warmly and naturally in Tamil/Tanglish.
- NEVER repeat identical canned boilerplates. Address the user's specific query directly.
- Keep answers structured with Markdown bolding and bullet points.`;

    const geminiReply = await callGemini(systemPrompt, message, history);
    if (geminiReply) {
      return res.json({
        success: true,
        reply: geminiReply,
        provider: 'gemini'
      });
    }

    // 4. Dynamic Context-Aware Fallback Engine (No static repetition!)
    const reply = generateDynamicContextReply({
      message,
      history,
      user,
      userRole,
      workspaceName,
      myTasks,
      allWorkspaceTasks,
      projects,
      openIssues,
      teamMembers,
      allPlatformUsers,
      isSuperAdmin
    });

    res.json({
      success: true,
      reply,
      provider: 'protrack-dynamic-ai'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public AI Chat for Landing page
 */
const publicChatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const systemPrompt = `You are ProTrack AI, welcoming a visitor on the ProTrack SaaS landing page.
${PROTRACK_PLATFORM_KNOWLEDGE}
Politely answer their questions in English, Tamil, or Tanglish. Keep it friendly and concise.`;

    const geminiReply = await callGemini(systemPrompt, message);
    if (geminiReply) {
      return res.json({ success: true, reply: geminiReply, provider: 'gemini' });
    }

    const reply = `Hello! 👋 Welcome to **ProTrack** — the modern agile project management & sprint delivery SaaS platform.
You can explore interactive Kanban boards, Gantt timelines, two-way GitHub sync, and AI Copilot automation. Sign in or create a free account to get started!`;

    res.json({ success: true, reply, provider: 'protrack-ai' });
  } catch (error) {
    next(error);
  }
};

/**
 * Parse Voice Transcript into Structured Task
 * @route POST /api/ai/parse-voice-task
 */
const parseVoiceTask = async (req, res, next) => {
  try {
    const { transcript } = req.body;
    const { parseVoiceTranscriptToTask } = require('../services/aiActionService');
    const taskData = parseVoiceTranscriptToTask(transcript);
    res.json({ success: true, taskData });
  } catch (error) {
    next(error);
  }
};

/**
 * ⚡ 1-Click AI Autonomous Workspace Auto-Pilot
 * Scans overdue tasks, auto-reschedules, distributes unassigned tasks, and optimizes sprint health!
 * @route POST /api/ai/auto-pilot
 */
const runAIAutoPilot = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const user = req.user;
    const now = new Date();
    const actions = [];

    // 1. Reschedule overdue deliverables (+3 days)
    const overdueTasks = await Task.find({
      workspace: workspaceId,
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    let overdueRescheduled = 0;
    for (const t of overdueTasks) {
      const currentDue = t.dueDate ? new Date(t.dueDate) : new Date();
      t.dueDate = new Date(Math.max(currentDue.getTime(), now.getTime()) + 3 * 24 * 60 * 60 * 1000);
      await t.save();
      overdueRescheduled++;
    }

    if (overdueRescheduled > 0) {
      actions.push(`Rescheduled ${overdueRescheduled} overdue task(s) by +3 business days to prevent sprint slippage.`);
    }

    // 2. Find unassigned tasks and distribute to team members with lowest workload
    const members = await Membership.find({ workspace: workspaceId }).populate('user', 'name email');
    const memberUserIds = members.map((m) => m.user?._id).filter(Boolean);

    let tasksAssigned = 0;
    if (memberUserIds.length > 0) {
      const unassignedTasks = await Task.find({
        workspace: workspaceId,
        assignee: null,
        status: { $ne: 'completed' }
      });

      // Calculate member workloads
      const workloadMap = new Map();
      for (const mId of memberUserIds) {
        const count = await Task.countDocuments({ workspace: workspaceId, assignee: mId, status: { $ne: 'completed' } });
        workloadMap.set(mId.toString(), count);
      }

      for (const task of unassignedTasks) {
        // Pick member with lowest count
        let bestMemberId = memberUserIds[0].toString();
        let minCount = Infinity;
        workloadMap.forEach((cnt, idStr) => {
          if (cnt < minCount) {
            minCount = cnt;
            bestMemberId = idStr;
          }
        });

        task.assignee = bestMemberId;
        await task.save();
        workloadMap.set(bestMemberId, minCount + 1);
        tasksAssigned++;
      }

      if (tasksAssigned > 0) {
        actions.push(`Evenly balanced and assigned ${tasksAssigned} backlog task(s) across team members.`);
      }
    }

    // 3. Re-evaluate all active project health diagnostics
    const activeProjects = await Project.find({ workspace: workspaceId, isArchived: false });
    for (const p of activeProjects) {
      await evaluateProjectHealth(p._id);
    }
    actions.push(`Re-benchmarked health and deliverable pacing across ${activeProjects.length} active project(s).`);

    // Log Activity
    await logActivity({
      workspaceId,
      userId: user._id,
      action: 'ai_autopilot',
      entityType: 'workspace',
      entityId: workspaceId,
      entityTitle: 'AI Autonomous Auto-Pilot Run',
      details: { overdueRescheduled, tasksAssigned }
    });

    emitToWorkspace(workspaceId, 'workspace_optimized', {
      overdueRescheduled,
      tasksAssigned,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'AI Autonomous Workspace Optimization completed successfully!',
      report: {
        overdueRescheduled,
        tasksAssigned,
        projectsAudited: activeProjects.length,
        actionsSummary: actions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ✨ AI Project Generator / Sprint Decomposer
 * Turns a simple feature idea into a complete Project + Milestones + 6-8 Tasks in 1 click!
 * @route POST /api/ai/generate-project-plan
 */
const generateProjectPlan = async (req, res, next) => {
  try {
    const { idea, autoCreate = true, dueDate } = req.body;
    const workspaceId = req.workspaceId;
    const user = req.user;

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ success: false, message: 'Project idea is required' });
    }

    // Generate project code and title from idea
    const words = idea.trim().split(/\s+/).filter(w => w.length > 2);
    const code = (words[0] || 'PRO').slice(0, 4).toUpperCase();
    const cleanTitle = idea.length > 50 ? idea.slice(0, 47) + '...' : idea;

    const targetDue = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Milestones plan
    const milestoneTemplates = [
      { title: 'Phase 1: Architecture & Data Modeling', daysOffset: 7 },
      { title: 'Phase 2: Core Implementation & API Integration', daysOffset: 18 },
      { title: 'Phase 3: QA Testing, Security Audit & Production Launch', daysOffset: 28 }
    ];

    // Structured task plan decomposed from idea
    const taskTemplates = [
      { title: `Define technical specs and data schema for ${words.slice(0, 3).join(' ')}`, priority: 'high', daysOffset: 4 },
      { title: 'Build database models, migrations, and index optimization', priority: 'high', daysOffset: 7 },
      { title: 'Implement RESTful API endpoints and authentication guards', priority: 'urgent', daysOffset: 12 },
      { title: 'Develop frontend user interface and responsive state management', priority: 'medium', daysOffset: 16 },
      { title: 'Integrate third-party services and error-boundary webhooks', priority: 'high', daysOffset: 20 },
      { title: 'Perform end-to-end integration testing and edge-case validation', priority: 'medium', daysOffset: 24 },
      { title: 'Production deployment configuration and performance benchmark', priority: 'urgent', daysOffset: 28 }
    ];

    if (!autoCreate) {
      return res.json({
        success: true,
        preview: {
          name: cleanTitle,
          projectCode: code,
          milestones: milestoneTemplates,
          tasks: taskTemplates
        }
      });
    }

    // Atomic Creation in MongoDB
    const project = await Project.create({
      workspace: workspaceId,
      name: cleanTitle,
      projectCode: code,
      description: `Autonomous sprint generated from idea: "${idea}" by ${user.name}.`,
      owner: user._id,
      startDate: new Date(),
      dueDate: targetDue,
      priority: 'high',
      status: 'active',
      health: 'on_track',
      progress: 0,
      tags: ['AI-Generated', 'Sprint']
    });

    // Create Milestones
    const createdMilestones = [];
    for (const m of milestoneTemplates) {
      const mDue = new Date(Date.now() + m.daysOffset * 24 * 60 * 60 * 1000);
      const milestone = await Milestone.create({
        workspace: workspaceId,
        project: project._id,
        title: m.title,
        dueDate: mDue,
        status: 'pending'
      });
      createdMilestones.push(milestone);
    }

    // Create Tasks
    const createdTasks = [];
    let taskNum = 1;
    for (const t of taskTemplates) {
      const tDue = new Date(Date.now() + t.daysOffset * 24 * 60 * 60 * 1000);
      const task = await Task.create({
        workspace: workspaceId,
        project: project._id,
        title: t.title,
        taskNumber: taskNum++,
        priority: t.priority,
        status: 'todo',
        startDate: new Date(),
        dueDate: tDue,
        creator: user._id,
        assignee: user._id,
        progress: 0,
        labels: ['AI-Decomposed']
      });
      createdTasks.push(task);
    }

    await logActivity({
      workspaceId,
      projectId: project._id,
      userId: user._id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name,
      details: { source: 'ai_project_generator', tasksCount: createdTasks.length }
    });

    emitToWorkspace(workspaceId, 'project_created', project);

    res.json({
      success: true,
      message: `Project "${project.name}" generated with ${createdTasks.length} tasks and ${createdMilestones.length} milestones!`,
      project,
      tasks: createdTasks,
      milestones: createdMilestones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 🧩 AI Task Decomposition & Subtask Generator
 * @route POST /api/ai/breakdown-task
 */
const breakdownTaskWithAI = async (req, res, next) => {
  try {
    const { taskId, title, description } = req.body;

    let taskTitle = title;
    let taskDesc = description;
    let taskDoc = null;

    if (taskId) {
      taskDoc = await Task.findById(taskId);
      if (taskDoc) {
        taskTitle = taskDoc.title;
        taskDesc = taskDoc.description;
      }
    }

    if (!taskTitle) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // Generate clear technical subtasks
    const subtasks = [
      { id: 1, title: `Architect technical requirements for "${taskTitle}"`, done: false },
      { id: 2, title: 'Implement core functionality & backend logic', done: false },
      { id: 3, title: 'Build UI components and state validation checks', done: false },
      { id: 4, title: 'Write unit tests and verify edge-case handling', done: false }
    ];

    const acceptanceCriteria = [
      'Functionality verified against PR requirements without regression',
      'Proper error logging and boundary handling implemented',
      'Code reviewed and clean documentation updated'
    ];

    if (taskDoc) {
      const breakdownNote = `\n\n📋 **[AI Task Breakdown & Acceptance Criteria]**\n` +
        subtasks.map((s) => `• [ ] ${s.title}`).join('\n') +
        `\n\n*Acceptance Criteria:*\n` +
        acceptanceCriteria.map((c) => `✓ ${c}`).join('\n');

      taskDoc.description = (taskDoc.description || '') + breakdownNote;
      await taskDoc.save();
    }

    res.json({
      success: true,
      taskTitle,
      subtasks,
      acceptanceCriteria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 🧠 AI Blocker Diagnostic & Solution Engine
 * @route POST /api/ai/diagnose-issue
 */
const diagnoseIssueWithAI = async (req, res, next) => {
  try {
    const { issueId } = req.body;
    const issue = await Issue.findById(issueId).populate('project', 'name projectCode');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const diagnosis = {
      rootCause: `Potential bottleneck in ${issue.category} layer or unhandled timeout exception during execution.`,
      resolutionSteps: [
        `1. Inspect application logs and network traces for ${issue.title}.`,
        '2. Verify database connection pool limits and environment variable configurations.',
        '3. Implement retry backoff and deploy hotfix to staging branch.'
      ],
      preventionTip: 'Add synthetic health monitoring alerts to detect performance degradation prior to user impact.'
    };

    res.json({
      success: true,
      issueTitle: issue.title,
      priority: issue.priority,
      diagnosis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 📰 Daily AI Standup Briefing
 * @route GET /api/ai/daily-briefing
 */
const getDailyBriefing = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [completedRecent, inProgressTasks, openIssues, activeProjects] = await Promise.all([
      Task.find({ workspace: workspaceId, status: 'completed', updatedAt: { $gte: yesterday } }).populate('project', 'name'),
      Task.find({ workspace: workspaceId, status: 'in_progress' }).populate('assignee', 'name').limit(5),
      Issue.find({ workspace: workspaceId, status: { $in: ['open', 'in_progress'] } }).limit(3),
      Project.find({ workspace: workspaceId, isArchived: false }).limit(4)
    ]);

    const briefing = {
      date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      shippedCount: completedRecent.length,
      shippedDeliverables: completedRecent.map((t) => `"${t.title}" (${t.project?.name || 'Project'})`),
      inProgressCount: inProgressTasks.length,
      todayFocus: inProgressTasks.map((t) => `"${t.title}" — assigned to ${t.assignee?.name || 'Unassigned'}`),
      blockersCount: openIssues.length,
      criticalBlockers: openIssues.map((i) => `[${i.priority.toUpperCase()}] ${i.title}`),
      aiRecommendation: openIssues.length > 0
        ? `Focus on remediating ${openIssues.length} active blocker(s) to protect milestone deadlines.`
        : 'Team pacing is optimal! Keep shipping active in-flight deliverables.'
    };

    res.json({ success: true, briefing });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  publicChatWithAI,
  parseVoiceTask,
  runAIAutoPilot,
  generateProjectPlan,
  breakdownTaskWithAI,
  diagnoseIssueWithAI,
  getDailyBriefing,
  generateDynamicContextReply
};
