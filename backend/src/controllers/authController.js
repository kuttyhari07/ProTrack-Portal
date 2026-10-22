const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const Invitation = require('../models/Invitation');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');

// @desc    Register a new user & create initial workspace
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, workspaceName, teamType, accountType = 'owner', title } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Handle Team Member registration (joins via invitation or waits for PM to invite)
    if (accountType === 'member') {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        title: title ? title.trim() : 'Team Member'
      });

      // Auto-join if workspace invitation was already sent to this email
      const pendingInvites = await Invitation.find({
        email: normalizedEmail,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('workspace');

      let currentWorkspace = null;

      if (pendingInvites.length > 0) {
        const invite = pendingInvites[0];
        if (invite.workspace) {
          await Membership.create({
            user: user._id,
            workspace: invite.workspace._id,
            role: invite.role || 'Member'
          });

          invite.status = 'accepted';
          await invite.save();

          user.currentWorkspace = invite.workspace._id;
          await user.save();

          currentWorkspace = {
            id: invite.workspace._id,
            name: invite.workspace.name,
            slug: invite.workspace.slug,
            role: invite.role || 'Member'
          };
        }
      }

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        accountType: 'member',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          title: user.title,
          preferences: user.preferences,
          currentWorkspace: currentWorkspace ? currentWorkspace.id : null
        },
        currentWorkspace
      });
    }

    // Default: Workspace Owner / Lead registration
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      title: title ? title.trim() : 'Workspace Owner'
    });

    // Generate workspace slug
    const wsName = workspaceName && workspaceName.trim() ? workspaceName.trim() : `${name.split(' ')[0]}'s Workspace`;
    let baseSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const workspace = await Workspace.create({
      name: wsName,
      slug,
      owner: user._id,
      teamType: teamType || 'General'
    });

    // Create Owner membership
    const membership = await Membership.create({
      user: user._id,
      workspace: workspace._id,
      role: 'Owner'
    });

    // Update user's current workspace
    user.currentWorkspace = workspace._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        preferences: user.preferences,
        currentWorkspace: workspace._id
      },
      currentWorkspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        role: 'Owner'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by the platform administrator. Contact protrack24@gmail.com for assistance.'
      });
    }

    // Ensure protrack24 is always recognized as system_admin
    const isSuperAdmin = user.email.toLowerCase() === 'protrack24@gmail.com' || user.role === 'system_admin';
    if (isSuperAdmin && user.role !== 'system_admin') {
      user.role = 'system_admin';
      await user.save();
    }

    // Find active workspaces for user
    const memberships = await Membership.find({
      user: user._id,
      status: 'active'
    }).populate('workspace');

    let currentWorkspace = null;
    if (user.currentWorkspace && memberships.some(m => m.workspace && m.workspace._id.toString() === user.currentWorkspace.toString())) {
      const match = memberships.find(m => m.workspace._id.toString() === user.currentWorkspace.toString());
      currentWorkspace = {
        id: match.workspace._id,
        name: match.workspace.name,
        slug: match.workspace.slug,
        role: match.role
      };
    } else if (memberships.length > 0 && memberships[0].workspace) {
      user.currentWorkspace = memberships[0].workspace._id;
      await user.save();
      currentWorkspace = {
        id: memberships[0].workspace._id,
        name: memberships[0].workspace.name,
        slug: memberships[0].workspace.slug,
        role: memberships[0].role
      };
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        role: user.role || (isSuperAdmin ? 'system_admin' : 'user'),
        status: user.status || 'active',
        preferences: user.preferences,
        currentWorkspace: currentWorkspace ? currentWorkspace.id : null
      },
      currentWorkspace,
      workspaces: memberships.map(m => ({
        id: m.workspace._id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user & workspace profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const memberships = await Membership.find({
      user: user._id,
      status: 'active'
    }).populate('workspace');

    let currentWorkspace = null;
    if (user.currentWorkspace) {
      const found = memberships.find(m => m.workspace && m.workspace._id.toString() === user.currentWorkspace.toString());
      if (found) {
        currentWorkspace = {
          id: found.workspace._id,
          name: found.workspace.name,
          slug: found.workspace.slug,
          role: found.role
        };
      }
    }

    if (!currentWorkspace && memberships.length > 0 && memberships[0].workspace) {
      currentWorkspace = {
        id: memberships[0].workspace._id,
        name: memberships[0].workspace.name,
        slug: memberships[0].workspace.slug,
        role: memberships[0].role
      };
      user.currentWorkspace = memberships[0].workspace._id;
      await user.save();
    }

    const isSuperAdmin = user.email.toLowerCase() === 'protrack24@gmail.com' || user.role === 'system_admin';
    if (isSuperAdmin && user.role !== 'system_admin') {
      user.role = 'system_admin';
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        bio: user.bio,
        role: user.role || (isSuperAdmin ? 'system_admin' : 'user'),
        status: user.status || 'active',
        preferences: user.preferences,
        currentWorkspace: currentWorkspace ? currentWorkspace.id : null
      },
      currentWorkspace,
      workspaces: memberships.filter(m => m.workspace).map(m => ({
        id: m.workspace._id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, title, bio, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (title !== undefined) user.title = title;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        bio: user.bio,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // In production, send email; in demo/dev, also return the resetToken for convenient testing
    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation token and join workspace
// @route   POST /api/auth/accept-invite
// @access  Private (Authenticated User)
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token or code is required' });
    }

    const invitation = await Invitation.findOne({
      token: token.trim(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('workspace');

    if (!invitation || !invitation.workspace) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation token' });
    }

    let membership = await Membership.findOne({
      user: req.user._id,
      workspace: invitation.workspace._id
    });

    if (!membership) {
      membership = await Membership.create({
        user: req.user._id,
        workspace: invitation.workspace._id,
        role: invitation.role || 'Member'
      });
    } else {
      membership.status = 'active';
      membership.role = invitation.role || 'Member';
      await membership.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    req.user.currentWorkspace = invitation.workspace._id;
    await req.user.save();

    res.json({
      success: true,
      message: `Successfully joined "${invitation.workspace.name}" as ${membership.role}`,
      workspace: {
        id: invitation.workspace._id,
        name: invitation.workspace.name,
        slug: invitation.workspace.slug,
        role: membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  acceptInvitation
};
