// TASK-0049 · The end-to-end tests' database (TECH-DESIGN section 12 point 56): the settings of infra/.env.test for the end-to-end API, the test person, and the run's set-up, which makes a fresh nexus_test with that person before the tests and keeps the database tests' run lock for the whole run. Written by the planner; builders never edit this file.
// Every builder copy has infra/.env.test (Claude makes it) and GitHub's check run copies it from infra/.env.test.example,
// so the end-to-end API uses nexus_test with the same settings on this computer and on GitHub, never nexus_dev.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const API = fileURLToPath(new URL('../../apps/api/', import.meta.url));
export const TEST_SETTINGS_FILE = new URL('../../infra/.env.test', import.meta.url);

// The settings of infra/.env.test, read (never loaded into this process). An empty set when the file is missing: the run's
// set-up below then stops the run before any test with the reason.
export function endToEndSettings(): Record<string, string> {
  if (!existsSync(TEST_SETTINGS_FILE)) return {};
  const settings: Record<string, string> = {};
  for (const [name, value] of Object.entries(parseEnv(readFileSync(TEST_SETTINGS_FILE, 'utf8')))) {
    if (value !== undefined) settings[name] = value;
  }
  return settings;
}

// The one person the end-to-end tests sign in as: made-up values for the test database only.
export const TEST_PERSON = {
  email: 'e2e.person@example.com',
  name: 'E2E Person',
  password: 'Made-up-e2e-0049',
} as const;

// Playwright's global set-up. Playwright starts the webServers before it, so the end-to-end API must never connect to the
// database as it starts: this set-up drops and makes nexus_test after the API is up. It starts
// apps/api/test/e2e/prepare-database.ts in a process of its own, which takes the database tests' run lock (waiting while
// another copy's database or end-to-end tests hold it), makes a fresh nexus_test with Test Company A and B and the test
// person, and holds the lock for the whole run; the teardown it returns ends that process, and the lock goes with it.
export default async function makeEndToEndDatabase(): Promise<() => Promise<void>> {
  if (!existsSync(TEST_SETTINGS_FILE)) {
    throw new Error('infra/.env.test is missing: make it from infra/.env (TEST-PLAN section 4)');
  }
  const holder = spawn(process.execPath, ['--import', 'tsx', 'test/e2e/prepare-database.ts'], {
    cwd: API,
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    env: {
      ...process.env,
      E2E_PERSON_EMAIL: TEST_PERSON.email,
      E2E_PERSON_NAME: TEST_PERSON.name,
      E2E_PERSON_PASSWORD: TEST_PERSON.password,
    },
  });
  const ended = new Promise<void>((resolve) => holder.once('exit', () => resolve()));
  await new Promise<void>((resolve, reject) => {
    holder.once('message', () => resolve());
    holder.once('error', reject);
    holder.once('exit', () => {
      reject(new Error('the end-to-end database could not be made (the reason is printed above)'));
    });
  });
  return async () => {
    if (holder.connected) holder.disconnect();
    // It gives the lock back and ends at once; if it ever hangs, it is stopped (its connection, and the lock, go with it).
    const stop = setTimeout(() => holder.kill(), 30_000);
    await ended;
    clearTimeout(stop);
  };
}
