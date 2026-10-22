const Task = require('../models/Task');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const User = require('../models/User');

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
- Reports & Analytics (/reports):
  * Team workload distribution, deliverable completion velocity, and one-click Tasks & Projects CSV data exports.
- User Profile & Security (/profile):
  * Update profile details, change passwords, and manage personal settings.
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
- Fluently understands and answers in English, Tamil, and Tanglish (Tamil written in English script, e.g., "machi", "vanakkam", "enna task irukku", "epdi issue report panradhu", "workspace epdi run panradhu", "password epdi mathanum", "users ellarum name kudu").
- Always friendly, crisp, polite, structured with clean Markdown bolding and bullet points.
`;

/**
 * Call Gemini Generative Language API with smart model cascade
 */
async function callGemini(systemPrompt, userQuery) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) return null;

  // Prioritize active flash-lite models with available quota, then fall back to standard flash
  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemma-4-26b-a4b-it',
    'gemini-3.8-flash',
    'gemini-3.5-flash'
  ];

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
              maxOutputTokens: 1000
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
      } else {
        const errText = await response.text();
        console.warn(`[Gemini API ${modelName} returned status ${response.status}]:`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`[Gemini API ${modelName} fetch error]:`, err.message);
    }
  }
  return null;
}

/**
 * Highly Dynamic & Comprehensive Local Intelligence Engine
 * Handles EVERY specific question dynamically without repeating boilerplate.
 */
function getLocalPublicReply(message, usersList = []) {
  const lower = message.toLowerCase();

  // 1. Users / Team Members / Names Directory (Specific request)
  if (lower.includes('user') || lower.includes('member') || lower.includes('team') || lower.includes('name') || lower.includes('ellarum') || lower.includes('aalu') || lower.includes('yaar')) {
    if (usersList.length > 0) {
      return `👥 **ProTrack Platform Users Directory (${usersList.length} Total):**\n\n` +
        usersList.map((u, i) => `${i + 1}. **${u.name}** (\`${u.email}\`) — *${u.role || 'Member'}* (${u.title || 'Contributor'})`).join('\n\n') +
        `\n\n🛡️ *Admins have full privileges to manage, assign roles, or audit users directly in the Master Admin Console (\`/admin\`).*`;
    }
    return `👥 **ProTrack Team Roles & Structure:**\n\n` +
      `• 🛡️ **Master Admin:** ProTrack Super Admin (\`protrack24@gmail.com\`)\n` +
      `• 👑 **Workspace Owner:** Alex Rivera (\`alex@protrack.dev\`)\n` +
      `• 👔 **Project Manager:** Marcus Chen (\`marcus@protrack.dev\`)\n` +
      `• 💻 **Member / Developer:** Elena Rostova (\`elena@protrack.dev\`) & Sophia Patel\n` +
      `• 👁️ **Viewer:** David Kim (\`david@protrack.dev\`)\n\n` +
      `Full live user directories are viewable from the **Admin Console** or inside **Workspace Settings**!`;
  }

  // 2. Password / Profile / Account Settings
  if (lower.includes('password') || lower.includes('pass') || lower.includes('profile') || lower.includes('account') || lower.includes('settings') || lower.includes('mathanum') || lower.includes('change')) {
    return `🔐 **Password & Account Management in ProTrack:**\n\n` +
      `Machi, unga password-ah change panna indha simple steps follow pannu:\n\n` +
      `1. **Login:** Un workspace-kulla login panni dashboard-ku po.\n` +
      `2. **Profile Page:** Top-right corner-la irukura un profile avatar click panni **User Profile** (\`/profile\`) choose pannu.\n` +
      `3. **Security Section:** Adhula **"Security & Password"** card irukkum:\n` +
      `   • Unnodaya **Current Password** enter pannu.\n` +
      `   • Puthu **New Password** type pannu (strong-ah numbers & symbols vechi).\n` +
      `   • **Confirm Password** verify panni **"Save Changes"** click pannidu!\n\n` +
      `💡 *Password marandhutta na:* Login page-laye **"Forgot Password?"** (\`/auth/forgot-password\`) link irukkum, un email kudutha reset instructions varum.`;
  }

  // 3. Can Members Create Tasks? (Permissions & Role Architecture)
  if ((lower.includes('create') && lower.includes('task')) || (lower.includes('add') && lower.includes('task')) || lower.includes('mudiyuma') || lower.includes('permission') || lower.includes('role')) {
    return `👥 **ProTrack Role Architecture & Task Permissions:**\n\n` +
      `🔒 **Members can NEVER create new tasks directly** in ProTrack! Idhoda main reason:\n` +
      `• **Prevent Scope Creep:** Engineering initiatives-la random tasks add aagita sprint planning kolambi poirum.\n` +
      `• **Disciplined Execution:** **Project Managers** and **Admins** mattum dhaan tasks & milestones create panni assign pannuvaanga.\n\n` +
      `✨ **What Members (Developers) DO:**\n` +
      `1. View assigned deliverables with target deadlines.\n` +
      `2. Update task progress directly (\`Todo\` ➔ \`In Progress\` ➔ \`Completed\`).\n` +
      `3. Report any technical blockers in **Issues**.\n` +
      `4. Upload specs and deliverable files in **Documents**.\n` +
      `5. Work stress-free without scope changes!`;
  }

  // 4. Tasks & Deliverables Management
  if (lower.includes('task') || lower.includes('velai') || lower.includes('work') || lower.includes('assigned') || lower.includes('pending') || lower.includes('deliverable')) {
    return `📋 **Task Management in ProTrack:**\n\n` +
      `• **Global Task Registry (\`/tasks\`):** Workspace-la irukura ella tasks-ayum priority (*Low, Medium, High, Urgent, Critical*), status (*Todo, In Progress, Review, Completed*), and assignee vechi filter pannalaam.\n` +
      `• **Status Updates:** Developers thanga tasks-oda status-ah easily update pannalaam.\n` +
      `• **Deadline Urgency:** Approaching deadlines bold colors-la highlight aagum so you never miss a deliverable!\n` +
      `• **Activity Audit:** Every update is logged in real-time.`;
  }

  // 5. Deadlines & Automated Email Reminders
  if (lower.includes('due') || lower.includes('deadline') || lower.includes('date') || lower.includes('overdue') || lower.includes('alert') || lower.includes('email') || lower.includes('notification')) {
    return `⏰ **Automated Deadline Protection & Email Notifications:**\n\n` +
      `ProTrack un team deliverables miss aagama paathukollum:\n\n` +
      `1. **48-Hour Pre-Warning:** Oru task-ku deadline approaching aana **48 hours munnadiye** assigned developer-ku automated email reminder send aagum (powered by Resend & Brevo).\n` +
      `2. **Overdue Urgency:** Task deadline thaandina adhu immediate-ah Red Overdue Banner-oda flag aagum.\n` +
      `3. **Team Notifications:** Notification bell icon-la real-time updates and invitations display aagum.`;
  }

  // 6. Agile Kanban Sprint Board
  if (lower.includes('kanban') || lower.includes('sprint') || lower.includes('board') || lower.includes('column') || lower.includes('drag') || lower.includes('drop')) {
    return `📌 **Agile Kanban Sprint Board (\`/kanban\`):**\n\n` +
      `ProTrack features an interactive drag-and-drop board across 5 engineering stages:\n` +
      `1. 📥 **Backlog** – Unscheduled user stories and product requests\n` +
      `2. 📝 **To Do** – Committed deliverables for the active sprint\n` +
      `3. ⚡ **In Progress** – Currently under development\n` +
      `4. 🔍 **Review** – Code review, QA verification, and peer check\n` +
      `5. ✅ **Done** – Shipped and verified\n\n` +
      `Cards include priority badges, assignee avatars, subtask counters, and WIP control limits!`;
  }

  // 7. Issues & Blocker Registry
  if (lower.includes('issue') || lower.includes('blocker') || lower.includes('bug') || lower.includes('problem') || lower.includes('error') || lower.includes('prachanai')) {
    return `⚠️ **Issues & Blocker Management (\`/issues\`):**\n\n` +
      `Developers or leads can report project impediments immediately:\n` +
      `• **1-Click Blocker Reporting:** Dashboard or Issues tab-la irundhu "Report Issue" click pannunga.\n` +
      `• **Severity Tiers:** Choose \`Low\`, \`Medium\`, \`High\`, or \`Critical\` blocker priority.\n` +
      `• **Linked Project:** Tag the exact initiative and assignee for instant remediation.\n` +
      `• **Resolution Tracking:** Track status from \`Open\` ➔ \`In Progress\` ➔ \`Resolved\`.`;
  }

  // 8. Projects & Milestone Scheduling
  if (lower.includes('project') || lower.includes('milestone') || lower.includes('timeline') || lower.includes('schedule') || lower.includes('roadmap')) {
    return `🚀 **Projects & Milestone Scheduling (\`/projects\`):**\n\n` +
      `• **Project Hub:** Create initiatives, set target launch dates, and track overall completion percentages.\n` +
      `• **Health Flags:** System auto-monitors health as \`On Track\`, \`At Risk\`, or \`Delayed\`.\n` +
      `• **Milestone Targets:** Group tasks under key sprint deliverables and track progress bars as tasks finish.`;
  }

  // 9. Documents & File Uploads
  if (lower.includes('document') || lower.includes('file') || lower.includes('upload') || lower.includes('pdf') || lower.includes('share') || lower.includes('attachment')) {
    return `📁 **Document Repository (\`/documents\`):**\n\n` +
      `• **Centralized Storage:** Upload specs, architecture diagrams, product briefs, and code deliverables directly.\n` +
      `• **Supported Formats:** PDF, DOCX, ZIP, PNG, JPG, and Markdown.\n` +
      `• **Capacity:** Up to 25MB per file with verified disk storage and secure downloads.`;
  }

  // 10. Pricing & Razorpay Licensing
  if (lower.includes('pricing') || lower.includes('cost') || lower.includes('price') || lower.includes('fees') || lower.includes('pay') || lower.includes('razorpay') || lower.includes('panam') || lower.includes('evlo')) {
    return `💳 **ProTrack Transparent Commercial Licensing:**\n\n` +
      `• **Free Community Tier:** Complete access to Kanban boards, task tracking, documents, and built-in AI copilot.\n` +
      `• **Project Activation License (₹499 one-time):** Launch initiatives with full resource quota allocation via secure **Razorpay** checkout.\n` +
      `• **Enterprise Workspace:** Unlimited team members, priority support, and custom audit reports.\n` +
      `• No hidden monthly subscription traps! Official tax invoice receipts provided for every transaction.`;
  }

  // 11. Master Admin Console
  if (lower.includes('admin') || lower.includes('protrack24') || lower.includes('superadmin') || lower.includes('console')) {
    return `🛡️ **Master Admin Console (\`/admin\`):**\n\n` +
      `• **Admin Account:** \`protrack24@gmail.com\`\n` +
      `• **Full Platform Control:**\n` +
      `  - Manage all registered users (view details, toggle roles, suspend, or delete accounts).\n` +
      `  - Real-time **User Feedback Inbox** with star ratings, feedback messages, and direct email actions.\n` +
      `  - Server telemetry, MongoDB status, and audit logs.`;
  }

  // 12. User Feedback System
  if (lower.includes('feedback') || lower.includes('review') || lower.includes('rating') || lower.includes('star') || lower.includes('karuthu')) {
    return `💬 **Integrated Feedback System:**\n\n` +
      `• Anyone can submit feedback by clicking the **"Feedback"** button in the top navigation or floating bottom widget.\n` +
      `• Submit 1 to 5 star ratings, category (Bug, Feature Request, General Feedback), and custom comments.\n` +
      `• Submissions immediately appear on the **Master Admin Console** for administrative action!`;
  }

  // 13. Onboarding & Workspace Setup
  if (lower.includes('onboarding') || lower.includes('create workspace') || lower.includes('setup') || lower.includes('new workspace') || lower.includes('invite')) {
    return `🧭 **Guided Onboarding Wizard (\`/onboarding\`):**\n\n` +
      `Getting started is seamless in 3 quick steps:\n` +
      `1. **Name Workspace:** Enter your organization name and select team type.\n` +
      `2. **Choose Agile Template:** Pick Scrum, Kanban, or Bug Tracker.\n` +
      `3. **Invite Team:** Add member emails with assigned roles and jump right into the workspace dashboard!`;
  }

  // 14. Reports & CSV Export
  if (lower.includes('report') || lower.includes('analytic') || lower.includes('csv') || lower.includes('export') || lower.includes('download data') || lower.includes('velocity')) {
    return `📊 **Reports & Analytics (\`/reports\`):**\n\n` +
      `• **Team Velocity:** Visual gauges for sprint completion rates and aggregate team progress.\n` +
      `• **Workload Distribution:** Table showing tasks assigned per team member, completed, and overdue items.\n` +
      `• **1-Click CSV Exports:** Export all project deliverables and task records directly to Excel/CSV for offline analysis.`;
  }

  // 15. Greetings
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('vanakkam') || lower.includes('machi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good evening')) {
    return `👋 **Vanakkam machi! Welcome to ProTrack!**\n\n` +
      `I am your **ProTrack AI Assistant**, trained with complete knowledge of the entire website.\n\n` +
      `Enna query irundhaalum kekalaam:\n` +
      `• 👥 *"Users ellarum name kudu"*\n` +
      `• 📋 *"How do I track my assigned tasks?"*\n` +
      `• 🔐 *"Password epdi change panradhu?"*\n` +
      `• 👥 *"Why can't members create tasks?"*\n` +
      `• 📌 *"Kanban board epdi run aagum?"*\n` +
      `• 💳 *"Pricing and Razorpay licensing details"*\n\n` +
      `Ask me in English or Tanglish machi!`;
  }

  // 16. General Overview & What is ProTrack
  if (lower.includes('what is') || lower.includes('about') || lower.includes('protrack') || lower.includes('website') || lower.includes('solli') || lower.includes('solu') || lower.includes('pathi') || lower.includes('feature')) {
    return `🌟 **About ProTrack — Plan Smarter. Track Progress. Deliver Better.**\n\n` +
      `**ProTrack** is a high-velocity project management and sprint tracking SaaS platform designed specifically for software engineering teams, startups, and product managers.\n\n` +
      `### ⚡ Key Capabilities:\n` +
      `1. **Agile Kanban & Sprints**: 5-stage drag-and-drop workflow (Backlog, To Do, In Progress, Review, Done).\n` +
      `2. **Disciplined Role Architecture**: Project Managers plan and assign; Members focus 100% on execution, status updates, and blocker reporting.\n` +
      `3. **Automated Deadline Protection**: Automated 48-hour email notifications via Resend & Brevo.\n` +
      `4. **Issues & Risks Registry**: Real-time bug reporting and impediment resolution.\n` +
      `5. **Master Admin Console**: Full platform oversight for \`protrack24@gmail.com\` with user management & real-time feedback inbox.\n` +
      `6. **Integrated Razorpay Payments**: Secure initiative licensing and transaction receipts.\n` +
      `7. **24/7 Contextual AI Copilot**: Live intelligence trained on the platform.`;
  }

  // Dynamic context-aware answer for any other question
  return `Machi, regarding **"${message.slice(0, 60)}"**:\n\n` +
    `ProTrack-la indha feature fully supported da:\n` +
    `• **Navigation:** Top navigation bar and sidebar vazhiya un initiatives, Kanban boards, and reports-ah access pannalaam.\n` +
    `• **Execution:** All changes live-ah MongoDB database-la sync aagum.\n` +
    `• **Assistance:** Specific questions like *password change*, *task status*, *blocker reporting*, or *sprint planning* pathi kettaa, step-by-step-ah guide pannuven!\n\n` +
    `Innum specific-ah enna step theriyanum nu sollu machi!`;
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

    // Fetch registered users preview so even public chat knows real users
    const registeredUsers = await User.find({}).select('name email role title').limit(15);
    const userDirectory = registeredUsers.map(
      (u, i) => `${i + 1}. ${u.name} (${u.email}) - Role: ${u.role || 'Member'} (${u.title || 'Contributor'})`
    ).join('\n');

    const systemPrompt = `You are ProTrack AI, the official intelligent assistant for the ProTrack SaaS project management platform.
You are interacting with a user or visitor exploring the ProTrack website.
Answer accurately based on the platform knowledge base below.

${PROTRACK_PLATFORM_KNOWLEDGE}

REGISTERED PLATFORM USERS IN DATABASE (${registeredUsers.length} Users):
${userDirectory}

CRITICAL DIRECTORY LOOKUP RULE:
- If the user asks for users, members, or names (e.g., "users ellarum name uh kudu", "who are the registered users?", "list all user names"):
  YOU MUST DIRECTLY LIST OUT THE ACTUAL NAMES, EMAILS, AND ROLES OF THE USERS LISTED ABOVE!
  DO NOT JUST TELL THEM TO GO TO /admin. DIRECTLY DISPLAY THEIR NAMES AND ROLES CLEARLY IN A BULLETED OR NUMBERED LIST!

CONVERSATIONAL GUIDELINES:
1. If the user asks in Tamil or Tanglish (e.g., "machi website pathi sollu", "password epdi change panradhu", "features enna", "kanban epdi work aagum", "users ellarum name kudu"), respond warmly in natural, friendly Tanglish/English.
2. Provide clear, structured explanations with markdown bullet points and bold highlights.
3. Highlight ProTrack's key value propositions: Clean separation between PM (planning) and Member (execution), automated 48h deadline email alerts, interactive Kanban boards, built-in AI copilot, and seamless Razorpay licensing.
4. Keep responses crisp, professional, helpful, and specifically answer what the user asked.`;

    const geminiReply = await callGemini(systemPrompt, message);
    if (geminiReply) {
      return res.json({
        success: true,
        reply: geminiReply,
        provider: 'gemini'
      });
    }

    // Dynamic local fallback engine with database users
    const reply = getLocalPublicReply(message, registeredUsers);
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
    const isSuperAdmin = user.role === 'system_admin' || user.email?.toLowerCase() === 'protrack24@gmail.com';

    // 1. Fetch relevant workspace context & team members from live database
    const [workspace, membership, myTasks, projects, openIssues, teamMembers, allPlatformUsers] = await Promise.all([
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

    // Format tasks for context
    const now = new Date();
    const taskSummaries = myTasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
      const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
      return `- "${t.title}" (${t.project?.name || 'Project'}) | Status: ${t.status} | Priority: ${t.priority} | Due: ${dueStr} ${isOverdue ? '[OVERDUE!]' : ''}`;
    });

    const projectSummaries = projects.map(
      (p) => `- "${p.name}" (${p.projectCode}) | Health: ${p.health} | Progress: ${p.progress}% | Status: ${p.status}`
    );

    const issueSummaries = openIssues.map(
      (i) => `- [${i.priority.toUpperCase()}] "${i.title}" in ${i.project?.name || 'Project'} (Status: ${i.status})`
    );

    const memberSummaries = teamMembers.map(
      (m, idx) => `${idx + 1}. ${m.user?.name || 'Unnamed'} (${m.user?.email || 'No email'}) - Role: ${m.role} - Title: ${m.user?.title || 'Contributor'}`
    );

    const platformUserSummaries = allPlatformUsers.map(
      (u, idx) => `${idx + 1}. ${u.name} (${u.email}) - Platform Role: ${u.role || 'User'} - Title: ${u.title || 'Member'}`
    );

    // 2. Try Gemini API with complete platform knowledge, live database users, and user workspace context
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

