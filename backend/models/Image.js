const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  // Basic image information
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Cloudinary URLs for different sizes
  urls: {
    original: {
      type: String,
      required: true
    },
    large: {
      type: String,
      required: true
    },
    medium: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    }
  },
  
  // Cloudinary public IDs for management
  publicIds: {
    original: String,
    large: String,
    medium: String,
    thumbnail: String
  },
  
  // Image metadata
  metadata: {
    width: Number,
    height: Number,
    format: String,
    size: Number, // in bytes
    exif: {
      camera: String,
      dateTaken: Date,
      location: {
        latitude: Number,
        longitude: Number
      },
      orientation: Number
    }
  },
  
  // User who uploaded the image
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Post association (if part of a post)
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  // Image tags and categories
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  category: {
    type: String,
    enum: ['travel', 'food', 'nature', 'city', 'culture', 'adventure', 'other'],
    default: 'other'
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
imageSchema.index({ user: 1, createdAt: -1 });
imageSchema.index({ post: 1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ category: 1 });
imageSchema.index({ status: 1 });
imageSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for like count
imageSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Ensure virtual fields are serialized
imageSchema.set('toJSON', { virtuals: true });
imageSchema.set('toObject', { virtuals: true });

// Pre-save middleware
imageSchema.pre('save', function(next) {
  // Set default tags based on category if none provided
  if (this.tags.length === 0 && this.category) {
    this.tags = [this.category];
  }
  next();
});

// Static method to find public images
imageSchema.statics.findPublic = function() {
  return this.find({ isPublic: true, status: 'approved', isDeleted: false });
};

// Instance method to increment views
imageSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to toggle like
imageSchema.methods.toggleLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(index, 1);
  }
  return this.save();
};

module.exports = mongoose.model('Image', imageSchema);
