import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: [['list']],
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:5310',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'computer',
      use: {
        browserName: 'chromium',
        viewport: { width: 1600, height: 1000 },
      },
    },
    {
      name: 'phone',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @ytp/api exec tsx src/main.ts',
      url: 'http://localhost:3000/api/health',
      stdout: 'pipe',
      env: { LOG_LEVEL: 'warn' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @ytp/web dev',
      url: 'http://localhost:5310',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
