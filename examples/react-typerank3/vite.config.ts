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
    port: 5174,
    open: true,
    watch: {
      ignored: ['!**/node_modules/pitype-core/**']
    }
  },
  optimizeDeps: {
    exclude: ['pitype-core']
  },
  resolve: {
    alias: {
      'pitype-core': resolve(__dirname, '../../packages/pitype-core/dist/index.js')
    }
  }
});
