// TASK-0092 · The database tests' set-up names a failed database change by its file, the database's own reason and the statement where it failed. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { sql } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ensureAccounts } from '../../src/db/accounts.js';
import { applyChanges, changeFailure } from './global-setup.js';

// Its own scratch database, where Core's first change cannot run: no test drops nexus_test (TEST-PLAN section 4).
const SCRATCH = 'nexus_test_setup_errors';
const env: Record<string, string | undefined> = { ...process.env };
for (const name of ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP']) {
  env[name] = env[name]!.replace('/nexus_test', `/${SCRATCH}`);
}
const owner = new URL(env.DATABASE_URL_OWNER!);
const server = { host: owner.hostname, port: Number(owner.port) || 5432, user: 'postgres', password: env.POSTGRES_SUPERUSER_PASSWORD };
const admin = new Client({ ...server, database: 'postgres' });
const STATEMENT = '-- why this statement exists\n\n  SELECT 1 / 0;';
let folder = '';

// A real failed statement, as drizzle reports it.
async function failedStatement(): Promise<DrizzleQueryError> {
  const failed: unknown = await drizzle(admin)
    .execute(sql.raw(`${STATEMENT}\n`))
    .then(() => 'no error', (error: unknown) => error);
  expect(failed).toBeInstanceOf(DrizzleQueryError);
  return failed as DrizzleQueryError;
}

beforeAll(async () => {
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await ensureAccounts(env);
  // A schema in the way: Core's first change starts with CREATE SCHEMA "audit".
  const inScratch = new Client({ ...server, database: SCRATCH });
  await inScratch.connect();
  await inScratch.query('CREATE SCHEMA audit');
  await inScratch.end();
  folder = mkdtempSync(join(tmpdir(), 'nexus-setup-errors-'));
});

afterAll(async () => {
  rmSync(folder, { recursive: true, force: true });
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await admin.end();
});

describe('the set-up applies every database change', () => {
  it('names a failed change by its file, the database’s own reason and its statement’s first line of SQL, never by its whole text', async () => {
    const message = await applyChanges(env).then(
      () => 'no error',
      (error: unknown) => (error as Error).message,
    );
    expect(message).toBe(
      'a database change failed in 0000_core_audit_schemas.sql: schema "audit" already exists; its statement starts with: CREATE SCHEMA "audit";',
    );
  });

  it('finds the file that holds the statement and skips the comment lines when it names the statement', async () => {
    writeFileSync(join(folder, '0001_first.sql'), 'SELECT 1;\n--> statement-breakpoint\nSELECT 2;\n');
    writeFileSync(join(folder, '0002_second.sql'), `GRANT nothing;\n--> statement-breakpoint\n${STATEMENT}\n`);
    expect(changeFailure(await failedStatement(), folder).message).toBe(
      'a database change failed in 0002_second.sql: division by zero; its statement starts with: SELECT 1 / 0;',
    );
  });

  it('says so when the statement is in no change file (drizzle’s own statements)', async () => {
    expect(changeFailure(await failedStatement()).message).toBe(
      'a database change failed in no change file: division by zero; its statement starts with: SELECT 1 / 0;',
    );
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
