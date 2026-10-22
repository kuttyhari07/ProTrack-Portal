const Feedback = require('../models/Feedback');
const { getIO } = require('../services/socketService');
const { sendMail } = require('../services/emailService');

// @desc    Submit new user feedback
// @route   POST /api/feedback
// @access  Public (Guest or Authenticated User)
const createFeedback = async (req, res, next) => {
  try {
    const { name, email, category, rating, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and feedback message are required'
      });
    }

    const feedback = await Feedback.create({
      user: req.user ? req.user._id : null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      category: category || 'General Feedback',
      rating: rating ? Number(rating) : 5,
      message: message.trim()
    });

    // Notify connected Admin Dashboard in real-time
    try {
      const io = getIO();
      if (io) {
        io.emit('admin:new_feedback', {
          id: feedback._id,
          name: feedback.name,
          email: feedback.email,
          category: feedback.category,
          rating: feedback.rating,
          message: feedback.message,
          createdAt: feedback.createdAt
        });
      }
    } catch (socketErr) {
      // Ignore if socket not ready
    }

    // Send email alert to admin (protrack24@gmail.com) via Resend/Brevo
    const adminEmail = process.env.ADMIN_EMAIL || 'protrack24@gmail.com';
    sendMail({
      to: adminEmail,
      subject: `💬 New Feedback [${feedback.category}] from ${feedback.name} (${feedback.rating}★)`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;margin-top:0;">New User Feedback Received</h2>
          <p style="color:#475569;font-size:14px;line-height:1.5;">
            A user has just submitted new feedback on ProTrack:
          </p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;font-size:13px;">
            <p style="margin:4px 0;"><strong>Name:</strong> ${feedback.name}</p>
            <p style="margin:4px 0;"><strong>Email:</strong> ${feedback.email}</p>
            <p style="margin:4px 0;"><strong>Category:</strong> ${feedback.category}</p>
            <p style="margin:4px 0;"><strong>Rating:</strong> ${'★'.repeat(feedback.rating)} (${feedback.rating}/5)</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />
            <p style="margin:4px 0;white-space:pre-wrap;color:#0f172a;"><strong>Feedback Message:</strong><br/>${feedback.message}</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
            Open Master Admin Dashboard
          </a>
        </div>
      `,
      text: `New Feedback from ${feedback.name} (${feedback.email}): [${feedback.category}] Rating: ${feedback.rating}/5. Message: ${feedback.message}`
    }).catch(err => console.warn('[Feedback Email Dispatch Note]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been successfully submitted to ProTrack administrators.',
      feedback: {
        id: feedback._id,
        category: feedback.category,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeedback
};
