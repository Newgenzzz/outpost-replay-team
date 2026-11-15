import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 100% static build: no proxies, no server-side code.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Pages is served under the repository name; the default build stays portable.
  base: mode === 'github-pages' ? '/outpost-replay-team/' : './',
  build: {
    // Recharts alone is ~560 kB minified (~160 kB gzip); that is expected for a static bundle.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          phaser: ['phaser'],
          three: ['three'],
        },
      },
    },
  },
}));
