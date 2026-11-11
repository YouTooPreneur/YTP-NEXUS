import { configDefaults, defineConfig } from 'vitest/config';

// Two groups of tests (TEST-PLAN section 4). "unit" needs nothing running. "db" needs the development
// database (pnpm services:up): its set-up makes a fresh nexus_test for every run, and its files run one
// at a time because they share that database.
export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['test/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'test/db/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'db',
          include: ['test/db/**/*.test.ts'],
          globalSetup: ['test/db/global-setup.ts'],
          setupFiles: ['test/db/test-settings.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
