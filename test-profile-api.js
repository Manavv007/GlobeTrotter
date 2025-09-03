const axios = require('axios');

async function testProfileAPI() {
  try {
    console.log('Testing Profile API...');

    // Test the profile endpoint
    const response = await axios.get('http://localhost:5001/api/profile/profile', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });

    console.log('Profile API Response:', response.data);
  } catch (error) {
    console.error('Profile API Error:', error.response?.data || error.message);
  }
}

testProfileAPI();
