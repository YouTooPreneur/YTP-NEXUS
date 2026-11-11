// TASK-0014 · The database accounts: exactly their rights, safe to run again, passwords never in a statement. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { ensureAccounts } from '../../src/db/accounts.js';
import setup, { checkTestSettings } from './global-setup.js';

const apiFolder = fileURLToPath(new URL('../../', import.meta.url));
const owner = new URL(process.env.DATABASE_URL_OWNER!);
const admin = new Client({
  host: owner.hostname,
  port: Number(owner.port) || 5432,
  user: 'postgres',
  password: process.env.POSTGRES_SUPERUSER_PASSWORD,
  database: 'postgres',
});
const passwords = ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP'].map((name) =>
  decodeURIComponent(new URL(process.env[name]!).password),
);

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

describe('ensureAccounts', () => {
  it('gives each account exactly its rights (TECH-DESIGN 5.2)', async () => {
    expect(
      await rows(
        `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
           FROM pg_roles WHERE rolname LIKE 'nexus\\_%' ORDER BY rolname`,
      ),
    ).toEqual([
      { rolname: 'nexus_app', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false },
      { rolname: 'nexus_backup', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: true, rolbypassrls: true },
      { rolname: 'nexus_owner', rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false },
      { rolname: 'nexus_system', rolcanlogin: false, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: true },
    ]);
  });

  it('gives each account exactly its memberships', async () => {
    expect(
      await rows(
        `SELECT r.rolname AS role, m.rolname AS member, a.inherit_option, a.set_option, a.admin_option
           FROM pg_auth_members a JOIN pg_roles r ON r.oid = a.roleid JOIN pg_roles m ON m.oid = a.member
          WHERE r.rolname LIKE 'nexus\\_%' OR m.rolname LIKE 'nexus\\_%' ORDER BY 1, 2`,
      ),
    ).toEqual([
      { role: 'nexus_system', member: 'nexus_owner', inherit_option: false, set_option: true, admin_option: false },
      { role: 'pg_monitor', member: 'nexus_app', inherit_option: true, set_option: true, admin_option: false },
      { role: 'pg_read_all_data', member: 'nexus_backup', inherit_option: true, set_option: true, admin_option: false },
    ]);
  });

  it('opens the database only to the accounts, and lets only the owner create in it', async () => {
    const rights = await rows(
      `SELECT r.rolname,
              has_database_privilege(r.oid, 'nexus_test', 'CONNECT') AS connect,
              has_database_privilege(r.oid, 'nexus_test', 'CREATE') AS create,
              has_database_privilege(r.oid, 'nexus_test', 'TEMPORARY') AS temporary
         FROM pg_roles r WHERE r.rolname LIKE 'nexus\\_%' ORDER BY r.rolname`,
    );
    expect(rights).toEqual([
      { rolname: 'nexus_app', connect: true, create: false, temporary: false },
      { rolname: 'nexus_backup', connect: true, create: false, temporary: false },
      { rolname: 'nexus_owner', connect: true, create: true, temporary: false },
      { rolname: 'nexus_system', connect: false, create: false, temporary: false },
    ]);
    const forEveryone = await rows(
      `SELECT a.privilege_type FROM pg_database d, aclexplode(d.datacl) a
        WHERE d.datname = 'nexus_test' AND a.grantee = 0`,
    );
    expect(forEveryone).toEqual([]);
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
    await admin.query('DROP DATABASE IF EXISTS nexus_test WITH (FORCE)');
    const results = await Promise.all([ensureAccounts(), ensureAccounts()]);
    expect(results).toEqual([
      { database: 'nexus_test', roles: ['nexus_owner', 'nexus_app', 'nexus_system', 'nexus_backup'] },
      { database: 'nexus_test', roles: ['nexus_owner', 'nexus_app', 'nexus_system', 'nexus_backup'] },
    ]);
    expect(await ensureAccounts()).toEqual(results[0]);
  });

  it('puts right an account that was changed by hand', async () => {
    await admin.query('ALTER ROLE nexus_app WITH CREATEDB BYPASSRLS PASSWORD $$changed-by-hand$$');
    await admin.query('REVOKE nexus_system FROM nexus_owner');
    await admin.query('REVOKE pg_monitor FROM nexus_app');
    await admin.query('REVOKE pg_read_all_data FROM nexus_backup');
    await admin.query('GRANT TEMPORARY ON DATABASE nexus_test TO PUBLIC');
    await ensureAccounts();
    expect(
      await rows(
        `SELECT r.rolname AS role, m.rolname AS member FROM pg_auth_members a
           JOIN pg_roles r ON r.oid = a.roleid JOIN pg_roles m ON m.oid = a.member
          WHERE m.rolname LIKE 'nexus\\_%' ORDER BY 1, 2`,
      ),
    ).toEqual([
      { role: 'nexus_system', member: 'nexus_owner' },
      { role: 'pg_monitor', member: 'nexus_app' },
      { role: 'pg_read_all_data', member: 'nexus_backup' },
    ]);
    expect(await rows(`SELECT rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname = 'nexus_app'`)).toEqual([
      { rolcreatedb: false, rolbypassrls: false },
    ]);
    expect(await canSignIn('nexus_app', passwords[1]!)).toBe(true);
    expect(await rows(`SELECT pg_has_role('nexus_owner', 'nexus_system', 'SET') AS can_set`)).toEqual([{ can_set: true }]);
    expect(
      await rows(`SELECT 1 FROM pg_database d, aclexplode(d.datacl) a WHERE d.datname = 'nexus_test' AND a.grantee = 0`),
    ).toEqual([]);
  });

  it('never puts a password in the text of a statement', async () => {
    const texts: string[] = [];
    const query = Client.prototype.query;
    Client.prototype.query = function (this: Client, ...args: unknown[]) {
      const first = args[0] as string | { text?: string };
      texts.push(typeof first === 'string' ? first : String(first?.text));
      return (query as (...a: unknown[]) => unknown).apply(this, args);
    } as typeof query;
    try {
      await ensureAccounts();
    } finally {
      Client.prototype.query = query;
    }
    expect(texts.length).toBeGreaterThan(10);
    for (const password of [...passwords, process.env.POSTGRES_SUPERUSER_PASSWORD!]) {
      for (const text of texts) expect(text.includes(password), text).toBe(false);
    }
  });

  it('refuses settings that are not one database of one server', async () => {
    const env = { ...process.env };
    const other = (name: string, value: string) => ensureAccounts({ ...env, [name]: value });
    await expect(other('DATABASE_URL_APP', env.DATABASE_URL_APP!.replace('/nexus_test', '/nexus_dev'))).rejects.toThrow(
      'DATABASE_URL_APP must use the same server and database as DATABASE_URL_OWNER',
    );
    await expect(other('DATABASE_URL_BACKUP', env.DATABASE_URL_BACKUP!.replace('nexus_backup:', 'nexus_app:'))).rejects.toThrow(
      'DATABASE_URL_BACKUP must sign in as nexus_backup',
    );
    await expect(other('DATABASE_URL_OWNER', env.DATABASE_URL_OWNER!.replace('/nexus_test', '/nexus-test'))).rejects.toThrow(
      'DATABASE_URL_OWNER must name a database in small letters, digits and _',
    );
    await expect(other('DATABASE_URL_APP', '')).rejects.toThrow('DATABASE_URL_APP is not set');
    await expect(other('POSTGRES_SUPERUSER_PASSWORD', '')).rejects.toThrow('POSTGRES_SUPERUSER_PASSWORD is not set');
  });
});

