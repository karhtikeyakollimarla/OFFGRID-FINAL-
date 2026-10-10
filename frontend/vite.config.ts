import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://offgrid-final-8re0ekkpc-karhtikeyakollimarla.vercel.app',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://offgrid-final-8re0ekkpc-karhtikeyakollimarla.vercel.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
