const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const Post = require('./models/Post');
const User = require('./models/User');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Simple posts route for testing
app.get('/api/posts', async (req, res) => {
  try {
    console.log('Posts endpoint hit');
    
    const posts = await Post.find({ isPublic: true })
      .populate('userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${posts.length} posts`);

    const postsWithCounts = posts.map(post => ({
      ...post,
      likeCount: post.likes ? post.likes.length : 0,
      commentCount: 0,
      isLiked: false
    }));

    res.json({
      success: true,
      posts: postsWithCounts,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalPosts: posts.length,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`🚀 Test server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🔗 Test posts at http://localhost:${PORT}/api/posts`);
    });
  })
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
  });
