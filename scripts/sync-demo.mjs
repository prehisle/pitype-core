#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, rmSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);
const distDir = join(rootDir, 'packages', 'pitype-core', 'dist');
const vendorDir = join(rootDir, 'examples', 'typerank3', 'vendor');

function emptyDir(dir) {
  if (!existsSync(dir)) {
    return;
  }
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function syncDemo({ skipDistCheck = false, verbose = true } = {}) {
  if (!existsSync(distDir)) {
    if (skipDistCheck) {
      if (verbose) {
        console.warn('[sync-demo] dist 目录不存在，等待构建完成...');
      }
      return false;
    }
    throw new Error('pitype-core dist 目录不存在，请先运行 npm run build:core');
  }

  mkdirSync(vendorDir, { recursive: true });
  emptyDir(vendorDir);
  copyRecursive(distDir, vendorDir);
  if (verbose) {
    console.log(`Synced ${distDir} -> ${vendorDir}`);
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const synced = syncDemo();
    if (!synced) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
