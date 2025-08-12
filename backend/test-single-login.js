#!/usr/bin/env node

/**
 * Test Single Login to see exact error
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSingleLogin() {
  console.log('🔍 Testing Single Login...\n');
  
  try {
    // Test with one user first
    const testUser = { 
      email: 'test@example.com', 
      password: 'password123' 
    };
    
    console.log(`📝 Attempting login with: ${testUser.email}`);
    console.log(`🔑 Password: ${testUser.password}`);
    console.log(`🌐 API URL: ${API_BASE_URL}/auth/login\n`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Message:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('Full Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - server might not be running');
    }
  }
}

if (require.main === module) {
  testSingleLogin();
}

module.exports = { testSingleLogin };
