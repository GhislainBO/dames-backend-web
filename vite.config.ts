import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, '../src/engine'),
      '@ai': path.resolve(__dirname, '../src/ai'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
