import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy standard HTTP API requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy WebSocket connections for Socket.IO to the backend server
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true, // This is the crucial setting that enables WebSocket proxying
      },
    },
  },
});