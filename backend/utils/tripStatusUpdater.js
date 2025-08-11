const Trip = require('../models/Trip');

class TripStatusUpdater {
  /**
   * Update trip statuses based on current date
   * - Move past trips to 'completed' status
   * - Move ongoing trips to 'ongoing' status
   */
  static async updateTripStatuses() {
    try {
      const now = new Date();
      
      // Update past trips to completed
      const pastTripsResult = await Trip.updateMany(
        {
          endDate: { $lt: now },
          status: { $in: ['planned', 'ongoing'] }
        },
        {
          $set: { status: 'completed' }
        }
      );

      // Update ongoing trips
      const ongoingTripsResult = await Trip.updateMany(
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
          status: 'planned'
        },
        {
          $set: { status: 'ongoing' }
        }
      );

      console.log(`Trip status update completed: ${pastTripsResult.modifiedCount} trips marked as completed, ${ongoingTripsResult.modifiedCount} trips marked as ongoing`);
      
      return {
        success: true,
        completed: pastTripsResult.modifiedCount,
        ongoing: ongoingTripsResult.modifiedCount
      };
    } catch (error) {
      console.error('Error updating trip statuses:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trip statistics for a user
   */
  static async getUserTripStats(userId) {
    try {
      const stats = await Trip.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCost: { $sum: '$totalCost' }
          }
        }
      ]);

      const statsMap = {
        planned: { count: 0, totalCost: 0 },
        ongoing: { count: 0, totalCost: 0 },
        completed: { count: 0, totalCost: 0 },
        cancelled: { count: 0, totalCost: 0 }
      };

      stats.forEach(stat => {
        statsMap[stat._id] = {
          count: stat.count,
          totalCost: stat.totalCost
        };
      });

      return statsMap;
    } catch (error) {
      console.error('Error getting user trip stats:', error);
      throw error;
    }
  }
}

module.exports = TripStatusUpdater;
