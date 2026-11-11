// TASK-0014 · The database accounts: exactly their rights, put right on every run, passwords never in a statement or an output. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { ensureAccounts } from '../../src/db/accounts.js';
import setup, { checkTestSettings } from './global-setup.js';

// A check that guards a real password reports only true or false with a fixed message, before any check that
// prints text: on failure Vitest prints what it compared (TEST-PLAN section 3).
const apiFolder = fileURLToPath(new URL('../../', import.meta.url));
const URLS = ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP'];
const owner = new URL(process.env.DATABASE_URL_OWNER!);
const admin = new Client({
  host: owner.hostname,
  port: Number(owner.port) || 5432,
  user: 'postgres',
  password: process.env.POSTGRES_SUPERUSER_PASSWORD,
  database: 'postgres',
});
// Each account's password as the account uses it, in the order owner, app, backup.
const passwords = URLS.map((name) => decodeURIComponent(new URL(process.env[name]!).password));
// Every way a password can be written: as typed in the settings (maybe %-encoded) and as used, and the administrator's.
const secrets = [
  ...URLS.flatMap((name) => {
    const raw = new URL(process.env[name]!).password;
    return [raw, decodeURIComponent(raw)];
  }),
  process.env.POSTGRES_SUPERUSER_PASSWORD!,
];
const leaks = (text: string, values: string[] = secrets) => values.some((value) => value !== '' && text.includes(value));

const ACCOUNT_RIGHTS = [
  { rolname: 'nexus_app', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false },
  { rolname: 'nexus_backup', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: true, rolbypassrls: true },
  { rolname: 'nexus_owner', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false },
  { rolname: 'nexus_system', rolcanlogin: false, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: true },
];
const RIGHTS_QUERY = `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
                        FROM pg_roles WHERE rolname LIKE 'nexus\\_%' ORDER BY rolname`;
const MEMBERSHIPS = [
  { role: 'nexus_system', member: 'nexus_owner', inherit_option: false, set_option: true, admin_option: false },
  { role: 'pg_monitor', member: 'nexus_app', inherit_option: true, set_option: true, admin_option: false },
  { role: 'pg_read_all_data', member: 'nexus_backup', inherit_option: true, set_option: true, admin_option: false },
];
const MEMBERSHIPS_QUERY = `SELECT r.rolname AS role, m.rolname AS member, a.inherit_option, a.set_option, a.admin_option
                             FROM pg_auth_members a JOIN pg_roles r ON r.oid = a.roleid JOIN pg_roles m ON m.oid = a.member
                            WHERE r.rolname LIKE 'nexus\\_%' OR m.rolname LIKE 'nexus\\_%' ORDER BY 1, 2`;
const DATABASE_RIGHTS = [
  { rolname: 'nexus_app', connect: true, create: false, temporary: false },
  { rolname: 'nexus_backup', connect: true, create: false, temporary: false },
  { rolname: 'nexus_owner', connect: true, create: true, temporary: false },
  { rolname: 'nexus_system', connect: false, create: false, temporary: false },
];
const DATABASE_RIGHTS_QUERY = `SELECT r.rolname,
                                      has_database_privilege(r.oid, 'nexus_test', 'CONNECT') AS connect,
                                      has_database_privilege(r.oid, 'nexus_test', 'CREATE') AS create,
                                      has_database_privilege(r.oid, 'nexus_test', 'TEMPORARY') AS temporary
                                 FROM pg_roles r WHERE r.rolname LIKE 'nexus\\_%' ORDER BY r.rolname`;
const FOR_EVERYONE_QUERY = `SELECT a.privilege_type FROM pg_database d, aclexplode(d.datacl) a
                             WHERE d.datname = 'nexus_test' AND a.grantee = 0`;

beforeAll(async () => {
  await admin.connect();
  await ensureAccounts();
});

afterAll(async () => {
  await admin.end();
});

async function rows(text: string, values: unknown[] = []): Promise<Record<string, unknown>[]> {
  return (await admin.query(text, values)).rows;
}

