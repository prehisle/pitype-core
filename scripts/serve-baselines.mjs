#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';

const SERVERS = [
  {
    name: 'baseline',
    command: 'npm',
    args: ['run', 'baseline:serve']
  },
  {
    name: 'svelte',
    command: 'npm',
    args: [
      'run',
      '--workspace',
      'svelte-typerank3',
      'dev',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      '5175'
    ]
  }
];

const PORTS = [
  { url: 'http://127.0.0.1:4173', name: 'baseline' },
  { url: 'http://127.0.0.1:5175', name: 'svelte' }
];

const children = SERVERS.map((server) => {
  const child = spawn(server.command, server.args, {
    stdio: 'inherit',
    shell: false
  });
  return { child, name: server.name };
});

async function waitForPort({ url, name }) {
  const maxAttempts = 150;
  const delayMs = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const reachable = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode ? res.statusCode >= 200 && res.statusCode < 500 : true);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (reachable) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`等待 ${name} 服务器 (${url}) 启动超时`);
}

async function waitForServers() {
  await Promise.all(PORTS.map((entry) => waitForPort(entry)));
  console.log('[serve-baselines] Svelte 与原生示例均已就绪');
}

function shutdown(code = 0) {
  children.forEach(({ child }) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  try {
    await waitForServers();
  } catch (error) {
    console.error(error);
    shutdown(1);
    return;
  }

  await new Promise((resolve, reject) => {
    let settled = false;
    children.forEach(({ child, name }) => {
      child.on('exit', (code, signal) => {
        if (settled) return;
        settled = true;
        if (code && code !== 0) {
          reject(new Error(`[serve-baselines] ${name} server exited with code ${code}`));
        } else if (signal && signal !== 'SIGTERM') {
          reject(new Error(`[serve-baselines] ${name} server terminated with signal ${signal}`));
        } else {
          resolve(undefined);
        }
      });
    });
  });

  shutdown(0);
}

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
