import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list
      exclude: [],
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          react: ['react', 'react-dom'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  assetsInclude: ['**/*.worker.js'],
  resolve: {
    alias: {
      // Add any necessary aliases here
    }
  },
}) 