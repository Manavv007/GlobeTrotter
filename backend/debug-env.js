#!/usr/bin/env node

/**
 * Debug Environment Variables Script
 * This script helps debug environment variable loading issues
 */

require('dotenv').config({ path: './config.env' });

console.log('🔍 Environment Variables Debug');
console.log('================================\n');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DISABLE_RATE_LIMIT:', process.env.DISABLE_RATE_LIMIT);
console.log('RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
console.log('AUTH_RATE_LIMIT_MAX_REQUESTS:', process.env.AUTH_RATE_LIMIT_MAX_REQUESTS);

console.log('\n🔍 Rate Limiting Logic Test:');
console.log('================================');

const isDevelopment = process.env.NODE_ENV === 'development';
const isDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

console.log('Is Development:', isDevelopment);
console.log('Is Disabled:', isDisabled);
console.log('Should Disable Rate Limiting:', isDevelopment && isDisabled);

console.log('\n📁 Current Directory:', process.cwd());
console.log('📄 Config File Path:', require('path').join(process.cwd(), 'config.env'));

// Check if config.env exists
const fs = require('fs');
const configPath = require('path').join(process.cwd(), 'config.env');
console.log('📄 Config File Exists:', fs.existsSync(configPath));

if (fs.existsSync(configPath)) {
  console.log('📄 Config File Content:');
  console.log('------------------------');
  const content = fs.readFileSync(configPath, 'utf8');
  console.log(content);
}
