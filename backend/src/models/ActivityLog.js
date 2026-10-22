const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'deleted',
        'status_change',
        'commented',
        'assigned',
        'resolved',
        'uploaded',
        'archived'
      ],
      required: true
    },
    entityType: {
      type: String,
      enum: ['project', 'task', 'milestone', 'issue', 'workspace', 'document', 'member'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    entityTitle: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });
activityLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
