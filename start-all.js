#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const shell = isWindows ? 'cmd.exe' : '/bin/bash';
const shellArgs = isWindows ? ['/c'] : ['-c'];

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

let processes = [];

const logWithColor = (color, label, message) => {
  const colors = {
    blue: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}[${label}]${colors.reset} ${message}`);
};

const startProcess = (name, command, cwd, color = 'blue') => {
  logWithColor(color, name, `Starting: ${command}`);

  const process = spawn(shell, [...shellArgs, command], {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  });

  process.on('error', (error) => {
    logWithColor('red', name, `Error: ${error.message}`);
  });

  process.on('exit', (code) => {
    logWithColor('yellow', name, `Exited with code ${code}`);
  });

  processes.push({ name, process });
};

const stopAll = () => {
  logWithColor('yellow', 'MASTER', 'Shutting down all processes...');
  processes.forEach(({ name, process }) => {
    logWithColor('yellow', name, 'Terminating...');
    process.kill();
  });
  process.exit(0);
};

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

console.log('\n');
logWithColor('green', 'MASTER', '🎵 WeVibin\' Master Runner Started 🎵');
console.log('\n');

// Start server
startProcess(
  'SERVER',
  isWindows ? 'npm run dev' : 'npm run dev',
  serverDir,
  'blue'
);

// Wait a bit for server to start, then start client
setTimeout(() => {
  startProcess(
    'CLIENT-DEV',
    isWindows ? 'npm run dev' : 'npm run dev',
    clientDir,
    'green'
  );

  // Wait a bit more for Vite to start, then start Electron
  setTimeout(() => {
    startProcess(
      'ELECTRON',
      isWindows ? 'npm run electron' : 'npm run electron',
      clientDir,
      'yellow'
    );
  }, 8000);
}, 2000);

logWithColor('green', 'MASTER', 'All processes scheduled to start');
logWithColor('green', 'MASTER', 'Press Ctrl+C to stop all processes');
console.log('\n');
