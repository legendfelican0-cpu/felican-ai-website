import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sites } from './build/sites-vite-plugin.js';

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react(), ...(mode === 'test' ? [] : [sites(), cloudflare()])],
  server: {
    allowedHosts: ['.serveousercontent.com', '.lhr.life'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
}));
