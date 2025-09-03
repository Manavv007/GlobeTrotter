const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { uploadProfilePicture, deleteImage } = require('../utils/cloudinary');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get user profile with trips
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get user trips
    const plannedTrips = await Trip.find({
      userId: req.user.userId,
      status: 'planned'
    }).sort({ startDate: 1 });

    const completedTrips = await Trip.find({
      userId: req.user.userId,
      status: 'completed'
    }).sort({ endDate: -1 });

    const ongoingTrips = await Trip.find({
      userId: req.user.userId,
      status: 'ongoing'
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      user: req.user,
      trips: {
        planned: plannedTrips,
        completed: completedTrips,
        ongoing: ongoingTrips
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await uploadProfilePicture(base64Image);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: uploadResult.error
      });
    }

    // Delete old profile picture if exists
    if (req.user.profilePicturePublicId) {
      await deleteImage(req.user.profilePicturePublicId);
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        profilePicture: uploadResult.url,
        profilePicturePublicId: uploadResult.public_id
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, preferences } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get user trips
router.get('/trips', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;

    let query = { userId: req.user.userId };
    if (status && ['planned', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const trips = await Trip.find(query)
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      trips,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + trips.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trips'
    });
  }
});

// Create a new trip
router.post('/trips', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      startPlace,
      endPlace,
      stops,
      startDate,
      endDate,
      travelers,
      budget,
      tripType,
      itinerary
    } = req.body;

    // Validate required fields
    if (!title || !startPlace || !endPlace || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start place, end place, start date, and end date are required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const trip = new Trip({
      userId: req.user._id,
      title,
      description,
      startPlace,
      endPlace,
      stops: stops || [],
      startDate: start,
      endDate: end,
      travelers: travelers || 1,
      budget: budget || 0,
      tripType: tripType || 'leisure',
      status: req.body.status || 'planned',
      itinerary: itinerary || []
    });

    await trip.save();

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trip'
    });
  }
});

// Save generated itinerary as planned trip
router.post('/save-itinerary', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      startPlace,
      endPlace,
      stops,
      startDate,
      endDate,
      itinerary,
      travelers = 1,
      budget = 0,
      tripType = 'leisure'
    } = req.body;

    // Validate required fields
    if (!title || !startPlace || !endPlace || !startDate || !endDate || !itinerary) {
      return res.status(400).json({
        success: false,
        message: 'Title, start place, end place, start date, end date, and itinerary are required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const trip = new Trip({
      userId: req.user.userId,
      title,
      description: `Trip from ${startPlace} to ${endPlace}`,
      startPlace,
      endPlace,
      stops: stops || [],
      startDate: start,
      endDate: end,
      travelers,
      budget,
      tripType,
      status: 'planned',
      itinerary
    });

    await trip.save();

    res.status(201).json({
      success: true,
      message: 'Itinerary saved as planned trip successfully',
      trip
    });
  } catch (error) {
    console.error('Save itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving itinerary'
    });
  }
});

// Update trip
router.put('/trips/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.userId;
    delete updateData._id;

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip'
    });
  }
});

// Update trip status
router.patch('/trips/:tripId/status', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    if (!['planned', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId: req.user.userId },
      { status },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      trip
    });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip status'
    });
  }
});

// Delete trip
router.delete('/trips/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOneAndDelete({ _id: tripId, userId: req.user.userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting trip'
    });
  }
});

// Get single trip by ID
router.get('/trips/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ _id: tripId, userId: req.user.userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      trip
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip'
    });
  }
});

// Get trip statistics
router.get('/trip-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Trip.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ]);

    const totalTrips = await Trip.countDocuments({ userId: req.user.userId });
    const totalSpent = await Trip.aggregate([
      { $match: { userId: req.user.userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalTrips,
        totalSpent: totalSpent[0]?.total || 0,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Get trip stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip statistics'
    });
  }
});

module.exports = router;
