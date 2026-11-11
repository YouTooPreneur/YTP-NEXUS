// TASK-0091 · The database changes: applied once and in order as nexus_owner, Core's schemas and their rights, no drift, failed queries logged without values. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { ensureAccounts } from '../../src/db/accounts.js';
import { CHANGES_FOLDER, runMigrations } from '../../src/db/migrate.js';
import { createLogger } from '../../src/shared/logging.js';

// Its own scratch database: no test drops nexus_test, which the set-up prepares for the whole run (TEST-PLAN section 4).
const SCRATCH = 'nexus_test_migrate';
const apiFolder = fileURLToPath(new URL('../../', import.meta.url));
const URLS = ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP'];
const env: Record<string, string | undefined> = { ...process.env };
for (const name of URLS) env[name] = env[name]!.replace('/nexus_test', `/${SCRATCH}`);
const owner = new URL(env.DATABASE_URL_OWNER!);
const server = { host: owner.hostname, port: Number(owner.port) || 5432 };
const admin = new Client({ ...server, user: 'postgres', password: env.POSTGRES_SUPERUSER_PASSWORD, database: 'postgres' });
const inScratch = new Client({ ...server, user: 'postgres', password: env.POSTGRES_SUPERUSER_PASSWORD, database: SCRATCH });
const secrets = [
  ...URLS.flatMap((name) => {
    const raw = new URL(env[name]!).password;
    return [raw, decodeURIComponent(raw)];
  }),
  env.POSTGRES_SUPERUSER_PASSWORD!,
];
const leaks = (text: string) => secrets.some((value) => value !== '' && text.includes(value));
const journal = (): { tag: string; when: number; idx: number }[] =>
  JSON.parse(readFileSync(join(CHANGES_FOLDER, 'meta', '_journal.json'), 'utf8')).entries;

beforeAll(async () => {
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await ensureAccounts(env);
});

afterAll(async () => {
  await inScratch.end().catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH} WITH (FORCE)`);
  await admin.end();
});

async function rows(text: string): Promise<Record<string, unknown>[]> {
  return (await inScratch.query(text)).rows;
}

describe('runMigrations', () => {
  it('applies every change from nothing, once, even when two runs start together', async () => {
    const count = journal().length;
    const both = await Promise.all([runMigrations(env), runMigrations(env)]);
    expect(both.map((r) => r.applied).sort()).toEqual([0, count]);
    expect(both.map((r) => r.total)).toEqual([count, count]);
    expect(await runMigrations(env)).toEqual({ database: SCRATCH, applied: 0, total: count });
    await inScratch.connect();
    expect(await rows('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations')).toEqual([{ n: count }]);
  });

  it('makes core and audit, owned by nexus_owner; nexus_app may use them but never create in them', async () => {
    expect(
      await rows(`SELECT nspname, pg_get_userbyid(nspowner) AS owner,
                         has_schema_privilege('nexus_app', oid, 'USAGE') AS app_usage,
                         has_schema_privilege('nexus_app', oid, 'CREATE') AS app_create
                    FROM pg_namespace WHERE nspname IN ('audit', 'core') ORDER BY nspname`),
    ).toEqual([
      { nspname: 'audit', owner: 'nexus_owner', app_usage: true, app_create: false },
      { nspname: 'core', owner: 'nexus_owner', app_usage: true, app_create: false },
    ]);
    // Everyone else gets nothing on them, and nexus_app may create nowhere and owns nothing.
    expect(
      await rows(`SELECT n.nspname FROM pg_namespace n, aclexplode(n.nspacl) a
                   WHERE n.nspname IN ('audit', 'core') AND a.grantee = 0`),
    ).toEqual([]);
    expect(
      await rows(`SELECT has_schema_privilege('nexus_app', 'public', 'CREATE') AS public_create,
                         has_schema_privilege('nexus_app', 'drizzle', 'USAGE') AS drizzle_usage,
                         has_database_privilege('nexus_app', current_database(), 'CREATE') AS database_create`),
    ).toEqual([{ public_create: false, drizzle_usage: false, database_create: false }]);
    expect(
      await rows(`SELECT (SELECT count(*) FROM pg_namespace WHERE nspowner = 'nexus_app'::regrole)
                       + (SELECT count(*) FROM pg_class WHERE relowner = 'nexus_app'::regrole)
                       + (SELECT count(*) FROM pg_proc WHERE proowner = 'nexus_app'::regrole) AS owned`),
    ).toEqual([{ owned: '0' }]);
  });

  it('never lets everyone run a function that nexus_owner makes', async () => {
    const asOwner = new Client({ ...server, user: 'nexus_owner', password: decodeURIComponent(owner.password), database: SCRATCH });
    await asOwner.connect();
    try {
      await asOwner.query("CREATE FUNCTION core.probe_0091() RETURNS int LANGUAGE sql AS 'SELECT 1'");
      expect(
        await rows(`SELECT has_function_privilege('nexus_app', 'core.probe_0091()', 'EXECUTE') AS app_runs,
                           (SELECT count(*)::int FROM pg_proc p, aclexplode(p.proacl) a
                             WHERE p.oid = 'core.probe_0091()'::regprocedure AND a.grantee = 0) AS for_everyone`),
      ).toEqual([{ app_runs: false, for_everyone: 0 }]);
    } finally {
      await asOwner.query('DROP FUNCTION IF EXISTS core.probe_0091()');
      await asOwner.end();
    }
  });

  it('reads a %-encoded owner password', async () => {
    const encoded = new URL(env.DATABASE_URL_OWNER!);
    encoded.password = "o%20w'n-0091";
    const settings = { ...env, DATABASE_URL_OWNER: encoded.href };
    // The accounts belong to the whole server, so the real password always comes back at the end.
    try {
      await ensureAccounts(settings);
      expect((await runMigrations(settings)).applied).toBe(0);
    } finally {
      await ensureAccounts(env);
    }
  });

  it('refuses settings that are not the owner account, before it touches the server', async () => {
    const refusal = (value: string | undefined) =>
      runMigrations({ ...env, DATABASE_URL_OWNER: value }).then(
        () => 'no error',
        (error: unknown) => (error instanceof Error ? error.message : 'not an Error'),
      );
    const asApp = new URL(env.DATABASE_URL_OWNER!);
    asApp.username = 'nexus_app';
    expect(await refusal(undefined)).toBe('DATABASE_URL_OWNER is not set');
    expect(await refusal('not a database address')).toBe('DATABASE_URL_OWNER is not a database address');
    const message = await refusal(asApp.href);
    expect(leaks(message), 'the refusal holds a password').toBe(false);
    expect(message).toBe('DATABASE_URL_OWNER must sign in as nexus_owner');
  });
});

describe('the database changes in apps/api/drizzle', () => {
  it('start with Core’s two changes, all listed in order in the journal', () => {
    const entries = journal();
    expect(entries.slice(0, 2).map((e) => e.tag)).toEqual(['0000_core_audit_schemas', '0001_core_audit_rights']);
    expect(entries.map((e) => e.idx)).toEqual(entries.map((_, i) => i));
    for (let i = 1; i < entries.length; i++) expect(entries[i]!.when).toBeGreaterThan(entries[i - 1]!.when);
    const files = readdirSync(CHANGES_FOLDER).filter((f) => f.endsWith('.sql'));
    expect(files.sort()).toEqual(entries.map((e) => `${e.tag}.sql`).sort());
  });

  it('match the tables in the schema files: drizzle-kit finds nothing new (no drift)', () => {
    // drizzle-kit runs in a throwaway folder on a copy of the changes, so nothing in the project changes. It
    // puts its working folder in front of `out` even when `out` is a full path, and it can end with exit code 0
    // after an error, so the test reads what it printed and which files are there.
    const folder = mkdtempSync(join(tmpdir(), 'nexus-drift-'));
    try {
      cpSync(CHANGES_FOLDER, join(folder, 'drizzle'), { recursive: true });
      const schema = join(apiFolder, 'src/modules/*/schema/*.ts').replace(/\\/g, '/');
      writeFileSync(
        join(folder, 'drift.config.mjs'),
        `export default ${JSON.stringify({ dialect: 'postgresql', schema, out: './drizzle' })};\n`,
      );
      const before = readdirSync(join(folder, 'drizzle'), { recursive: true }).map(String).sort();
      const kit = join(apiFolder, 'node_modules', 'drizzle-kit', 'bin.cjs');
      const run = spawnSync(process.execPath, [kit, 'generate', '--config', 'drift.config.mjs'], { cwd: folder, encoding: 'utf8' });
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain('No schema changes, nothing to migrate');
      expect(readdirSync(join(folder, 'drizzle'), { recursive: true }).map(String).sort()).toEqual(before);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});

describe('a failed query', () => {
  it('is logged without any of its values, with or without a message (CR-011)', async () => {
    const lines: string[] = [];
    const logger = createLogger(
      new Writable({
        write(chunk, _encoding, done) {
          lines.push(String(chunk));
          done();
        },
      }),
    );
    const asApp = new Client({ ...server, user: 'nexus_app', password: decodeURIComponent(new URL(env.DATABASE_URL_APP!).password), database: SCRATCH });
    await asApp.connect();
    let failure: unknown;
    try {
      await drizzle(asApp).execute(sql`SELECT 1 / (length(${'SECRET-P-0091'}) - 13) AS x`);
    } catch (error) {
      failure = error;
    } finally {
      await asApp.end();
    }
    // A real DrizzleQueryError, whose own message repeats the values, with the driver's error as its cause.
    expect(failure?.constructor?.name).toBe('DrizzleQueryError');
    expect((failure as Error).message.includes('SECRET-P-0091'), 'the error itself carries the value').toBe(true);
    expect(((failure as Error).cause as Error | undefined)?.message).toBe('division by zero');
    logger.error({ err: failure }, 'query failed');
    logger.error({ err: failure });
    expect(lines.length).toBe(2);
    expect(lines.some((line) => line.includes('SECRET')), 'a log line holds a value').toBe(false);
    expect(lines.every((line) => line.includes('division by zero') || line.includes('Failed query'))).toBe(true);
  });
});

describe('pnpm --filter @ytp/api db:migrate', () => {
  function run(settings: Record<string, string | undefined>) {
    return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/db-migrate.ts'], { cwd: apiFolder, env: settings, encoding: 'utf8' });
  }

  it('says how many changes it applied, and never prints a password', () => {
    const out = run({ ...env });
    expect(leaks(out.stdout + out.stderr), 'the output holds a password').toBe(false);
    expect(out.status, out.stderr).toBe(0);
    expect(out.stdout.trim()).toMatch(new RegExp(`^database changes applied on ${SCRATCH}: 0 new, \\d+ in all$`));
  });

  it('says the database is not running when nothing answers, with exit code 1', () => {
    const down = new URL(env.DATABASE_URL_OWNER!);
    down.port = '1';
    const out = run({ ...env, DATABASE_URL_OWNER: down.href });
    expect(leaks(out.stdout + out.stderr), 'the output holds a password').toBe(false);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('db:migrate failed: the database is not running: run pnpm services:up');
  });
});
