// TASK-0017 · The activity log and its writer: the table, its company rule and rights (add and read only), and writeActivity writing in the transaction on the request context. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction, securityWrite } from '../../src/db/database.js';
import { writeActivity, type ActivityEntry } from '../../src/modules/core/repository/activity-log.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const CLIENT = '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f';
let A = '';
let B = '';
let n = 0;

const entry = (label: string, more: Partial<ActivityEntry> = {}): ActivityEntry => ({
  module: 'crm',
  recordType: 'client',
  recordId: CLIENT,
  recordLabel: label,
  action: 'update',
  ...more,
});
const context = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0017-${n}`, background: false, companyId: A, userId: PERSON, ...more };
};
// One request: the real request transaction from TASK-0016, with the given context.
const inRequest = <T>(ctx: RequestContext, work: () => Promise<T>) => runWithContext(ctx, () => inRequestTransaction(work));

// The entries a company sees, read by nexus_owner with that company set (the owner is bound by the rule too).
async function entries(companyId: string): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query('SELECT * FROM audit.activity_log ORDER BY at, id')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}
const labelsOf = async (companyId: string) => (await entries(companyId)).map((row) => String(row.record_label));

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE audit.activity_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('audit.activity_log (the table)', () => {
  it('has exactly the planned columns, types, required fields and defaults', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, udt_schema || '.' || udt_name AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'audit' AND table_name = 'activity_log' ORDER BY ordinal_position`,
    );
    expect(columns.rows).toEqual([
      { name: 'id', type: 'pg_catalog.uuid', required: true, default: 'core.uuid_v7()' },
      { name: 'company_id', type: 'pg_catalog.uuid', required: true, default: null },
      { name: 'at', type: 'pg_catalog.timestamptz', required: true, default: 'now()' },
      { name: 'actor_type', type: 'audit.actor_type', required: true, default: null },
      { name: 'actor_user_id', type: 'pg_catalog.uuid', required: false, default: null },
      { name: 'actor_label', type: 'pg_catalog.text', required: false, default: null },
      { name: 'module', type: 'pg_catalog.text', required: true, default: null },
      { name: 'record_type', type: 'pg_catalog.text', required: true, default: null },
      { name: 'record_id', type: 'pg_catalog.uuid', required: true, default: null },
      { name: 'record_label', type: 'pg_catalog.text', required: true, default: null },
      { name: 'action', type: 'pg_catalog.text', required: true, default: null },
      { name: 'changes', type: 'pg_catalog.jsonb', required: true, default: "'{}'::jsonb" },
      { name: 'client_id', type: 'pg_catalog.uuid', required: false, default: null },
      { name: 'request_id', type: 'pg_catalog.text', required: false, default: null },
    ]);
    const kinds = await owner.query(`SELECT unnest(enum_range(NULL::audit.actor_type))::text AS kind`);
    expect(kinds.rows.map((row) => row.kind)).toEqual(['person', 'automation', 'api', 'mcp', 'ai', 'system']);
  });

  it('has its key, a company link that refuses to delete a company with entries, and its four indexes', async () => {
    const links = await owner.query(
      `SELECT contype AS kind, confrelid::regclass::text AS target, confdeltype AS on_delete,
              (SELECT array_agg(attname ORDER BY attnum)::text FROM pg_attribute WHERE attrelid = conrelid AND attnum = ANY (conkey)) AS columns
         FROM pg_constraint WHERE conrelid = 'audit.activity_log'::regclass ORDER BY contype`,
    );
    expect(links.rows).toEqual([
      { kind: 'f', target: 'core.companies', on_delete: 'r', columns: '{company_id}' },
      { kind: 'p', target: '-', on_delete: ' ', columns: '{id}' },
    ]);
    const indexes = await owner.query(
      `SELECT indexname AS name, indexdef AS def FROM pg_indexes WHERE schemaname = 'audit' AND tablename = 'activity_log' ORDER BY indexname`,
    );
    expect(indexes.rows).toEqual([
      { name: 'activity_log_actor_idx', def: 'CREATE INDEX activity_log_actor_idx ON audit.activity_log USING btree (company_id, actor_user_id, at)' },
      { name: 'activity_log_at_idx', def: 'CREATE INDEX activity_log_at_idx ON audit.activity_log USING btree (company_id, at)' },
      { name: 'activity_log_client_idx', def: 'CREATE INDEX activity_log_client_idx ON audit.activity_log USING btree (company_id, client_id, at)' },
      { name: 'activity_log_pkey', def: 'CREATE UNIQUE INDEX activity_log_pkey ON audit.activity_log USING btree (id)' },
      {
        name: 'activity_log_record_idx',
        def: 'CREATE INDEX activity_log_record_idx ON audit.activity_log USING btree (company_id, module, record_type, record_id, at)',
      },
    ]);
  });

  it('belongs to nexus_owner, has the company rule, and the app may only add and read entries; everyone else gets nothing', async () => {
    const table = await owner.query(
      `SELECT pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity AS rules, c.relforcerowsecurity AS forced,
              (SELECT array_agg(policyname)::text FROM pg_policies WHERE schemaname = 'audit' AND tablename = 'activity_log') AS policies,
              (SELECT count(*)::int FROM aclexplode(c.relacl) a WHERE a.grantee = 0) AS for_everyone
         FROM pg_class c WHERE c.oid = 'audit.activity_log'::regclass`,
    );
    expect(table.rows).toEqual([{ owner: 'nexus_owner', rules: true, forced: true, policies: '{company_rows}', for_everyone: 0 }]);
    const rights = await owner.query(
      `SELECT r AS right, has_table_privilege('nexus_app', 'audit.activity_log', r) AS app
         FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) r`,
    );
    expect(Object.fromEntries(rights.rows.map((row) => [row.right, row.app]))).toEqual({
      SELECT: true,
      INSERT: true,
      UPDATE: false,
      DELETE: false,
      TRUNCATE: false,
      REFERENCES: false,
      TRIGGER: false,
    });
  });

  it('refuses to delete a company that still has entries', async () => {
    await inRequest(context(), () => writeActivity(entry('kept')));
    await expect(owner.query('DELETE FROM core.companies WHERE id = $1', [A])).rejects.toMatchObject({ code: '23503' });
    expect(await labelsOf(A)).toEqual(['kept']);
  });
});

