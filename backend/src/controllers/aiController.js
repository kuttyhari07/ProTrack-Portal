const Task = require('../models/Task');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');

/**
 * MASTER PROTRACK PLATFORM KNOWLEDGE BASE
 * Embedded into Gemini AI system prompts and local deterministic engines.
 */
const PROTRACK_PLATFORM_KNOWLEDGE = `
=== PROTRACK PLATFORM MASTER KNOWLEDGE BASE ===

1. PLATFORM IDENTITY & MISSION:
- Brand Name: ProTrack
- Official Tagline: "Plan Smarter. Track Progress. Deliver Better."
- Purpose: ProTrack is an all-in-one modern SaaS project management, sprint planning, and team delivery platform. It empowers agile software engineering teams, product managers, and developers to plan, execute, and deliver projects without clutter.

2. CORE MODULES & WEBSITE ARCHITECTURE:
- Landing Page (/):
  * Modern high-converting portal highlighting core capabilities, architecture, interactive AI demo, and real-time user feedback modal.
  * Direct access to Sign In, Get Started Free, and Admin Console.
- Onboarding Wizard (/onboarding):
  * Step-by-step guided setup for new organizations: Workspace naming, selecting agile methodology (Scrum, Kanban, or Bug Tracker), and inviting initial teammates.
- Executive Workspace Dashboard (/dashboard):
  * Metric summary cards (Total Projects, Assigned Tasks, Completed Deliverables, Active Blockers).
  * Project progress completion gauges, upcoming deadline reminders, and real-time activity feeds.
- Agile Kanban Board (/kanban):
  * Interactive drag-and-drop workflow across 5 standard engineering stages:
    1. Backlog (Queued user stories & tasks)
    2. To Do (Committed sprint deliverables)
    3. In Progress (Active implementation)
    4. Review (Code review, QA, and verification)
    5. Done (Shipped to production)
  * Priority chips, assignee avatars, and column WIP counts.
- Global Task Management (/tasks):
  * Centralized deliverable registry with multi-dimensional filtering by priority (Low, Medium, High, Urgent, Critical), workflow status, assignee, and project code.
- Projects & Milestones (/projects, /projects/:id):
  * Create initiatives, set target milestones, monitor health flags (on_track, at_risk, delayed), and track deliverable completion percentages.
- Issues & Blocker Registry (/issues):
  * Dedicated bug and blocker tracking module.
  * Team members report impediments with severity ratings (Low, Medium, High, Critical), linked project, and assignee resolution tracking.
- Document Repository (/documents):
  * Centralized asset repository for specs, architecture diagrams, PDFs, and deliverable attachments.
- Master Admin Console (/admin):
  * Exclusively reserved for Master Admin (Email: protrack24@gmail.com).
  * Comprehensive oversight of all registered platform users (view profile, toggle role, status audit, permanent delete).
  * Live user feedback inbox with rating stars, feedback messages, user metadata, and direct reply actions.
  * Platform telemetry and server health monitoring.
- Interactive Feedback System:
  * Users can submit ratings and feedback from the top navigation bar, floating feedback widget, or workspace.
  * Stored securely in MongoDB and visualized in real-time on the Admin Console.
- Razorpay Commercial Licensing:
  * Integrated payment verification for project creation quotas and enterprise workspaces with automated digital receipts.
- Automated Deadline Protection:
  * Automated email dispatch system powered by Resend & Brevo.
  * Sends automated reminders 48 hours before target deadlines and triggers overdue warning notifications.
- 24/7 Contextual ProTrack AI Assistant:
  * Embedded across the entire website and workspace.
  * Context-aware of user deliverables, project milestones, role permissions, and platform features.

3. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION RULES:
- System Admin / Super Admin (protrack24@gmail.com):
  * Complete governance over all workspaces, users, audit logs, and feedback.
- Workspace Owner:
  * Manages workspace billing, team membership invitations, role assignments, and project quotas.
- Project Manager / Scrum Master:
  * Creates projects, sets up milestones, defines and assigns tasks, monitors sprints, and updates project health.
- Member / Developer / Contributor:
  * CRITICAL ARCHITECTURAL RULE: Members CANNOT create new tasks or projects. This prevents scope creep and keeps project delivery disciplined.
  * What Members DO: View assigned deliverables, track upcoming due dates, update task status (Todo -> In Progress -> Completed), report blockers in Issues, upload deliverables in Documents, and consult the AI assistant.
- Viewer / Client Stakeholder:
  * Read-only visibility into roadmaps, boards, and progress summaries.

4. MULTILINGUAL & CONVERSATIONAL INTELLIGENCE:
- Fluently understands and answers in English, Tamil, and Tanglish (Tamil written in English script, e.g., "machi", "vanakkam", "enna task irukku", "epdi issue report panradhu", "workspace epdi run panradhu").
- Always friendly, crisp, polite, structured with clean Markdown bolding and bullet points.
`;

