const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middleware/auth');

// Delete a comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Delete replies first
    await Comment.deleteMany({ parentCommentId: req.params.id });
    
    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

// Like/Unlike a comment
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isLiked = comment.toggleLike(req.user.userId);
    await comment.save();

    res.json({
      success: true,
      isLiked,
      likeCount: comment.likeCount,
      message: isLiked ? 'Comment liked' : 'Comment unliked'
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle comment like'
    });
  }
});

// Update a comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.text = text.trim();
    comment.markAsEdited();
    await comment.save();
    await comment.populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      comment: {
        ...comment.toObject(),
        likeCount: comment.likeCount,
        isLiked: comment.likes ? comment.likes.includes(req.user.userId) : false
      },
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    });
  }
});

module.exports = router;
