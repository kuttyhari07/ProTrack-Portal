const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const crypto = require('crypto');
const { logActivity } = require('../services/activityService');
const { sendWorkspaceInvitationEmail } = require('../services/emailService');
const { emitToUser } = require('../services/socketService');

// @desc    Get all workspaces current user belongs to
// @route   GET /api/workspaces
// @access  Private
const getMyWorkspaces = async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: 'active'
    }).populate('workspace');

    const workspaces = memberships
      .filter((m) => m.workspace)
      .map((m) => ({
        _id: m.workspace._id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        description: m.workspace.description,
        teamType: m.workspace.teamType,
        owner: m.workspace.owner,
        role: m.role,
        joinedAt: m.joinedAt
      }));

    res.json({
      success: true,
      count: workspaces.length,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, teamType } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required'
      });
    }

    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const workspace = await Workspace.create({
      name: name.trim(),
      slug,
      description: description || '',
      teamType: teamType || 'General',
      owner: req.user._id
    });

    // Create Owner membership
    await Membership.create({
      user: req.user._id,
      workspace: workspace._id,
      role: 'Owner'
    });

    // Update current workspace for user
    req.user.currentWorkspace = workspace._id;
    await req.user.save();

    await logActivity({
      workspaceId: workspace._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'workspace',
      entityId: workspace._id,
      entityTitle: workspace.name
    });

    res.status(201).json({
      success: true,
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        teamType: workspace.teamType,
        role: 'Owner'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Switch active workspace
// @route   POST /api/workspaces/switch/:workspaceId
// @access  Private
const switchWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: req.user._id,
      status: 'active'
    }).populate('workspace');

    if (!membership || !membership.workspace) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    req.user.currentWorkspace = workspaceId;
    await req.user.save();

    res.json({
      success: true,
      workspace: {
        id: membership.workspace._id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workspace details & settings
// @route   GET /api/workspaces/:workspaceId
// @access  Private (Workspace Member)
const getWorkspaceDetails = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId).populate('owner', 'name email avatar');
    const memberCount = await Membership.countDocuments({
      workspace: req.workspaceId,
      status: 'active'
    });

    res.json({
      success: true,
      workspace: {
        ...workspace.toObject(),
        memberCount,
        currentUserRole: req.userRole
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workspace details
// @route   PUT /api/workspaces/:workspaceId
// @access  Private (Owner, Admin)
const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description, teamType, settings } = req.body;
    const workspace = await Workspace.findById(req.workspaceId);

    if (name) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description;
    if (teamType) workspace.teamType = teamType;
    if (settings) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    await workspace.save();

    await logActivity({
      workspaceId: workspace._id,
      userId: req.user._id,
      action: 'updated',
      entityType: 'workspace',
      entityId: workspace._id,
      entityTitle: workspace.name
    });

    res.json({
      success: true,
      message: 'Workspace updated successfully',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all members of workspace
// @route   GET /api/workspaces/:workspaceId/members
// @access  Private (Workspace Member)
const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await Membership.find({
      workspace: req.workspaceId
    })
      .populate('user', 'name email avatar title bio createdAt')
      .sort({ role: 1, joinedAt: -1 });

    const invitations = await Invitation.find({
      workspace: req.workspaceId,
      status: 'pending'
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: members.length,
      members: members.map((m) => ({
        id: m._id,
        userId: m.user?._id,
        name: m.user?.name,
        email: m.user?.email,
        avatar: m.user?.avatar,
        title: m.user?.title,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt
      })),
      invitations: invitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invitedBy?.name,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite new member to workspace
// @route   POST /api/workspaces/:workspaceId/invitations
// @access  Private (Owner, Admin)
const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'Member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Invitee email address is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Check existing membership
      const existingMembership = await Membership.findOne({
        workspace: req.workspaceId,
        user: user._id
      });

      if (existingMembership) {
        if (existingMembership.status === 'active') {
          return res.status(400).json({
            success: false,
            message: 'User is already an active member of this workspace'
          });
        } else {
          // Reactivate
          existingMembership.status = 'active';
          existingMembership.role = role;
          await existingMembership.save();

          await logActivity({
            workspaceId: req.workspaceId,
            userId: req.user._id,
            action: 'updated',
            entityType: 'member',
            entityTitle: user.name,
            details: { email: normalizedEmail, role, action: 'reactivated' }
          });

          return res.json({
            success: true,
            message: `User ${user.name} has been reactivated in this workspace with role ${role}`
          });
        }
      }

      // Add user directly as member
      await Membership.create({
        user: user._id,
        workspace: req.workspaceId,
        role
      });

      if (!user.currentWorkspace) {
        user.currentWorkspace = req.workspaceId;
        await user.save();
      }

      await logActivity({
        workspaceId: req.workspaceId,
        userId: req.user._id,
        action: 'created',
        entityType: 'member',
        entityTitle: user.name,
        details: { email: normalizedEmail, role }
      });

      // In-app notification
      const notif = await Notification.create({
        workspace: req.workspaceId,
        recipient: user._id,
        sender: req.user._id,
        type: 'system',
        title: 'Joined Workspace',
        message: `${req.user.name} added you to workspace "${req.workspace.name}" as ${role}.`,
        link: '/dashboard'
      });
      emitToUser(user._id, 'notification_new', notif);

      // Email notification
      await sendWorkspaceInvitationEmail({
        recipientEmail: user.email,
        workspaceName: req.workspace.name,
        role,
        inviterName: req.user.name,
        inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`
      });

      return res.status(201).json({
        success: true,
        message: `User ${user.name} has been added to ${req.workspace.name} as ${role}. An invitation email has been dispatched.`
      });
    }

    // Otherwise create pending invitation
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      workspace: req.workspaceId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: req.user._id,
      expiresAt
    });

    await logActivity({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'created',
      entityType: 'member',
      entityTitle: normalizedEmail,
      details: { role, status: 'invitation_dispatched' }
    });

    // Send invitation email with direct join link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/auth/register?type=member&email=${encodeURIComponent(normalizedEmail)}&inviteToken=${token}`;

    await sendWorkspaceInvitationEmail({
      recipientEmail: normalizedEmail,
      workspaceName: req.workspace.name,
      role,
      inviterName: req.user.name,
      inviteLink
    });

    res.status(201).json({
      success: true,
      message: `Invitation generated and dispatched to ${normalizedEmail}`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        inviteLink,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member's role or status
// @route   PUT /api/workspaces/:workspaceId/members/:memberId
// @access  Private (Owner, Admin)
const updateMember = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const { memberId } = req.params;

    const targetMembership = await Membership.findById(memberId).populate('user');
    if (!targetMembership || targetMembership.workspace.toString() !== req.workspaceId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this workspace'
      });
    }

    // Cannot modify workspace owner unless you are the owner
    if (targetMembership.role === 'Owner' && req.userRole !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the Workspace Owner can modify the owner account'
      });
    }

    if (role) targetMembership.role = role;
    if (status) targetMembership.status = status;

    await targetMembership.save();

    await logActivity({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'updated',
      entityType: 'member',
      entityTitle: targetMembership.user?.name || 'Member',
      details: { role, status }
    });

    res.json({
      success: true,
      message: 'Member updated successfully',
      member: targetMembership
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove or deactivate a member
// @route   DELETE /api/workspaces/:workspaceId/members/:memberId
// @access  Private (Owner, Admin)
const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const targetMembership = await Membership.findById(memberId).populate('user');

    if (!targetMembership || targetMembership.workspace.toString() !== req.workspaceId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Member record not found'
      });
    }

    if (targetMembership.role === 'Owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the primary Workspace Owner'
      });
    }

    await Membership.findByIdAndDelete(memberId);

    await logActivity({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'member',
      entityTitle: targetMembership.user?.name || 'Member',
      details: { email: targetMembership.user?.email }
    });

    res.json({
      success: true,
      message: 'Member removed from workspace'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workspace recent activity logs
// @route   GET /api/workspaces/:workspaceId/activity
// @access  Private (Workspace Member)
const getWorkspaceActivity = async (req, res, next) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const activities = await ActivityLog.find({ workspace: req.workspaceId })
      .populate('user', 'name email avatar title')
      .populate('project', 'name projectCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await ActivityLog.countDocuments({ workspace: req.workspaceId });

    res.json({
      success: true,
      count: activities.length,
      total,
      activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWorkspaces,
  createWorkspace,
  switchWorkspace,
  getWorkspaceDetails,
  updateWorkspace,
  getWorkspaceMembers,
  inviteMember,
  updateMember,
  removeMember,
  getWorkspaceActivity
};
