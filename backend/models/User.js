const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  profilePicturePublicId: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Multiple active sessions support
  activeSessions: {
    type: [{
      sessionId: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      },
      deviceInfo: {
        type: String,
        default: 'Unknown'
      },
      ipAddress: {
        type: String,
        default: 'Unknown'
      },
      lastActivity: {
        type: Date,
        default: Date.now
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (without sensitive data)
userSchema.methods.getProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  
  // Ensure activeSessions is included but limit sensitive data
  if (user.activeSessions) {
    user.activeSessions = user.activeSessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    }));
  }
  
  return user;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Method to add a new active session
userSchema.methods.addSession = function(sessionId, token, deviceInfo = 'Unknown', ipAddress = 'Unknown') {
  // Initialize activeSessions if it doesn't exist
  if (!this.activeSessions) {
    this.activeSessions = [];
  }
  
  // Remove old sessions if too many (keep max 10 sessions)
  if (this.activeSessions.length >= 10) {
    this.activeSessions.shift(); // Remove oldest session
  }
  
  this.activeSessions.push({
    sessionId,
    token,
    deviceInfo,
    ipAddress,
    lastActivity: new Date(),
    createdAt: new Date()
  });
  
  return this;
};

// Method to remove a specific session
userSchema.methods.removeSession = function(sessionId) {
  if (!this.activeSessions) {
    this.activeSessions = [];
    return this;
  }
  
  this.activeSessions = this.activeSessions.filter(session => session.sessionId !== sessionId);
  return this;
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  if (!this.activeSessions) {
    this.activeSessions = [];
    return this;
  }
  
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
  return this;
};

// Method to check if session exists
userSchema.methods.hasSession = function(sessionId) {
  if (!this.activeSessions) {
    return false;
  }
  
  return this.activeSessions.some(session => session.sessionId === sessionId);
};

// Method to get active sessions count
userSchema.methods.getActiveSessionsCount = function() {
  if (!this.activeSessions) {
    return 0;
  }
  
  return this.activeSessions.length;
};

module.exports = mongoose.model('User', userSchema);
