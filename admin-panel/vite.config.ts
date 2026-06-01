import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path must match what the backend serves it under
  base: '/admin/',
  server: {
    port: 3000,
    proxy: {
      // During dev: forward /api calls to the backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
});
