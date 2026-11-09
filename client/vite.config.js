import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, forward API and uploaded-image requests to the Express server
// so the browser only ever talks to one origin (no CORS issues locally).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
