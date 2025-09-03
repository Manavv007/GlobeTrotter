const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { authenticateToken } = require('../middleware/auth');

// Get posts with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      tag,
      userId
    } = req.query;

    const skip = (page - 1) * limit;
    let sortOptions = {};
    let filterOptions = { isPublic: true };

    // Sorting options
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'mostLiked':
        sortOptions = { likeCount: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Filter by tag
    if (tag) {
      filterOptions.tags = { $in: [tag.toLowerCase()] };
    }

    // Filter by user
    if (userId) {
      filterOptions.userId = userId;
    }

    const posts = await Post.find(filterOptions)
      .populate('userId', 'firstName lastName profilePicture')
      .populate('commentCount')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get comment counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return {
          ...post,
          commentCount,
          likeCount: post.likes ? post.likes.length : 0,
          isLiked: post.likes ? post.likes.includes(req.user.userId) : false
        };
      })
    );

    const totalPosts = await Post.countDocuments(filterOptions);
    const hasMore = skip + posts.length < totalPosts;

    res.json({
      success: true,
      posts: postsWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
});

// Get single post with comments
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'firstName lastName profilePicture')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get comments for this post
    const comments = await Comment.find({ postId: req.params.id, parentCommentId: null })
      .populate('userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    // Get nested replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentId: comment._id })
          .populate('userId', 'firstName lastName profilePicture')
          .sort({ createdAt: 1 });

        return {
          ...comment.toObject(),
          replies,
          likeCount: comment.likes ? comment.likes.length : 0,
          isLiked: comment.likes ? comment.likes.includes(req.user.userId) : false
        };
      })
    );

    res.json({
      success: true,
      post: {
        ...post,
        likeCount: post.likes ? post.likes.length : 0,
        isLiked: post.likes ? post.likes.includes(req.user.userId) : false
      },
      comments: commentsWithReplies
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
});

// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tripTitle, description, photos, tags, itinerary, location } = req.body;

    // Validate required fields
    if (!tripTitle || !description) {
      return res.status(400).json({
        success: false,
        message: 'Trip title and description are required'
      });
    }

    // Process tags to ensure they start with #
    const processedTags = tags ? tags.map(tag =>
      tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    ) : [];

    const newPost = new Post({
      userId: req.user.userId,
      tripTitle,
      description,
      photos: photos || [],
      tags: processedTags,
      itinerary: itinerary || [],
      location
    });

    await newPost.save();

    // Populate user data for response
    await newPost.populate('userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      post: {
        ...newPost.toObject(),
        likeCount: 0,
        commentCount: 0,
        isLiked: false
      },
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
});

// Update a post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const { tripTitle, description, photos, tags, itinerary, location } = req.body;

    // Process tags
    const processedTags = tags ? tags.map(tag =>
      tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    ) : post.tags;

    // Update fields
    post.tripTitle = tripTitle || post.tripTitle;
    post.description = description || post.description;
    post.photos = photos || post.photos;
    post.tags = processedTags;
    post.itinerary = itinerary || post.itinerary;
    post.location = location || post.location;

    await post.save();
    await post.populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      post: post.toObject(),
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

// Delete a post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ postId: req.params.id });

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// Like/Unlike a post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isLiked = post.toggleLike(req.user.userId);
    await post.save();

    res.json({
      success: true,
      isLiked,
      likeCount: post.likeCount,
      message: isLiked ? 'Post liked' : 'Post unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // Check if post exists
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const newComment = new Comment({
      postId: req.params.id,
      userId: req.user.userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    });

    await newComment.save();
    await newComment.populate('userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      comment: {
        ...newComment.toObject(),
        likeCount: 0,
        isLiked: false
      },
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Get comments for a post
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId: req.params.id,
      parentCommentId: null
    })
      .populate('userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentId: comment._id })
          .populate('userId', 'firstName lastName profilePicture')
          .sort({ createdAt: 1 });

        return {
          ...comment.toObject(),
          replies,
          likeCount: comment.likes ? comment.likes.length : 0,
          isLiked: comment.likes ? comment.likes.includes(req.user.userId) : false
        };
      })
    );

    res.json({
      success: true,
      comments: commentsWithReplies
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// Copy itinerary from post to user's trips
router.post('/:id/copy-itinerary', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.itinerary || post.itinerary.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This post does not have an itinerary to copy'
      });
    }

    // Create a new trip based on the post's itinerary
    const newTrip = new Trip({
      userId: req.user.userId,
      title: `${post.tripTitle} (Copied)`,
      description: `Copied from post`,
      startPlace: 'To be determined',
      endPlace: post.location || 'To be determined',
      startDate: new Date(),
      endDate: new Date(Date.now() + (post.itinerary.length * 24 * 60 * 60 * 1000)),
      travelers: 1,
      tripType: 'leisure',
      status: 'planned',
      itinerary: post.itinerary,
      notes: `Original post: ${post.tripTitle}\nDescription: ${post.description}`
    });

    await newTrip.save();

    res.status(201).json({
      success: true,
      trip: newTrip.getSummary(),
      message: 'Itinerary copied to your trips successfully!'
    });
  } catch (error) {
    console.error('Error copying itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to copy itinerary'
    });
  }
});

// Get trending tags
router.get('/tags/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trendingTags = await Post.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      tags: trendingTags
    });
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending tags'
    });
  }
});

module.exports = router;
