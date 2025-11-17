#!/usr/bin/env node

import readline from 'node:readline';
import { spawn } from 'node:child_process';

const tasks = [
  {
    key: 'lint',
    label: 'Lint (ESLint)',
    command: 'npm run lint'
  },
  {
    key: 'format',
    label: 'Format Check (Prettier)',
    command: 'npm run format:check'
  },
  {
    key: 'type',
    label: 'Type Check (core + demos)',
    command:
      'npm run type-check && cd examples/ts-typerank3 && npx tsc --noEmit && cd ../react-typerank3 && npx tsc --noEmit && cd ../vue3-typerank3 && npx vue-tsc --noEmit && cd ../next-typerank3 && npx tsc --noEmit && cd ../svelte-typerank3 && npx svelte-check --tsconfig ./tsconfig.json'
  },
  {
    key: 'unit',
    label: 'Unit Tests (Vitest + Coverage)',
    command: 'npm run test:unit -- --coverage'
  },
  {
    key: 'bench',
    label: 'TypingSession benchmark',
    command: 'npm run bench:typing-session'
  },
  {
    key: 'e2e',
    label: 'Baseline E2E (Playwright)',
    command: 'npm run test:baseline'
  },
  {
    key: 'build',
    label: 'Build core package',
    command: 'npm run build:core'
  },
  {
    key: 'sync',
    label: 'Sync demo assets',
    command: 'npm run sync:demo'
  },
  {
    key: 'watch-core',
    label: 'Core watch (tsc --watch)',
    command: 'npm run watch:core'
  },
  {
    key: 'vue-dev',
    label: 'Vue3 demo dev server',
    command: 'npm run vue3-demo:dev'
  },
  {
    key: 'ts-dev',
    label: 'TS demo dev server',
    command: 'npm run ts-demo:dev'
  },
  {
    key: 'react-dev',
    label: 'React demo dev server',
    command: 'npm run react-demo:dev'
  },
  {
    key: 'next-dev',
    label: 'Next demo dev server',
    command: 'npm run next-demo:dev'
  },
  {
    key: 'svelte-dev',
    label: 'Svelte demo dev server',
    command: 'npm run svelte-demo:dev'
  },
  {
    key: 'baseline-dev',
    label: 'Baseline demo dev server',
    command: 'npm run baseline:dev'
  }
];

const input = process.argv[2];

if (input) {
  const task = findTask(input);
  if (!task) {
    console.error(`未知命令: ${input}`);
    process.exit(1);
  }
  runTask(task);
} else {
  showMenu();
}

function findTask(value) {
  const lowered = value.toLowerCase();
  return tasks.find((task, index) => task.key === lowered || String(index + 1) === lowered);
}

function showMenu() {
  console.log('请选择要执行的任务：\n');
  tasks.forEach((task, index) => {
    console.log(`${index + 1}. [${task.key}] ${task.label}`);
  });
  console.log('q. 退出\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('输入编号或关键字: ', (answer) => {
    rl.close();
    if (answer.trim().toLowerCase() === 'q') {
      console.log('已取消。');
      process.exit(0);
    }
    const task = findTask(answer.trim());
    if (!task) {
      console.error('无法识别的选项。');
      process.exit(1);
    }
    runTask(task);
  });
}

function runTask(task) {
  console.log(`\n>>> 执行：${task.label} (${task.command})\n`);
  const child = spawn(task.command, {
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
