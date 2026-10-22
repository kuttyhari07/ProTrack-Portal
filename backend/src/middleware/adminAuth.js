const { protect } = require('./auth');

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const isSuperAdmin =
    req.user.role === 'system_admin' ||
    req.user.email.toLowerCase() === 'protrack24@gmail.com';

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Master System Administrator privileges required'
    });
  }

  next();
};

module.exports = { requireAdmin };
