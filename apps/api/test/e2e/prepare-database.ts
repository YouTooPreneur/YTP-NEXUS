// TASK-0049 · Makes the end-to-end tests' database and keeps it theirs for the whole run (TECH-DESIGN section 12 point 56): a fresh nexus_test with the accounts and every database change, made exactly as the database tests make it (their set-up, under their run lock), then Test Company A and B and one test person who signs in with a password; then it holds that run lock until the end-to-end run ends, so no other copy's database or end-to-end tests drop or change nexus_test meanwhile. Started by tests/e2e/e2e-database.ts before every end-to-end run, with the person's made-up values in E2E_PERSON_EMAIL, E2E_PERSON_NAME and E2E_PERSON_PASSWORD. Written by the planner; builders never edit this file.
// It reads infra/.env.test (settings already in the environment win) and refuses every database but nexus_test.
import '../db/test-settings.js';
import makeFreshTestDatabase from '../db/global-setup.js';
import { clientFor, makeTestCompanies } from '../db/helpers.js';
import { closePools } from '../../src/db/database.js';
import { createSigninUser } from '../../src/modules/core/signin/users.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const person = {
  email: required('E2E_PERSON_EMAIL'),
  name: required('E2E_PERSON_NAME'),
  password: required('E2E_PERSON_PASSWORD'),
};

// The database tests' own set-up takes their run lock (pg_advisory_lock, the same key in every copy, on a connection of
// its own), waiting while another copy's database or end-to-end tests hold it, and only then drops and makes nexus_test.
// It keeps the lock until finish() runs.
const finish = await makeFreshTestDatabase();
try {
  const owner = clientFor('DATABASE_URL_OWNER');
  await owner.connect();
  try {
    const { a } = await makeTestCompanies(owner);
    await createSigninUser({ companyId: a, ...person });
  } finally {
    await owner.end();
  }
  await closePools();
} catch (error) {
  await finish();
  throw error;
}
console.log('end-to-end database ready: nexus_test with the test person, held for this run');

// Started by the end-to-end run's set-up, this process tells it the database is ready and keeps the run lock until the
// run's teardown closes the channel between them (the channel also closes if the run stops), then gives the lock back.
// Run by hand, with no such channel, it gives the lock back at once.
await new Promise<void>((resolve) => {
  if (!process.send || !process.connected) {
    resolve();
    return;
  }
  process.once('disconnect', () => resolve());
  process.send('ready');
});
await finish();