describe('pnpm --filter @ytp/api db:accounts', () => {
  function run(env: Record<string, string | undefined>) {
    return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/db-accounts.ts'], { cwd: apiFolder, env, encoding: 'utf8' });
  }

  it('says which accounts are ready, and never prints a password', () => {
    const out = run({ ...process.env });
    expect(out.status, out.stderr).toBe(0);
    expect(out.stdout.trim()).toBe('database accounts ready on nexus_test: nexus_owner, nexus_app, nexus_system, nexus_backup');
    for (const password of passwords) expect(out.stdout + out.stderr).not.toContain(password);
  });

  it('fails with a plain message and exit code 1, still without a password', () => {
    const out = run({ ...process.env, POSTGRES_SUPERUSER_PASSWORD: 'SECRET-WRONG-ADMIN-PW' });
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('db:accounts failed: password authentication failed for user "postgres"');
    for (const password of [...passwords, 'SECRET-WRONG-ADMIN-PW']) expect(out.stdout + out.stderr).not.toContain(password);
  });
});

describe('the database tests set-up', () => {
  it('refuses any database but nexus_test, before it touches anything', async () => {
    for (const name of ['DATABASE_URL_OWNER', 'DATABASE_URL_APP', 'DATABASE_URL_BACKUP']) {
      const env = { ...process.env, [name]: process.env[name]!.replace('/nexus_test', '/nexus_dev') };
      expect(() => checkTestSettings(env)).toThrow(`${name} must name the database nexus_test`);
    }
    const saved = process.env.DATABASE_URL_OWNER;
    process.env.DATABASE_URL_OWNER = saved!.replace('/nexus_test', '/nexus_dev');
    const printed = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(setup()).rejects.toThrow('DATABASE_URL_OWNER must name the database nexus_test');
      expect(printed).toHaveBeenCalledWith(
        '\nThe database tests could not start: DATABASE_URL_OWNER must name the database nexus_test: the database tests delete it on every run\n',
      );
    } finally {
      printed.mockRestore();
      process.env.DATABASE_URL_OWNER = saved;
    }
  });
});
