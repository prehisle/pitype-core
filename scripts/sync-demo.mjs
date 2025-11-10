#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, rmSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);
const distDir = join(rootDir, 'packages', 'pitype-core', 'dist');
const vendorDir = join(rootDir, 'examples', 'typerank3', 'vendor');

if (!existsSync(distDir)) {
  throw new Error('pitype-core dist 目录不存在，请先运行 npm run build:core');
}

mkdirSync(vendorDir, { recursive: true });

function emptyDir(dir) {
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

emptyDir(vendorDir);
copyRecursive(distDir, vendorDir);
console.log(`Synced ${distDir} -> ${vendorDir}`);
