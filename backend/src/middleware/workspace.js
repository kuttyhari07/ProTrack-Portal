const Membership = require('../models/Membership');
const Workspace = require('../models/Workspace');

// Middleware to verify user is an active member of the target workspace
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId =
      req.headers['x-workspace-id'] ||
      req.params.workspaceId ||
      req.body.workspaceId ||
      req.query.workspaceId ||
      (req.user && req.user.currentWorkspace);

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace identifier is missing'
      });
    }

    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: req.user._id,
      status: 'active'
    }).populate('workspace');

    if (!membership || !membership.workspace) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace or your account is deactivated'
      });
    }

    req.workspace = membership.workspace;
    req.workspaceId = membership.workspace._id;
    req.membership = membership;
    req.userRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};

// Role hierarchy helper
const ROLE_HIERARCHY = {
  'Owner': 5,
  'Admin': 4,
  'Project Manager': 3,
  'Member': 2,
  'Viewer': 1
};

// Check if user has one of allowed roles or meets minimum role level
const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: 'No role found for this workspace'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Disallow mutating actions for Viewers
const restrictViewerMutations = (req, res, next) => {
  if (req.userRole === 'Viewer' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      success: false,
      message: 'Viewers have read-only access and cannot make modifications.'
    });
  }
  next();
};

module.exports = {
  requireWorkspaceMember,
  requireRoles,
  restrictViewerMutations,
  ROLE_HIERARCHY
};
