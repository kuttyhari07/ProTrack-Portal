const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters']
    },
    projectCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          default: 'Contributor'
        }
      }
    ],
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active'
    },
    health: {
      type: String,
      enum: ['on_track', 'needs_attention', 'at_risk', 'delayed', 'completed'],
      default: 'on_track'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isArchived: {
      type: Boolean,
      default: false
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    paymentAmount: {
      type: Number,
      default: 0
    },
    razorpayPaymentId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ workspace: 1, projectCode: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ workspace: 1, dueDate: 1 });

module.exports = mongoose.model('Project', projectSchema);
