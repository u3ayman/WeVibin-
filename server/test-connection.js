// Test if the server is accessible from external networks
const http = require('http');

const hostname = '41.38.46.220';
const port = 3001;

console.log(`Testing connection to ${hostname}:${port}...`);

const options = {
  hostname: hostname,
  port: port,
  path: '/socket.io/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is accessible!`);
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
});

req.on('error', (error) => {
  console.error(`❌ Connection failed: ${error.message}`);
  console.log('\nPossible causes:');
  console.log('1. Router port forwarding not configured for port 3001');
  console.log('2. ISP blocking the port');
  console.log('3. Server not running');
});

req.on('timeout', () => {
  console.error('❌ Connection timeout');
  req.destroy();
});

req.end();
