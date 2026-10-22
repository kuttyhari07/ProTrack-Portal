const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    razorpaySignature: {
      type: String
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true
    },
    receipt: {
      type: String
    },
    projectData: {
      name: String,
      projectCode: String,
      description: String,
      startDate: Date,
      dueDate: Date,
      priority: String,
      status: String,
      tags: [String],
      memberIds: [mongoose.Schema.Types.ObjectId]
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
