const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      default: '',
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['bug', 'blocker', 'risk', 'technical_debt', 'compliance', 'other'],
      default: 'risk'
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    dueDate: {
      type: Date
    },
    resolutionNotes: {
      type: String,
      default: '',
      maxlength: [2000, 'Resolution notes cannot exceed 2000 characters']
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

issueSchema.index({ workspace: 1, status: 1 });
issueSchema.index({ workspace: 1, priority: 1 });

module.exports = mongoose.model('Issue', issueSchema);
