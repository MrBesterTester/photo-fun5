import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Proxy TrueFoundry in dev to avoid CORS (Failed to fetch / Failed to load)
        proxy: {
          '/tfy': {
            target: (env.TRUEFOUNDRY_BASE_URL || 'https://api.truefoundry.com').replace(/\/$/, ''),
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tfy/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        // Expose GEMINI_API_KEY to client code via import.meta.env
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Expose TrueFoundry configuration
        'import.meta.env.VITE_TRUEFOUNDRY_BASE_URL': JSON.stringify(env.TRUEFOUNDRY_BASE_URL),
        'import.meta.env.VITE_TRUEFOUNDRY_API_KEY': JSON.stringify(env.TRUEFOUNDRY_API_KEY),
        'import.meta.env.VITE_TRUEFOUNDRY_MODEL': JSON.stringify(env.TRUEFOUNDRY_MODEL),
        'import.meta.env.VITE_TRUEFOUNDRY_PROJECT_ID': JSON.stringify(env.TRUEFOUNDRY_PROJECT_ID),
        'import.meta.env.VITE_TRUEFOUNDRY_METADATA_PROJECT_ID': JSON.stringify(env.TRUEFOUNDRY_METADATA_PROJECT_ID),
        // Also support process.env for backward compatibility
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.TRUEFOUNDRY_BASE_URL': JSON.stringify(env.TRUEFOUNDRY_BASE_URL),
        'process.env.TRUEFOUNDRY_API_KEY': JSON.stringify(env.TRUEFOUNDRY_API_KEY),
        'process.env.TRUEFOUNDRY_MODEL': JSON.stringify(env.TRUEFOUNDRY_MODEL),
        'process.env.TRUEFOUNDRY_PROJECT_ID': JSON.stringify(env.TRUEFOUNDRY_PROJECT_ID),
        'process.env.TRUEFOUNDRY_METADATA_PROJECT_ID': JSON.stringify(env.TRUEFOUNDRY_METADATA_PROJECT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
