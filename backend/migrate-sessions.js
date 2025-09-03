#!/usr/bin/env node

/**
 * Database Migration Script for Active Sessions
 * This script safely adds the activeSessions field to existing users
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateSessions() {
  try {
    console.log('🔄 Starting session migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all users without activeSessions field
    const usersToMigrate = await User.find({
      $or: [
        { activeSessions: { $exists: false } },
        { activeSessions: null }
      ]
    });
    
    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);
    
    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration');
      return;
    }
    
    // Migrate each user
    let migratedCount = 0;
    for (const user of usersToMigrate) {
      try {
        // Initialize activeSessions if it doesn't exist
        if (!user.activeSessions) {
          user.activeSessions = [];
        }
        
        await user.save();
        migratedCount++;
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! ${migratedCount}/${usersToMigrate.length} users migrated successfully`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSessions()
    .then(() => {
      console.log('🚀 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSessions };
