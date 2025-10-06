import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Emulate __dirname in ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Root and broad groups
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@domains': path.resolve(__dirname, 'src/domains'),
      '@shared': path.resolve(__dirname, 'src/shared'),

      // Common folders (keep these for convenience and backwards compatibility)
      '@components': path.resolve(__dirname, 'src/Components'),
      '@hooks': path.resolve(__dirname, 'src/Hooks'),
      '@layouts': path.resolve(__dirname, 'src/Layouts'),
      '@pages': path.resolve(__dirname, 'src/Pages'),
      '@routes': path.resolve(__dirname, 'src/Routes'),
      '@services': path.resolve(__dirname, 'src/Services'),
      '@theme': path.resolve(__dirname, 'src/Theme'),

      // Assets & mocks
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@mocks': path.resolve(__dirname, 'src/mocks'),
      '@config': path.resolve(__dirname, 'src/config'),

      // Useful component-scoped aliases kept for continued compatibility
      // Map calendar to the new domain location (calendar components moved under domains)
      '@calendar': path.resolve(__dirname, 'src/domains/timesheet/components/calendar'),
      '@entries': path.resolve(__dirname, 'src/Components/Entries'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@mui')) return 'vendor-mui';
            return 'vendor';
          }
          if (id.includes('/src/Hooks/Timesheet') || id.includes('/src/Pages/Timesheet')) {
            return 'timesheet';
          }
        }
      }
    }
  }
})
