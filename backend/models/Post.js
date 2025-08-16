const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tripTitle: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Trip title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  photos: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/i.test(v);
      },
      message: 'Invalid photo URL format'
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v.startsWith('#') && v.length > 1 && v.length <= 30;
      },
      message: 'Tags must start with # and be 1-30 characters'
    }
  }],
  itinerary: [{
    day: {
      type: Number,
      required: true,
      min: 1
    },
    activities: [{
      type: String,
      trim: true,
      maxlength: [200, 'Activity description cannot exceed 200 characters']
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes': 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count (will be populated separately)
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Method to toggle like
postSchema.methods.toggleLike = function(userId) {
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

// Method to get post summary for feed
postSchema.methods.getSummary = function() {
  return {
    id: this._id,
    tripTitle: this.tripTitle,
    description: this.description,
    photos: this.photos,
    tags: this.tags,
    likeCount: this.likeCount,
    location: this.location,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
