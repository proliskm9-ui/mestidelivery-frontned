import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import hoverGate from './postcss-hover-gate.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {
      // Gate :hover styles to real pointers so taps on phones don't leave hover stuck
      plugins: [hoverGate()],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet', '@turf/boolean-point-in-polygon', '@turf/helpers'],
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // Gateway sends HSTS/CSP meant for production HTTPS.
          // When proxied over LAN HTTP (phone → PC IP), HSTS poisons the IP
          // and Safari/Chrome start forcing https://172.x.x.x which fails.
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['strict-transport-security'];
            delete proxyRes.headers['content-security-policy'];
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['strict-transport-security'];
            delete proxyRes.headers['content-security-policy'];
          });
        },
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
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
