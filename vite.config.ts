import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy the root health check route
      '/health': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      // Proxy all API requests under the /api prefix to the backend server
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      // Proxy Socket.IO connections (which use WebSockets)
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
      },
    },
  },
});