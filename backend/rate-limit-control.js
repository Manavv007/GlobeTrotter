#!/usr/bin/env node

/**
 * Rate Limit Control Script for GlobeTrotter Development
 * 
 * This script helps you manage rate limiting during development and testing.
 * 
 * Usage:
 *   node rate-limit-control.js disable    # Disable rate limiting
 *   node rate-limit-control.js enable     # Enable rate limiting
 *   node rate-limit-control.js status     # Show current status
 *   node rate-limit-control.js reset      # Reset rate limit counters
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'config.env');
const envExampleFile = path.join(__dirname, 'config.env.example');

function updateEnvFile(key, value) {
  let envContent = '';
  
  try {
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
    } else {
      // Create from example if config.env doesn't exist
      if (fs.existsSync(envExampleFile)) {
        envContent = fs.readFileSync(envExampleFile, 'utf8');
      }
    }
  } catch (error) {
    console.error('Error reading env file:', error.message);
    return false;
  }

  // Update or add the key
  const lines = envContent.split('\n');
  let keyFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      keyFound = true;
      break;
    }
  }
  
  if (!keyFound) {
    lines.push(`${key}=${value}`);
  }
  
  try {
    fs.writeFileSync(envFile, lines.join('\n'));
    return true;
  } catch (error) {
    console.error('Error writing env file:', error.message);
    return false;
  }
}

function showStatus() {
  try {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const lines = envContent.split('\n');
      
      console.log('\n📊 Current Rate Limiting Configuration:');
      console.log('=====================================');
      
      const config = {};
      lines.forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          config[key.trim()] = value.trim();
        }
      });
      
      console.log(`NODE_ENV: ${config.NODE_ENV || 'not set'}`);
      console.log(`DISABLE_RATE_LIMIT: ${config.DISABLE_RATE_LIMIT || 'not set'}`);
      console.log(`RATE_LIMIT_MAX_REQUESTS: ${config.RATE_LIMIT_MAX_REQUESTS || '500 (default)'}`);
      console.log(`AUTH_RATE_LIMIT_MAX_REQUESTS: ${config.AUTH_RATE_LIMIT_MAX_REQUESTS || '50 (default)'}`);
      
      if (config.DISABLE_RATE_LIMIT === 'true') {
        console.log('\n⚠️  Rate limiting is DISABLED');
      } else {
        console.log('\n✅ Rate limiting is ENABLED');
      }
      
    } else {
      console.log('❌ config.env file not found. Run this script from the backend directory.');
    }
  } catch (error) {
    console.error('Error reading status:', error.message);
  }
}

function main() {
  const command = process.argv[2];
  
  console.log('🚀 GlobeTrotter Rate Limit Control');
  console.log('==================================\n');
  
  switch (command) {
    case 'disable':
      if (updateEnvFile('DISABLE_RATE_LIMIT', 'true')) {
        console.log('✅ Rate limiting disabled for development');
        console.log('⚠️  Remember to restart your server for changes to take effect');
      } else {
        console.log('❌ Failed to disable rate limiting');
      }
      break;
      
    case 'enable':
      if (updateEnvFile('DISABLE_RATE_LIMIT', 'false')) {
        console.log('✅ Rate limiting enabled');
        console.log('⚠️  Remember to restart your server for changes to take effect');
      } else {
        console.log('❌ Failed to enable rate limiting');
      }
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'reset':
      console.log('🔄 Rate limit counters are reset automatically when the server restarts');
      console.log('💡 To reset counters now, restart your server');
      break;
      
    default:
      console.log('Usage: node rate-limit-control.js [command]');
      console.log('\nCommands:');
      console.log('  disable  - Disable rate limiting for development');
      console.log('  enable   - Enable rate limiting');
      console.log('  status   - Show current configuration');
      console.log('  reset    - Show reset instructions');
      console.log('\nExample:');
      console.log('  node rate-limit-control.js disable');
      break;
  }
  
  console.log('\n📝 Note: After changing configuration, restart your server for changes to take effect.');
}

if (require.main === module) {
  main();
}

module.exports = { updateEnvFile, showStatus };
