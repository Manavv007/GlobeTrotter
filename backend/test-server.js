const express = require('express');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = 5001; // Different port to avoid conflicts

console.log('🔍 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DISABLE_RATE_LIMIT:', process.env.DISABLE_RATE_LIMIT);
console.log('=====================================\n');

// Rate limiting - can be disabled in development for testing
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
  console.log('⚠️  Rate limiting disabled for development');
} else {
  console.log('✅ Rate limiting enabled');
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
}

// Basic middleware
app.use(express.json());

// Test routes
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working!', timestamp: new Date().toISOString() });
});

app.post('/test-auth', (req, res) => {
  res.json({ message: 'Auth test route working!', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📝 Test with: http://localhost:${PORT}/test`);
  console.log(`🔐 Rate limiting status: ${process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true' ? 'DISABLED' : 'ENABLED'}`);
});
