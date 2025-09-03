const User = require('../models/User');

/**
 * Clean up expired sessions
 * This utility removes sessions that are older than 7 days
 */
const cleanupExpiredSessions = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await User.updateMany(
      { 'activeSessions.lastActivity': { $lt: sevenDaysAgo } },
      { 
        $pull: { 
          activeSessions: { 
            lastActivity: { $lt: sevenDaysAgo } 
          } 
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up expired sessions from ${result.modifiedCount} users`);
    }

    return { success: true, cleanedUsers: result.modifiedCount };
  } catch (error) {
    console.error('Session cleanup error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get session statistics
 */
const getSessionStats = async () => {
  try {
    const stats = await User.aggregate([
      {
        $project: {
          sessionCount: { $size: '$activeSessions' }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalSessions: { $sum: '$sessionCount' },
          avgSessionsPerUser: { $avg: '$sessionCount' }
        }
      }
    ]);

    return stats[0] || { totalUsers: 0, totalSessions: 0, avgSessionsPerUser: 0 };
  } catch (error) {
    console.error('Session stats error:', error);
    return { totalUsers: 0, totalSessions: 0, avgSessionsPerUser: 0 };
  }
};

/**
 * Force logout user from all sessions
 */
const forceLogoutAllSessions = async (userId) => {
  try {
    const result = await User.findByIdAndUpdate(
      userId,
      { $set: { activeSessions: [] } },
      { new: true }
    );

    if (result) {
      console.log(`🚪 Force logged out user ${userId} from all sessions`);
      return { success: true, message: 'All sessions logged out' };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Force logout error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cleanupExpiredSessions,
  getSessionStats,
  forceLogoutAllSessions
};
