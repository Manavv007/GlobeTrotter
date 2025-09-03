const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for reply count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
  count: true
});

// Method to check if user liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Method to toggle like on comment
commentSchema.methods.toggleLike = function(userId) {
  const userIdStr = userId.toString();
  const likeIndex = this.likes.findIndex(id => id.toString() === userIdStr);
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return false; // unliked
  } else {
    this.likes.push(userId);
    return true; // liked
  }
};

// Method to check if comment is a reply
commentSchema.methods.isReply = function() {
  return this.parentCommentId !== null;
};

// Method to mark as edited
commentSchema.methods.markAsEdited = function() {
  this.isEdited = true;
  this.editedAt = new Date();
};

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
