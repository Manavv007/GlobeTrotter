const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if token exists in user's active sessions
    if (!user.activeSessions || !Array.isArray(user.activeSessions)) {
      // Initialize activeSessions if it doesn't exist (for backward compatibility)
      user.activeSessions = [];
      await user.save();
    }
    
    const hasValidSession = user.activeSessions.some(session => session.token === token);
    if (!hasValidSession) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    // Update session activity
    const session = user.activeSessions.find(s => s.token === token);
    if (session) {
      user.updateSessionActivity(session.sessionId);
      await user.save();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { authenticateToken };
