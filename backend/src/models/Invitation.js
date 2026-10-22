const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['Admin', 'Project Manager', 'Member', 'Viewer'],
      default: 'Member'
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ workspace: 1, email: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);
