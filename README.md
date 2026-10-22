# ProTrack-Portal — Project Management & Monitoring SaaS

> **Tagline:** Plan Smarter. Track Progress. Deliver Better.  
> **Stack:** MERN (MongoDB, Express.js, React.js + Vite, Node.js, Tailwind CSS)

ProTrack is an independent, commercial-grade, multi-tenant SaaS application built for modern engineering teams, startups, agencies, and cross-functional product organizations. It combines project planning, task tracking, milestone roadmaps, risk/issue management, document sharing, and deterministic rule-based automation in one workspace.

---

## 🚀 Key Features

1. **Workspace Multi-Tenancy & RBAC**
   - Workspace-based data isolation across all database queries.
   - 5 Granular Roles:
     - **Workspace Owner**: Full administrative control and ownership transfer.
     - **Admin**: Workspace configuration, member management, project deletion.
     - **Project Manager**: Project lead, task and milestone allocation.
     - **Member**: Create, update, comment on tasks, issues, and files.
     - **Viewer**: Read-only oversight with strict server-side mutation blocks (HTTP 403).

2. **Executive & Team Dashboard**
   - 6 Core Metric Cards: Total Projects, Active Projects, Completed, At-Risk, My Open Tasks, Overdue Tasks.
   - Pacing & Project Progress Benchmarking (Recharts).
   - Task Workflow Status Distribution (Donut Chart).
   - Real-time Workspace Activity Stream.
   - High-severity blockers & rule-based insight banners.

3. **Project Management Workspace & Health Diagnostics**
   - Full CRUD with List and Card grid views.
   - Filters by status, priority, health (`on_track`, `needs_attention`, `at_risk`, `delayed`, `completed`), and search.
   - 7 Functional Workspace Tabs:
     1. **Overview**: Deliverable metrics, scope description, tags, calculated risk score factors.
     2. **Tasks**: Interactive task table with live status toggling.
     3. **Board**: Kanban columns (*To Do*, *In Progress*, *In Review*, *Completed*) with column advance/move-back workflows.
     4. **Milestones**: Interactive timeline checkpoints with overdue target indicators.
     5. **Issues**: Risk and blocker tracking with resolution notes.
     6. **Files**: Secure multi-file document repository (up to 25MB).
     7. **Health & AI Insights**: Transparent health status (`on_track`, `needs_attention`, `at_risk`, `delayed`), 0-100 risk scoring, schedule pacing gap detection, and AI/rule-based project summary with risk mitigation action points.

4. **Team Member Onboarding & Invitation Flow**
   - **Dedicated Registration**: Team members can register directly via the "Team Member" tab without being forced to create empty workspaces.
   - **Waiting Portal**: Registered members without an active workspace see an intuitive waiting state where they can enter invitation tokens or notify their manager.
   - **Project Manager Invitations**: Project Managers and Admins can invite members by email with assigned roles.
   - **Instant Auto-Join**: If a member registers with an email that has a pending invitation, they are automatically enrolled into that workspace.

5. **Automated Due Date Reminders & Email Notifications**
   - **Nodemailer SMTP Integration**: Automated reminder scanner checks for tasks due within 48 hours and overdue tasks every hour (or manually triggered by managers via "Send Due Reminders").
   - **Configurable in `backend/.env`**: Easy setup for Gmail or custom SMTP hosts, with graceful console simulation mode when SMTP credentials are not yet configured.
   - **Email Alerts**: Automatic emails sent on task assignment, workspace invitations, and upcoming/overdue deadlines.

6. **Task & Workflow Management**
   - Fast filtering (*All Tasks*, *Assigned to Me*, *Overdue*, *Upcoming 7 Days*).
   - Task discussion drawer with comments and timestamps.
   - Live progress percentage slider (0% - 100%) and status updater for team members.
   - Automatic project progress recalculation upon deliverable completion.

7. **Milestone & Schedule Roadmaps**
   - Visual timeline checkpoints with target dates and overdue warnings.
   - Milestone status toggle directly from the timeline nodes.

8. **Issue & Risk Management**
   - Categorized by Blocker, Bug, Risk, Technical Debt, Compliance.
   - Priority severity levels: Low, Medium, High, Critical.
   - Resolution workflows with resolution audit notes.

9. **Document Repository**
   - File metadata, upload size & MIME type validation.
   - Secure local disk storage with authenticated download endpoints.

10. **Executive Reports & Analytics**
    - Aggregate project velocity and task completion rates.
    - Team workload distribution table (tasks per contributor, completed, overdue).
    - One-click **Tasks CSV Export** & **Projects CSV Export**.
    - Print-friendly layout (`Ctrl+P` / Print button).

11. **Smart Automation & AI Insights Engine**
    - Rule-based deterministic monitoring (no fake AI claims):
      - Pacing gap detection (schedule elapsed > 70% but progress < 50%).
      - Overdue task identification and deadline warnings (next 48h).
      - Critical blocker remediation alerts.
    - Optional Google Gemini integration via `GEMINI_API_KEY` with graceful fallback to deterministic risk evaluation.
    - Manual **Run Workspace Scan** and **Send Due Reminders** triggers.

