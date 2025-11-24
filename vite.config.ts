import path from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3002,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://church-app-server.onrender.com',
            changeOrigin: true,
            secure: true
          },
          '/socket.io': {
            target: 'https://church-app-server.onrender.com',
            ws: true,
            changeOrigin: true,
            secure: true
          },
        },
      },
      build: {
        outDir: 'server/public',
        emptyOutDir: true,
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
