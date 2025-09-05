const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/generateItinerary');

const packagesRoutes = require('./routes/packages');
const calendarRoutes = require('./routes/calendar');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const placesDiscoveryRoutes = require('./routes/placesDiscovery');
const imageRoutes = require('./routes/images');

const profileRoutes = require('./routes/profile');
const TripStatusUpdater = require('./utils/tripStatusUpdater');
const { cleanupExpiredSessions } = require('./utils/sessionCleanup');

const app = express();
const PORT = process.env.PORT || 3000; // Railway will set PORT automatically

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting - can be disabled in development for testing
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
  console.log('⚠️  Rate limiting disabled for development');
} else {
  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
    max: process.env.NODE_ENV === 'production' ? 100 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    }
  });

  // Stricter rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : (parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 50),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    }
  });

  app.use(limiter);

  // Apply stricter rate limiting to auth routes
  app.use('/api/auth', authLimiter);
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

// Handle preflight requests for uploads
app.options('/uploads/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// Handle preflight requests for api/images
app.options('/api/images/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/itinerary', itineraryRoutes);

app.use('/api/packages', packagesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/places-discovery', placesDiscoveryRoutes);
app.use('/api/images', imageRoutes);

app.use('/api/profile', profileRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'GlobeTrotter API is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Schedule trip status updates (run every hour)
    setInterval(async () => {
      try {
        await TripStatusUpdater.updateTripStatuses();
      } catch (error) {
        console.error('Scheduled trip status update failed:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Schedule session cleanup (run every 6 hours)
    setInterval(async () => {
      try {
        await cleanupExpiredSessions();
      } catch (error) {
        console.error('Scheduled session cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // Run every 6 hours

    // Run initial trip status update
    TripStatusUpdater.updateTripStatuses()
      .then(result => {
        if (result.success) {
          console.log(`Initial trip status update: ${result.completed} completed, ${result.ongoing} ongoing`);
        }
      })
      .catch(error => {
        console.error('Initial trip status update failed:', error);
      });

    // Run initial session cleanup
    cleanupExpiredSessions()
      .then(result => {
        if (result.success) {
          console.log(`Initial session cleanup: ${result.cleanedUsers} users cleaned`);
        }
      })
      .catch(error => {
        console.error('Initial session cleanup failed:', error);
      });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});