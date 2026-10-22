const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    }
  },
  {
    timestamps: true
  }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: Number,
    mimeType: String,
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
);

const taskSchema = new mongoose.Schema(
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
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    taskNumber: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'completed'],
      default: 'todo'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    order: {
      type: Number,
      default: 0
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ],
    comments: [commentSchema],
    attachments: [attachmentSchema],
    completedAt: {
      type: Date
    },
    lastReminderSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ workspace: 1, project: 1, status: 1 });
taskSchema.index({ workspace: 1, assignee: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
