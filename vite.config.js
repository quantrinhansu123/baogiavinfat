import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split large dependencies
          if (id.includes('node_modules')) {
            // React core must be in the same chunk to avoid duplicate instances
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
              return 'vendor-react'
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'vendor-charts'
            }
            // react-toastify needs React, so it should be in vendor-react or default chunk
            // Don't separate it into vendor-ui as it causes useLayoutEffect issues
          }

          // Không tách feature-calculator / feature-customers — tránh lỗi "Cannot read properties of undefined (reading 'useLayoutEffect')" khi chunk load trước vendor-react trên production (Vercel).
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
