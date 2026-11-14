// TASK-0023 · The per-address limit: core.rate_counters and its rights, hitLimit (one count per request in fixed windows on the database's clock, refused requests included, one limit_hit entry per window), and the limiter on the sign-in and two-step doors. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools } from '../../src/db/database.js';
import { hitLimit } from '../../src/modules/core/repository/rate-counters.js';
import { clientFor, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let n = 0;
let savedSettings: NodeJS.ProcessEnv = {};

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0023-${n}`, background: false, ip: '203.0.113.50', userAgent: 'Chrome 131', ...more };
};
const counters = async () =>
  (await owner.query('SELECT bucket, count FROM core.rate_counters ORDER BY bucket, window_start')).rows.map((row) => [row.bucket, row.count]);
// The security log's system chain, read as the system account (the owner may switch to it).
async function systemChain(): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query('SET LOCAL ROLE nexus_system');
    return (await owner.query('SELECT * FROM audit.security_log WHERE company_id IS NULL ORDER BY seq')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}

const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const web = createApp({
  logger,
  routes: (a) => {
    a.get('/api/auth/x', (_req, res) => {
      res.json({ ok: true });
    });
    a.post('/api/core/two-step/x', (_req, res) => {
      res.json({ ok: true });
    });
    a.get('/api/authx/y', (_req, res) => {
      res.json({ ok: true });
    });
    a.get('/api/core/other', (_req, res) => {
      res.json({ ok: true });
    });
  },
});
const from = (address: string) => request(web).get('/api/auth/x').set('X-Forwarded-For', address);

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
});

// No test's requests may fall in two windows: when fewer than 5 seconds are left in the database clock's minute, the test
// waits for the next one.
beforeEach(async () => {
  savedSettings = { ...process.env };
  process.env.ADDRESS_LIMITS = 'signin:3/minute,public:60/minute';
  const left = Number((await owner.query('SELECT 60 - mod(extract(epoch FROM clock_timestamp()), 60) AS left')).rows[0]!.left);
  if (left < 5) await pause(left * 1_000 + 50);
});

afterEach(async () => {
  vi.useRealTimers();
  await closePools();
  for (const key of Object.keys(process.env)) if (!(key in savedSettings)) delete process.env[key];
  Object.assign(process.env, savedSettings);
  await owner.query('TRUNCATE core.rate_counters');
  await owner.query('TRUNCATE audit.security_log');
});

afterAll(async () => {
  await closePools();
  await owner.end();
});

describe('core.rate_counters (the table and its rights)', () => {
  it('has exactly a bucket, a window start and a count, keyed by bucket and window, with no company and no row rule', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'rate_counters' ORDER BY ordinal_position`,
    );
    expect(columns.rows.map((c) => [c.name, c.type, c.required, c.default])).toEqual([
      ['bucket', 'text', true, null],
      ['window_start', 'timestamp with time zone', true, null],
      ['count', 'integer', true, null],
    ]);
    const keys = await owner.query(`SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.rate_counters'::regclass`);
    expect(keys.rows).toEqual([{ kind: 'p', def: 'PRIMARY KEY (bucket, window_start)' }]);
    const rules = await owner.query(`SELECT relrowsecurity AS rules FROM pg_class WHERE oid = 'core.rate_counters'::regclass`);
    expect(rules.rows).toEqual([{ rules: false }]);
  });

  it('lets the app read, add and change counters, and nothing more', async () => {
    const rights = await owner.query(
      `SELECT r AS right, has_table_privilege('nexus_app', 'core.rate_counters', r) AS ok
         FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) r`,
    );
    expect(Object.fromEntries(rights.rows.map((x) => [x.right, x.ok]))).toEqual({
      SELECT: true,
      INSERT: true,
      UPDATE: true,
      DELETE: false,
      TRUNCATE: false,
      REFERENCES: false,
      TRIGGER: false,
    });
  });
});

