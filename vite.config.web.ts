import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: resolve(__dirname, 'src/renderer'),
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.web.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  define: {
    'process.env.IS_WEB': JSON.stringify(true),
    'process.platform': JSON.stringify('web'),
  },
});
