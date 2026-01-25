import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
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
    }
  },
});
