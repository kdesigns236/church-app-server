import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://church-app-server.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
