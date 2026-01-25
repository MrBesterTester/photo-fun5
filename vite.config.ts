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
          new Date()
            .toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles', hour12: false })
            .replace(' ', '_')
            .slice(0, 16)
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
