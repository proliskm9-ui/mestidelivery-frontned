import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/poster-api': {
        target: 'https://joinposter.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/poster-api/, '/api'),
        secure: false,
      }
    }
  },
  build: {
    assetsDir: 'static',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js and 3D — ~600KB, загружается только если нужен
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // React core — кешируется отдельно, меняется редко
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Анимации
          'lottie-vendor': ['lottie-react'],
        },
      },
    },
  },
})