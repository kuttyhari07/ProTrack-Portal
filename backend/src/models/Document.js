const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
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
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

documentSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
