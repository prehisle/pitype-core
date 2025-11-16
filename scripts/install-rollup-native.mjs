#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const TARGET_PACKAGE = '@rollup/rollup-linux-x64-gnu@^4.53.1';
const shouldSkip = process.env.SKIP_ROLLUP_NATIVE === '1';

if (shouldSkip) {
  process.exit(0);
}

const isLinuxX64 = process.platform === 'linux' && process.arch === 'x64';
if (!isLinuxX64) {
  process.exit(0);
}

const pkgPath = path.join(process.cwd(), 'node_modules', '@rollup', 'rollup-linux-x64-gnu');
if (existsSync(pkgPath)) {
  process.exit(0);
}

console.log('[postinstall] installing rollup native binary:', TARGET_PACKAGE);
const result = spawnSync('npm', ['install', '--no-save', TARGET_PACKAGE], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SKIP_ROLLUP_NATIVE: '1'
  }
});

if (result.status !== 0) {
  console.warn(
    '[postinstall] failed to install rollup native binary, Rollup may fallback to JS build.'
  );
}
