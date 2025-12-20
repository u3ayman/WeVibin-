#!/usr/bin/env node
/**
 * WeVibin' Server Startup Script
 * Runs the built server with error handling and logging
 */

const path = require('path');
require('dotenv').config();

// Import the compiled server
const distPath = path.join(__dirname, 'dist', 'index.js');
console.log(`Starting WeVibin' server from: ${distPath}`);

try {
  require(distPath);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
