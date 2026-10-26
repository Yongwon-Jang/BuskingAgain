import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// API / WebSocket requests are proxied to the rebuild server (server/index.js)
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', rewrite: (p) => p.replace(/^\/api/, '') },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
});
