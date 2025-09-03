const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0';

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if users exist
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find().select('email firstName lastName isActive').limit(5);
      console.log('\nSample users:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - Active: ${user.isActive}`);
      });

      // Test login with first user
      const testUser = users[0];
      console.log(`\nTesting login with: ${testUser.email}`);
      
      // Try to find user and check password
      const foundUser = await User.findOne({ email: testUser.email });
      if (foundUser) {
        console.log('User found in database');
        console.log(`Password hash exists: ${!!foundUser.password}`);
        console.log(`Account active: ${foundUser.isActive}`);
        
        // Test with common passwords
        const testPasswords = ['password', '123456', 'admin', 'test123'];
        for (const pwd of testPasswords) {
          try {
            const isMatch = await bcrypt.compare(pwd, foundUser.password);
            if (isMatch) {
              console.log(`✅ Password match found: ${pwd}`);
              break;
            }
          } catch (err) {
            console.log(`❌ Error testing password ${pwd}:`, err.message);
          }
        }
      }
    } else {
      console.log('No users found in database');
      
      // Create a test user
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      const testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        activeSessions: []
      });
      
      await testUser.save();
      console.log('✅ Test user created: test@example.com / test123');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
