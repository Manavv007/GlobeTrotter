const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'globe-trotter') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload profile picture with specific transformations
const uploadProfilePicture = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'globe-trotter/profile-pictures',
      resource_type: 'auto',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete image from Cloudinary
const deleteImage = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update image in Cloudinary (delete old and upload new)
const updateImage = async (oldPublicId, newFile, folder = 'globe-trotter') => {
  try {
    // Delete old image if it exists
    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

    // Upload new image
    return await uploadImage(newFile, folder);
  } catch (error) {
    console.error('Image update error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get image info from Cloudinary
const getImageInfo = async (public_id) => {
  try {
    const result = await cloudinary.api.resource(public_id);
    return {
      success: true,
      info: result
    };
  } catch (error) {
    console.error('Get image info error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadImage,
  uploadProfilePicture,
  deleteImage,
  updateImage,
  getImageInfo
};