12. **Design System & Theme Engine**
    - Seamless Light & Dark mode toggle in navbar.
    - Custom palette:
      - **Light Mode**: Background `#F5F7FB`, Cards `#FFFFFF`, Sidebar `#101828`, Accent `#4F46E5`.
      - **Dark Mode**: Background `#0B1120`, Cards `#111827`, Sidebar `#080D19`, Accent `#818CF8`.
    - Persisted in `localStorage` and zero-flash initialization script.
    - Global Search (`⌘K` / `Ctrl+K`) across projects, tasks, issues, and documents.

---

## ⚡ Quick Start & Run Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24)
- **MongoDB**: Running instance locally on port `27017` or a MongoDB Atlas URI

### 1. Install Dependencies
From the repository root:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cd backend
cp .env.example .env
```
Default configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/protrack
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=25
```

### 3. Seed Database with Realistic Demo Data
Run the automated seed script to populate realistic projects, tasks, issues, milestones, and demo accounts:
```bash
cd backend
npm run seed
```

### 4. Start the Application
In separate terminal tabs:

**Terminal 1 (Backend API on port 5000):**
```bash
cd backend
npm run dev
# or
node server.js
```

**Terminal 2 (Frontend Client on port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 👥 Role-Based Access Hierarchy

ProTrack maintains strict role-based access control (RBAC) to ensure security and project discipline:

| Role | Access Level | Responsibilities |
| :--- | :--- | :--- |
| **Workspace Owner** | Full Organization Control | Workspace settings, billing, member invites, and project deletion |
| **Admin** | Administrative Access | Workspace configuration, member role management, initiative oversight |
| **Project Manager** | Planning & Allocation | Project creation, milestone schedules, sprint planning, and task assignment |
| **Member / Developer** | Delivery & Execution | Viewing assigned deliverables, updating task status, reporting blockers, and uploading docs |
| **Viewer** | Read-Only Access | Stakeholder observation (mutations strictly blocked server-side) |

Users can create new accounts via the sign-up portal (`/auth/register`) or join an existing organization via email invitations.

---

## 📂 System Architecture

```text
ProTrack/
├── backend/
│   ├── server.js                      # Express HTTP & Socket.IO entry point
│   ├── src/
│   │   ├── config/db.js               # Mongoose database connector
│   │   ├── models/                    # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Workspace.js
│   │   │   ├── Membership.js
│   │   │   ├── Invitation.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   ├── Milestone.js
│   │   │   ├── Issue.js
│   │   │   ├── Notification.js
│   │   │   ├── ActivityLog.js
│   │   │   └── Document.js
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT Bearer token authentication
│   │   │   ├── workspace.js           # Multi-tenant isolation & RBAC hierarchy
│   │   │   ├── upload.js              # Multer file validation & disk storage
│   │   │   └── errorHandler.js        # Centralized safe error handler
│   │   ├── controllers/               # Business logic controllers
│   │   ├── routes/                    # Modular Express API endpoints
│   │   ├── services/
│   │   │   ├── automationService.js   # Rule-based health & pacing engine
│   │   │   ├── activityService.js     # Audit activity logging
│   │   │   └── socketService.js       # Real-time WebSocket emitter
│   │   └── utils/
│   │       ├── jwt.js
│   │       └── seed.js                # Database seed generator
│   └── uploads/                       # Document storage directory
│
└── frontend/
    ├── src/
    │   ├── context/                   # Theme, Auth, Workspace, Socket, Notification
    │   ├── components/
    │   │   ├── common/                # Button, Input, Select, Badge, Card, Modal, StatCard, Skeleton
    │   │   └── layout/                # Navbar, Sidebar, Layout, ThemeToggle, NotificationBell, GlobalSearch
    │   ├── pages/
    │   │   ├── auth/                  # Login, Register, ForgotPassword
    │   │   ├── onboarding/            # 3-step interactive onboarding wizard
    │   │   ├── dashboard/             # Executive Overview & Charts
    │   │   ├── projects/              # ProjectList, ProjectDetail (7 Tabs)
    │   │   ├── tasks/                 # GlobalTaskList (Table & Kanban views)
    │   │   ├── milestones/            # MilestonesTimeline
    │   │   ├── issues/                # IssueList
    │   │   ├── documents/             # DocumentsPage
    │   │   ├── reports/               # ReportsAnalytics (Charts & CSV export)
    │   │   ├── automation/            # AutomationPage (Rule engine & scan)
    │   │   ├── workspace/             # WorkspaceSettings & Team invites
    │   │   └── profile/               # UserProfile & theme selector
    │   ├── services/api.js            # Axios client with JWT + workspace interceptors
    │   └── index.css                  # Tailwind styles & theme variables
```

---

## 🔒 Security & Multi-Tenancy

- **Guaranteed Isolation**: All backend queries enforce the validated `workspace` ObjectId from the active membership record. A user cannot query or mutate records from a workspace they do not belong to.
- **Password Security**: Passwords are encrypted using `bcrypt` (10 salt rounds) and stripped from standard responses.
- **Rate Limiting**: Sensitive endpoints under `/api/auth` are protected against brute-force attacks via `express-rate-limit`.
- **Upload Validation**: File extensions are filtered against strict whitelist criteria, and file sizes are enforced (max 25MB).

---

## 🌐 Production Deployment Guide

### Deployment Options
- **Backend API**: Render, Railway, or AWS Elastic Beanstalk (Node.js runtime).
- **Frontend SPA**: Vercel, Netlify, or AWS CloudFront (Vite build output in `frontend/dist`).
- **Database**: MongoDB Atlas Cluster.
