import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://mestiapi.ddns.net:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://mestiapi.ddns.net:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    assetsDir: 'static',
  }
})