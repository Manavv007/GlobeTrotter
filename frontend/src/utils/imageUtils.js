/**
 * Frontend Image Utilities
 * Provides client-side image processing, compression, and validation
 */

// Canvas for image processing
const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// Get canvas context with fallback
const getCanvasContext = (canvas) => {
  return canvas.getContext('2d') || canvas.getContext('webgl') || null;
};

/**
 * Compress image using canvas
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg',
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = createCanvas(maxWidth, maxHeight);
    const ctx = getCanvasContext(canvas);

    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxWidth = 4096,
    maxHeight = 4096
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
  }

  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    errors.push('File must be an image');
  }

  return {
    valid: errors.length === 0,
    errors,
    file
  };
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<Object>} Image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create thumbnail from image
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (square)
 * @param {number} quality - JPEG quality
 * @returns {Promise<File>} Thumbnail file
 */
export const createThumbnail = async (file, size = 150, quality = 0.7) => {
  return compressImage(file, {
    quality,
    maxWidth: size,
    maxHeight: size,
    format: 'jpeg',
    mimeType: 'image/jpeg'
  });
};

/**
 * Convert image to different format
 * @param {File} file - Image file
 * @param {string} format - Target format
 * @param {number} quality - Quality setting
 * @returns {Promise<File>} Converted image file
 */
export const convertImageFormat = async (file, format = 'webp', quality = 0.8) => {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };

  const mimeType = mimeTypes[format.toLowerCase()];
  if (!mimeType) {
    throw new Error(`Unsupported format: ${format}`);
  }

  return compressImage(file, {
    quality,
    format,
    mimeType
  });
};

/**
 * Add watermark to image
 * @param {File} file - Image file
 * @param {string} watermarkText - Text to add as watermark
 * @param {Object} options - Watermark options
 * @returns {Promise<File>} Watermarked image file
 */
export const addWatermark = async (file, watermarkText, options = {}) => {
  const {
    position = 'bottomRight',
    fontSize = 24,
    fontColor = 'rgba(255, 255, 255, 0.7)',
    margin = 20
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = createCanvas(800, 600);
    const ctx = getCanvasContext(canvas);

    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas size to image size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add watermark text
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Calculate watermark position
        let x, y;
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        switch (position) {
          case 'topLeft':
            x = margin;
            y = margin + textHeight;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            break;
          case 'topRight':
            x = canvas.width - margin;
            y = margin + textHeight;
            ctx.textBaseline = 'top';
            break;
          case 'bottomLeft':
            x = margin;
            y = canvas.height - margin;
            ctx.textAlign = 'left';
            break;
          case 'bottomRight':
          default:
            x = canvas.width - margin;
            y = canvas.height - margin;
            break;
        }

        // Draw watermark
        ctx.fillText(watermarkText, x, y);

        // Convert to file
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          },
          file.type,
          0.9
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate multiple sizes for responsive images
 * @param {File} file - Original image file
 * @param {Object} sizes - Size configurations
 * @returns {Promise<Object>} Multiple sized images
 */
export const generateResponsiveImages = async (file, sizes = {}) => {
  const {
    thumbnail = 150,
    small = 300,
    medium = 600,
    large = 1200
  } = sizes;

  try {
    const [thumbnailFile, smallFile, mediumFile, largeFile] = await Promise.all([
      createThumbnail(file, thumbnail),
      compressImage(file, { maxWidth: small, maxHeight: small, quality: 0.8 }),
      compressImage(file, { maxWidth: medium, maxHeight: medium, quality: 0.85 }),
      compressImage(file, { maxWidth: large, maxHeight: large, quality: 0.9 })
    ]);

    return {
      thumbnail: thumbnailFile,
      small: smallFile,
      medium: mediumFile,
      large: largeFile
    };
  } catch (error) {
    console.error('Error generating responsive images:', error);
    throw error;
  }
};

/**
 * Calculate file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if browser supports specific image format
 * @param {string} format - Image format to check
 * @returns {boolean} Support status
 */
export const supportsImageFormat = (format) => {
  const canvas = createCanvas(1, 1);
  const ctx = getCanvasContext(canvas);
  
  if (!ctx) return false;

  try {
    const mimeType = `image/${format.toLowerCase()}`;
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  } catch (error) {
    return false;
  }
};

/**
 * Get optimal image format for browser
 * @returns {string} Best supported format
 */
export const getOptimalFormat = () => {
  if (supportsImageFormat('webp')) return 'webp';
  if (supportsImageFormat('jpeg')) return 'jpeg';
  if (supportsImageFormat('png')) return 'png';
  return 'jpeg'; // fallback
};

/**
 * Create image preview URL
 * @param {File} file - Image file
 * @param {number} maxSize - Maximum preview size
 * @returns {Promise<string>} Preview URL
 */
export const createPreviewUrl = async (file, maxSize = 300) => {
  try {
    const compressedFile = await compressImage(file, {
      maxWidth: maxSize,
      maxHeight: maxSize,
      quality: 0.7
    });
    
    return URL.createObjectURL(compressedFile);
  } catch (error) {
    console.error('Error creating preview:', error);
    return URL.createObjectURL(file);
  }
};

/**
 * Clean up object URLs to prevent memory leaks
 * @param {string|Array<string>} urls - URL or array of URLs to revoke
 */
export const cleanupObjectUrls = (urls) => {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  urlArray.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

/**
 * Batch process multiple images
 * @param {Array<File>} files - Array of image files
 * @param {Function} processor - Processing function
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed images
 */
export const batchProcessImages = async (files, processor, options = {}) => {
  const { concurrency = 3, onProgress } = options;
  const results = [];
  const total = files.length;

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchPromises = batch.map(async (file, batchIndex) => {
      try {
        const result = await processor(file, options);
        const globalIndex = i + batchIndex;
        
        if (onProgress) {
          onProgress({
            current: globalIndex + 1,
            total,
            percentage: Math.round(((globalIndex + 1) / total) * 100),
            file,
            result
          });
        }
        
        return { success: true, file, result };
      } catch (error) {
        return { success: false, file, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};
