// TASK-0014, TASK-0092 · The database tests' set-up: a fresh nexus_test for every run, with the accounts and every database change (TEST-PLAN section 4). Written by the planner; builders never edit this file.
// It deletes the database it is given, so it refuses every name but nexus_test. All builder copies share one
// database server, so a run holds a lock until it ends and runs from other copies wait their turn.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { Client } from 'pg';
import { ensureAccounts } from '../../src/db/accounts.js';
import { runMigrations } from '../../src/db/migrate.js';

const SETTINGS = ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP'];
const DEV_SETTINGS_FILE = new URL('../../../../infra/.env', import.meta.url);
const TEST_SETTINGS_FILE = new URL('../../../../infra/.env.test', import.meta.url);
const RUN_LOCK = 7_317_014;

function passwordsOf(values: Record<string, string | undefined>): string[] {
  return [
    values.POSTGRES_SUPERUSER_PASSWORD ?? '',
    ...SETTINGS.map((name) => (URL.canParse(values[name] ?? '') ? new URL(values[name]!).password : '')),
  ];
}

export function checkTestSettings(env: Record<string, string | undefined> = process.env): URL {
  for (const name of SETTINGS) {
    const value = env[name] ?? '';
    if (!URL.canParse(value) || new URL(value).pathname !== '/nexus_test') {
      throw new Error(`${name} must name the database nexus_test: the database tests delete it on every run`);
    }
  }
  // The accounts belong to the whole server, so the test settings must not change their passwords.
  if (existsSync(DEV_SETTINGS_FILE)) {
    const dev = parseEnv(readFileSync(DEV_SETTINGS_FILE, 'utf8'));
    if (passwordsOf(dev).join('\n') !== passwordsOf(env).join('\n')) {
      throw new Error('infra/.env.test must use the same passwords as infra/.env (TEST-PLAN section 4)');
    }
  }
  return new URL(env.DATABASE_URL_OWNER!);
}

// Vitest 5.0.5 cannot show an error thrown by this set-up (it fails on its own source map and prints
// "code.charCodeAt is not a function" instead), so the set-up prints the reason itself first.
export default async function setup(): Promise<() => Promise<void>> {
  try {
    return await start();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`\nThe database tests could not start: ${reason}\n`);
    throw error;
  }
}

async function start(): Promise<() => Promise<void>> {
  // Read, never loaded: this set-up runs in Vitest's main process, and every worker (the unit group's too)
  // inherits its environment. Only test-settings.ts loads these settings, into the db group's files.
  let file: Record<string, string | undefined>;
  try {
    file = parseEnv(readFileSync(TEST_SETTINGS_FILE, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    throw new Error('infra/.env.test is missing: make it from infra/.env (TEST-PLAN section 4)');
  }
  const env = { ...file, ...process.env };
  const owner = checkTestSettings(env);
  const admin = new Client({
    host: owner.hostname,
    port: Number(owner.port) || 5432,
    user: 'postgres',
    password: env.POSTGRES_SUPERUSER_PASSWORD,
    database: 'postgres',
  });
  try {
    await admin.connect();
  } catch (error) {
    if ((error as { code?: unknown }).code === 'ECONNREFUSED') {
      throw new Error('the database is not running: run pnpm services:up');
    }
    throw error;
  }
  await admin.query('SELECT pg_advisory_lock($1)', [RUN_LOCK]);
  await admin.query('DROP DATABASE IF EXISTS nexus_test WITH (FORCE)');
  // A fresh nexus_test with the accounts and every database change, once per run (TEST-PLAN section 4), made by
  // the backend's own commands with the merged settings given explicitly (never loaded into this process).
  await ensureAccounts(env);
  await runMigrations(env);
  return async () => {
    await admin.query('SELECT pg_advisory_unlock($1)', [RUN_LOCK]);
    await admin.end();
  };
}
