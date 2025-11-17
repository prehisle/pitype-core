import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
    port: 3000,
    open: true,
    watch: {
      // 监听 pitype-core 源码变化
      ignored: ['!**/node_modules/pitype-core/**']
    }
  },
  optimizeDeps: {
    // 排除 pitype-core 的预构建，让 Vite 直接使用源码
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
        // 直接指向 pitype-core 的构建输出
        find: 'pitype-core',
        replacement: resolve(__dirname, '../../packages/pitype-core/dist/index.js')
      }
    ]
  }
});
