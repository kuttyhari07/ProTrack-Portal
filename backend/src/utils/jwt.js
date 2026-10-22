const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'protrack_super_secret_jwt_key_2026_production_ready', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = { generateToken };
