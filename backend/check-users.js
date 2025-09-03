#!/usr/bin/env node

/**
 * Check existing users in the database
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}).select('email firstName lastName activeSessions');
    
    console.log(`📊 Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active Sessions: ${user.activeSessions?.length || 0}`);
      console.log(`   Has activeSessions field: ${user.activeSessions ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  checkUsers();
}

module.exports = { checkUsers };
