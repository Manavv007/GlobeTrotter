require('dotenv').config({ path: './config.env' });
const cloudinary = require('cloudinary').v2;

console.log('Testing Cloudinary Configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test Cloudinary connection
async function testCloudinary() {
  try {
    console.log('\nTesting Cloudinary connection...');
    
    // Test API credentials by getting account info
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // Test upload with a simple text file
    console.log('\nTesting upload functionality...');
    const uploadResult = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', {
      folder: 'test',
      public_id: 'test-image-' + Date.now()
    });
    
    console.log('✅ Upload test successful:', uploadResult.secure_url);
    
    // Clean up test image
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Test image cleaned up');
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    console.error('Error details:', error);
  }
}

testCloudinary();
