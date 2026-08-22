import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://18.61.36.65',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://18.61.36.65',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
