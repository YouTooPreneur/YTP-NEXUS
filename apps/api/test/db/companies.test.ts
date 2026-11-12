// TASK-0092 · Time-ordered IDs and the companies table: version-7 keys, exactly the table's columns and rights, read-only for the app. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { companies } from '../../src/modules/core/schema/companies.js';

const owner = new URL(process.env.DATABASE_URL_OWNER!);
const server = { host: owner.hostname, port: Number(owner.port) || 5432, database: 'nexus_test' };
const as = (name: string) =>
  new Client({ ...server, user: new URL(process.env[name]!).username, password: decodeURIComponent(new URL(process.env[name]!).password) });
const admin = new Client({ ...server, user: 'postgres', password: process.env.POSTGRES_SUPERUSER_PASSWORD });
const ownerClient = as('DATABASE_URL_OWNER');
const appClient = as('DATABASE_URL_APP');
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const millisOf = (id: string) => parseInt(id.replace(/-/g, '').slice(0, 12), 16);

beforeAll(async () => {
  await Promise.all([admin.connect(), ownerClient.connect(), appClient.connect()]);
});

afterAll(async () => {
  await ownerClient.query(`DELETE FROM core.companies WHERE slug LIKE 'probe-0092-%'`);
  await Promise.all([admin.end(), ownerClient.end(), appClient.end()]);
});

async function rows(client: Client, text: string): Promise<Record<string, unknown>[]> {
  return (await client.query(text)).rows;
}

describe('core.uuid_v7()', () => {
  it('gives version-7 IDs that start with the time and are all different', async () => {
    const before = Date.now();
    const ids = (await rows(appClient, 'SELECT core.uuid_v7() AS id FROM generate_series(1, 1000)')).map((r) => String(r.id));
    const after = Date.now();
    expect(ids.every((id) => V7.test(id)), 'every ID is version 7 with the standard variant').toBe(true);
    expect(new Set(ids).size).toBe(1000);
    for (const id of ids) {
      expect(millisOf(id)).toBeGreaterThanOrEqual(before - 5_000);
      expect(millisOf(id)).toBeLessThanOrEqual(after + 5_000);
    }
  });

  it('gives a later ID a larger value (time-ordered)', async () => {
    const first = String((await rows(appClient, 'SELECT core.uuid_v7() AS id'))[0]!.id);
    await new Promise((done) => setTimeout(done, 5));
    const second = String((await rows(appClient, 'SELECT core.uuid_v7() AS id'))[0]!.id);
    expect(second > first, 'a later ID sorts after an earlier one').toBe(true);
  });

  it('belongs to nexus_owner, runs with a fixed search path, and only the app (not everyone) may run it', async () => {
    expect(
      await rows(
        admin,
        `SELECT pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS definer, p.proconfig::text AS config,
                has_function_privilege('nexus_app', p.oid, 'EXECUTE') AS app_runs,
                (SELECT count(*)::int FROM aclexplode(p.proacl) a WHERE a.grantee = 0) AS for_everyone
           FROM pg_proc p WHERE p.oid = 'core.uuid_v7()'::regprocedure`,
      ),
    ).toEqual([{ owner: 'nexus_owner', definer: false, config: '{"search_path=pg_catalog, pg_temp"}', app_runs: true, for_everyone: 0 }]);
  });
});

describe('core.companies', () => {
  it('has exactly its columns, key, unique short name and status choices (DATA-MODEL 3.1)', async () => {
    expect(
      await rows(
        admin,
        `SELECT column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns
          WHERE table_schema = 'core' AND table_name = 'companies' ORDER BY ordinal_position`,
      ),
    ).toEqual([
      { column_name: 'id', data_type: 'uuid', udt_name: 'uuid', is_nullable: 'NO', column_default: 'core.uuid_v7()' },
      { column_name: 'name', data_type: 'text', udt_name: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'slug', data_type: 'text', udt_name: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'status', data_type: 'USER-DEFINED', udt_name: 'company_status', is_nullable: 'NO', column_default: "'active'::core.company_status" },
      { column_name: 'created_at', data_type: 'timestamp with time zone', udt_name: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ]);
    expect(
      await rows(
        admin,
        `SELECT c.contype AS kind, array_to_string(array_agg(a.attname ORDER BY a.attname), ',') AS columns
           FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
          WHERE c.conrelid = 'core.companies'::regclass GROUP BY c.conname, c.contype ORDER BY 1, 2`,
      ),
    ).toEqual([
      { kind: 'p', columns: 'id' },
      { kind: 'u', columns: 'slug' },
    ]);
    expect(await rows(admin, `SELECT unnest(enum_range(NULL::core.company_status))::text AS value`)).toEqual([
      { value: 'active' },
      { value: 'paused' },
    ]);
  });

  it('is a system table owned by nexus_owner, with no company row rule', async () => {
    expect(
      await rows(
        admin,
        `SELECT pg_get_userbyid(relowner) AS owner, relrowsecurity AS row_rules, relforcerowsecurity AS forced
           FROM pg_class WHERE oid = 'core.companies'::regclass`,
      ),
    ).toEqual([{ owner: 'nexus_owner', row_rules: false, forced: false }]);
  });

  it('may be read but never changed by the app, and gives nothing to everyone else', async () => {
    expect(
      await rows(
        admin,
        `SELECT p AS right, has_table_privilege('nexus_app', 'core.companies', p) AS app
           FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) p`,
      ),
    ).toEqual([
      { right: 'SELECT', app: true },
      { right: 'INSERT', app: false },
      { right: 'UPDATE', app: false },
      { right: 'DELETE', app: false },
      { right: 'TRUNCATE', app: false },
      { right: 'REFERENCES', app: false },
      { right: 'TRIGGER', app: false },
    ]);
    expect(
      await rows(admin, `SELECT 1 FROM pg_class c, aclexplode(c.relacl) a WHERE c.oid = 'core.companies'::regclass AND a.grantee = 0`),
    ).toEqual([]);
    await expect(appClient.query(`INSERT INTO core.companies (name, slug) VALUES ('Probe', 'probe-0092-app')`)).rejects.toThrow(
      'permission denied for table companies',
    );
    expect(await rows(appClient, 'SELECT count(*)::int AS n FROM core.companies')).toHaveLength(1);
  });

  it('gives a new company a version-7 key, the active status and the time, through the code’s own table', async () => {
    const before = Date.now();
    const [made] = await drizzle(ownerClient).insert(companies).values({ name: 'Probe Company', slug: 'probe-0092-a' }).returning();
    expect(made!.id).toMatch(V7);
    expect(made!.status).toBe('active');
    expect(made!.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);
    expect(millisOf(made!.id)).toBeGreaterThanOrEqual(before - 5_000);
    const [read] = await drizzle(appClient).select().from(companies).where(eq(companies.id, made!.id));
    expect(read).toEqual(made);
    await expect(
      drizzle(ownerClient).insert(companies).values({ name: 'Same Short Name', slug: 'probe-0092-a' }),
    ).rejects.toThrow();
    await expect(ownerClient.query(`INSERT INTO core.companies (name, slug, status) VALUES ('X', 'probe-0092-b', 'closed')`)).rejects.toThrow(
      'invalid input value for enum core.company_status: "closed"',
    );
  });
});