/**
 * Call Gemini Generative Language API with model fallback
 */
async function callGemini(systemPrompt, userQuery) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) return null;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) return replyText.trim();
      } else {
        const errText = await response.text();
        console.warn(`[Gemini API ${modelName} returned status ${response.status}]:`, errText);
      }
    } catch (err) {
      console.warn(`[Gemini API ${modelName} fetch error]:`, err.message);
    }
  }
  return null;
}

/**
 * Fallback engine for public questions about ProTrack
 */
function getLocalPublicReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes('hi') || lower.includes('hello') || lower.includes('vanakkam') || lower.includes('machi') || lower.includes('hey')) {
    return `👋 **Vanakkam machi! Welcome to ProTrack!**\n\n` +
      `I am your **ProTrack AI Assistant**, trained with full knowledge about this website.\n\n` +
      `Here is what you can ask me about:\n` +
      `• 🚀 **"What is ProTrack?"** – Overview & platform mission\n` +
      `• 📋 **"What features are available?"** – Kanban, Sprints, Issues, Milestones\n` +
      `• 👥 **"How do team roles work?"** – Owner, Project Manager, Member, Admin\n` +
      `• 💰 **"Pricing & Razorpay licensing"** – Quotas and checkout\n` +
      `• 🛡️ **"Master Admin Console"** – How protrack24@gmail.com manages the platform\n` +
      `• 📧 **"Automated deadline alerts"** – Resend & Brevo 48h reminders\n\n` +
      `Enna query irukku machi? Ask me in English or Tanglish!`;
  }

  if (lower.includes('what is') || lower.includes('about') || lower.includes('website') || lower.includes('protrack') || lower.includes('pathi') || lower.includes('solli') || lower.includes('solu')) {
    return `🌟 **About ProTrack — Plan Smarter. Track Progress. Deliver Better.**\n\n` +
      `**ProTrack** is a high-velocity project management and sprint tracking SaaS platform designed specifically for software engineering teams, startups, and product managers.\n\n` +
      `### ⚡ Key Capabilities:\n` +
      `1. **Agile Kanban & Sprints**: 5-stage drag-and-drop workflow (Backlog, To Do, In Progress, Review, Done).\n` +
      `2. **Disciplined Role Architecture**: Project Managers plan and assign; Members focus 100% on execution, status updates, and blocker reporting.\n` +
      `3. **Automated Deadline Protection**: Automated 48-hour email notifications via Resend & Brevo.\n` +
      `4. **Issues & Risks Registry**: Real-time bug reporting and impediment resolution.\n` +
      `5. **Master Admin Console**: Full platform oversight for \`protrack24@gmail.com\` with user management & real-time feedback inbox.\n` +
      `6. **Integrated Razorpay Payments**: Secure initiative licensing and transaction receipts.\n` +
      `7. **24/7 Contextual AI Copilot**: Powered by Google Gemini with live workspace awareness.`;
  }

  if (lower.includes('feature') || lower.includes('module') || lower.includes('capabilities') || lower.includes('enna enna')) {
    return `🚀 **ProTrack Core Features & Modules:**\n\n` +
      `• 📊 **Executive Dashboard**: KPI metrics, personal task queue, project health gauges, and live activity streams.\n` +
      `• 📌 **Kanban Boards**: Drag-and-drop sprint management with WIP controls and priority tags.\n` +
      `• 🎯 **Milestones & Projects**: Multi-project tracking with completion percentage and target delivery schedules.\n` +
      `• 📋 **Global Task List**: Multi-filter registry across projects by priority, assignee, and status.\n` +
      `• ⚠️ **Issues & Blocker Tracking**: Report bugs and technical impediments with severity tiers.\n` +
      `• 📁 **Document Repository**: Centralized deliverable specifications and file attachments.\n` +
      `• 🧭 **Onboarding Wizard**: Quick organization setup with Scrum, Kanban, or Bug Tracker templates.\n` +
      `• 💬 **Real-time Feedback**: User reviews and ratings flowing directly to the Admin Console.`;
  }

  if (lower.includes('role') || lower.includes('permission') || lower.includes('member') || lower.includes('can member create')) {
    return `👥 **ProTrack Role-Based Access Control (RBAC):**\n\n` +
      `• 🛡️ **Master Admin (\`protrack24@gmail.com\`)**: Platform superuser managing all registered users, feedbacks, and system audits.\n` +
      `• 👑 **Workspace Owner**: Organization billing, team invites, and workspace settings.\n` +
      `• 👔 **Project Manager**: Creates projects, breaks initiatives into tasks, sets milestones, and manages sprint boards.\n` +
      `• 💻 **Member / Developer**: Focused strictly on execution! **Members cannot create new tasks** (prevents scope creep). They view assigned tasks, update progress (\`Todo\` ➔ \`In Progress\` ➔ \`Completed\`), report blockers, and upload documents.\n` +
      `• 👁️ **Viewer**: Read-only stakeholder view for progress reports.`;
  }

  if (lower.includes('pricing') || lower.includes('cost') || lower.includes('plan') || lower.includes('pay') || lower.includes('razorpay')) {
    return `💳 **ProTrack Pricing & Commercial Licensing:**\n\n` +
      `• **Free Community Tier**: Perfect for getting started, includes 1 active workspace, basic Kanban board, task tracking, and community AI access.\n` +
      `• **Commercial Initiative Licensing**: Integrated with **Razorpay** for seamless payment processing, project launch quota expansions, and instant digital tax receipts.\n` +
      `• All transactions are secured with 256-bit encryption.`;
  }

  if (lower.includes('admin') || lower.includes('protrack24') || lower.includes('console')) {
    return `🛡️ **Master Admin Console:**\n\n` +
      `• **Admin Account**: \`protrack24@gmail.com\`\n` +
      `• **Route**: Accessible at \`/admin\` whenever logged in as the system admin.\n` +
      `• **Features**:\n` +
      `  - Manage all platform users (view registrations, change roles, suspend, or delete accounts).\n` +
      `  - Real-time **User Feedback Inbox** with star ratings, feedback messages, and direct email replies.\n` +
      `  - Server performance, MongoDB health, and system audit logs.`;
  }

  if (lower.includes('kanban') || lower.includes('sprint') || lower.includes('board')) {
    return `📌 **Agile Kanban & Sprint Workflow:**\n\n` +
      `ProTrack features an interactive drag-and-drop board with 5 clean columns:\n` +
      `1. **Backlog** – Unscheduled user stories and requests\n` +
      `2. **To Do** – Committed deliverables for the current sprint\n` +
      `3. **In Progress** – Active engineering work\n` +
      `4. **Review** – Code reviews, QA verification, and stakeholder checks\n` +
      `5. **Done** – Shipped and verified\n\n` +
      `Cards include priority badges, assignee avatars, due date warnings, and linked project codes.`;
  }

  if (lower.includes('email') || lower.includes('notification') || lower.includes('deadline') || lower.includes('resend') || lower.includes('brevo')) {
    return `📧 **Automated Deadline Protection & Email Notifications:**\n\n` +
      `• Powered by high-deliverability integrations with **Resend** and **Brevo**.\n` +
      `• **Automated Alerts**:\n` +
      `  - Dispatched **48 hours before** any task deadline to the assigned developer.\n` +
      `  - Urgent alert flags when tasks become overdue.\n` +
      `  - Welcome and team invitation emails.`;
  }

  if (lower.includes('feedback') || lower.includes('review') || lower.includes('star')) {
    return `💬 **Feedback System:**\n\n` +
      `• Accessible from the top navbar button or the floating widget on the landing page.\n` +
      `• Users can submit a 1 to 5 star rating along with comments, category (Bug, Feature Request, General Feedback), and contact email.\n` +
      `• All feedback appears in real time on the **Admin Console** for \`protrack24@gmail.com\`!`;
  }

  return `I am **ProTrack AI**, your project management copilot! 🚀\n\n` +
    `Ask me anything about:\n` +
    `• ProTrack features, Kanban boards, or sprint tracking\n` +
    `• Roles & permissions (why members can't create tasks)\n` +
    `• Razorpay licensing, pricing, and project quotas\n` +
    `• Master Admin dashboard and live feedback monitoring\n` +
    `• Automated 48h deadline email notifications\n\n` +
    `How can I help you today? (English or Tanglish la kooda kekalaam!)`;
}

