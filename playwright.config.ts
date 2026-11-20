import { defineConfig } from '@playwright/test';
import { endToEndSettings } from './tests/e2e/e2e-database.js';

export default defineConfig({
  testDir: 'tests/e2e',
  // Before the tests: a fresh nexus_test with the test person, kept for this run under the database tests' run lock
  // (TECH-DESIGN section 12 point 56, TASK-0049). Playwright starts the webServers below before this set-up, so the
  // end-to-end API must never connect to the database as it starts.
  globalSetup: './tests/e2e/e2e-database.ts',
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
      // The end-to-end API uses nexus_test with the settings of infra/.env.test, here and on GitHub; they win over
      // infra/.env (TECH-DESIGN section 12 point 56).
      env: { ...endToEndSettings(), LOG_LEVEL: 'warn' },
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
