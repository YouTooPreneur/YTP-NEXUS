// TASK-0019 · Rows with no company: core.error_events and its rights, core.record_error and recordError, the error handler that keeps server errors, and the readers of the system rows. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { sql } from 'drizzle-orm';
import { createApp } from '../../src/app.js';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { AppError } from '../../src/shared/errors.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools, inRequestTransaction, securityWrite, securityWriteWithoutCompany } from '../../src/db/database.js';
import { recordError } from '../../src/modules/core/repository/error-events.js';
import { writeSecurity } from '../../src/modules/core/repository/security-log.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let A = '';
let B = '';
let n = 0;
let savedSettings: NodeJS.ProcessEnv = {};

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0019-${n}`, background: false, ...more };
};

// Every error, read as the system account (the owner may switch to it), which sees the rows with no company too.
async function allErrors(): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query('SET LOCAL ROLE nexus_system');
    return (await owner.query('SELECT * FROM core.error_events ORDER BY at, id')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}

// The errors the app sees with a company set (its row rule), or with none.
async function appSees(companyId?: string): Promise<Record<string, unknown>[]> {
  await appClient.query('BEGIN');
  try {
    if (companyId) await appClient.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await appClient.query('SELECT * FROM core.error_events ORDER BY at, id')).rows;
  } finally {
    await appClient.query('COMMIT');
  }
}

// The error handler keeps an error without making the answer wait, so a test waits for its row (at most 5 seconds).
async function eventually(count: number): Promise<Record<string, unknown>[]> {
  for (let i = 0; i < 50; i += 1) {
    const rows = await allErrors();
    if (rows.length >= count) return rows;
    await pause(100);
  }
  return allErrors();
}

const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const logged = (from: number) => lines.slice(from).map((line) => JSON.parse(line) as Record<string, any>);
const web = createApp({
  logger,
  routes: (a) => {
    a.get('/api/test/crash', () => {
      throw new Error('the door crashed');
    });
    a.get('/api/test/company-crash', () => {
      getContext().companyId = A;
      throw new Error('the company door crashed');
    });
    a.get('/api/test/down', () => {
      throw new AppError(503, 'door_down', 'The mail service is down');
    });
    a.get('/api/test/stale', () => {
      throw new AppError(409, 'stale_version', 'This was just changed, please review');
    });
    a.post('/api/test/input', () => {
      throw new AppError(400, 'invalid_input', 'Please check the form');
    });
  },
});

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

beforeEach(() => {
  savedSettings = { ...process.env };
});

afterEach(async () => {
  await closePools();
  for (const key of Object.keys(process.env)) if (!(key in savedSettings)) delete process.env[key];
  Object.assign(process.env, savedSettings);
  await owner.query('TRUNCATE core.error_events');
  await owner.query('TRUNCATE audit.security_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('core.error_events (the table and its rights)', () => {
  it('has exactly the planned columns, the two sources, its own key and a company link that refuses deletes', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, udt_name AS udt, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'error_events' ORDER BY ordinal_position`,
    );
    expect(columns.rows.map((c) => [c.name, c.type, c.udt, c.required, c.default])).toEqual([
      ['id', 'uuid', 'uuid', true, 'core.uuid_v7()'],
      ['company_id', 'uuid', 'uuid', false, null],
      ['at', 'timestamp with time zone', 'timestamptz', true, 'now()'],
      ['source', 'USER-DEFINED', 'error_source', true, null],
      ['message', 'text', 'text', true, null],
      ['request_id', 'text', 'text', false, null],
      ['external_id', 'text', 'text', false, null],
      ['resolved_at', 'timestamp with time zone', 'timestamptz', false, null],
      ['resolved_by', 'uuid', 'uuid', false, null],
    ]);
    const sources = await owner.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'core.error_source'::regtype ORDER BY enumsortorder`);
    expect(sources.rows.map((row) => row.enumlabel)).toEqual(['api', 'worker']);
    const keys = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.error_events'::regclass ORDER BY contype`,
    );
    expect(keys.rows).toEqual([
      { kind: 'f', def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' },
      { kind: 'p', def: 'PRIMARY KEY (id)' },
    ]);
  });

  it('lets the app only read its company’s errors and add errors through the function; the system account adds and reads them', async () => {
    const rights = await owner.query(
      `SELECT a AS account, r AS right, has_table_privilege(a, 'core.error_events', r) AS ok
         FROM unnest(ARRAY['nexus_app', 'nexus_system']) a, unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    expect(Object.fromEntries(rights.rows.map((x) => [`${x.account} ${x.right}`, x.ok]))).toEqual({
      'nexus_app SELECT': true,
      'nexus_app INSERT': false,
      'nexus_app UPDATE': false,
      'nexus_app DELETE': false,
      'nexus_app TRUNCATE': false,
      'nexus_system SELECT': true,
      'nexus_system INSERT': true,
      'nexus_system UPDATE': false,
      'nexus_system DELETE': false,
      'nexus_system TRUNCATE': false,
    });
    const more = await owner.query(
      `SELECT has_schema_privilege('nexus_system', 'core', 'USAGE') AS system_uses_core,
              has_schema_privilege('nexus_system', 'core', 'CREATE') AS system_makes_in_core,
              has_schema_privilege('nexus_app', 'core', 'CREATE') AS app_makes_in_core,
              has_function_privilege('nexus_system', 'core.uuid_v7()', 'EXECUTE') AS system_makes_ids,
              has_table_privilege('nexus_system', 'core.companies', 'SELECT') AS system_reads_companies,
              has_table_privilege('nexus_system', 'core.companies', 'INSERT') AS system_adds_companies`,
    );
    expect(more.rows[0]).toEqual({
      system_uses_core: true,
      system_makes_in_core: true,
      app_makes_in_core: false,
      system_makes_ids: true,
      system_reads_companies: true,
      system_adds_companies: false,
    });
  });

  it('has three functions owned by the system account, with a fixed search path, that the app may run and everyone may not', async () => {
    const functions = await owner.query(
      `SELECT p.oid::regprocedure::text AS name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS definer, p.provolatile AS volatility,
              p.proconfig::text AS config, has_function_privilege('nexus_app', p.oid, 'EXECUTE') AS app_runs,
              (SELECT count(*)::int FROM aclexplode(p.proacl) x WHERE x.grantee = 0) AS for_everyone
         FROM pg_proc p WHERE p.proname IN ('record_error', 'system_errors', 'system_security_entries') ORDER BY p.proname`,
    );
    const fixed = { owner: 'nexus_system', definer: true, config: '{"search_path=pg_catalog, pg_temp"}', app_runs: true, for_everyone: 0 };
    expect(functions.rows).toEqual([
      { name: 'core.record_error(text,text,text)', volatility: 'v', ...fixed },
      { name: 'core.system_errors(integer)', volatility: 's', ...fixed },
      { name: 'core.system_security_entries(bigint,integer)', volatility: 's', ...fixed },
    ]);
  });

  it('refuses an error the app adds by itself, even under its own company', async () => {
    await appClient.query('BEGIN');
    try {
      await appClient.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await expect(appClient.query(`INSERT INTO core.error_events (company_id, source, message) VALUES ($1, 'api', 'x')`, [A])).rejects.toThrow(
        'permission denied for table error_events',
      );
    } finally {
      await appClient.query('ROLLBACK');
    }
  });
});

describe('recordError (core.record_error)', () => {
  it('records an error under the request’s company, with its source, cleaned message and request ID; only that company sees it', async () => {
    const context = ctx({ companyId: A });
    const id = await runWithContext(context, () => recordError(new Error('the door crashed'), 'api'));
    expect(id).toMatch(V7);
    expect(await allErrors()).toMatchObject([
      { id, company_id: A, source: 'api', message: 'the door crashed', request_id: context.requestId, external_id: null, resolved_at: null, resolved_by: null },
    ]);
    expect((await appSees(A)).map((row) => row.id)).toEqual([id]);
    expect(await appSees(B)).toEqual([]);
  });

  it('records a system error, with no company, when the request has none; the app never sees it', async () => {
    const context = ctx();
    const id = await runWithContext(context, () => recordError(new Error('before the company is known'), 'api'));
    expect(await allErrors()).toMatchObject([{ id, company_id: null, message: 'before the company is known', request_id: context.requestId }]);
    for (const company of [A, B, undefined]) expect(await appSees(company)).toEqual([]);
  });

  it('records a system error with no request ID outside any context, and a worker’s error under its own source', async () => {
    await recordError(new Error('a job failed'), 'worker');
    expect(await allErrors()).toMatchObject([{ company_id: null, source: 'worker', message: 'a job failed', request_id: null }]);
  });

  it('treats a company setting never made and one set to empty the same: no company', async () => {
    const fresh = clientFor('DATABASE_URL_APP');
    await fresh.connect();
    try {
      await fresh.query("SELECT core.record_error('api', 'never set', NULL)");
      await fresh.query("SELECT set_config('app.company_id', '', false)");
      await fresh.query("SELECT core.record_error('api', 'set to empty', NULL)");
    } finally {
      await fresh.end();
    }
    expect((await allErrors()).map((row) => [row.message, row.company_id])).toEqual([
      ['never set', null],
      ['set to empty', null],
    ]);
  });

  it('keeps only the cleaned message: never a failed query’s values, only the kind of a thrown value that is not an error, at most 2000 characters', async () => {
    const failed = await runWithContext(ctx({ companyId: A }), () =>
      inRequestTransaction(() => getContext().tx!.execute(sql`SELECT ${'SECRET-0019-VALUE'}::int AS n`)).catch((error: unknown) => error),
    );
    await runWithContext(ctx({ companyId: A }), () => recordError(failed, 'api'));
    await recordError({ message: 'a plain object\nparams: SECRET-P', params: ['SECRET-P'] }, 'api');
    await recordError('SECRET-STRING', 'api');
    await recordError(new TypeError(''), 'api');
    await recordError(new Error('y'.repeat(3000)), 'api');
    const rows = await allErrors();
    expect(rows.map((row) => String(row.message).slice(0, 40))).toEqual(['Failed query: SELECT $1::int AS n', 'a plain object', 'string', 'TypeError', 'y'.repeat(40)]);
    expect(String(rows[4]!.message)).toHaveLength(2000);
    expect(JSON.stringify(rows)).not.toContain('SECRET');
  });

  it('keeps the error when the request’s own transaction is undone', async () => {
    await expect(
      runWithContext(ctx({ companyId: A }), () =>
        inRequestTransaction(async () => {
          await recordError(new Error('kept'), 'api');
          throw new Error('the request failed');
        }),
      ),
    ).rejects.toThrow('the request failed');
    expect((await allErrors()).map((row) => [row.message, row.company_id])).toEqual([['kept', A]]);
  });

  it('refuses an unknown source and saves nothing', async () => {
    const refused = (await recordError(new Error('x'), 'screens' as never).catch((error: unknown) => error)) as Error & { cause?: Error };
    expect(String(refused.cause?.message)).toContain('invalid input value for enum core.error_source');
    expect(await allErrors()).toEqual([]);
  });
});

describe('the error handler', () => {
  it('keeps an unexpected error as a system error with the request’s ID, and still answers the plain 500', async () => {
    const res = await request(web).get('/api/test/crash');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'server_error', message: 'Something went wrong. Please try again.', requestId: res.headers['x-request-id'] },
    });
    expect(await eventually(1)).toMatchObject([{ company_id: null, source: 'api', message: 'the door crashed', request_id: res.headers['x-request-id'] }]);
  });

  it('keeps it under the request’s company when the request has one', async () => {
    const res = await request(web).get('/api/test/company-crash');
    expect(res.status).toBe(500);
    expect(await eventually(1)).toMatchObject([{ company_id: A, message: 'the company door crashed', request_id: res.headers['x-request-id'] }]);
  });

  it('logs an AppError of 500 or more at error level and keeps it, answering with its own status and format', async () => {
    const start = lines.length;
    const res = await request(web).get('/api/test/down');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: { code: 'door_down', message: 'The mail service is down', requestId: res.headers['x-request-id'] } });
    expect(await eventually(1)).toMatchObject([{ message: 'The mail service is down', request_id: res.headers['x-request-id'] }]);
    expect(
      logged(start).some((line) => line.level === 50 && line.msg === 'server error' && line.requestId === res.headers['x-request-id'] && line.err?.type === 'AppError'),
    ).toBe(true);
  });

  it('keeps no answer under 500: an AppError under 500, an unknown door and refused bodies are neither kept nor logged as server errors', async () => {
    const start = lines.length;
    expect((await request(web).get('/api/test/stale')).status).toBe(409);
    expect((await request(web).get('/api/no-such-door')).status).toBe(404);
    expect((await request(web).post('/api/test/input').set('Content-Type', 'application/json').send('{bad json')).status).toBe(400);
    expect((await request(web).post('/api/test/input').send({})).status).toBe(400);
    await pause(500);
    expect(await allErrors()).toEqual([]);
    expect(logged(start).some((line) => line.msg === 'server error')).toBe(false);
  });

  it('never makes the answer wait for the error to be kept', { timeout: 30_000 }, async () => {
    process.env.DB_SECURITY_POOL_SIZE = '1';
    await closePools();
    let release: (() => void) | undefined;
    const held = securityWriteWithoutCompany(() => new Promise<void>((resolve) => (release = resolve)));
    while (!release) await pause(20);
    const started = Date.now();
    const res = await request(web).get('/api/test/crash');
    expect(res.status).toBe(500);
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(await allErrors()).toEqual([]);
    release();
    await held;
    expect(await eventually(1)).toMatchObject([{ message: 'the door crashed', request_id: res.headers['x-request-id'] }]);
  });

  it('answers the same way when the error cannot be kept, and logs that as a warning with the reason only', async () => {
    await closePools();
    delete process.env.DATABASE_URL_APP;
    const start = lines.length;
    const res = await request(web).get('/api/test/crash');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    let warning: Record<string, any> | undefined;
    for (let i = 0; i < 50 && !warning; i += 1) {
      warning = logged(start).find((line) => line.msg === 'error not recorded');
      if (!warning) await pause(100);
    }
    expect(warning).toMatchObject({ level: 40, requestId: res.headers['x-request-id'], err: { message: 'DATABASE_URL_APP is not set' } });
    expect(await allErrors()).toEqual([]);
  });
});

describe('the readers of the system rows (only while Nexus has one company)', () => {
  beforeAll(async () => {
    await resetCompanies(owner);
    const made = await owner.query(`INSERT INTO core.companies (name, slug) VALUES ('Test Company A', 'test-company-a') RETURNING id`);
    A = String(made.rows[0]!.id);
    B = '';
  });

  it('core.system_errors gives the newest system errors first, never a company’s, at least 1 and at most 500 of them', async () => {
    for (const message of ['first', 'second', 'third']) await recordError(new Error(message), 'api');
    await runWithContext(ctx({ companyId: A }), () => recordError(new Error('the company’s own'), 'api'));
    const read = async (limit: number) => (await appClient.query('SELECT message, company_id FROM core.system_errors($1)', [limit])).rows;
    expect(await read(10)).toEqual([
      { message: 'third', company_id: null },
      { message: 'second', company_id: null },
      { message: 'first', company_id: null },
    ]);
    expect((await read(2)).map((row) => row.message)).toEqual(['third', 'second']);
    expect((await read(0)).map((row) => row.message)).toEqual(['third']);
    await owner.query('BEGIN');
    try {
      await owner.query('SET LOCAL ROLE nexus_system');
      await owner.query(`INSERT INTO core.error_events (source, message) SELECT 'worker', 'bulk ' || g FROM generate_series(1, 501) g`);
    } finally {
      await owner.query('COMMIT');
    }
    expect(await read(1000)).toHaveLength(500);
  });

  it('core.system_security_entries gives the system chain newest first, before a number, never a company’s chain', async () => {
    for (const event of ['signin_failed', 'signin_failed', 'account_locked'] as const) {
      await runWithContext(ctx(), () => securityWriteWithoutCompany(() => writeSecurity({ event })));
    }
    await runWithContext(ctx({ companyId: A }), () => securityWrite(A, () => writeSecurity({ event: 'signin_ok' })));
    const read = async (before: number | null, limit: number) =>
      (await appClient.query('SELECT seq, event, company_id FROM core.system_security_entries($1, $2)', [before, limit])).rows;
    expect(await read(null, 10)).toEqual([
      { seq: '3', event: 'account_locked', company_id: null },
      { seq: '2', event: 'signin_failed', company_id: null },
      { seq: '1', event: 'signin_failed', company_id: null },
    ]);
    expect(await read(3, 1)).toEqual([{ seq: '2', event: 'signin_failed', company_id: null }]);
    expect(await read(1, 10)).toEqual([]);
  });

  it('both readers refuse once Nexus has a second company, until the platform operator is settled', async () => {
    await recordError(new Error('a system error'), 'api');
    await owner.query(`INSERT INTO core.companies (name, slug) VALUES ('Test Company B', 'test-company-b')`);
    await expect(appClient.query('SELECT * FROM core.system_errors(10)')).rejects.toThrow('system rows need the platform operator');
    await expect(appClient.query('SELECT * FROM core.system_security_entries(NULL, 10)')).rejects.toThrow('system rows need the platform operator');
  });
});
