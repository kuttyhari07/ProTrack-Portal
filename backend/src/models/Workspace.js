const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamType: {
      type: String,
      default: 'General'
    },
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      defaultRole: {
        type: String,
        enum: ['Admin', 'Project Manager', 'Member', 'Viewer'],
        default: 'Member'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Workspace', workspaceSchema);
