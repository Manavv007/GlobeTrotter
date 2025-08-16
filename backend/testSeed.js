const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0';

async function testSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get users
    const users = await User.find().limit(5);
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    // Clear existing posts
    await Post.deleteMany({});
    console.log('Cleared existing posts');

    // Create a simple test post
    const testPost = new Post({
      userId: users[0]._id,
      tripTitle: "Test Kerala Trip",
      description: "A simple test post to verify the community feature is working properly.",
      photos: ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944"],
      tags: ["#kerala", "#test"],
      location: "Kerala, India",
      itinerary: [{
        day: 1,
        activities: ["Test activity"],
        notes: "Test notes"
      }],
      likes: [users[0]._id]
    });

    await testPost.save();
    console.log('✅ Created test post successfully');

    // Verify the post was created
    const posts = await Post.find().populate('userId', 'firstName lastName');
    console.log(`✅ Found ${posts.length} posts in database`);
    
    if (posts.length > 0) {
      console.log('Post details:', {
        title: posts[0].tripTitle,
        author: `${posts[0].userId.firstName} ${posts[0].userId.lastName}`,
        likes: posts[0].likes.length
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSeed();
