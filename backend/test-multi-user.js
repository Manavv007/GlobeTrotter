#!/usr/bin/env node

/**
 * Test Script for Multi-User Authentication
 * This script tests if multiple users can be logged in simultaneously
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test users (you can modify these)
const testUsers = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'user3@test.com', password: 'password123' }
];

const activeSessions = [];

async function testMultiUserLogin() {
  console.log('🚀 Testing Multi-User Authentication');
  console.log('=====================================\n');

  try {
    // Step 1: Login all users simultaneously
    console.log('📝 Step 1: Logging in all users...');
    
    const loginPromises = testUsers.map(async (user, index) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, user);
        const { token, sessionId, user: userData } = response.data;
        
        activeSessions.push({
          email: user.email,
          token,
          sessionId,
          userData
        });
        
        console.log(`✅ User ${index + 1} (${user.email}) logged in successfully`);
        console.log(`   Session ID: ${sessionId.substring(0, 8)}...`);
        console.log(`   Token: ${token.substring(0, 20)}...`);
        console.log('');
        
        return { success: true, user: user.email };
      } catch (error) {
        console.log(`❌ User ${index + 1} (${user.email}) login failed:`, error.response?.data?.message || error.message);
        return { success: false, user: user.email, error: error.message };
      }
    });

    const loginResults = await Promise.all(loginPromises);
    const successfulLogins = loginResults.filter(result => result.success);
    
    console.log(`📊 Login Results: ${successfulLogins.length}/${testUsers.length} users logged in successfully\n`);

    if (successfulLogins.length === 0) {
      console.log('❌ No users could log in. Please check your server and database.');
      return;
    }

    // Step 2: Test profile access for each logged-in user
    console.log('🔐 Step 2: Testing profile access for each user...');
    
    for (let i = 0; i < activeSessions.length; i++) {
      const session = activeSessions[i];
      
      try {
        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });
        
        console.log(`✅ User ${i + 1} (${session.email}) profile access successful`);
        console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
        console.log(`   Active Sessions: ${response.data.user.activeSessions?.length || 0}`);
        console.log(`   Session ID: ${session.sessionId.substring(0, 8)}...`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ User ${i + 1} (${session.email}) profile access failed:`, error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          console.log(`   🔍 This might indicate a session validation issue`);
        }
      }
    }

    // Step 3: Test concurrent API calls
    console.log('🔄 Step 3: Testing concurrent API calls...');
    
    const concurrentPromises = activeSessions.map(async (session, index) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });
        
        return { success: true, user: session.email, index };
      } catch (error) {
        return { success: false, user: session.email, index, error: error.message };
      }
    });

    const concurrentResults = await Promise.all(concurrentPromises);
    const successfulConcurrent = concurrentResults.filter(result => result.success);
    
    console.log(`📊 Concurrent API Results: ${successfulConcurrent.length}/${activeSessions.length} successful`);
    
    if (successfulConcurrent.length === activeSessions.length) {
      console.log('✅ All concurrent API calls successful! Multi-user support is working.');
    } else {
      console.log('⚠️  Some concurrent API calls failed. There might be an issue.');
    }

    // Step 4: Test logout for each user
    console.log('\n🚪 Step 4: Testing logout for each user...');
    
    for (let i = 0; i < activeSessions.length; i++) {
      const session = activeSessions[i];
      
      try {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          sessionId: session.sessionId
        });
        
        console.log(`✅ User ${i + 1} (${session.email}) logged out successfully`);
        
      } catch (error) {
        console.log(`❌ User ${i + 1} (${session.email}) logout failed:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Multi-user authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testMultiUserLogin();
}

module.exports = { testMultiUserLogin };
