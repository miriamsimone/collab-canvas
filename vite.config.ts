import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error:', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    // Optimize bundle size and code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'konva-vendor': ['konva', 'react-konva'],
        },
      },
    },
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    // Generate source maps for debugging
    sourcemap: false, // Disable in production for smaller builds
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'konva', 'react-konva'],
  },
  // Production-specific settings
  define: {
    // Remove console.log in production
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})
