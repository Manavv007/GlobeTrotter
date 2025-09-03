const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    console.log('📁 Storage destination:', uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'image-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📝 Generated filename:', filename, 'for:', file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('❌ File rejected:', file.originalname, 'Type:', file.mimetype);
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
  }
});

/**
 * @route   POST /api/images/upload
 * @desc    Upload images
 * @access  Private
 */
router.post('/upload', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    // Enhanced logging to debug the upload
    console.log('=== IMAGE UPLOAD REQUEST RECEIVED ===');
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files received:', req.files ? req.files.length : 0);

    if (req.files && req.files.length > 0) {
      console.log('File details:');
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          destination: file.destination,
          filename: file.filename,
          path: file.path
        });
      });
    }

    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}` // Direct access to static files
    }));

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      images: uploadedImages
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/serve/:filename
 * @desc    Serve uploaded images
 * @access  Public
 */
router.get('/serve/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

/**
 * @route   GET /api/images/test
 * @desc    Test endpoint
 * @access  Public
 */
router.get('/test', (req, res) => {
  const uploadDir = path.join(__dirname, '../uploads');
  const uploadDirExists = fs.existsSync(uploadDir);
  let files = [];

  if (uploadDirExists) {
    try {
      files = fs.readdirSync(uploadDir);
    } catch (error) {
      console.error('Error reading upload directory:', error);
    }
  }

  res.json({
    success: true,
    message: 'Images route is working',
    timestamp: new Date().toISOString(),
    uploadDir,
    uploadDirExists,
    filesCount: files.length,
    files: files
  });
});

module.exports = router;
