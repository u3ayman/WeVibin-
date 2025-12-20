#!/usr/bin/env node
/**
 * WeVibin' Server Test Script
 * Tests the server connection on port 3001
 */

const http = require('http');

const PORT = 3001;
const HOST = 'localhost';

console.log(`\n🎵 WeVibin' Server Connection Test`);
console.log(`===============================\n`);
console.log(`Testing connection to: http://${HOST}:${PORT}\n`);

const testRequest = http.get(`http://${HOST}:${PORT}`, (res) => {
  console.log(`✅ Server is running!`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log(`\n✅ Socket.IO server is listening on port ${PORT}`);
  console.log(`Clients can connect via: ws://${HOST}:${PORT}`);
  process.exit(0);
});

testRequest.on('error', (error) => {
  console.log(`❌ Error connecting to server:`);
  console.log(`   ${error.message}\n`);
  console.log(`Make sure the server is running:`);
  console.log(`   cd C:\\Users\\Administrator\\WeVibin-\\server`);
  console.log(`   npm run dev`);
  console.log(`   OR`);
  console.log(`   node dist/index.js`);
  process.exit(1);
});

testRequest.on('timeout', () => {
  console.log(`❌ Connection timed out`);
  process.exit(1);
});

testRequest.setTimeout(5000);
