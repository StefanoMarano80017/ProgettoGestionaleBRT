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

  // (LEGACY) Deprecated aliases - keep temporarily for backward compatibility. Remove after import rewrite & cleanup.
  // Removed deprecated @components, @hooks, @layouts, @pages aliases after migration
  '@routes': path.resolve(__dirname, 'src/Routes'),         // keep (active routing)
  '@services': path.resolve(__dirname, 'src/Services'),     // TODO review structure
  '@theme': path.resolve(__dirname, 'src/Theme'),           // (still pending relocation of theme assets)

      // Assets & mocks
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@mocks': path.resolve(__dirname, 'src/mocks'),
      '@config': path.resolve(__dirname, 'src/config'),

      // Useful component-scoped aliases kept for continued compatibility
      // Map calendar to the new domain location (calendar components moved under domains)
      '@calendar': path.resolve(__dirname, 'src/domains/timesheet/components/calendar'),
  // Removed @entries after migrating EntryListItem; use @shared/components/Entries instead
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
          // Legacy chunk grouping for old Timesheet paths removed (all domain code now under domains/timesheet).
          // If future domain-specific splitting is needed, add explicit pattern here.
        }
      }
    }
  }
})
