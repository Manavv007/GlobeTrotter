const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const EmailService = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate unique session ID
const generateSessionId = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Register User
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const emailSent = await EmailService.sendEmailVerification(email, firstName, verificationToken);
    
    if (!emailSent) {
      // If email fails, still create user but notify about email issue
      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please check your email for verification link. If you don\'t receive it, contact support.',
        user: user.getProfile()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email for verification link.',
      user: user.getProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account. Please try again.'
    });
  }
});

// Login User
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate unique session ID and token
    const sessionId = generateSessionId();
    const token = generateToken(user._id);
    
    try {
      // Add new session to user
      user.addSession(
        sessionId, 
        token, 
        req.headers['user-agent'] || 'Unknown',
        req.ip || req.connection.remoteAddress || 'Unknown'
      );
      
      await user.save();
      console.log(`✅ User ${user.email} logged in successfully with session ${sessionId.substring(0, 8)}...`);
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue with login even if session creation fails
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      sessionId,
      user: user.getProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in. Please try again.'
    });
  }
});

// Logout User (remove specific session)
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Find user by session ID
    const user = await User.findOne({
      'activeSessions.sessionId': sessionId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Remove the specific session
    user.removeSession(sessionId);
    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out. Please try again.'
    });
  }
});

// Get user's active sessions
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return active sessions (without sensitive data)
    const sessions = user.activeSessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      sessions,
      totalSessions: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sessions'
    });
  }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Verification attempt for token:', token);

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('No user found with this token or token expired');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    console.log('User found:', user.email, 'Token expires:', user.emailVerificationExpires);

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('Email verified successfully for:', user.email);

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user.email, user.firstName);
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail the verification if welcome email fails
    }

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to GlobeTrotter!',
      email: user.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email. Please try again.'
    });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    const emailSent = await EmailService.sendPasswordReset(email, user.firstName, resetToken);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request. Please try again.'
    });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const { token, password } = req.body;

    // Find user with this token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password. Please try again.'
    });
  }
});

// Resend Verification Email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const emailSent = await EmailService.sendEmailVerification(email, user.firstName, verificationToken);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully!'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email. Please try again.'
    });
  }
});

// Verify token endpoint
router.get('/verify-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
