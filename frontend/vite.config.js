import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@domains': path.resolve(__dirname, 'src/domains'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@routes': path.resolve(__dirname, 'src/Routes'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@mocks': path.resolve(__dirname, 'src/mocks'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@calendar': path.resolve(__dirname, 'src/domains/timesheet/components/calendar')
    }
  },
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
