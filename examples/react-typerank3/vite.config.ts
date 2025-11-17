import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 4203,
    host: '0.0.0.0',
    open: true,
    watch: {
      ignored: ['!**/node_modules/pitype-core/**']
    }
  },
  optimizeDeps: {
    exclude: ['pitype-core']
  },
  resolve: {
    alias: [
      {
        find: /^pitype-core\/styles\/(.*)$/,
        replacement: resolve(__dirname, '../../packages/pitype-core/styles/$1')
      },
      {
        find: 'pitype-core/styles',
        replacement: resolve(__dirname, '../../packages/pitype-core/styles')
      },
      {
        find: 'pitype-core',
        replacement: resolve(__dirname, '../../packages/pitype-core/dist/index.js')
      }
    ]
  }
});
