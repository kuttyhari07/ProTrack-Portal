const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Project Manager', 'Member', 'Viewer'],
      default: 'Member'
    },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate membership for same user in same workspace
membershipSchema.index({ workspace: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
