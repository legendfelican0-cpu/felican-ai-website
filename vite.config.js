import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['3a1e3de0f81048d2-104-6-240-230.serveousercontent.com'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
});
