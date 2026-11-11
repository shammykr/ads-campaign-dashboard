import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = { '/api': `http://localhost:${process.env.API_PORT ?? 4000}` };

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5173, proxy: api },
  preview: { port: 4173, proxy: api },
  resolve: {
    // `--mode profile` swaps in React's profiling build so <Profiler> onRender
    // callbacks fire in an otherwise production-optimized bundle.
    alias:
      mode === 'profile'
        ? [
            { find: /^react-dom$/, replacement: 'react-dom/profiling' },
            { find: /^react-dom\/client$/, replacement: 'react-dom/profiling' },
            { find: /^scheduler\/tracing$/, replacement: 'scheduler/tracing-profiling' },
          ]
        : [],
  },
  build: {
    outDir: mode === 'profile' ? 'dist-profile' : 'dist',
    // Recharts alone is ~540 kB minified (155 kB gzip); it lives in its own chunk.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'styled-components', 'react-window'],
        },
      },
    },
  },
}));