describe('hitLimit', () => {
  const limit = { name: 'signin', key: 'ip:203.0.113.50', max: 2, windowSeconds: 60 };

  it('counts each request in its bucket, refused ones too, and says when the limit is passed', async () => {
    const counted = [];
    for (let i = 0; i < 4; i += 1) counted.push(await runWithContext(ctx(), () => hitLimit(limit)));
    expect(counted.map((c) => [c.count, c.refused])).toEqual([
      [1, false],
      [2, false],
      [3, true],
      [4, true],
    ]);
    for (const c of counted) expect(c.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    for (const c of counted) expect(c.retryAfterSeconds).toBeLessThanOrEqual(60);
    const left = Number((await owner.query('SELECT ceil(60 - mod(extract(epoch FROM clock_timestamp()), 60)) AS left')).rows[0]!.left);
    expect(Math.abs(counted[3]!.retryAfterSeconds - left)).toBeLessThanOrEqual(1);
    await runWithContext(ctx(), () => hitLimit({ ...limit, key: 'ip:198.51.100.7' }));
    expect(await counters()).toEqual([
      ['signin:ip:198.51.100.7', 1],
      ['signin:ip:203.0.113.50', 4],
    ]);
  });

  it('starts again at 1 in the next window', { timeout: 10_000 }, async () => {
    const short = { ...limit, windowSeconds: 1 };
    await runWithContext(ctx(), () => hitLimit(short));
    await runWithContext(ctx(), () => hitLimit(short));
    await pause(1_100);
    expect((await runWithContext(ctx(), () => hitLimit(short))).count).toBe(1);
  });

  it('counts forty requests at once exactly once each, without making them wait', async () => {
    const started = Date.now();
    const counted = await Promise.all(Array.from({ length: 40 }, () => runWithContext(ctx(), () => hitLimit({ ...limit, max: 100 }))));
    expect(counted.map((c) => c.count).sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it('works out the window by the database’s clock, never the API’s', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2001-02-03T04:05:06Z') });
    await runWithContext(ctx(), () => hitLimit(limit));
    const row = (await owner.query(`SELECT window_start, extract(epoch FROM now() - window_start) AS age FROM core.rate_counters`)).rows[0]!;
    expect(Number(row.age)).toBeGreaterThanOrEqual(0);
    expect(Number(row.age)).toBeLessThan(60);
    expect(new Date(row.window_start).getUTCSeconds()).toBe(0);
  });

  it('writes one limit_hit entry in the system chain for the first refused request of a window, with the address and browser', async () => {
    for (let i = 0; i < 5; i += 1) await runWithContext(ctx(), () => hitLimit(limit));
    const chain = await systemChain();
    expect(chain).toHaveLength(1);
    expect(chain[0]).toMatchObject({
      company_id: null,
      seq: '1',
      event: 'limit_hit',
      ip: '203.0.113.50',
      user_agent: 'Chrome 131',
      details: { limit: 'signin', max: 2, windowSeconds: 60 },
    });
  });
});

describe('the per-address limit on the sign-in and two-step doors', () => {
  it('lets the first requests from an address through and answers 429 with Retry-After past the limit', async () => {
    const answers = [];
    for (let i = 0; i < 4; i += 1) answers.push(await from('203.0.113.7'));
    expect(answers.map((r) => r.status)).toEqual([200, 200, 200, 429]);
    const refused = answers[3]!;
    expect(refused.body).toEqual({
      error: { code: 'too_many_requests', message: expect.stringMatching(/^Too many tries\. Please try again in \d+ seconds\.$/), requestId: refused.headers['x-request-id'] },
    });
    const wait = Number(refused.headers['retry-after']);
    expect(wait).toBeGreaterThanOrEqual(1);
    expect(wait).toBeLessThanOrEqual(60);
    expect(refused.body.error.message).toBe(`Too many tries. Please try again in ${wait} seconds.`);
  });

  it('counts the address the proxy saw: a first address in X-Forwarded-For makes no bucket of its own', async () => {
    await from('198.51.100.1, 203.0.113.8');
    await from('203.0.113.8');
    await from('::ffff:203.0.113.8');
    expect(await counters()).toEqual([['signin:ip:203.0.113.8', 3]]);
  });

  it('counts the two-step doors in the same sign-in bucket, every method, and paths in any case', async () => {
    await from('203.0.113.9');
    await request(web).post('/api/core/two-step/x').set('X-Forwarded-For', '203.0.113.9').send({});
    await request(web).get('/API/AUTH/x').set('X-Forwarded-For', '203.0.113.9');
    expect(await counters()).toEqual([['signin:ip:203.0.113.9', 3]]);
    expect((await from('203.0.113.9')).status).toBe(429);
  });

  it('keeps counting refused requests, and never slows another address', async () => {
    for (let i = 0; i < 6; i += 1) await from('203.0.113.10');
    expect((await from('203.0.113.11')).status).toBe(200);
    expect(await counters()).toEqual([
      ['signin:ip:203.0.113.10', 6],
      ['signin:ip:203.0.113.11', 1],
    ]);
  });

  it('slows one address’s flood of a hundred requests at once while another address still gets in (NFR-020)', { timeout: 30_000 }, async () => {
    const answers = await Promise.all(Array.from({ length: 100 }, () => from('203.0.113.12')));
    const statuses = answers.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(3);
    expect(statuses.filter((s) => s === 429)).toHaveLength(97);
    expect((await from('203.0.113.13')).status).toBe(200);
    expect((await systemChain()).filter((entry) => entry.event === 'limit_hit')).toHaveLength(1);
  });

  it('counts nothing on other doors, nor on a path that only starts with the same letters', async () => {
    expect((await request(web).get('/api/authx/y').set('X-Forwarded-For', '203.0.113.14')).status).toBe(200);
    expect((await request(web).get('/api/core/other').set('X-Forwarded-For', '203.0.113.14')).status).toBe(200);
    expect((await request(web).get('/api/health').set('X-Forwarded-For', '203.0.113.14')).status).toBe(200);
    expect(await counters()).toEqual([]);
  });

  it('runs after the same-site check and before the body is read', async () => {
    const crossSite = await request(web).post('/api/core/two-step/x').set('X-Forwarded-For', '203.0.113.15').set('Sec-Fetch-Site', 'cross-site').send({});
    expect(crossSite.status).toBe(403);
    expect(await counters()).toEqual([]);
    for (let i = 0; i < 3; i += 1) await from('203.0.113.15');
    const badBody = await request(web).post('/api/core/two-step/x').set('X-Forwarded-For', '203.0.113.15').set('Content-Type', 'application/json').send('{bad json');
    expect(badBody.status).toBe(429);
  });

  it('answers 500, never lets the request through, when the counter cannot be reached; other doors still work', async () => {
    await closePools();
    delete process.env.DATABASE_URL_APP;
    const res = await from('203.0.113.16');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    expect((await request(web).get('/api/health')).status).toBe(200);
  });

  it('answers 500 when ADDRESS_LIMITS is wrong, naming the wrong part only in the log', async () => {
    process.env.ADDRESS_LIMITS = 'signin:lots/minute,public:60/minute';
    const start = lines.length;
    const res = await from('203.0.113.17');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    expect(lines.slice(start).join('\n')).toContain('ADDRESS_LIMITS has a part that is not <name>:<count>/<unit>: signin:lots/minute');
    expect(await counters()).toEqual([]);
  });
});
