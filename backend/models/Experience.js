const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [100, 'Destination cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['adventure', 'culture', 'food', 'nature', 'relaxation', 'shopping', 'nightlife', 'other'],
    default: 'other'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    required: [true, 'Rating is required']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  travelDate: {
    type: Date,
    required: [true, 'Travel date is required']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'flagged', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
experienceSchema.index({ user: 1, createdAt: -1 });
experienceSchema.index({ destination: 1 });
experienceSchema.index({ category: 1 });
experienceSchema.index({ rating: 1 });
experienceSchema.index({ status: 1 });
experienceSchema.index({ tags: 1 });

// Virtual for like count
experienceSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
experienceSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are serialized
experienceSchema.set('toJSON', { virtuals: true });
experienceSchema.set('toObject', { virtuals: true });

// Method to add like
experienceSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return true;
  }
  return false;
};

// Method to remove like
experienceSchema.methods.removeLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
    return true;
  }
  return false;
};

// Method to add comment
experienceSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.comments[this.comments.length - 1];
};

// Method to remove comment
experienceSchema.methods.removeComment = function(commentId) {
  const index = this.comments.findIndex(comment => comment._id.toString() === commentId);
  if (index > -1) {
    this.comments.splice(index, 1);
    return true;
  }
  return false;
};

module.exports = mongoose.model('Experience', experienceSchema);
