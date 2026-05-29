import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'CLERK_', 'NEXT_PUBLIC_'],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor'
            if (id.includes('/react/')) return 'react-vendor'
            if (
              id.includes('framer-motion') ||
              id.includes('lucide-react') ||
              id.includes('@radix-ui')
            ) return 'ui-vendor'
            if (id.includes('recharts') || id.includes('/d3')) return 'chart-vendor'
            if (id.includes('react-hook-form') || id.includes('/zod/')) return 'form-vendor'
            if (id.includes('@tanstack') || id.includes('/axios/')) return 'query-vendor'
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-vendor'
            if (id.includes('@clerk')) return 'clerk-vendor'
          }
        },
      },
    },
  },
})
