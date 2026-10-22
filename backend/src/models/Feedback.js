const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    category: {
      type: String,
      enum: [
        'General Feedback',
        'Feature Request',
        'Bug Report',
        'UI/UX Design',
        'Performance',
        'Billing / Payments',
        'Other'
      ],
      default: 'General Feedback'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    message: {
      type: String,
      required: [true, 'Please enter your feedback message'],
      maxlength: [3000, 'Message cannot exceed 3000 characters']
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in_progress', 'resolved'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
