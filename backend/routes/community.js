const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Experience = require('../models/Experience');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @route   POST /api/community/experiences
// @desc    Create a new experience post
// @access  Private
router.post('/experiences', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('destination').trim().isLength({ min: 1, max: 100 }).withMessage('Destination must be between 1 and 100 characters'),
  body('content').trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be between 10 and 2000 characters'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('category').isIn(['adventure', 'culture', 'food', 'nature', 'relaxation', 'shopping', 'nightlife', 'other']).withMessage('Invalid category'),
  body('travelDate').isISO8601().withMessage('Invalid travel date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('images').optional().isArray().withMessage('Images must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, destination, content, category, rating, travelDate, tags, images } = req.body;

    // Create new experience
    const experience = new Experience({
      user: req.user.id,
      title,
      destination,
      content,
      category,
      rating,
      travelDate,
      tags: tags || [],
      images: images || []
    });

    await experience.save();

    // Populate user info for response
    await experience.populate('user', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Experience posted successfully',
      experience
    });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating experience'
    });
  }
});

// @route   GET /api/community/experiences
// @desc    Get all public experiences with pagination and filtering
// @access  Private
router.get('/experiences', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { 
      status: 'active',
      isPublic: true 
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.destination) {
      filter.destination = { $regex: req.query.destination, $options: 'i' };
    }

    if (req.query.rating) {
      filter.rating = { $gte: parseInt(req.query.rating) };
    }

    // Get experiences with pagination
    const experiences = await Experience.find(filter)
      .populate('user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Experience.countDocuments(filter);

    res.json({
      success: true,
      experiences,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExperiences: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching experiences'
    });
  }
});

// @route   GET /api/community/experiences/:id
// @desc    Get a specific experience by ID
// @access  Private
router.get('/experiences/:id', authenticateToken, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id)
      .populate('user', 'firstName lastName profilePicture')
      .populate('likes', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profilePicture');

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Check if user has liked this experience
    const isLiked = experience.likes.some(like => like._id.toString() === req.user.id);

    res.json({
      success: true,
      experience: {
        ...experience.toObject(),
        isLiked
      }
    });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching experience'
    });
  }
});

// @route   PUT /api/community/experiences/:id
// @desc    Update an experience (only by owner)
// @access  Private
router.put('/experiences/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('destination').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Destination must be between 1 and 100 characters'),
  body('content').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be between 10 and 2000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('category').optional().isIn(['adventure', 'culture', 'food', 'nature', 'relaxation', 'shopping', 'nightlife', 'other']).withMessage('Invalid category'),
  body('travelDate').optional().isISO8601().withMessage('Invalid travel date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('images').optional().isArray().withMessage('Images must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Check if user owns the experience
    if (experience.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this experience'
      });
    }

    // Update experience
    const updatedExperience = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Experience updated successfully',
      experience: updatedExperience
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating experience'
    });
  }
});

// @route   DELETE /api/community/experiences/:id
// @desc    Delete an experience (only by owner)
// @access  Private
router.delete('/experiences/:id', authenticateToken, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Check if user owns the experience
    if (experience.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this experience'
      });
    }

    await Experience.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting experience'
    });
  }
});

// @route   POST /api/community/experiences/:id/like
// @desc    Like/unlike an experience
// @access  Private
router.post('/experiences/:id/like', authenticateToken, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    const isLiked = experience.likes.includes(req.user.id);
    let message;

    if (isLiked) {
      experience.removeLike(req.user.id);
      message = 'Experience unliked successfully';
    } else {
      experience.addLike(req.user.id);
      message = 'Experience liked successfully';
    }

    await experience.save();

    res.json({
      success: true,
      message,
      likeCount: experience.likeCount,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// @route   POST /api/community/experiences/:id/comments
// @desc    Add a comment to an experience
// @access  Private
router.post('/experiences/:id/comments', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    const comment = experience.addComment(req.user.id, req.body.content);
    await experience.save();

    // Populate user info for the new comment
    await experience.populate('comments.user', 'firstName lastName profilePicture');

    const newComment = experience.comments[experience.comments.length - 1];

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      commentCount: experience.commentCount
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   DELETE /api/community/experiences/:id/comments/:commentId
// @desc    Delete a comment (only by comment owner or experience owner)
// @access  Private
router.delete('/experiences/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    const comment = experience.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or the experience
    if (comment.user.toString() !== req.user.id && experience.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    experience.removeComment(req.params.commentId);
    await experience.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      commentCount: experience.commentCount
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
});

// @route   GET /api/community/experiences/user/:userId
// @desc    Get experiences by a specific user
// @access  Private
router.get('/experiences/user/:userId', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const experiences = await Experience.find({
      user: req.params.userId,
      status: 'active',
      isPublic: true
    })
      .populate('user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Experience.countDocuments({
      user: req.params.userId,
      status: 'active',
      isPublic: true
    });

    res.json({
      success: true,
      experiences,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExperiences: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user experiences:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user experiences'
    });
  }
});

// @route   GET /api/community/categories
// @desc    Get all available categories
// @access  Private
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { value: 'adventure', label: 'Adventure', icon: '🏔️' },
      { value: 'culture', label: 'Culture', icon: '🏛️' },
      { value: 'food', label: 'Food & Dining', icon: '🍽️' },
      { value: 'nature', label: 'Nature', icon: '🌿' },
      { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
      { value: 'shopping', label: 'Shopping', icon: '🛍️' },
      { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
      { value: 'other', label: 'Other', icon: '✨' }
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;
