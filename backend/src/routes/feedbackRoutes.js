const express = require('express');
const router = express.Router();
const { createFeedback } = require('../controllers/feedbackController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware: if token is present, populate req.user, otherwise continue as guest
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'protrack_super_secret_jwt_key_2026_production_ready'
      );
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Continue as unauthenticated guest
    }
  }
  next();
};

router.post('/', optionalAuth, createFeedback);

module.exports = router;