async function canSignIn(user: string, password: string): Promise<boolean> {
  const client = new Client({ host: owner.hostname, port: Number(owner.port) || 5432, user, password, database: 'nexus_test' });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

// Runs ensureAccounts and returns the text of every statement it sent to the server.
async function statementsOf(settings?: Record<string, string | undefined>): Promise<string[]> {
  const texts: string[] = [];
  const query = Client.prototype.query;
  Client.prototype.query = function (this: Client, ...args: unknown[]) {
    const first = args[0] as string | { text?: string };
    texts.push(typeof first === 'string' ? first : String(first?.text));
    return (query as (...a: unknown[]) => unknown).apply(this, args);
  } as typeof query;
  try {
    await ensureAccounts(settings);
  } finally {
    Client.prototype.query = query;
  }
  return texts;
}

describe('ensureAccounts', () => {
  it('gives each account exactly its rights (TECH-DESIGN 5.2)', async () => {
    expect(await rows(RIGHTS_QUERY)).toEqual(ACCOUNT_RIGHTS);
    expect(await rows(`SELECT rolpassword IS NULL AS no_password FROM pg_authid WHERE rolname = 'nexus_system'`)).toEqual([
      { no_password: true },
    ]);
  });

  it('gives each account exactly its memberships', async () => {
    expect(await rows(MEMBERSHIPS_QUERY)).toEqual(MEMBERSHIPS);
  });

  it('opens the database only to the accounts, and lets only the owner create in it', async () => {
    expect(await rows(DATABASE_RIGHTS_QUERY)).toEqual(DATABASE_RIGHTS);
    expect(await rows(FOR_EVERYONE_QUERY)).toEqual([]);
    expect(await rows(`SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = 'nexus_test'`)).toEqual([
      { owner: 'postgres' },
    ]);
  });

  it('lets the three accounts sign in with their settings, and nexus_system never', async () => {
    const [ownerPw, appPw, backupPw] = passwords;
    expect(await canSignIn('nexus_owner', ownerPw!)).toBe(true);
    expect(await canSignIn('nexus_app', appPw!)).toBe(true);
    expect(await canSignIn('nexus_backup', backupPw!)).toBe(true);
    expect(await canSignIn('nexus_app', `${appPw}-wrong`)).toBe(false);
    expect(await canSignIn('nexus_system', appPw!)).toBe(false);
  });

  it('can run again, twice at once, even when the database is missing', async () => {
    // Its own scratch database: no test drops nexus_test, which the set-up prepares for the whole run (TEST-PLAN section 4).
    const env = { ...process.env };
    for (const name of URLS) env[name] = env[name]!.replace('/nexus_test', '/nexus_test_accounts');
    const ready = { database: 'nexus_test_accounts', roles: ['nexus_owner', 'nexus_app', 'nexus_system', 'nexus_backup'] };
    await admin.query('DROP DATABASE IF EXISTS nexus_test_accounts WITH (FORCE)');
    try {
      expect(await Promise.all([ensureAccounts(env), ensureAccounts(env)])).toEqual([ready, ready]);
      expect(await ensureAccounts(env)).toEqual(ready);
    } finally {
      await admin.query('DROP DATABASE IF EXISTS nexus_test_accounts WITH (FORCE)');
    }
  });

  it('puts right everything that was changed by hand', async () => {
    // Every attribute of every account the other way round, wrong memberships and options, settings and rights.
    for (const statement of [
      'ALTER ROLE nexus_owner WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS NOLOGIN NOINHERIT CONNECTION LIMIT 0',
      "ALTER ROLE nexus_app WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS NOLOGIN VALID UNTIL '2000-01-01' PASSWORD 'changed-by-hand'",
      `ALTER ROLE nexus_system WITH SUPERUSER CREATEDB CREATEROLE REPLICATION NOBYPASSRLS LOGIN PASSWORD '${randomUUID()}'`,
      'ALTER ROLE nexus_backup WITH SUPERUSER CREATEDB CREATEROLE NOREPLICATION NOBYPASSRLS NOLOGIN',
      'REVOKE nexus_system FROM nexus_owner',
      'REVOKE pg_read_all_data FROM nexus_backup',
      'GRANT pg_read_all_data TO nexus_backup WITH ADMIN TRUE, INHERIT FALSE',
      'GRANT pg_monitor TO nexus_app WITH ADMIN TRUE, INHERIT FALSE',
      'GRANT nexus_system TO nexus_app',
      'GRANT pg_write_all_data TO nexus_app',
      'ALTER ROLE nexus_app SET row_security = off',
      "ALTER ROLE nexus_owner IN DATABASE nexus_test SET work_mem = '1MB'",
      'GRANT TEMPORARY ON DATABASE nexus_test TO PUBLIC',
      'GRANT CREATE, TEMPORARY ON DATABASE nexus_test TO nexus_app',
    ]) {
      await admin.query(statement);
    }
    await ensureAccounts();
    expect(await rows(RIGHTS_QUERY)).toEqual(ACCOUNT_RIGHTS);
    expect(await rows(`SELECT rolpassword IS NULL AS no_password FROM pg_authid WHERE rolname = 'nexus_system'`)).toEqual([
      { no_password: true },
    ]);
    expect(await rows(MEMBERSHIPS_QUERY)).toEqual(MEMBERSHIPS);
    expect(
      await rows(`SELECT rolname FROM pg_roles WHERE rolname LIKE 'nexus\\_%'
                    AND (NOT rolinherit OR rolconnlimit <> -1 OR rolvaliduntil < now())`),
    ).toEqual([]);
    expect(await rows(`SELECT 1 FROM pg_db_role_setting WHERE setrole::regrole::text LIKE 'nexus\\_%'`)).toEqual([]);
    expect(await rows(DATABASE_RIGHTS_QUERY)).toEqual(DATABASE_RIGHTS);
    expect(await rows(FOR_EVERYONE_QUERY)).toEqual([]);
    expect(await canSignIn('nexus_owner', passwords[0]!)).toBe(true);
    expect(await canSignIn('nexus_app', passwords[1]!)).toBe(true);
    expect(await canSignIn('nexus_backup', passwords[2]!)).toBe(true);
  });

  it('never puts a password in the text of a statement, nor a value in the server log', async () => {
    const texts = await statementsOf();
    expect(texts.length).toBeGreaterThan(10);
    expect(texts.filter((text) => leaks(text)).length, 'statements that hold a password').toBe(0);
    expect(texts[0]).toBe('SET log_parameter_max_length = 0');
  });

  it('reads %-encoded passwords, each for its own account, never in a statement', async () => {
    const planted = [
      { name: 'DATABASE_URL_OWNER', role: 'nexus_owner', password: "o%20w'n-1" },
      { name: 'DATABASE_URL_APP', role: 'nexus_app', password: "a%20p'p-2" },
      { name: 'DATABASE_URL_BACKUP', role: 'nexus_backup', password: "b%20a'k-3" },
    ];
    const settings = { ...process.env };
    for (const { name, password } of planted) {
      const url = new URL(settings[name]!);
      url.password = password;
      settings[name] = url.href;
    }
    // The accounts belong to the whole server, so the real passwords always come back at the end.
    try {
      const texts = await statementsOf(settings);
      const all = planted.flatMap(({ password }) => [password, decodeURIComponent(password)]);
      expect(texts.filter((text) => leaks(text, all)).length, 'statements that hold a password').toBe(0);
      for (const { role, password } of planted) {
        expect(await canSignIn(role, decodeURIComponent(password))).toBe(true);
        expect(await canSignIn(role, password)).toBe(false);
      }
      expect(await canSignIn('nexus_app', decodeURIComponent(planted[0]!.password))).toBe(false);
      expect(await canSignIn('nexus_backup', decodeURIComponent(planted[1]!.password))).toBe(false);
    } finally {
      await ensureAccounts();
    }
  });

  it('refuses settings that are not one database of one server, before it touches the server', async () => {
    const env = { ...process.env };
    const refusal = async (name: string, value: string): Promise<string> => {
      const message = await ensureAccounts({ ...env, [name]: value }).then(
        () => 'no error',
        (error: unknown) => (error instanceof Error ? error.message : 'not an Error'),
      );
      expect(leaks(message), 'the refusal holds a password').toBe(false);
      return message;
    };
    const changed = (name: string, change: (url: URL) => void): string => {
      const url = new URL(env[name]!);
      change(url);
      return url.href;
    };
    const same = 'must use the same server and database as DATABASE_URL_OWNER';
    expect(await refusal('DATABASE_URL_APP', changed('DATABASE_URL_APP', (u) => (u.pathname = '/nexus_dev')))).toBe(`DATABASE_URL_APP ${same}`);
    expect(await refusal('DATABASE_URL_APP', changed('DATABASE_URL_APP', (u) => (u.hostname = 'db.invalid')))).toBe(`DATABASE_URL_APP ${same}`);
    expect(await refusal('DATABASE_URL_APP', changed('DATABASE_URL_APP', (u) => (u.port = '1')))).toBe(`DATABASE_URL_APP ${same}`);
    expect(await refusal('DATABASE_URL_BACKUP', changed('DATABASE_URL_BACKUP', (u) => (u.username = 'nexus_app')))).toBe(
      'DATABASE_URL_BACKUP must sign in as nexus_backup',
    );
    expect(await refusal('DATABASE_URL_BACKUP', changed('DATABASE_URL_BACKUP', (u) => (u.password = '')))).toBe(
      'DATABASE_URL_BACKUP has no password',
    );
    expect(await refusal('DATABASE_URL_OWNER', changed('DATABASE_URL_OWNER', (u) => (u.pathname = '/nexus-test')))).toBe(
      'DATABASE_URL_OWNER must name a database in small letters, digits and _',
    );
    expect(await refusal('DATABASE_URL_OWNER', 'not a database address')).toBe('DATABASE_URL_OWNER is not a database address');
    expect(await refusal('DATABASE_URL_APP', '')).toBe('DATABASE_URL_APP is not set');
    expect(await refusal('POSTGRES_SUPERUSER_PASSWORD', '')).toBe('POSTGRES_SUPERUSER_PASSWORD is not set');
  });
});

describe('pnpm --filter @ytp/api db:accounts', () => {
  function run(env: Record<string, string | undefined>) {
    return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/db-accounts.ts'], { cwd: apiFolder, env, encoding: 'utf8' });
  }

  it('says which accounts are ready, and never prints a password', () => {
    const out = run({ ...process.env });
    expect(leaks(out.stdout + out.stderr), 'the output holds a password').toBe(false);
    expect(out.status, out.stderr).toBe(0);
    expect(out.stdout.trim()).toBe('database accounts ready on nexus_test: nexus_owner, nexus_app, nexus_system, nexus_backup');
  });

  it('fails with a plain message and exit code 1 on a wrong administrator password, still without a password', () => {
    const out = run({ ...process.env, POSTGRES_SUPERUSER_PASSWORD: 'SECRET-WRONG-ADMIN-PW' });
    expect(leaks(out.stdout + out.stderr, [...secrets, 'SECRET-WRONG-ADMIN-PW']), 'the output holds a password').toBe(false);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('db:accounts failed: password authentication failed for user "postgres"');
  });

  it('says the database is not running when nothing answers, still without a password', () => {
    const env: Record<string, string | undefined> = { ...process.env };
    for (const name of URLS) {
      const url = new URL(env[name]!);
      url.port = '1';
      env[name] = url.href;
    }
    const out = run(env);
    expect(leaks(out.stdout + out.stderr), 'the output holds a password').toBe(false);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('db:accounts failed: the database is not running: run pnpm services:up');
  });
});

describe('the database tests set-up', () => {
  it('refuses any database but nexus_test before it touches anything, and never loads the settings into its process', async () => {
    for (const name of URLS) {
      const env = { ...process.env, [name]: process.env[name]!.replace('/nexus_test', '/nexus_dev') };
      expect(() => checkTestSettings(env)).toThrow(`${name} must name the database nexus_test`);
    }
    const saved = process.env.DATABASE_URL_OWNER;
    process.env.DATABASE_URL_OWNER = saved!.replace('/nexus_test', '/nexus_dev');
    const printed = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loaded = vi.spyOn(process, 'loadEnvFile');
    try {
      await expect(setup()).rejects.toThrow('DATABASE_URL_OWNER must name the database nexus_test');
      expect(printed).toHaveBeenCalledWith(
        '\nThe database tests could not start: DATABASE_URL_OWNER must name the database nexus_test: the database tests delete it on every run\n',
      );
      expect(loaded).not.toHaveBeenCalled();
    } finally {
      printed.mockRestore();
      loaded.mockRestore();
      process.env.DATABASE_URL_OWNER = saved;
    }
  });
});
