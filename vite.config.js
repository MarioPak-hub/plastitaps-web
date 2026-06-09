import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Fix Cross-Origin-Opener-Policy for Google OAuth popup
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    // Proxy /api al backend Express (puerto 3001)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Increase inline asset threshold (assets < 4KB get inlined as base64)
    assetsInlineLimit: 4096,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('framer-motion') || id.includes('animejs')) return 'animation-vendor';
            if (id.includes('swiper') || id.includes('lucide-react') || id.includes('react-icons')) return 'ui-vendor';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          }
        },
      },
    },
    // Enable CSS minification
    cssMinify: true,
    // Report compressed file sizes
    reportCompressedSize: true,
  },
})