describe('writeActivity', () => {
  it('writes one entry in the request’s transaction, with the company, the person and the request ID from the context', async () => {
    const ctx = context();
    const started = Date.now();
    const id = await inRequest(ctx, () =>
      writeActivity(
        entry('CL-0042 Kaveri Hospitals', {
          changes: { phone: { old: '98400 11111', new: '98400 22222' } },
          clientId: CLIENT,
        }),
      ),
    );
    expect(id).toMatch(V7);
    const [row] = await entries(A);
    expect(row).toMatchObject({
      id,
      company_id: A,
      actor_type: 'person',
      actor_user_id: PERSON,
      actor_label: null,
      module: 'crm',
      record_type: 'client',
      record_id: CLIENT,
      record_label: 'CL-0042 Kaveri Hospitals',
      action: 'update',
      changes: { phone: { old: '98400 11111', new: '98400 22222' } },
      client_id: CLIENT,
      request_id: ctx.requestId,
    });
    expect(Math.abs((row!.at as Date).getTime() - started)).toBeLessThan(10_000);
  });

  it('records an automation, an API key, MCP, AI or the system with its label, ahead of the context’s person', async () => {
    const OWNER_OF_KEY = '0190f2a6-6c1e-7b3a-9d2f-ffffffffffff';
    await inRequest(context(), async () => {
      await writeActivity(entry('by automation', { actor: { type: 'automation', label: 'Renewal check (nightly)' } }));
      await writeActivity(entry('by api', { actor: { type: 'api', label: 'Key: accounts export', userId: OWNER_OF_KEY } }));
      await writeActivity(entry('by system', { actor: { type: 'system', label: 'First start' } }));
    });
    const rows = await entries(A);
    expect(rows.map((row) => [row.record_label, row.actor_type, row.actor_label, row.actor_user_id])).toEqual([
      ['by automation', 'automation', 'Renewal check (nightly)', null],
      ['by api', 'api', 'Key: accounts export', OWNER_OF_KEY],
      ['by system', 'system', 'First start', null],
    ]);
  });

  it('is undone with its request: an entry written before a later step fails is not kept', async () => {
    await expect(
      inRequest(context(), async () => {
        await writeActivity(entry('undone'));
        throw new Error('a later step failed');
      }),
    ).rejects.toThrow('a later step failed');
    expect(await labelsOf(A)).toEqual([]);
  });

  it('inside a security write, writes in the security write’s own transaction, which stays when the request is refused', async () => {
    await expect(
      inRequest(context(), async () => {
        await writeActivity(entry('in the request'));
        await securityWrite(A, () => writeActivity(entry('in the security write', { actor: { type: 'system', label: 'Session end' } })));
        throw new Error('refused');
      }),
    ).rejects.toThrow('refused');
    expect(await labelsOf(A)).toEqual(['in the security write']);
  });

  it('keeps a value left undefined as null, and writes {} when there are no changes', async () => {
    await inRequest(context(), async () => {
      await writeActivity(entry('with undefined', { changes: { email: { old: undefined, new: 'accounts@kaverihospitals.in' } } }));
      await writeActivity(entry('without changes', { action: 'delete' }));
    });
    expect((await entries(A)).map((row) => row.changes)).toEqual([{ email: { old: null, new: 'accounts@kaverihospitals.in' } }, {}]);
  });

  it('refuses without who did it, without a transaction or outside any request, and saves nothing', async () => {
    await expect(inRequest(context({ userId: undefined }), () => writeActivity(entry('nobody')))).rejects.toThrow(
      'the activity log needs who did it',
    );
    await expect(runWithContext(context(), () => writeActivity(entry('no transaction')))).rejects.toThrow(
      'the activity log needs the transaction',
    );
    await expect(writeActivity(entry('no context'))).rejects.toThrow('No request context');
    expect(await labelsOf(A)).toEqual([]);
  });

  it('refuses an ID that is not valid before the database sees it, without repeating the value', async () => {
    const bad = "CL-0042'; DROP TABLE x; --";
    for (const more of [{ recordId: bad }, { clientId: bad }, { actor: { type: 'api' as const, label: 'Key', userId: bad } }]) {
      const error = await inRequest(context(), () => writeActivity(entry('bad id', more))).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('the activity entry holds an ID that is not valid');
    }
    expect(await labelsOf(A)).toEqual([]);
  });

  it('keeps each company’s entries apart, and the app can never change or delete an entry', async () => {
    await inRequest(context(), () => writeActivity(entry('for A')));
    await inRequest(context({ companyId: B }), () => writeActivity(entry('for B')));
    expect(await labelsOf(A)).toEqual(['for A']);
    expect(await labelsOf(B)).toEqual(['for B']);
    for (const change of [sql`UPDATE audit.activity_log SET action = 'changed'`, sql`DELETE FROM audit.activity_log`]) {
      await expect(
        inRequest(context(), async () => {
          await getContext().tx!.execute(change);
        }),
      ).rejects.toThrow();
    }
    expect(await labelsOf(A)).toEqual(['for A']);
  });
});
