const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: __dirname + '/../../.env' });

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Document = require('../models/Document');
const { evaluateProjectHealth } = require('../services/automationService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/protrack';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Membership.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Milestone.deleteMany({}),
      Issue.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      Document.deleteMany({})
    ]);

    console.log('[Seed] Cleared existing data.');

    // 1. Create Users
    const plainPassword = 'ProTrack2026!';

    const users = await User.create([
      {
        name: 'Alex Rivera',
        email: 'alex@protrack.dev',
        password: plainPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'VP of Product & Engineering',
        bio: 'Product strategist and systems architect focused on developer velocity and team collaboration.'
      },
      {
        name: 'Elena Rostova',
        email: 'elena@protrack.dev',
        password: plainPassword,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        title: 'Lead Frontend Architect',
        bio: 'Design systems fanatic, TypeScript builder, and performance enthusiast.'
      },
      {
        name: 'Marcus Chen',
        email: 'marcus@protrack.dev',
        password: plainPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        title: 'Senior Backend Engineer',
        bio: 'Distributed systems, database optimization, and cloud architecture.'
      },
      {
        name: 'Sophia Patel',
        email: 'sophia@protrack.dev',
        password: plainPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        title: 'Technical Project Manager',
        bio: 'Scrum master, agile coach, keeping cross-functional roadmaps synchronized.'
      },
      {
        name: 'David Kim',
        email: 'david@protrack.dev',
        password: plainPassword,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        title: 'Product QA Analyst & Viewer',
        bio: 'Quality engineering, release validation, and user journey audit.'
      }
    ]);

    const [alex, elena, marcus, sophia, david] = users;

    // 2. Create Workspace
    const workspace = await Workspace.create({
      name: 'Acme Technologies',
      slug: 'acme-technologies',
      description: 'Central engineering and product operations workspace for Acme Cloud solutions.',
      owner: alex._id,
      teamType: 'Software Development'
    });

    // Update current workspace for users
    for (const u of users) {
      u.currentWorkspace = workspace._id;
      await u.save();
    }

    // 3. Create Memberships
    await Membership.create([
      { user: alex._id, workspace: workspace._id, role: 'Owner' },
      { user: sophia._id, workspace: workspace._id, role: 'Admin' },
      { user: marcus._id, workspace: workspace._id, role: 'Project Manager' },
      { user: elena._id, workspace: workspace._id, role: 'Member' },
      { user: david._id, workspace: workspace._id, role: 'Viewer' }
    ]);

    console.log('[Seed] Created Workspace and 5 Memberships.');

    // 4. Create Projects
    const now = new Date();
    const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const project1 = await Project.create({
      workspace: workspace._id,
      name: 'Cloud Infrastructure Modernization',
      projectCode: 'PRJ-101',
      description: 'Migration of core microservices to Kubernetes clusters with zero-downtime traffic cutover.',
      owner: alex._id,
      members: [
        { user: alex._id, role: 'Lead' },
        { user: marcus._id, role: 'Backend Lead' },
        { user: sophia._id, role: 'Scrum Manager' }
      ],
      startDate: past14Days,
      dueDate: in30Days,
      priority: 'high',
      status: 'active',
      health: 'on_track',
      progress: 45,
      tags: ['Infrastructure', 'Kubernetes', 'DevOps', 'Security']
    });

    const project2 = await Project.create({
      workspace: workspace._id,
      name: 'Design System & UI Components V2',
      projectCode: 'PRJ-102',
      description: 'Unifying component library across web and mobile with accessible tokens and dark mode support.',
      owner: elena._id,
      members: [
        { user: elena._id, role: 'Lead' },
        { user: alex._id, role: 'Reviewer' },
        { user: david._id, role: 'QA Contributor' }
      ],
      startDate: past14Days,
      dueDate: in10Days,
      priority: 'urgent',
      status: 'active',
      health: 'at_risk',
      progress: 60,
      tags: ['Design System', 'React', 'Tailwind', 'Accessibility']
    });

    const project3 = await Project.create({
      workspace: workspace._id,
      name: 'Mobile Client Biometric Auth',
      projectCode: 'PRJ-103',
      description: 'FaceID and fingerprint integration with WebAuthn backplane for high-security sessions.',
      owner: marcus._id,
      members: [
        { user: marcus._id, role: 'Lead' },
        { user: sophia._id, role: 'PM' }
      ],
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: past2Days, // overdue deadline to trigger automation
      priority: 'high',
      status: 'active',
      health: 'delayed',
      progress: 75,
      tags: ['Mobile', 'Security', 'Auth']
    });

    const project4 = await Project.create({
      workspace: workspace._id,
      name: 'Enterprise Analytics Dashboard V1',
      projectCode: 'PRJ-104',
      description: 'Real-time telemetry and reporting engine for enterprise executive accounts.',
      owner: sophia._id,
      members: [
        { user: sophia._id, role: 'Lead' },
        { user: elena._id, role: 'Frontend' },
        { user: marcus._id, role: 'Database' }
      ],
      startDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      dueDate: past14Days,
      priority: 'medium',
      status: 'completed',
      health: 'completed',
      progress: 100,
      tags: ['Analytics', 'Telemetry', 'Released']
    });

    console.log('[Seed] Created 4 Projects.');

    // 5. Create Milestones
    await Milestone.create([
      {
        workspace: workspace._id,
        project: project1._id,
        title: 'Cluster Provisioning & VPC Peering',
        description: 'Multi-region AWS EKS clusters and private subnets established.',
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        createdBy: alex._id
      },
      {
        workspace: workspace._id,
        project: project1._id,
        title: 'CI/CD Pipeline Automated Deployment',
        description: 'ArgoCD integration with GitHub actions and automated rollbacks.',
        dueDate: in10Days,
        status: 'in_progress',
        createdBy: alex._id
      },
      {
        workspace: workspace._id,
        project: project2._id,
        title: 'Color & Typography Token Spec',
        description: 'Complete Figma sync and token JSON exports.',
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdBy: elena._id
      },
      {
        workspace: workspace._id,
        project: project2._id,
        title: 'Accessible Form Controls Release',
        description: 'WCAG AAA compliance tests for inputs, selects, and modals.',
        dueDate: past2Days,
        status: 'delayed',
        createdBy: elena._id
      },
      {
        workspace: workspace._id,
        project: project3._id,
        title: 'Secure Keychain & Enclave Integration',
        dueDate: past2Days,
        status: 'delayed',
        createdBy: marcus._id
      }
    ]);

    // 6. Create Tasks
    await Task.create([
      // Project 1 Tasks
      {
        workspace: workspace._id,
        project: project1._id,
        taskNumber: 1,
        title: 'Audit Terraform scripts for VPC isolation',
        description: 'Review security group egress rules and ensure bastion host access is restricted.',
        assignee: marcus._id,
        creator: alex._id,
        priority: 'high',
        status: 'completed',
        progress: 100,
        labels: ['DevOps', 'Security'],
        order: 0,
        dueDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        comments: [
          { user: alex._id, text: 'Great work getting the egress rules locked down without breaking DNS.' }
        ]
      },
      {
        workspace: workspace._id,
        project: project1._id,
        taskNumber: 2,
        title: 'Configure Prometheus and Grafana alerts',
        description: 'Setup thresholds for memory leaks, pod restarts, and 5xx response spikes.',
        assignee: alex._id,
        creator: sophia._id,
        priority: 'medium',
        status: 'in_progress',
        progress: 60,
        labels: ['Monitoring'],
        order: 0,
        dueDate: in10Days
      },
      {
        workspace: workspace._id,
        project: project1._id,
        taskNumber: 3,
        title: 'Stress-test load balancing under peak traffic',
        description: 'Simulate 50,000 requests per minute with Locust or k6.',
        assignee: marcus._id,
        creator: alex._id,
        priority: 'urgent',
        status: 'todo',
        progress: 0,
        labels: ['QA', 'Performance'],
        order: 0,
        dueDate: in30Days
      },

      // Project 2 Tasks
      {
        workspace: workspace._id,
        project: project2._id,
        taskNumber: 1,
        title: 'Implement Dark Mode color scheme tokens',
        description: 'Verify background contrast ratios (#0B1120 background and #111827 card surfaces).',
        assignee: elena._id,
        creator: alex._id,
        priority: 'urgent',
        status: 'in_progress',
        progress: 80,
        labels: ['Tailwind', 'UI/UX'],
        order: 0,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        comments: [
          { user: alex._id, text: 'Looks crisp! Make sure modal backdrops use opacity-80 backdrop-blur.' }
        ]
      },
      {
        workspace: workspace._id,
        project: project2._id,
        taskNumber: 2,
        title: 'Fix keyboard focus ring in dropdown menus',
        description: 'Dropdown items lose focus trap when navigating with ArrowDown.',
        assignee: elena._id,
        creator: david._id,
        priority: 'high',
        status: 'todo',
        progress: 0,
        labels: ['A11y', 'Bug'],
        order: 1,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Overdue
      },
      {
        workspace: workspace._id,
        project: project2._id,
        taskNumber: 3,
        title: 'Publish v2.0 npm package preview',
        description: 'Draft changelog and tag v2.0.0-beta.1 on internal registry.',
        assignee: alex._id,
        creator: elena._id,
        priority: 'medium',
        status: 'in_review',
        progress: 90,
        labels: ['Release'],
        order: 0,
        dueDate: in10Days
      },

      // Project 3 Tasks
      {
        workspace: workspace._id,
        project: project3._id,
        taskNumber: 1,
        title: 'iOS Secure Enclave biometric challenge integration',
        description: 'Implement LocalAuthentication context evaluation with fallback passcode.',
        assignee: marcus._id,
        creator: sophia._id,
        priority: 'urgent',
        status: 'in_progress',
        progress: 70,
        labels: ['iOS', 'Security'],
        order: 0,
        dueDate: past2Days // Overdue
      },
      {
        workspace: workspace._id,
        project: project3._id,
        taskNumber: 2,
        title: 'Android BiometricPrompt API integration',
        description: 'Support Strong vs Weak authenticators across Samsung and Pixel devices.',
        assignee: marcus._id,
        creator: sophia._id,
        priority: 'high',
        status: 'todo',
        progress: 0,
        labels: ['Android'],
        order: 0,
        dueDate: past2Days // Overdue
      }
    ]);

    // 7. Create Issues
    await Issue.create([
      {
        workspace: workspace._id,
        project: project2._id,
        title: 'Contrast ratio failure on Dark Mode secondary badge',
        description: 'Secondary text on badge does not satisfy WCAG AA 4.5:1 ratio on OLED screens.',
        priority: 'high',
        category: 'bug',
        assignee: elena._id,
        reporter: david._id,
        status: 'open',
        dueDate: in10Days
      },
      {
        workspace: workspace._id,
        project: project3._id,
        title: 'Biometric credential cache invalidated after OS update',
        description: 'Critical blocker: Users report infinite auth loop if fingerprint enrollment changed in device settings.',
        priority: 'critical',
        category: 'blocker',
        assignee: marcus._id,
        reporter: sophia._id,
        status: 'in_progress',
        dueDate: in10Days
      },
      {
        workspace: workspace._id,
        project: project1._id,
        title: 'Kubernetes ingress controller cert-manager renewal timeout',
        description: 'Let\'s Encrypt challenge fails when rate-limited during high pod scaling events.',
        priority: 'medium',
        category: 'technical_debt',
        assignee: alex._id,
        reporter: marcus._id,
        status: 'resolved',
        resolutionNotes: 'Updated renewal window to 30 days prior and added DNS-01 challenge fallback.'
      }
    ]);

    // 8. Create Documents
    await Document.create([
      {
        workspace: workspace._id,
        project: project1._id,
        title: 'K8s Cluster Architecture & Threat Model',
        originalName: 'k8s_architecture_spec_v2.pdf',
        fileName: 'seed_k8s_spec.pdf',
        mimeType: 'application/pdf',
        size: 1845000,
        filePath: 'uploads/seed_k8s_spec.pdf',
        uploader: alex._id,
        description: 'Security blueprint and networking topology diagram for the cloud migration.',
        tags: ['Architecture', 'Security', 'PDF']
      },
      {
        workspace: workspace._id,
        project: project2._id,
        title: 'Design System Figma Token Export',
        originalName: 'protrack_design_tokens.json',
        fileName: 'seed_tokens.json',
        mimeType: 'application/json',
        size: 42300,
        filePath: 'uploads/seed_tokens.json',
        uploader: elena._id,
        description: 'Raw color palette, typography scales, spacing tokens, and shadow presets.',
        tags: ['Tokens', 'Figma', 'JSON']
      }
    ]);

    // 9. Create Activity Logs
    await ActivityLog.create([
      {
        workspace: workspace._id,
        project: project1._id,
        user: alex._id,
        action: 'created',
        entityType: 'project',
        entityId: project1._id,
        entityTitle: project1.name,
        details: { projectCode: 'PRJ-101' }
      },
      {
        workspace: workspace._id,
        project: project2._id,
        user: elena._id,
        action: 'status_change',
        entityType: 'task',
        entityTitle: 'Implement Dark Mode color scheme tokens',
        details: { from: 'todo', to: 'in_progress' }
      },
      {
        workspace: workspace._id,
        project: project3._id,
        user: sophia._id,
        action: 'created',
        entityType: 'issue',
        entityTitle: 'Biometric credential cache invalidated after OS update',
        details: { priority: 'critical', category: 'blocker' }
      },
      {
        workspace: workspace._id,
        project: project1._id,
        user: marcus._id,
        action: 'status_change',
        entityType: 'task',
        entityTitle: 'Audit Terraform scripts for VPC isolation',
        details: { from: 'in_progress', to: 'completed' }
      }
    ]);

    // 10. Create Notifications
    await Notification.create([
      {
        workspace: workspace._id,
        recipient: alex._id,
        sender: elena._id,
        type: 'comment_added',
        title: 'New Comment on Dark Mode',
        message: 'Elena commented on "Implement Dark Mode color scheme tokens"',
        link: `/projects/${project2._id}?tab=tasks`,
        isRead: false
      },
      {
        workspace: workspace._id,
        recipient: alex._id,
        sender: sophia._id,
        type: 'project_risk',
        title: 'Project Delay Warning',
        message: 'Project "Mobile Client Biometric Auth" has 2 overdue tasks.',
        link: `/projects/${project3._id}`,
        isRead: false
      },
      {
        workspace: workspace._id,
        recipient: alex._id,
        sender: marcus._id,
        type: 'task_assigned',
        title: 'New Review Assigned',
        message: 'Marcus requested your review on "Configure Prometheus and Grafana alerts"',
        link: `/projects/${project1._id}?tab=tasks`,
        isRead: true
      }
    ]);

    // Evaluate health across all projects
    for (const p of [project1, project2, project3, project4]) {
      await evaluateProjectHealth(p._id);
    }

    console.log('[Seed] Successfully seeded all database collections with rich realistic data!');
    console.log('----------------------------------------------------');
    console.log('DEMO ACCOUNTS:');
    console.log('Owner:   alex@protrack.dev     / ProTrack2026!');
    console.log('Admin:   sophia@protrack.dev   / ProTrack2026!');
    console.log('PM:      marcus@protrack.dev   / ProTrack2026!');
    console.log('Member:  elena@protrack.dev    / ProTrack2026!');
    console.log('Viewer:  david@protrack.dev    / ProTrack2026!');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
