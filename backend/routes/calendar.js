const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authenticateToken } = require('../middleware/auth');

// Get calendar events (trips) for a user
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start, end } = req.query;

    let query = { userId };
    
    // If date range is provided, filter trips within that range
    if (start && end) {
      query.$or = [
        {
          startDate: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        },
        {
          endDate: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        },
        {
          $and: [
            { startDate: { $lte: new Date(start) } },
            { endDate: { $gte: new Date(end) } }
          ]
        }
      ];
    }

    const trips = await Trip.find(query)
      .select('title startDate endDate status tripType totalCost startPlace endPlace')
      .sort({ startDate: 1 });

    // Transform trips into calendar events format
    const events = trips.map(trip => ({
      id: trip._id,
      title: trip.title,
      start: trip.startDate,
      end: trip.endDate,
      status: trip.status,
      type: trip.tripType,
      cost: trip.totalCost,
      location: `${trip.startPlace} → ${trip.endPlace}`,
      color: getStatusColor(trip.status)
    }));

    res.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Failed to fetch calendar events' });
  }
});

// Get trip statistics for calendar view
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    let dateFilter = { userId };
    
    if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      
      dateFilter.$or = [
        {
          startDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        },
        {
          endDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      ];
    }

    const trips = await Trip.find(dateFilter);
    
    const stats = {
      totalTrips: trips.length,
      plannedTrips: trips.filter(t => t.status === 'planned').length,
      ongoingTrips: trips.filter(t => t.status === 'ongoing').length,
      completedTrips: trips.filter(t => t.status === 'completed').length,
      totalBudget: trips.reduce((sum, trip) => sum + (trip.totalCost || 0), 0),
      tripTypes: {}
    };

    // Count trips by type
    trips.forEach(trip => {
      stats.tripTypes[trip.tripType] = (stats.tripTypes[trip.tripType] || 0) + 1;
    });

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ message: 'Failed to fetch calendar statistics' });
  }
});

// Helper function to get color based on trip status
function getStatusColor(status) {
  const colors = {
    'planned': '#3B82F6',    // Blue
    'ongoing': '#10B981',    // Green
    'completed': '#6B7280',  // Gray
    'cancelled': '#EF4444'   // Red
  };
  return colors[status] || '#6B7280';
}

module.exports = router;
