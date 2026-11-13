// TASK-0015 · Company context and row rules: both locks, the row rule's procedure, a reused connection, two companies at once, and every company table in the database. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import { forCompany, withCompany } from '../../src/db/company.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

// A throwaway company table, made by nexus_owner the way a later card's database change makes one.
const probe = pgSchema('core').table('probe_0015', {
  id: uuid('id').primaryKey().default(sql`core.uuid_v7()`),
  companyId: uuid('company_id').notNull(),
  label: text('label').notNull(),
});
const owner = clientFor('DATABASE_URL_OWNER');
const app = clientFor('DATABASE_URL_APP');
const app2 = clientFor('DATABASE_URL_APP');
const backup = clientFor('DATABASE_URL_BACKUP');
const RULE = "(company_id = (NULLIF(current_setting('app.company_id'::text, true), ''::text))::uuid)";
// The system tables of DATA-MODEL section 2 (no company row rule), and the two with company_id that may be empty.
const SYSTEM = ['core.companies', 'core.permission_catalogue', 'core.event_receipts', 'core.rate_counters', 'core.backup_runs'];
const MAY_BE_EMPTY = ['audit.security_log', 'core.error_events'];
let A = '';
let B = '';

const labels = (rows: { label: string }[]) => rows.map((row) => row.label).sort();
const reason = (error: unknown) => String((error as { cause?: Error }).cause?.message ?? (error as Error).message);

beforeAll(async () => {
  await Promise.all([owner.connect(), app.connect(), app2.connect(), backup.connect()]);
  await owner.query('DROP TABLE IF EXISTS core.probe_0015, core.probe_0015_bad');
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
  await owner.query(`CREATE TABLE core.probe_0015 (
    id uuid PRIMARY KEY DEFAULT core.uuid_v7(),
    company_id uuid NOT NULL REFERENCES core.companies (id),
    label text NOT NULL)`);
  await owner.query(`CALL core.add_company_rules('core.probe_0015')`);
  await owner.query('GRANT SELECT, INSERT, UPDATE, DELETE ON core.probe_0015 TO nexus_app');
  await withCompany(drizzle(app), A, (tx) => tx.insert(probe).values([{ companyId: A, label: 'a1' }, { companyId: A, label: 'a2' }]));
  await withCompany(drizzle(app), B, (tx) => tx.insert(probe).values({ companyId: B, label: 'b1' }));
});

afterAll(async () => {
  await owner.query('DROP TABLE IF EXISTS core.probe_0015, core.probe_0015_bad');
  await resetCompanies(owner);
  await Promise.all([owner.end(), app.end(), app2.end(), backup.end()]);
});

describe('the row rule (lock 2)', () => {
  it('shows only the rows of the company set for the transaction, with no filter in the query', async () => {
    expect(labels(await withCompany(drizzle(app), A, (tx) => tx.select().from(probe)))).toEqual(['a1', 'a2']);
    expect(labels(await withCompany(drizzle(app), B, (tx) => tx.select().from(probe)))).toEqual(['b1']);
  });

  it('never writes, moves, changes or removes another company’s row', async () => {
    const db = drizzle(app);
    const failed = await withCompany(db, A, (tx) => tx.insert(probe).values({ companyId: B, label: 'sneaked' })).then(
      () => 'no error',
      reason,
    );
    expect(failed).toContain('new row violates row-level security policy for table "probe_0015"');
    const moved = await withCompany(db, A, (tx) => tx.update(probe).set({ companyId: B }).where(eq(probe.label, 'a1'))).then(
      () => 'no error',
      reason,
    );
    expect(moved).toContain('new row violates row-level security policy for table "probe_0015"');
    expect(await withCompany(db, A, (tx) => tx.update(probe).set({ label: 'changed' }).where(eq(probe.label, 'b1')).returning())).toEqual([]);
    expect(await withCompany(db, A, (tx) => tx.delete(probe).where(eq(probe.label, 'b1')).returning())).toEqual([]);
    expect(labels(await withCompany(db, B, (tx) => tx.select().from(probe)))).toEqual(['b1']);
  });

  it('gives a reused connection with no company set no rows and no error, and a new one too', async () => {
    await withCompany(drizzle(app), A, (tx) => tx.select().from(probe));
    expect((await app.query('SELECT label FROM core.probe_0015')).rows).toEqual([]);
    expect((await app2.query('SELECT label FROM core.probe_0015')).rows).toEqual([]);
  });

  it('binds the tables’ owner too (FORCE)', async () => {
    expect((await owner.query('SELECT label FROM core.probe_0015')).rows).toEqual([]);
    expect(labels(await withCompany(drizzle(owner), A, (tx) => tx.select().from(probe)))).toEqual(['a1', 'a2']);
  });

  it('keeps two companies apart when both work at the same time', async () => {
    const slowly = (companyId: string, client: typeof app) =>
      withCompany(drizzle(client), companyId, async (tx) => {
        await tx.execute(sql`SELECT pg_sleep(0.2)`);
        return labels(await tx.select().from(probe));
      });
    expect(await Promise.all([slowly(A, app), slowly(B, app2)])).toEqual([['a1', 'a2'], ['b1']]);
  });

  it('refuses a value that is not a company ID before it reaches the database, and never names it', async () => {
    // Also values that hold a real company ID inside them.
    for (const planted of ["x' OR '1'='1", `${A}' OR '1'='1`, ` ${A}`, `${A}\n`, `{${A}}`, '']) {
      let ran = false;
      const message = await withCompany(drizzle(app), planted, async () => {
        ran = true;
      }).then(() => 'no error', (error: unknown) => (error as Error).message);
      expect(message).toBe('the company is not a valid ID');
      expect(ran).toBe(false);
      expect(() => forCompany(probe.companyId, planted)).toThrow('the company is not a valid ID');
    }
  });
});

