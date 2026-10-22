const ActivityLog = require('../models/ActivityLog');
const socketService = require('./socketService');

const logActivity = async ({
  workspaceId,
  projectId = null,
  userId,
  action,
  entityType,
  entityId = null,
  entityTitle = '',
  details = {}
}) => {
  try {
    const activity = await ActivityLog.create({
      workspace: workspaceId,
      project: projectId,
      user: userId,
      action,
      entityType,
      entityId,
      entityTitle,
      details
    });

    const populatedActivity = await ActivityLog.findById(activity._id)
      .populate('user', 'name email avatar title')
      .populate('project', 'name projectCode');

    // Real-time broadcast if socket service initialized
    socketService.emitToWorkspace(workspaceId, 'activity_new', populatedActivity);

    return populatedActivity;
  } catch (error) {
    console.error('[ActivityLog Error]:', error.message);
  }
};

module.exports = { logActivity };
