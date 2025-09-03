const sharp = require('sharp');
const exifReader = require('exifreader');
const { Readable } = require('stream');

/**
 * Extract metadata from image buffer
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Extracted metadata
 */
const extractImageMetadata = async (buffer) => {
  try {
    const metadata = {};
    
    // Get basic image info using Sharp
    const imageInfo = await sharp(buffer).metadata();
    metadata.width = imageInfo.width;
    metadata.height = imageInfo.height;
    metadata.format = imageInfo.format;
    metadata.size = buffer.length;
    
    // Extract EXIF data if available
    try {
      const exifData = exifReader(buffer);
      
      if (exifData) {
        metadata.exif = {};
        
        // Camera information
        if (exifData.Make && exifData.Model) {
          metadata.exif.camera = `${exifData.Make} ${exifData.Model}`.trim();
        }
        
        // Date taken
        if (exifData.DateTimeOriginal) {
          metadata.exif.dateTaken = new Date(exifData.DateTimeOriginal);
        }
        
        // GPS coordinates
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
          metadata.exif.location = {
            latitude: convertDMSToDD(exifData.GPSLatitude, exifData.GPSLatitudeRef),
            longitude: convertDMSToDD(exifData.GPSLongitude, exifData.GPSLongitudeRef)
          };
        }
        
        // Orientation
        if (exifData.Orientation) {
          metadata.exif.orientation = exifData.Orientation;
        }
      }
    } catch (exifError) {
      // EXIF extraction failed, continue without it
      console.log('EXIF extraction failed:', exifError.message);
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return {};
  }
};

/**
 * Convert GPS coordinates from DMS to decimal degrees
 * @param {Array} dms - DMS coordinates array
 * @param {string} ref - Reference (N/S, E/W)
 * @returns {number} Decimal degrees
 */
const convertDMSToDD = (dms, ref) => {
  if (!dms || !Array.isArray(dms)) return 0;
  
  const degrees = dms[0] || 0;
  const minutes = dms[1] || 0;
  const seconds = dms[2] || 0;
  
  let dd = degrees + (minutes / 60) + (seconds / 3600);
  
  if (ref === 'S' || ref === 'W') {
    dd = -dd;
  }
  
  return dd;
};

/**
 * Compress and resize image for different use cases
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Buffer>} Processed image buffer
 */
const processImage = async (buffer, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'jpeg',
    fit = 'cover',
    position = 'center'
  } = options;
  
  try {
    let sharpInstance = sharp(buffer);
    
    // Auto-orient based on EXIF
    sharpInstance = sharpInstance.rotate();
    
    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit,
        position,
        withoutEnlargement: true
      });
    }
    
    // Convert format and set quality
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality });
    }
    
    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Generate multiple sizes for an image
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} sizes - Size configurations
 * @returns {Promise<Object>} Processed images
 */
const generateMultipleSizes = async (buffer, sizes = {}) => {
  const {
    thumbnail = { width: 300, height: 300 },
    medium = { width: 800, height: 800 },
    large = { width: 1200, height: 1200 }
  } = sizes;
  
  try {
    const [thumbnailBuffer, mediumBuffer, largeBuffer] = await Promise.all([
      processImage(buffer, { ...thumbnail, quality: 70 }),
      processImage(buffer, { ...medium, quality: 80 }),
      processImage(buffer, { ...large, quality: 90 })
    ]);
    
    return {
      thumbnail: thumbnailBuffer,
      medium: mediumBuffer,
      large: largeBuffer
    };
  } catch (error) {
    console.error('Error generating multiple sizes:', error);
    throw error;
  }
};

/**
 * Create a thumbnail from image buffer
 * @param {Buffer} buffer - Original image buffer
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Buffer>} Thumbnail buffer
 */
const createThumbnail = async (buffer, size = 300) => {
  return processImage(buffer, {
    width: size,
    height: size,
    quality: 70,
    format: 'jpeg'
  });
};

/**
 * Optimize image for web delivery
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} Optimized image buffer
 */
const optimizeForWeb = async (buffer, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp'
  } = options;
  
  try {
    const imageInfo = await sharp(buffer).metadata();
    
    let { width, height } = imageInfo;
    
    // Calculate dimensions while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    return processImage(buffer, {
      width,
      height,
      quality,
      format,
      fit: 'inside'
    });
  } catch (error) {
    console.error('Error optimizing image for web:', error);
    throw error;
  }
};

/**
 * Add watermark to image
 * @param {Buffer} buffer - Original image buffer
 * @param {Buffer|string} watermark - Watermark image or text
 * @param {Object} options - Watermark options
 * @returns {Promise<Buffer>} Watermarked image buffer
 */
const addWatermark = async (buffer, watermark, options = {}) => {
  const {
    position = 'bottomRight',
    opacity = 0.7,
    margin = 20
  } = options;
  
  try {
    let sharpInstance = sharp(buffer);
    
    if (typeof watermark === 'string') {
      // Text watermark
      const svgText = `
        <svg width="200" height="50">
          <text x="10" y="35" font-family="Arial" font-size="24" fill="white" opacity="${opacity}">
            ${watermark}
          </text>
        </svg>
      `;
      
      const watermarkBuffer = Buffer.from(svgText);
      sharpInstance = sharpInstance.composite([{
        input: watermarkBuffer,
        gravity: position,
        top: margin,
        left: margin
      }]);
    } else {
      // Image watermark
      const watermarkBuffer = await processImage(watermark, {
        width: 100,
        height: 50,
        quality: 90
      });
      
      sharpInstance = sharpInstance.composite([{
        input: watermarkBuffer,
        gravity: position,
        top: margin,
        left: margin
      }]);
    }
    
    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
};

/**
 * Convert image to different formats
 * @param {Buffer} buffer - Original image buffer
 * @param {string} format - Target format
 * @param {Object} options - Format-specific options
 * @returns {Promise<Buffer>} Converted image buffer
 */
const convertFormat = async (buffer, format, options = {}) => {
  try {
    let sharpInstance = sharp(buffer);
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return await sharpInstance.jpeg(options).toBuffer();
      case 'png':
        return await sharpInstance.png(options).toBuffer();
      case 'webp':
        return await sharpInstance.webp(options).toBuffer();
      case 'avif':
        return await sharpInstance.avif(options).toBuffer();
      case 'tiff':
        return await sharpInstance.tiff(options).toBuffer();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Error converting image format:', error);
    throw error;
  }
};

/**
 * Validate image file
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
const validateImage = async (buffer, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    maxWidth = 4096,
    maxHeight = 4096,
    allowedFormats = ['jpeg', 'png', 'webp', 'gif']
  } = options;
  
  try {
    // Check file size
    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      };
    }
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Check dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      return {
        valid: false,
        error: `Image dimensions exceed maximum allowed size of ${maxWidth}x${maxHeight}`
      };
    }
    
    // Check format
    if (!allowedFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: `Image format ${metadata.format} is not allowed. Allowed formats: ${allowedFormats.join(', ')}`
      };
    }
    
    return {
      valid: true,
      metadata
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file'
    };
  }
};

module.exports = {
  extractImageMetadata,
  processImage,
  generateMultipleSizes,
  createThumbnail,
  optimizeForWeb,
  addWatermark,
  convertFormat,
  validateImage
};
