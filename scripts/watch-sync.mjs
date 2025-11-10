#!/usr/bin/env node
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { syncDemo } from './sync-demo.mjs';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);
const distDir = join(rootDir, 'packages', 'pitype-core', 'dist');

let debounceTimer = null;
let hasLoggedReady = false;

function log(message) {
  console.log(`[watch-sync] ${message}`);
}

function scheduleSync(reason) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    try {
      const synced = syncDemo({ skipDistCheck: true, verbose: false });
      if (synced) {
        log(`完成同步 (${reason})`);
        hasLoggedReady = true;
      } else if (!hasLoggedReady) {
        log('等待 pitype-core 完成首次构建...');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      console.error(`[watch-sync] 同步失败: ${message}`);
    }
  }, 100);
}

if (existsSync(distDir)) {
  scheduleSync('初始化');
} else {
  log('等待 pitype-core 完成首次构建...');
}

const watcher = chokidar.watch(distDir, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 50
  }
});

watcher
  .on('add', (path) => scheduleSync(`新增 ${path}`))
  .on('change', (path) => scheduleSync(`修改 ${path}`))
  .on('unlink', (path) => scheduleSync(`删除 ${path}`));

process.on('SIGINT', () => {
  watcher.close().then(() => process.exit(0));
});
