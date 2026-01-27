import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  server: {
    port: 5176,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5176,
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
    },
  },
});
