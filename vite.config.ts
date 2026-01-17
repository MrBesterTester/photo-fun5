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
        // Expose GEMINI_API_KEY to client code via import.meta.env
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Expose TrueFoundry configuration
        'import.meta.env.VITE_TRUEFOUNDRY_BASE_URL': JSON.stringify(env.TRUEFOUNDRY_BASE_URL),
        'import.meta.env.VITE_TRUEFOUNDRY_API_KEY': JSON.stringify(env.TRUEFOUNDRY_API_KEY),
        'import.meta.env.VITE_TRUEFOUNDRY_MODEL': JSON.stringify(env.TRUEFOUNDRY_MODEL),
        // Also support process.env for backward compatibility
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.TRUEFOUNDRY_BASE_URL': JSON.stringify(env.TRUEFOUNDRY_BASE_URL),
        'process.env.TRUEFOUNDRY_API_KEY': JSON.stringify(env.TRUEFOUNDRY_API_KEY),
        'process.env.TRUEFOUNDRY_MODEL': JSON.stringify(env.TRUEFOUNDRY_MODEL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