CURRENT WORKSPACE TEAM MEMBERS (${teamMembers.length} Members):
${memberSummaries.length > 0 ? memberSummaries.join('\n') : 'No other members in this workspace.'}

${isSuperAdmin && allPlatformUsers.length > 0 ? `
ALL REGISTERED PLATFORM USERS (${allPlatformUsers.length} Users in MongoDB - Super Admin Access):
${platformUserSummaries.join('\n')}
` : ''}

CRITICAL DIRECTORY LOOKUP RULE:
- If the user asks for users, team members, or names (e.g. "users ellarum name uh kudu", "show team members", "who is in this workspace?", "list all users"):
  YOU MUST DIRECTLY LIST OUT THE NAMES, EMAILS, AND ROLES OF THE USERS IN A BEAUTIFULLY FORMATTED NUMBERED LIST RIGHT HERE IN YOUR RESPONSE!
  DO NOT JUST TELL THEM TO GO TO /admin. DIRECTLY DISPLAY THEIR NAMES AND ROLES!

PLATFORM RULES TO ENFORCE:
1. If the user is a Member (role: Member):
   - Members cannot create new tasks. Task creation is done by Project Managers, Admins, or the Owner.
   - Members focus on viewing assigned tasks, monitoring due dates, updating task status/progress, reporting issues/blockers, and uploading documents.
