import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // API key is now server-side only - not exposed to client
        // GEMINI_API_KEY should be set in Vercel Project Settings → Environment Variables
        __BUILD_DATE__: JSON.stringify(
          new Date().toISOString().slice(0, 16).replace('T', '_')
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
