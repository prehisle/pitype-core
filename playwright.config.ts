import { defineConfig, devices } from '@playwright/test';

const BASELINE_SERVER = {
  command: 'node scripts/serve-baselines.mjs',
  port: 4173,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe',
  stderr: 'pipe'
};

export default defineConfig({
  testDir: './tests/baseline',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    video: 'off'
  },
  webServer: BASELINE_SERVER,
  projects: [
    {
      name: 'typerank3-chromium',
      testMatch: /typerank3\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4173'
      }
    },
    {
      name: 'svelte-typerank3-chromium',
      testMatch: /svelte-typerank3\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5175'
      }
    }
  ]
});
