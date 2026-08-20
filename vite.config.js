import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/test-monitor/',
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['test-monitor.infra-dev.forcepoint.net', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['test-monitor.infra-dev.forcepoint.net', 'localhost'],
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
