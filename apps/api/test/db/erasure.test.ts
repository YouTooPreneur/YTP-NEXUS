// TASK-0025 · Removing personal values on request (DPDP, NFR-010): the system account's narrow right on the activity log, core.erase_personal_values, and erasePersonalValues with its data_erased security entry. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction } from '../../src/db/database.js';
import { writeActivity } from '../../src/modules/core/repository/activity-log.js';
import { erasePersonalValues } from '../../src/modules/core/repository/erasure.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const RECORD = '0190f2a6-6c1e-7b3a-9d2f-aaaaaaaaaaaa';
const OTHER = '0190f2a6-6c1e-7b3a-9d2f-bbbbbbbbbbbb';
const REMOVED = '[removed on request]';
let A = '';
let B = '';
let n = 0;

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0025-${n}`, background: false, companyId: A, userId: PERSON, ip: '203.0.113.9', userAgent: 'Chrome 131', ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));
const entry = (recordId: string, label: string, changes: Record<string, { old: unknown; new: unknown }>) =>
  writeActivity({ module: 'core', recordType: 'person', recordId, recordLabel: label, action: 'changed', changes });

// One company's activity entries, as the app reads them (the row rule binds it to the company set).
async function entries(companyId: string): Promise<Record<string, unknown>[]> {
  await appClient.query('BEGIN');
  try {
    await appClient.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await appClient.query('SELECT record_id, record_label, changes FROM audit.activity_log ORDER BY at, id')).rows;
  } finally {
    await appClient.query('COMMIT');
  }
}

// One company's security-log entries, as the app reads them.
async function securityEntries(companyId: string): Promise<Record<string, unknown>[]> {
  await appClient.query('BEGIN');
  try {
    await appClient.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await appClient.query('SELECT event, user_id, record_type, record_id, ip, details FROM audit.security_log ORDER BY seq')).rows;
  } finally {
    await appClient.query('COMMIT');
  }
}

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE audit.security_log');
  await owner.query('TRUNCATE audit.activity_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('the rights', () => {
  it('lets the system account read entries and change only their changes and label; the app still only reads and adds', async () => {
    const columns = await owner.query(
      `SELECT attname AS name, has_column_privilege('nexus_system', 'audit.activity_log', attname, 'UPDATE') AS ok
         FROM pg_attribute WHERE attrelid = 'audit.activity_log'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
    );
    expect(columns.rows.filter((c) => c.ok).map((c) => c.name).sort()).toEqual(['changes', 'record_label']);
    const tables = await owner.query(
      `SELECT a AS account, r AS right, has_table_privilege(a, 'audit.activity_log', r) AS ok
         FROM unnest(ARRAY['nexus_app', 'nexus_system']) a, unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    expect(Object.fromEntries(tables.rows.map((x) => [`${x.account} ${x.right}`, x.ok]))).toEqual({
      'nexus_app SELECT': true,
      'nexus_app INSERT': true,
      'nexus_app UPDATE': false,
      'nexus_app DELETE': false,
      'nexus_app TRUNCATE': false,
      'nexus_system SELECT': true,
      'nexus_system INSERT': false,
      'nexus_system UPDATE': false,
      'nexus_system DELETE': false,
      'nexus_system TRUNCATE': false,
    });
  });

  it('has one removal function owned by the system account, with a fixed search path, that the app may run and everyone may not', async () => {
    const functions = await owner.query(
      `SELECT p.oid::regprocedure::text AS name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS definer, p.proconfig::text AS config,
              has_function_privilege('nexus_app', p.oid, 'EXECUTE') AS app_runs,
              (SELECT count(*)::int FROM aclexplode(p.proacl) x WHERE x.grantee = 0) AS for_everyone
         FROM pg_proc p WHERE p.proname = 'erase_personal_values'`,
    );
    expect(functions.rows).toEqual([
      {
        name: 'core.erase_personal_values(text,uuid,jsonb)',
        owner: 'nexus_system',
        definer: true,
        config: '{"search_path=pg_catalog, pg_temp"}',
        app_runs: true,
        for_everyone: 0,
      },
    ]);
  });
});

describe('erasePersonalValues', () => {
  it('removes the record’s label and the named fields in every entry of that record, and nothing else', async () => {
    await inRequest(ctx(), async () => {
      await entry(RECORD, 'Asha Kumar', { name: { old: 'Asha', new: 'Asha Kumar' }, phone: { old: null, new: '98400 12345' }, status: { old: 'new', new: 'active' } });
      await entry(RECORD, 'Asha Kumar', { phone: { old: '98400 12345', new: '98400 99999' } });
      await entry(OTHER, 'Ravi', { name: { old: 'R', new: 'Ravi' } });
    });
    const changed = await inRequest(ctx(), () => erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['name', 'phone'] }));
    expect(changed).toBe(2);
    const removed = { old: REMOVED, new: REMOVED };
    expect(await entries(A)).toEqual([
      { record_id: RECORD, record_label: REMOVED, changes: { name: removed, phone: removed, status: { old: 'new', new: 'active' } } },
      { record_id: RECORD, record_label: REMOVED, changes: { phone: removed } },
      { record_id: OTHER, record_label: 'Ravi', changes: { name: { old: 'R', new: 'Ravi' } } },
    ]);
    expect(JSON.stringify(await entries(A))).not.toContain('98400');
  });

  it('writes one data_erased entry last, with who asked, the record, how many entries changed and which fields', async () => {
    await inRequest(ctx(), () => entry(RECORD, 'Asha Kumar', { phone: { old: null, new: '98400 12345' } }));
    await inRequest(ctx(), () => erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['phone'] }));
    expect(await securityEntries(A)).toEqual([
      { event: 'data_erased', user_id: PERSON, record_type: 'person', record_id: RECORD, ip: '203.0.113.9', details: { entries: 1, fields: ['phone'] } },
    ]);
  });

  it('touches only the request’s company, even for the same record ID', async () => {
    await inRequest(ctx({ companyId: B }), () => entry(RECORD, 'Asha in B', { phone: { old: null, new: '98400 55555' } }));
    expect(await inRequest(ctx(), () => erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['phone'] }))).toBe(0);
    expect(await entries(B)).toEqual([{ record_id: RECORD, record_label: 'Asha in B', changes: { phone: { old: null, new: '98400 55555' } } }]);
    expect((await securityEntries(A)).map((e) => e.details)).toEqual([{ entries: 0, fields: ['phone'] }]);
    expect(await securityEntries(B)).toEqual([]);
  });

  it('keeps nothing when the request is undone: neither the removal nor its security entry', async () => {
    await inRequest(ctx(), () => entry(RECORD, 'Asha Kumar', { phone: { old: null, new: '98400 12345' } }));
    await expect(
      inRequest(ctx(), async () => {
        await erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['phone'] });
        throw new Error('the request failed');
      }),
    ).rejects.toThrow('the request failed');
    expect((await entries(A))[0]).toMatchObject({ record_label: 'Asha Kumar' });
    expect(await securityEntries(A)).toEqual([]);
  });

  it('refuses outside a request, without the transaction, with a wrong record ID or wrong field names, and changes nothing', async () => {
    await inRequest(ctx(), () => entry(RECORD, 'Asha Kumar', { phone: { old: null, new: '98400 12345' } }));
    await expect(erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['phone'] })).rejects.toThrow('No request context');
    await expect(runWithContext(ctx(), () => erasePersonalValues({ recordType: 'person', recordId: RECORD, fields: ['phone'] }))).rejects.toThrow(
      'the removal needs the transaction',
    );
    await expect(inRequest(ctx(), () => erasePersonalValues({ recordType: 'person', recordId: 'not-an-id', fields: ['phone'] }))).rejects.toThrow(
      'the removal needs a record ID',
    );
    for (const bad of [{ recordType: '', fields: ['phone'] }, { recordType: 'person', fields: [''] }, { recordType: 'person', fields: [7 as never] }]) {
      await expect(inRequest(ctx(), () => erasePersonalValues({ recordId: RECORD, ...bad }))).rejects.toThrow('the removal needs a record type and field names');
    }
    expect((await entries(A))[0]).toMatchObject({ record_label: 'Asha Kumar' });
    expect(await securityEntries(A)).toEqual([]);
  });

  it('is refused by the database without a company, or with a field list that is not a list', async () => {
    await expect(appClient.query(`SELECT core.erase_personal_values('person', $1, '["phone"]')`, [RECORD])).rejects.toThrow('the removal needs the company');
    await appClient.query('BEGIN');
    try {
      await appClient.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await expect(appClient.query(`SELECT core.erase_personal_values('person', $1, '{"phone": true}')`, [RECORD])).rejects.toThrow(
        'the removal needs a list of field names',
      );
    } finally {
      await appClient.query('ROLLBACK');
    }
  });
});
