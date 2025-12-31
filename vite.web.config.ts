import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/renderer'),
  base: '/', // Absolute base for SPA routing
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  define: {
    'process.env.IS_WEB': JSON.stringify(true),
    'process.env.NEXT_PUBLIC_WEB_URL': JSON.stringify(process.env.NEXT_PUBLIC_WEB_URL || 'https://ibex-web.vercel.app'),
  },
  server: {
    port: 5174, // Different port from Electron dev server
    open: true,
  },
});
