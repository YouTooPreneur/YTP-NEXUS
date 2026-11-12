// TASK-0092 · The database tests' set-up names a failed database change by the database's own reason and the statement where it failed. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { ensureAccounts } from '../../src/db/accounts.js';
import { applyChanges } from './global-setup.js';

// Its own scratch database, where Core's first change cannot run: no test drops nexus_test (TEST-PLAN section 4).
const SCRATCH = 'nexus_test_setup_errors';
const env: Record<string, string | undefined> = { ...process.env };
for (const name of ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP']) {
  env[name] = env[name]!.replace('/nexus_test', `/${SCRATCH}`);
}
const owner = new URL(env.DATABASE_URL_OWNER!);
const server = { host: owner.hostname, port: Number(owner.port) || 5432, user: 'postgres', password: env.POSTGRES_SUPERUSER_PASSWORD };
const admin = new Client({ ...server, database: 'postgres' });

beforeAll(async () => {
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await ensureAccounts(env);
  // A schema in the way: Core's first change starts with CREATE SCHEMA "audit".
  const inScratch = new Client({ ...server, database: SCRATCH });
  await inScratch.connect();
  await inScratch.query('CREATE SCHEMA audit');
  await inScratch.end();
});

afterAll(async () => {
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await admin.end();
});

describe('the set-up applies every database change', () => {
  it('names a failed change by the database’s own reason and its statement’s first line, never by its whole text', async () => {
    const message = await applyChanges(env).then(
      () => 'no error',
      (error: unknown) => (error as Error).message,
    );
    expect(message).toBe('a database change failed: schema "audit" already exists (in the statement starting: CREATE SCHEMA "audit";)');
  });

  it('passes every other problem on as it is', async () => {
    await expect(applyChanges({ ...env, DATABASE_URL_OWNER: env.DATABASE_URL_APP })).rejects.toThrow(
      /^DATABASE_URL_OWNER must sign in as nexus_owner$/,
    );
  });

  it('is how the set-up applies them', () => {
    const setup = readFileSync(new URL('./global-setup.ts', import.meta.url), 'utf8');
    expect(setup).toMatch(/^ {2}await applyChanges\(env\);$/m);
    expect(setup.match(/runMigrations\(/g)).toHaveLength(1);
  });
});
