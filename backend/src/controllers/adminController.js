const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// @desc    Get complete platform statistics for Admin Dashboard
// @route   GET /api/admin/stats
// @access  Private (System Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalWorkspaces,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      feedbacks,
      payments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      Workspace.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['active', 'in_progress', 'planning'] } }),
      Project.countDocuments({ status: 'completed' }),
      Task.countDocuments(),
      Task.countDocuments({ status: { $in: ['completed', 'done'] } }),
      Feedback.find().sort({ createdAt: -1 }),
      Payment.find({ status: 'paid' })
    ]);

    // Feedbacks stats
    const totalFeedbacks = feedbacks.length;
    const newFeedbacks = feedbacks.filter(f => f.status === 'new').length;
    const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved').length;
    const avgRating = totalFeedbacks > 0 
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalFeedbacks).toFixed(1)
      : 5.0;

    // Payments / Revenue stats
    const totalRevenueINR = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPaidTransactions = payments.length;

    // Recent 7 days registration trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          newLast7Days: newUsersLast7Days
        },
        workspaces: {
          total: totalWorkspaces
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks
        },
        feedback: {
          total: totalFeedbacks,
          new: newFeedbacks,
          resolved: resolvedFeedbacks,
          avgRating: parseFloat(avgRating)
        },
        revenue: {
          totalINR: totalRevenueINR,
          transactionsCount: totalPaidTransactions
        },
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with workspace counts and search/filter
// @route   GET /api/admin/users
// @access  Private (System Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { title: regex }];
    }
    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    // Enrich users with workspace counts
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const membershipsCount = await Membership.countDocuments({ user: u._id, status: 'active' });
        const ownedWorkspaces = await Workspace.find({ owner: u._id }).select('name slug');
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          title: u.title,
          role: u.role || (u.email === 'protrack24@gmail.com' ? 'system_admin' : 'user'),
          status: u.status || 'active',
          workspacesCount: membershipsCount,
          ownedWorkspaces,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        };
      })
    );

    res.json({
      success: true,
      users: enrichedUsers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (active / suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private (System Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect the primary master admin from being suspended
    if (user.email.toLowerCase() === 'protrack24@gmail.com') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend primary Master Administrator account'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.email} status changed to ${status}`,
      user: {
        id: user._id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (user / system_admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private (System Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'system_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect master admin from demotion
    if (user.email.toLowerCase() === 'protrack24@gmail.com' && role !== 'system_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote the primary Master Administrator'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.email} role updated to ${role}`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset a user's password directly
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (System Admin)
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: `Password reset successfully for ${user.email}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and associations
// @route   DELETE /api/admin/users/:id
// @access  Private (System Admin)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email.toLowerCase() === 'protrack24@gmail.com') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete primary Master Administrator account'
      });
    }

    // Clean up user memberships
    await Membership.deleteMany({ user: id });

    // Remove user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `User ${user.email} has been permanently deleted from the platform.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workspaces across the platform
// @route   GET /api/admin/workspaces
// @access  Private (System Admin)
const getAllWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find()
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const membersCount = await Membership.countDocuments({ workspace: ws._id, status: 'active' });
        const projectsCount = await Project.countDocuments({ workspace: ws._id });
        return {
          id: ws._id,
          name: ws.name,
          slug: ws.slug,
          owner: ws.owner,
          teamType: ws.teamType,
          membersCount,
          projectsCount,
          createdAt: ws.createdAt
        };
      })
    );

    res.json({
      success: true,
      workspaces: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workspace
// @route   DELETE /api/admin/workspaces/:id
// @access  Private (System Admin)
const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ws = await Workspace.findById(id);
    if (!ws) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    await Membership.deleteMany({ workspace: id });
    await Project.deleteMany({ workspace: id });
    await Workspace.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Workspace "${ws.name}" and related data deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects platform-wide
// @route   GET /api/admin/projects
// @access  Private (System Admin)
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('workspace', 'name slug')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    const enriched = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const completedTaskCount = await Task.countDocuments({
          project: p._id,
          status: { $in: ['completed', 'done'] }
        });
        return {
          id: p._id,
          name: p.name,
          projectCode: p.projectCode,
          workspace: p.workspace,
          owner: p.owner,
          status: p.status,
          priority: p.priority,
          startDate: p.startDate,
          dueDate: p.dueDate,
          totalTasks: taskCount,
          completedTasks: completedTaskCount,
          progress: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
          createdAt: p.createdAt
        };
      })
    );

    res.json({
      success: true,
      projects: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedbacks submitted by users
// @route   GET /api/admin/feedbacks
// @access  Private (System Admin)
const getAllFeedbacks = async (req, res, next) => {
  try {
    const { status, category, rating } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (rating && rating !== 'all') query.rating = Number(rating);

    const feedbacks = await Feedback.find(query)
      .populate('user', 'name email avatar title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks: feedbacks.map(f => ({
        id: f._id,
        user: f.user,
        name: f.name,
        email: f.email,
        category: f.category,
        rating: f.rating,
        message: f.message,
        status: f.status,
        adminNotes: f.adminNotes,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status / admin notes
// @route   PUT /api/admin/feedbacks/:id
// @access  Private (System Admin)
const updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback item
// @route   DELETE /api/admin/feedbacks/:id
// @access  Private (System Admin)
const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({
      success: true,
      message: 'Feedback removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payment records platform-wide
// @route   GET /api/admin/payments
// @access  Private (System Admin)
const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent platform activity logs
// @route   GET /api/admin/activity-logs
// @access  Private (System Admin)
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email avatar')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 })
      .limit(60);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getAllWorkspaces,
  deleteWorkspace,
  getAllProjects,
  getAllFeedbacks,
  updateFeedback,
  deleteFeedback,
  getAllPayments,
  getActivityLogs
};