/**
 * Handle Public AI Chat messages (e.g. from Landing Page or visitors)
 * @route POST /api/ai/public-chat
 * @access Public
 */
const publicChatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const systemPrompt = `You are ProTrack AI, the official intelligent assistant for the ProTrack SaaS project management platform.
You are interacting with a visitor or user exploring the ProTrack website.
Answer questions accurately based on the platform knowledge base below.

${PROTRACK_PLATFORM_KNOWLEDGE}

CONVERSATIONAL GUIDELINES:
1. If the user asks in Tamil or Tanglish (e.g., "machi website pathi sollu", "features enna", "kanban epdi work aagum"), respond warmly in natural, friendly Tanglish/English.
2. Provide clear, structured explanations with markdown bullet points and bold highlights.
3. Highlight ProTrack's key value propositions: Clean separation between PM (planning) and Member (execution), automated 48h deadline email alerts, interactive Kanban boards, built-in AI copilot, and seamless Razorpay licensing.
4. Keep responses crisp, professional, and helpful.`;

    const geminiReply = await callGemini(systemPrompt, message);
    if (geminiReply) {
      return res.json({
        success: true,
        reply: geminiReply,
        provider: 'gemini'
      });
    }

    // Local rule-based fallback
    const reply = getLocalPublicReply(message);
    return res.json({
      success: true,
      reply,
      provider: 'protrack-ai'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle AI Chat messages for ProTrack Workspace (Private)
 * @route POST /api/ai/chat
 * @access Private (Workspace Member)
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const workspaceId = req.workspaceId;
    const user = req.user;

    // 1. Fetch relevant workspace context
    const [workspace, membership, myTasks, projects, openIssues] = await Promise.all([
      Workspace.findById(workspaceId).select('name description teamType'),
      Membership.findOne({ workspace: workspaceId, user: user._id }).select('role'),
      Task.find({ workspace: workspaceId, assignee: user._id })
        .populate('project', 'name projectCode')
        .sort({ dueDate: 1 })
        .limit(10),
      Project.find({ workspace: workspaceId, isArchived: false })
        .select('name projectCode health progress status dueDate')
        .limit(8),
      Issue.find({ workspace: workspaceId, status: { $in: ['open', 'in_progress'] } })
        .populate('project', 'name')
        .sort({ priority: 1 })
        .limit(5)
    ]);

    const userRole = membership?.role || 'Member';
    const workspaceName = workspace?.name || 'Workspace';

    // Format tasks for context
    const now = new Date();
    const taskSummaries = myTasks.map(t => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
      const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
      return `- "${t.title}" (${t.project?.name || 'Project'}) | Status: ${t.status} | Priority: ${t.priority} | Due: ${dueStr} ${isOverdue ? '[OVERDUE!]' : ''}`;
    });

    const projectSummaries = projects.map(p =>
      `- "${p.name}" (${p.projectCode}) | Health: ${p.health} | Progress: ${p.progress}% | Status: ${p.status}`
    );

    const issueSummaries = openIssues.map(i =>
      `- [${i.priority.toUpperCase()}] "${i.title}" in ${i.project?.name || 'Project'} (Status: ${i.status})`
    );

    // 2. Try Gemini API with complete platform knowledge & user workspace context
    const systemPrompt = `You are ProTrack AI, an intelligent, helpful, and polite assistant embedded inside the ProTrack SaaS project management platform.
Current User: ${user.name} (Email: ${user.email}, Role: ${userRole}).
Active Workspace: "${workspaceName}".

${PROTRACK_PLATFORM_KNOWLEDGE}

LIVE CONTEXT FROM CURRENT WORKSPACE DATABASE:
User's Assigned Tasks:
${taskSummaries.length > 0 ? taskSummaries.join('\n') : 'No assigned tasks currently.'}

Active Projects in Workspace:
${projectSummaries.length > 0 ? projectSummaries.join('\n') : 'No active projects.'}

Top Unresolved Issues / Blockers:
${issueSummaries.length > 0 ? issueSummaries.join('\n') : 'No open blockers.'}

PLATFORM RULES TO ENFORCE:
1. If the user is a Member (role: Member):
   - Members cannot create new tasks. Task creation is done by Project Managers, Admins, or the Owner.
   - Members focus on viewing assigned tasks, monitoring due dates, updating task status/progress, reporting issues/blockers, and uploading documents.
2. If asked in Tamil or Tanglish (e.g. "enna task irukku", "due date enna", "website pathi sollu"), respond naturally in warm, friendly Tanglish/English.
3. Keep replies crisp, structured with markdown bolding, bullet points, and actionable steps.`;

    const geminiReply = await callGemini(systemPrompt, message);
    if (geminiReply) {
      return res.json({
        success: true,
        reply: geminiReply,
        provider: 'gemini'
      });
    }

    // 3. Built-in Local ProTrack Intelligent Response Engine (Deterministic Fallback)
    const lower = message.toLowerCase();
    let reply = '';

    const overdueCount = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
    const pendingCount = myTasks.filter(t => t.status !== 'completed').length;

    if (lower.includes('task') || lower.includes('ennaku') || lower.includes('work') || lower.includes('assigned') || lower.includes('pending')) {
      if (myTasks.length === 0) {
        reply = `Hello **${user.name}**! You currently do not have any tasks assigned to you in **${workspaceName}**.\n\nOnce a Project Manager or Admin assigns a task to you, it will appear right on your dashboard with its deadline!`;
      } else {
        reply = `Hello **${user.name}**! Here is your current task summary in **${workspaceName}**:\n\n` +
          `• **Total Assigned:** ${myTasks.length} task(s)\n` +
          `• **Pending / In Progress:** ${pendingCount}\n` +
          `• **Overdue:** ${overdueCount > 0 ? `⚠️ ${overdueCount} task(s) past deadline!` : '✅ None! All on schedule'}\n\n` +
          `**Your Deliverables:**\n` +
          myTasks.slice(0, 5).map(t => {
            const isO = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
            const d = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
            return `• **${t.title}** (${t.project?.name || 'Project'})\n  - Status: \`${t.status}\` | Priority: \`${t.priority}\` | Due: **${d}** ${isO ? '*(⚠️ OVERDUE)*' : ''}`;
          }).join('\n\n') +
          `\n\n💡 *Tip: You can update your task status directly from the Dashboard or Tasks tab.*`;
      }
    } else if (lower.includes('due') || lower.includes('deadline') || lower.includes('date') || lower.includes('overdue')) {
      if (myTasks.length === 0) {
        reply = `You don't have any pending deadlines right now in **${workspaceName}**. Everything is clear!`;
      } else {
        reply = `⏰ **Your Task Deadlines Overview:**\n\n` +
          myTasks.map(t => {
            const isO = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
            const d = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No deadline';
            return `• **${t.title}**: ${d} ${isO ? '🔴 **[OVERDUE]**' : '🟢 [Active]'}`;
          }).join('\n') +
          `\n\n📧 *Automated due date reminder emails are sent whenever deadlines approach within 48 hours via Resend & Brevo.*`;
      }
    } else if (lower.includes('create task') || lower.includes('new task') || lower.includes('add task')) {
      if (userRole === 'Member' || userRole === 'Viewer') {
        reply = `🔒 **Permission Notice**: As a **${userRole}**, you do not have permission to create new tasks in **${workspaceName}**.\n\n` +
          `Task creation is reserved for **Project Managers** and **Workspace Admins** to maintain project discipline.\n\n` +
          `✨ **What you can do:**\n` +
          `1. View all tasks assigned to you with due dates.\n` +
          `2. Update the status and progress of your tasks (\`Todo\` ➔ \`In Progress\` ➔ \`Completed\`).\n` +
          `3. Report any issues, bugs, or blockers.\n` +
          `4. Upload and collaborate on project documents.`;
      } else {
        reply = `As a **${userRole}**, you can create tasks anytime! Go to **Tasks ➔ Create Task** or inside any Project's Tasks tab.`;
      }
    } else if (lower.includes('issue') || lower.includes('blocker') || lower.includes('bug') || lower.includes('problem')) {
      reply = `⚠️ **Reporting Issues & Blockers**:\n\n` +
        `If you encounter any bug, dependency blocker, or technical risk, you can report it directly!\n\n` +
        `• Click the **"Report Issue"** button on your dashboard or navigate to **Issues & Risks** from the sidebar.\n` +
        `• Select the project, choose priority (\`Critical\`, \`High\`, etc.), and explain the blocker.\n` +
        `• Your team and project managers will be alerted immediately!`;
    } else if (lower.includes('project') || lower.includes('health') || lower.includes('status')) {
      reply = `📁 **Projects in ${workspaceName}**:\n\n` +
        projects.slice(0, 4).map(p =>
          `• **${p.name}** (\`${p.projectCode}\`)\n  Progress: ${p.progress}% | Health: \`${p.health.replace('_', ' ')}\` | Status: \`${p.status}\``
        ).join('\n\n') +
        `\n\nCheck out the **Projects** tab for deep-dive milestone schedules and linked tasks!`;
    } else if (lower.includes('document') || lower.includes('upload') || lower.includes('file')) {
      reply = `📄 **Documents & Files**:\n\n` +
        `You have full access to view, download, and upload project files in **Documents**.\n\n` +
        `• Supported formats: PDF, Images, Specs, Code archives, etc.\n` +
        `• Simply go to **Documents ➔ Upload File** to share deliverables with your team.`;
    } else if (lower.includes('about') || lower.includes('website') || lower.includes('protrack') || lower.includes('pathii') || lower.includes('pathi') || lower.includes('solli') || lower.includes('solu')) {
      reply = getLocalPublicReply(message);
    } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('vanakkam') || lower.includes('machi') || lower.includes('hey')) {
      reply = `👋 **Vanakkam machi!** I am your **ProTrack AI Assistant**.\n\n` +
        `Current Workspace: **${workspaceName}** | Role: **${userRole}**\n\n` +
        `Here is how I can assist you today:\n` +
        `• 📋 **"Show my tasks"** – List all deliverables assigned to you.\n` +
        `• ⏰ **"When are my tasks due?"** – Check approaching deadlines and overdue alerts.\n` +
        `• ⚠️ **"How do I report an issue?"** – Guide on reporting blockers.\n` +
        `• 🚀 **"Project status"** – Current progress across workspace initiatives.\n` +
        `• 🌐 **"About ProTrack"** – Complete guide to the platform and features.\n\n` +
        `What would you like to check right now?`;
    } else {
      reply = getLocalPublicReply(message);
    }

    res.json({
      success: true,
      reply,
      provider: 'protrack-ai'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  publicChatWithAI
};
