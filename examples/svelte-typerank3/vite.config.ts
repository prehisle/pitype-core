import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
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
    port: 5175,
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
        find: 'pitype-core/styles/pitype-core.css',
        replacement: resolve(__dirname, '../../packages/pitype-core/styles/pitype-core.css')
      },
      {
        find: 'pitype-core',
        replacement: resolve(__dirname, '../../packages/pitype-core/dist/index.js')
      }
    ]
  }
});
