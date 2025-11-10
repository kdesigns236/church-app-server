import path from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          },
          '/socket.io': {
            target: 'http://localhost:3001',
            ws: true,
            changeOrigin: true,
            secure: false
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      // Vite automatically loads VITE_ prefixed variables from .env files
      // No need to manually define them here
    };
});
