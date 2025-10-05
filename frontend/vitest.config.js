import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/Components'),
      '@hooks': path.resolve(__dirname, 'src/Hooks'),
      '@pages': path.resolve(__dirname, 'src/Pages'),
      '@calendar': path.resolve(__dirname, 'src/Components/Calendar'),
      '@entries': path.resolve(__dirname, 'src/Components/Entries'),
      '@config': path.resolve(__dirname, 'src/config'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    coverage: { reports: ['text', 'html'] }
  }
});