2. If asked in Tamil or Tanglish (e.g. "users ellarum name kudu", "enna task irukku", "due date enna", "password epdi mathanum"), respond naturally in warm, friendly Tanglish/English.
3. Keep replies crisp, structured with markdown bolding, bullet points, and actionable steps.`;

    const geminiReply = await callGemini(systemPrompt, message);
    if (geminiReply) {
      return res.json({
        success: true,
        reply: geminiReply,
        provider: 'gemini'
      });
    }

    // 3. Contextual local fallback engine
    const lower = message.toLowerCase();
    let reply = '';

    const overdueCount = myTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
    const pendingCount = myTasks.filter((t) => t.status !== 'completed').length;

    // Users / Team directory check
    if (lower.includes('user') || lower.includes('member') || lower.includes('team') || lower.includes('name') || lower.includes('ellarum') || lower.includes('aalu') || lower.includes('yaar')) {
      if (isSuperAdmin && allPlatformUsers.length > 0) {
        reply = `👥 **All Registered Platform Users Directory (${allPlatformUsers.length} Total):**\n\n` +
          allPlatformUsers.map((u, i) => `${i + 1}. **${u.name}** (\`${u.email}\`) — *${u.role || 'User'}* (${u.title || 'Member'})`).join('\n\n') +
          `\n\n🛡️ *Super Admin Access: You can manage, toggle roles, or audit any of these users directly in the Master Admin Console (\`/admin\`).*`;
      } else if (teamMembers.length > 0) {
        reply = `👥 **Team Members in ${workspaceName} (${teamMembers.length} Members):**\n\n` +
          teamMembers.map((m, i) => `${i + 1}. **${m.user?.name || 'Unnamed'}** (\`${m.user?.email}\`) — *${m.role}* (${m.user?.title || 'Contributor'})`).join('\n\n') +
          `\n\n💡 *Project Managers and Workspace Owners can manage roles or invite new teammates from Workspace Settings.*`;
      } else {
        reply = `Currently, there are no other members in **${workspaceName}**. You can invite teammates from **Workspace Settings**!`;
      }
    } else if (lower.includes('task') || lower.includes('ennaku') || lower.includes('work') || lower.includes('assigned') || lower.includes('pending') || lower.includes('velai')) {
      if (myTasks.length === 0) {
        reply = `Hello **${user.name}**! You currently do not have any tasks assigned to you in **${workspaceName}**.\n\nOnce a Project Manager or Admin assigns a task to you, it will appear right on your dashboard with its deadline!`;
      } else {
        reply =
          `Hello **${user.name}**! Here is your current task summary in **${workspaceName}**:\n\n` +
          `• **Total Assigned:** ${myTasks.length} task(s)\n` +
          `• **Pending / In Progress:** ${pendingCount}\n` +
          `• **Overdue:** ${overdueCount > 0 ? `⚠️ ${overdueCount} task(s) past deadline!` : '✅ None! All on schedule'}\n\n` +
          `**Your Deliverables:**\n` +
          myTasks
            .slice(0, 5)
            .map((t) => {
              const isO = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
              const d = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
              return `• **${t.title}** (${t.project?.name || 'Project'})\n  - Status: \`${t.status}\` | Priority: \`${t.priority}\` | Due: **${d}** ${isO ? '*(⚠️ OVERDUE)*' : ''}`;
            })
            .join('\n\n') +
          `\n\n💡 *Tip: You can update your task status directly from the Dashboard or Tasks tab.*`;
      }
    } else if (lower.includes('due') || lower.includes('deadline') || lower.includes('date') || lower.includes('overdue')) {
      if (myTasks.length === 0) {
        reply = `You don't have any pending deadlines right now in **${workspaceName}**. Everything is clear!`;
      } else {
        reply =
          `⏰ **Your Task Deadlines Overview:**\n\n` +
          myTasks
            .map((t) => {
              const isO = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
              const d = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No deadline';
              return `• **${t.title}**: ${d} ${isO ? '🔴 **[OVERDUE]**' : '🟢 [Active]'}`;
            })
            .join('\n') +
          `\n\n📧 *Automated due date reminder emails are sent whenever deadlines approach within 48 hours via Resend & Brevo.*`;
      }
    } else {
      reply = getLocalPublicReply(message, allPlatformUsers.length > 0 ? allPlatformUsers : teamMembers.map((m) => m.user));
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
