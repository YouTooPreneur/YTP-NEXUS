// TASK-0029 · The doors table and the door status: core.doors exactly (columns, defaults, key, checks, links, the app's rights and the row rules), and recordDoorCheck adding then updating one row per company and door in a security write of its own, at every check even when nothing changed, every status's columns, the database's time, the cleaned error (none when no error is given), updated_by always empty and nothing else written, an unknown door or provider refused (exact spellings only) and a database failure let through as it is. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inCompanyTransaction, inRequestTransaction } from '../../src/db/database.js';
import { doorStatus } from '../../src/modules/core/schema/doors.js';
import {
  DOOR_KEYS,
  DOOR_PROVIDERS,
  recordDoorCheck,
  type DoorKey,
  type DoorProvider,
  type DoorStatus,
} from '../../src/modules/core/doors/doors.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
let A = '';
let B = '';
let n = 0;

const ctx = (companyId: string, more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0029-${n}`, background: false, companyId, ...more };
};

const columnsOf = async (table: string) =>
  (
    await owner.query(
      `SELECT column_name AS name, data_type AS type, udt_name AS udt, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
  ).rows.map((c) => [c.name, c.type === 'USER-DEFINED' ? c.udt : c.type, c.required, c.default]);
const enumOf = async (name: string) =>
  (await owner.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = $1::regtype ORDER BY enumsortorder`, [name])).rows.map((e) => e.enumlabel);

// One statement as the app (or the owner) for one company: the row rules bind both accounts.
async function asCompany(client: typeof owner, companyId: string, query: string, values: unknown[] = []): Promise<Record<string, any>[]> {
  await client.query('BEGIN');
  try {
    await client.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    const result = await client.query(query, values);
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

// A company's doors as the table's owner reads them (the row rule binds the owner too).
const doorsOf = (companyId: string) =>
  asCompany(
    owner,
    companyId,
    `SELECT key, provider, status, is_on, settings, last_check_ok, last_error, updated_by, last_check_at IS NOT NULL AS checked
       FROM core.doors ORDER BY key`,
  );
const lastErrorOf = async (companyId: string, key: DoorKey): Promise<unknown> =>
  (await asCompany(owner, companyId, 'SELECT last_error FROM core.doors WHERE key = $1', [key]))[0]?.last_error;

const newId = async () => String((await owner.query('SELECT core.uuid_v7() AS id')).rows[0]!.id);
const roleOf = async (companyId: string) =>
  String(
    (await asCompany(owner, companyId, `INSERT INTO core.roles (company_id, key, name, idle_timeout_minutes) VALUES ($1, 'staff', 'Staff', 480) RETURNING id`, [companyId]))[0]!.id,
  );
const personIn = async (companyId: string) => {
  const id = await newId();
  await asCompany(appClient, companyId, `INSERT INTO core.users (id, company_id, display_name, role_id, signin_methods) VALUES ($1, $2, 'Asha', $3, '{password}')`, [
    id,
    companyId,
    await roleOf(companyId),
  ]);
  return id;
};

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  vi.useRealTimers();
  await closePools();
  await owner.query('TRUNCATE core.doors, core.users, core.roles CASCADE');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('core.doors (the table)', () => {
  it('has exactly its columns, defaults and status type, keyed by company and door, linked to the company and to a person of the same company', async () => {
    expect(await columnsOf('doors')).toEqual([
      ['company_id', 'uuid', true, null],
      ['key', 'text', true, null],
      ['provider', 'text', true, null],
      ['status', 'door_status', true, "'not_connected'::core.door_status"],
      ['is_on', 'boolean', true, 'true'],
      ['settings', 'jsonb', true, "'{}'::jsonb"],
      ['last_check_at', 'timestamp with time zone', false, null],
      ['last_check_ok', 'boolean', false, null],
      ['last_error', 'text', false, null],
      ['updated_at', 'timestamp with time zone', true, 'now()'],
      ['updated_by', 'uuid', false, null],
    ]);
    const keys = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.doors'::regclass AND contype <> 'c'
        ORDER BY contype, pg_get_constraintdef(oid) COLLATE "C"`,
    );
    expect(keys.rows.map((c) => `${c.kind} ${c.def}`)).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, updated_by) REFERENCES core.users(company_id, id) ON DELETE RESTRICT',
      'p PRIMARY KEY (company_id, key)',
    ]);
    expect(await enumOf('core.door_status')).toEqual(['not_connected', 'connected', 'error']);
    expect(doorStatus.enumValues).toEqual(['not_connected', 'connected', 'error']);
  });

  it('allows only the doors and providers of the code: its two checks list exactly DOOR_KEYS and DOOR_PROVIDERS', async () => {
    expect(DOOR_KEYS).toEqual(['email', 'files']);
    expect(DOOR_PROVIDERS).toEqual(['gmail', 'smtp', 'r2', 'seaweedfs']);
    const checks = (
      await owner.query(`SELECT conname AS name, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.doors'::regclass AND contype = 'c' ORDER BY conname`)
    ).rows;
    expect(checks.map((c) => c.name)).toEqual(['doors_key_check', 'doors_provider_check']);
    const listed = (def: string) => [...def.matchAll(/'([^']*)'::text/g)].map((m) => m[1]);
    expect(listed(checks[0]!.def), checks[0]!.def).toEqual([...DOOR_KEYS]);
    expect(checks[0]!.def).toMatch(/^CHECK \(\(key = ANY \(ARRAY\[/);
    expect(listed(checks[1]!.def), checks[1]!.def).toEqual([...DOOR_PROVIDERS]);
    expect(checks[1]!.def).toMatch(/^CHECK \(\(provider = ANY \(ARRAY\[/);
    const add = (key: string, provider: string) =>
      asCompany(
        appClient,
        A,
        'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3) ON CONFLICT (company_id, key) DO UPDATE SET provider = EXCLUDED.provider',
        [A, key, provider],
      );
    for (const key of DOOR_KEYS) for (const provider of DOOR_PROVIDERS) await add(key, provider);
    expect((await doorsOf(A)).map((d) => [d.key, d.provider])).toEqual([
      ['email', 'seaweedfs'],
      ['files', 'seaweedfs'],
    ]);
    for (const key of ['sms', 'Email', 'email ', '']) await expect(add(key, 'smtp'), key).rejects.toThrow('doors_key_check');
    for (const provider of ['mailgun', 'Gmail', 'smtp ', '']) await expect(add('email', provider), provider).rejects.toThrow('doors_provider_check');
  });

  it('gives a new row its defaults: not connected, switched on, no settings, never checked, changed now by nobody', async () => {
    await asCompany(appClient, A, 'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3)', [A, 'email', 'smtp']);
    expect(
      await asCompany(
        owner,
        A,
        `SELECT status, is_on, settings, last_check_at, last_check_ok, last_error, updated_by, abs(extract(epoch FROM now() - updated_at)) < 60 AS changed_now FROM core.doors`,
      ),
    ).toEqual([{ status: 'not_connected', is_on: true, settings: {}, last_check_at: null, last_check_ok: null, last_error: null, updated_by: null, changed_now: true }]);
  });

  it('lets the app read and add doors and change only the provider, status, settings, last-check and updated columns: never a row’s company, door or switch, and never delete or empty', async () => {
    const table = await owner.query(
      `SELECT relrowsecurity AS rules, relforcerowsecurity AS forced, (SELECT count(*)::int FROM aclexplode(relacl) a WHERE a.grantee = 0) AS for_everyone
         FROM pg_class WHERE oid = 'core.doors'::regclass`,
    );
    expect(table.rows).toEqual([{ rules: true, forced: true, for_everyone: 0 }]);
    const rights = await owner.query(
      `SELECT r AS right, has_table_privilege('nexus_app', 'core.doors', r) AS app
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
    const columns = await owner.query(
      `SELECT attname AS name, has_column_privilege('nexus_app', 'core.doors', attname, 'UPDATE') AS ok
         FROM pg_attribute WHERE attrelid = 'core.doors'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
    );
    expect(columns.rows.filter((c) => c.ok).map((c) => c.name)).toEqual([
      'provider',
      'status',
      'settings',
      'last_check_at',
      'last_check_ok',
      'last_error',
      'updated_at',
      'updated_by',
    ]);
    await asCompany(appClient, A, 'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3)', [A, 'email', 'smtp']);
    await asCompany(appClient, A, `UPDATE core.doors SET status = 'connected', settings = '{"senderName": "YTP"}'::jsonb, last_check_ok = true`);
    for (const change of ['is_on = false', "key = 'files'", `company_id = '${B}'`]) {
      await expect(asCompany(appClient, A, `UPDATE core.doors SET ${change}`), change).rejects.toThrow('permission denied');
    }
    await expect(asCompany(appClient, A, 'DELETE FROM core.doors')).rejects.toThrow('permission denied');
    await expect(asCompany(appClient, A, 'TRUNCATE core.doors')).rejects.toThrow('permission denied');
    expect(await doorsOf(A)).toMatchObject([{ key: 'email', status: 'connected', is_on: true, settings: { senderName: 'YTP' } }]);
  });

  it('keeps every door in its company: another company sees none of its rows, and updated_by names only a person of the same company', async () => {
    await asCompany(appClient, A, 'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3)', [A, 'email', 'smtp']);
    await asCompany(appClient, B, 'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3)', [B, 'files', 'seaweedfs']);
    expect((await asCompany(appClient, A, 'SELECT company_id, key FROM core.doors')).map((d) => [d.company_id, d.key])).toEqual([[A, 'email']]);
    expect((await asCompany(appClient, B, 'SELECT company_id, key FROM core.doors')).map((d) => [d.company_id, d.key])).toEqual([[B, 'files']]);
    await expect(asCompany(appClient, A, 'INSERT INTO core.doors (company_id, key, provider) VALUES ($1, $2, $3)', [B, 'email', 'gmail'])).rejects.toThrow('row-level security');
    const personA = await personIn(A);
    const personB = await personIn(B);
    await asCompany(appClient, A, 'UPDATE core.doors SET updated_by = $1', [personA]);
    expect((await doorsOf(A)).map((d) => d.updated_by)).toEqual([personA]);
    for (const someone of [personB, await newId()]) {
      await expect(asCompany(appClient, A, 'UPDATE core.doors SET updated_by = $1', [someone])).rejects.toThrow('violates foreign key constraint');
    }
  });
});

describe('recordDoorCheck', () => {
  it('names exactly the doors, providers and statuses, and takes the company and the check (types checked by the Type check step)', () => {
    expectTypeOf<DoorKey>().toEqualTypeOf<'email' | 'files'>();
    expectTypeOf<DoorProvider>().toEqualTypeOf<'gmail' | 'smtp' | 'r2' | 'seaweedfs'>();
    expectTypeOf<DoorStatus>().toEqualTypeOf<'not_connected' | 'connected' | 'error'>();
    expectTypeOf(recordDoorCheck).parameters.toEqualTypeOf<[string, { key: DoorKey; provider: DoorProvider; status: DoorStatus; error?: unknown }]>();
    expectTypeOf(recordDoorCheck).returns.toEqualTypeOf<Promise<void>>();
    expect(typeof recordDoorCheck).toBe('function');
  });

  it('adds the company’s row for a door at its first check, then updates that one row: one row per company and door', async () => {
    await recordDoorCheck(A, { key: 'email', provider: 'smtp', status: 'not_connected' });
    expect(await doorsOf(A)).toEqual([
      { key: 'email', provider: 'smtp', status: 'not_connected', is_on: true, settings: {}, last_check_ok: false, last_error: null, updated_by: null, checked: true },
    ]);
    await recordDoorCheck(A, { key: 'email', provider: 'gmail', status: 'connected' });
    await recordDoorCheck(A, { key: 'files', provider: 'seaweedfs', status: 'connected' });
    await recordDoorCheck(B, { key: 'email', provider: 'gmail', status: 'error', error: new Error('the server did not answer') });
    expect(await doorsOf(A)).toEqual([
      { key: 'email', provider: 'gmail', status: 'connected', is_on: true, settings: {}, last_check_ok: true, last_error: null, updated_by: null, checked: true },
      { key: 'files', provider: 'seaweedfs', status: 'connected', is_on: true, settings: {}, last_check_ok: true, last_error: null, updated_by: null, checked: true },
    ]);
    expect(await doorsOf(B)).toEqual([
      { key: 'email', provider: 'gmail', status: 'error', is_on: true, settings: {}, last_check_ok: false, last_error: 'the server did not answer', updated_by: null, checked: true },
    ]);
    expect((await asCompany(appClient, B, 'SELECT key FROM core.doors')).map((d) => d.key)).toEqual(['email']);
    // A check is automatic work, not a person's change: no activity-log entry.
    for (const companyId of [A, B]) {
      expect(await asCompany(owner, companyId, 'SELECT count(*)::int AS entries FROM audit.activity_log')).toEqual([{ entries: 0 }]);
    }
  });

  it('writes each status’s columns: only connected passes, and only an error keeps its message (none when no error is given)', async () => {
    const failure = new Error('the door failed');
    const expected: [DoorStatus, boolean, string | null][] = [
      ['error', false, 'the door failed'],
      ['connected', true, null],
      ['not_connected', false, null],
      ['error', false, 'the door failed'],
    ];
    for (const [status, ok, lastError] of expected) {
      await recordDoorCheck(A, { key: 'files', provider: 'r2', status, error: failure });
      expect(await doorsOf(A), status).toMatchObject([{ key: 'files', status, last_check_ok: ok, last_error: lastError }]);
    }
    // An error status with no error given keeps no message: never the text "undefined", and never the one before.
    for (const [label, check] of [
      ['no error', { status: 'error' }],
      ['error: undefined', { status: 'error', error: undefined }],
    ] as const) {
      await recordDoorCheck(A, { key: 'files', provider: 'r2', status: 'error', error: failure });
      await recordDoorCheck(A, { key: 'files', provider: 'r2', ...check });
      expect(await doorsOf(A), label).toMatchObject([{ key: 'files', status: 'error', last_check_ok: false, last_error: null }]);
    }
  });

  it('takes the time of the check from the database, never the computer’s clock, when it adds the row and when it updates it, changes only its own columns and marks the change as automatic', async () => {
    const person = await personIn(A);
    await asCompany(owner, A, `INSERT INTO core.doors (company_id, key, provider, is_on, settings, updated_by, updated_at) VALUES ($1, 'email', 'smtp', false, '{"senderName": "YTP"}', $2, now() - interval '1 day')`, [
      A,
      person,
    ]);
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2001-02-03T04:05:06Z') });
    await recordDoorCheck(A, { key: 'email', provider: 'gmail', status: 'connected' });
    // The first check of the files door adds its row.
    await recordDoorCheck(A, { key: 'files', provider: 'r2', status: 'connected' });
    vi.useRealTimers();
    expect(
      await asCompany(
        owner,
        A,
        `SELECT key, provider, status, is_on, settings, updated_by, last_check_at = updated_at AS same_time,
                abs(extract(epoch FROM now() - last_check_at)) < 60 AS checked_now FROM core.doors ORDER BY key`,
      ),
    ).toEqual([
      { key: 'email', provider: 'gmail', status: 'connected', is_on: false, settings: { senderName: 'YTP' }, updated_by: null, same_time: true, checked_now: true },
      { key: 'files', provider: 'r2', status: 'connected', is_on: true, settings: {}, updated_by: null, same_time: true, checked_now: true },
    ]);
    const first = (await asCompany(owner, A, `SELECT last_check_at::text AS at FROM core.doors WHERE key = 'email'`))[0]!.at;
    await recordDoorCheck(A, { key: 'email', provider: 'gmail', status: 'not_connected' });
    expect(
      await asCompany(owner, A, `SELECT last_check_at > $1::timestamptz AS later, last_check_at = updated_at AS same_time FROM core.doors WHERE key = 'email'`, [first]),
    ).toEqual([{ later: true, same_time: true }]);
  });

  it('writes at every check, even when nothing changed: the time of the check moves each time', async () => {
    for (const check of [{ status: 'connected' }, { status: 'error', error: new Error('the server did not answer') }] as const) {
      await recordDoorCheck(A, { key: 'email', provider: 'gmail', ...check });
      const first = (await asCompany(owner, A, 'SELECT last_check_at::text AS at FROM core.doors'))[0]!.at;
      await recordDoorCheck(A, { key: 'email', provider: 'gmail', ...check });
      expect(
        await asCompany(owner, A, 'SELECT last_check_at > $1::timestamptz AS later, last_check_at = updated_at AS same_time FROM core.doors', [first]),
        check.status,
      ).toEqual([{ later: true, same_time: true }]);
    }
  });

  it('is automatic work even when a person asked for the check: updated_by stays empty, and it writes nothing else', async () => {
    const person = await personIn(A);
    const entries = () =>
      asCompany(
        owner,
        A,
        `SELECT (SELECT count(*)::int FROM core.error_events) AS errors, (SELECT count(*)::int FROM audit.security_log) AS security,
                (SELECT count(*)::int FROM audit.activity_log) AS activity`,
      );
    const before = await entries();
    for (const check of [{ status: 'error', error: new Error('the server is down') }, { status: 'connected' }] as const) {
      await runWithContext(ctx(A, { userId: person }), () => recordDoorCheck(A, { key: 'email', provider: 'smtp', ...check }));
      expect((await doorsOf(A)).map((d) => d.updated_by), check.status).toEqual([null]);
    }
    expect(await entries()).toEqual(before);
  });

  it('keeps the result when the caller’s own transaction is undone, and writes under the company it is given, with or without a context', async () => {
    await expect(
      runWithContext(ctx(A), () =>
        inRequestTransaction(async () => {
          await recordDoorCheck(A, { key: 'email', provider: 'smtp', status: 'error', error: new Error('the server is down') });
          throw new Error('the request failed');
        }),
      ),
    ).rejects.toThrow('the request failed');
    await expect(
      runWithContext({ requestId: 'job-0029', background: true }, () =>
        inCompanyTransaction(A, async () => {
          await recordDoorCheck(A, { key: 'files', provider: 'seaweedfs', status: 'connected' });
          throw new Error('the job failed');
        }),
      ),
    ).rejects.toThrow('the job failed');
    expect((await doorsOf(A)).map((d) => [d.key, d.status, d.last_error])).toEqual([
      ['email', 'error', 'the server is down'],
      ['files', 'connected', null],
    ]);
    await runWithContext(ctx(A), () => recordDoorCheck(B, { key: 'files', provider: 'r2', status: 'connected' }));
    await recordDoorCheck(B, { key: 'email', provider: 'gmail', status: 'not_connected' });
    expect((await doorsOf(B)).map((d) => [d.key, d.provider, d.status])).toEqual([
      ['email', 'gmail', 'not_connected'],
      ['files', 'r2', 'connected'],
    ]);
    expect((await doorsOf(A)).map((d) => d.key)).toEqual(['email', 'files']);
  });

  it('keeps only the cleaned message: never a failed query’s values or a planted secret, no NUL character, at most 2000 characters', async () => {
    const failedQuery = await drizzle(owner)
      .execute(sql`SELECT ${'SECRET-0029-Q'}::int AS n`)
      .then(
        () => undefined,
        (error: unknown) => error,
      );
    const cases: [unknown, string][] = [
      [failedQuery, 'Failed query: SELECT $1::int AS n'],
      [Object.assign(new Error('the door failed'), { params: ['SECRET-0029-P'], input: 'postgres://u:SECRET-0029-PW@h/d' }), 'the door failed'],
      [{ message: 'x', params: ['SECRET-0029-P'], input: 'postgres://u:SECRET-0029-PW@h/d' }, 'x'],
      ['postgres://u:SECRET-0029-PW@h/d', 'string'],
      [new TypeError(''), 'TypeError'],
      [new Error(`a\u0000b\u0000${'y'.repeat(5000)}`), `ab${'y'.repeat(1998)}`],
    ];
    const kept: unknown[] = [];
    for (const [error, cleaned] of cases) {
      await recordDoorCheck(A, { key: 'email', provider: 'smtp', status: 'error', error });
      const lastError = await lastErrorOf(A, 'email');
      kept.push(lastError);
      expect(lastError).toBe(cleaned);
    }
    expect(String(kept[kept.length - 1])).toHaveLength(2000);
    expect(JSON.stringify(kept)).not.toContain('SECRET');
    expect(JSON.stringify(kept)).not.toContain('\\u0000');
  });

  it('never makes a second row for one door when checks run at once', async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        recordDoorCheck(A, { key: 'email', provider: 'smtp', status: i % 2 === 0 ? 'connected' : 'error', error: new Error('busy') }),
      ),
    );
    expect((await doorsOf(A)).map((d) => d.key)).toEqual(['email']);
  });

  it('refuses a door or a provider it does not know, spelt exactly, with a plain error and a fixed message before any database work, and lets a database failure through as it is', async () => {
    const refusal = (check: { key: string; provider: string }, companyId = A) =>
      recordDoorCheck(companyId, { ...(check as { key: DoorKey; provider: DoorProvider }), status: 'connected' }).then(
        () => undefined,
        (error: unknown) => error,
      );
    for (const [check, message] of [
      [{ key: 'sms', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'SECRET-0029-KEY', provider: 'gmail' }, 'recordDoorCheck: unknown door'],
      [{ key: 'sms', provider: 'mailgun' }, 'recordDoorCheck: unknown door'],
      // Exact spellings only, and never a name that every object has.
      [{ key: 'Email', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'EMAIL', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'email ', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'constructor', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'toString', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: '__proto__', provider: 'smtp' }, 'recordDoorCheck: unknown door'],
      [{ key: 'email', provider: 'mailgun' }, 'recordDoorCheck: unknown provider'],
      [{ key: 'files', provider: 'SECRET-0029-PROVIDER' }, 'recordDoorCheck: unknown provider'],
      [{ key: 'email', provider: 'Gmail' }, 'recordDoorCheck: unknown provider'],
      [{ key: 'email', provider: 'SMTP' }, 'recordDoorCheck: unknown provider'],
      [{ key: 'email', provider: 'constructor' }, 'recordDoorCheck: unknown provider'],
      [{ key: 'email', provider: 'hasOwnProperty' }, 'recordDoorCheck: unknown provider'],
    ] as const) {
      const error = await refusal(check);
      expect(error, JSON.stringify(check)).toBeInstanceOf(Error);
      expect(Object.getPrototypeOf(error), JSON.stringify(check)).toBe(Error.prototype);
      expect((error as Error).message, JSON.stringify(check)).toBe(message);
    }
    // Refused before the security write, which would first refuse a company that is not an ID.
    expect(((await refusal({ key: 'sms', provider: 'smtp' }, 'not-a-company')) as Error).message).toBe('recordDoorCheck: unknown door');
    expect(((await refusal({ key: 'email', provider: 'mailgun' }, 'not-a-company')) as Error).message).toBe('recordDoorCheck: unknown provider');
    expect(await doorsOf(A)).toEqual([]);
    expect(await doorsOf(B)).toEqual([]);
    // No status check in code, and it catches nothing: a database failure goes through as it is, drizzle's own error with
    // the driver's error as its cause (a status the database does not know; a company that does not exist).
    for (const [companyId, status, code] of [
      [A, 'broken', '22P02'],
      ['01890000-0000-7000-8000-000000000000', 'connected', '23503'],
    ] as const) {
      const failure = await recordDoorCheck(companyId, { key: 'email', provider: 'smtp', status: status as DoorStatus }).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(failure, status).toBeInstanceOf(DrizzleQueryError);
      expect((failure as DrizzleQueryError).cause, status).toMatchObject({ code });
    }
    expect(await doorsOf(A)).toEqual([]);
  });
});
