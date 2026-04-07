import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/projects':        'http://localhost:3001',
      '/review':          'http://localhost:3001',
      '/comment':         'http://localhost:3001',
      '/health':          'http://localhost:3001',
      '/auth':            'http://localhost:3001',
      '/setup-workflow':  'http://localhost:3001',
      '/reviews':         'http://localhost:3001',
    },
  },
});
