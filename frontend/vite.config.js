import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
