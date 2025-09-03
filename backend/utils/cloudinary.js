const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary with multiple transformations
 * @param {Buffer|ReadableStream} file - Image file buffer or stream
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URLs and public IDs
 */
const uploadImage = async (file, options = {}) => {
  try {
    const {
      folder = 'globe-trotter',
      publicId = null,
      tags = [],
      transformation = 'auto'
    } = options;

    // Upload original image
    const originalResult = await cloudinary.uploader.upload(file, {
      folder: `${folder}/original`,
      public_id: publicId,
      tags,
      transformation: transformation === 'auto' ? [
        { quality: 'auto', fetch_format: 'auto' }
      ] : transformation,
      resource_type: 'auto'
    });

    // Generate thumbnail (300x300)
    const thumbnailResult = await cloudinary.uploader.upload(file, {
      folder: `${folder}/thumbnails`,
      public_id: publicId ? `${publicId}_thumb` : undefined,
      tags: [...tags, 'thumbnail'],
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      resource_type: 'auto'
    });

    // Generate medium size (800x800)
    const mediumResult = await cloudinary.uploader.upload(file, {
      folder: `${folder}/medium`,
      public_id: publicId ? `${publicId}_medium` : undefined,
      tags: [...tags, 'medium'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      resource_type: 'auto'
    });

    // Generate large size (1200x1200)
    const largeResult = await cloudinary.uploader.upload(file, {
      folder: `${folder}/large`,
      public_id: publicId ? `${publicId}_large` : undefined,
      tags: [...tags, 'large'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      resource_type: 'auto'
    });

    return {
      success: true,
      urls: {
        original: originalResult.secure_url,
        large: largeResult.secure_url,
        medium: mediumResult.secure_url,
        thumbnail: thumbnailResult.secure_url
      },
      publicIds: {
        original: originalResult.public_id,
        large: largeResult.public_id,
        medium: mediumResult.public_id,
        thumbnail: thumbnailResult.public_id
      },
      metadata: {
        width: originalResult.width,
        height: originalResult.height,
        format: originalResult.format,
        size: originalResult.bytes
      }
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple images with progress tracking
 * @param {Array<Buffer|ReadableStream>} files - Array of image files
 * @param {Object} options - Upload options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (files, options = {}, onProgress = null) => {
  const results = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImage(files[i], options);
      results.push(result);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          success: result.success
        });
      }
    } catch (error) {
      console.error(`Error uploading file ${i + 1}:`, error);
      results.push({
        success: false,
        error: error.message,
        index: i
      });
    }
  }

  return results;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Array>} Array of deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  const results = [];
  
  for (const publicId of publicIds) {
    try {
      const result = await deleteImage(publicId);
      results.push({ publicId, ...result });
    } catch (error) {
      results.push({ 
        publicId, 
        success: false, 
        error: error.message 
      });
    }
  }

  return results;
};

/**
 * Get image information from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Image information
 */
const getImageInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      success: true,
      info: result
    };
  } catch (error) {
    console.error('Cloudinary info error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Transform image URL with Cloudinary transformations
 * @param {string} url - Original Cloudinary URL
 * @param {Array} transformations - Array of transformations
 * @returns {string} Transformed URL
 */
const transformImageUrl = (url, transformations = []) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];
  
  if (transformations.length === 0) {
    return url;
  }

  const transformString = transformations
    .map(t => Object.entries(t).map(([k, v]) => `${k}_${v}`).join(','))
    .join('/');

  return `${baseUrl}${transformString}/${imagePath}`;
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageInfo,
  transformImageUrl
};