describe('the data helper (lock 1)', () => {
  it('filters by the company even where the row rules do not apply', async () => {
    // nexus_backup bypasses the row rules, so here only the helper keeps company B's row out.
    const db = drizzle(backup);
    expect(labels(await db.select().from(probe))).toEqual(['a1', 'a2', 'b1']);
    expect(labels(await db.select().from(probe).where(forCompany(probe.companyId, A)))).toEqual(['a1', 'a2']);
    expect(labels(await db.select().from(probe).where(forCompany(probe.companyId, B)))).toEqual(['b1']);
  });
});

describe('core.add_company_rules', () => {
  it('puts exactly the company rule on the table, for reading and for writing, owner included', async () => {
    expect(
      (
        await owner.query(
          `SELECT c.relrowsecurity AS row_rules, c.relforcerowsecurity AS forced, p.policyname, p.permissive, p.roles::text AS roles,
                  p.cmd, p.qual, p.with_check
             FROM pg_class c JOIN pg_policies p ON p.schemaname = 'core' AND p.tablename = c.relname
            WHERE c.oid = 'core.probe_0015'::regclass`,
        )
      ).rows,
    ).toEqual([
      { row_rules: true, forced: true, policyname: 'company_rows', permissive: 'PERMISSIVE', roles: '{public}', cmd: 'ALL', qual: RULE, with_check: RULE },
    ]);
  });

  it('refuses a table without a company_id uuid NOT NULL column', async () => {
    try {
      for (const column of ['company_id text NOT NULL', 'company_id uuid', 'owner_id uuid NOT NULL']) {
        await owner.query(`DROP TABLE IF EXISTS core.probe_0015_bad; CREATE TABLE core.probe_0015_bad (id uuid PRIMARY KEY, ${column})`);
        await expect(owner.query(`CALL core.add_company_rules('core.probe_0015_bad')`)).rejects.toThrow(
          'core.probe_0015_bad has no company_id uuid NOT NULL column',
        );
      }
    } finally {
      await owner.query('DROP TABLE IF EXISTS core.probe_0015_bad');
    }
  });

  it('belongs to nexus_owner, runs with a fixed search path, and nobody else may run it', async () => {
    expect(
      (
        await owner.query(
          `SELECT pg_get_userbyid(p.proowner) AS owner, p.prokind AS kind, p.prosecdef AS definer, p.proconfig::text AS config,
                  has_function_privilege('nexus_app', p.oid, 'EXECUTE') AS app_runs,
                  (SELECT count(*)::int FROM aclexplode(p.proacl) a WHERE a.grantee = 0) AS for_everyone
             FROM pg_proc p WHERE p.oid = 'core.add_company_rules(regclass)'::regprocedure`,
        )
      ).rows,
    ).toEqual([
      { owner: 'nexus_owner', kind: 'p', definer: false, config: '{"search_path=pg_catalog, pg_temp"}', app_runs: false, for_everyone: 0 },
    ]);
  });
});

describe('every company table in the database (the catalogue check)', () => {
  it('has the company rule, its company_id and its link to core.companies; only the system tables go without', async () => {
    const tables = (
      await owner.query(
        `SELECT c.oid, n.nspname || '.' || c.relname AS name, c.relrowsecurity AS row_rules, c.relforcerowsecurity AS forced,
                pg_get_userbyid(c.relowner) AS table_owner
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind IN ('r', 'p') AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'drizzle', 'auth', 'pgboss')
          ORDER BY 2`,
      )
    ).rows as { oid: number; name: string; row_rules: boolean; forced: boolean; table_owner: string }[];
    const problems: string[] = [];
    for (const table of tables) {
      if (table.table_owner !== 'nexus_owner') problems.push(`${table.name} belongs to ${table.table_owner}`);
      if (table.name.startsWith('public.')) problems.push(`${table.name} is in the public schema`);
      if (SYSTEM.includes(table.name)) continue;
      if (!table.row_rules || !table.forced) problems.push(`${table.name} has no forced row rules`);
      const policies = (
        await owner.query('SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname || \'.\' || tablename = $1', [
          table.name,
        ])
      ).rows;
      if (JSON.stringify(policies) !== JSON.stringify([{ policyname: 'company_rows', cmd: 'ALL', qual: RULE, with_check: RULE }])) {
        problems.push(`${table.name} does not have exactly the company_rows rule`);
      }
      const column = (
        await owner.query(
          `SELECT format_type(atttypid, atttypmod) AS type, attnotnull AS required FROM pg_attribute
            WHERE attrelid = $1 AND attname = 'company_id' AND NOT attisdropped`,
          [table.oid],
        )
      ).rows[0] as { type: string; required: boolean } | undefined;
      if (!column || column.type !== 'uuid') problems.push(`${table.name} has no company_id uuid column`);
      else if (!column.required && !MAY_BE_EMPTY.includes(table.name)) problems.push(`${table.name} allows an empty company_id`);
      const link = (
        await owner.query(
          `SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
            WHERE c.conrelid = $1 AND c.contype = 'f' AND c.confrelid = 'core.companies'::regclass AND a.attname = 'company_id'`,
          [table.oid],
        )
      ).rowCount;
      if (!link) problems.push(`${table.name} has no link from company_id to core.companies`);
    }
    expect(tables.map((table) => table.name)).toContain('core.companies');
    expect(problems).toEqual([]);
  });
});
