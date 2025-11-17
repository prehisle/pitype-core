import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4201,
    host: '0.0.0.0',
    open: true
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
