const mongoose = require('mongoose');
const Post = require('./models/Post');

const MONGODB_URI = 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0';

async function quickTest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const postCount = await Post.countDocuments();
    console.log(`Total posts in database: ${postCount}`);

    if (postCount > 0) {
      const posts = await Post.find().populate('userId', 'firstName lastName').limit(3);
      console.log('Sample posts:');
      posts.forEach(post => {
        console.log(`- ${post.tripTitle} by ${post.userId?.firstName || 'Unknown'}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();
