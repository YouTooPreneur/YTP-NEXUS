// TASK-0021 · The job queue in the worker (pg-boss 12.38.0): its schema owned by nexus_owner and never changed by the app, queues made only by the owner, a job sent with its company, each job run once in its own context and transaction, failures cleaned, logged, kept and retried, stop() and the connection budget. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools, poolSettings } from '../../src/db/database.js';
import { writeActivity } from '../../src/modules/core/repository/activity-log.js';
import { JOB_POOL_SIZE, defineJob, sendJob, startJobs } from '../../src/jobs/jobs.js';
import { queueSql } from '../../src/jobs/queues.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const RECORD = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let A = '';
let B = '';
let n = 0;
const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const logged = (from: number) => lines.slice(from).map((line) => JSON.parse(line) as Record<string, any>);
const ctx = (companyId: string): RequestContext => {
  n += 1;
  return { requestId: `req-0021-${n}`, background: false, companyId };
};
async function eventually<T>(read: () => Promise<T> | T, done: (value: T) => boolean, ms = 20_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (done(value) || Date.now() > until) return value;
    await pause(200);
  }
}
async function activity(companyId: string): Promise<string[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query('SELECT record_label FROM audit.activity_log ORDER BY at')).rows.map((r) => String(r.record_label));
  } finally {
    await owner.query('COMMIT');
  }
}

// The probe jobs (their queues are made by the owner below, as a database change would make them).
const seen: Record<string, unknown>[] = [];
const probe = defineJob<{ label: string }>({
  name: 'core.probe-0021',
  retries: 0,
  handle: async (data) => {
    const context = getContext();
    seen.push({ label: data.label, companyId: context.companyId, background: context.background, hasTx: Boolean(context.tx) });
    await writeActivity({ module: 'core', recordType: 'probe', recordId: RECORD, recordLabel: data.label, action: 'ran', actor: { type: 'system', label: 'probe job' } });
  },
});
let failures = 0;
const failing = defineJob<{ label: string }>({
  name: 'core.probe-0021-fails',
  retries: 1,
  handle: async () => {
    failures += 1;
    throw Object.assign(new Error('Failed query: select 1\nparams: SECRET-P-0021'), { params: ['SECRET-P-0021'], input: 'postgres://u:SECRET-PW-0021@h/d' });
  },
});

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
  for (const name of ['core.probe-0021', 'core.probe-0021-fails']) await owner.query(queueSql(name));
});

afterEach(async () => {
  await closePools();
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('the pgboss schema', () => {
  it('belongs to nexus_owner with everything in it, even after queues are made, and the app may create nothing there', async () => {
    const owners = await owner.query(
      `SELECT DISTINCT pg_get_userbyid(o) AS owner FROM (
         SELECT nspowner AS o FROM pg_namespace WHERE nspname = 'pgboss'
         UNION ALL SELECT relowner FROM pg_class WHERE relnamespace = 'pgboss'::regnamespace
         UNION ALL SELECT proowner FROM pg_proc WHERE pronamespace = 'pgboss'::regnamespace) x`,
    );
    expect(owners.rows).toEqual([{ owner: 'nexus_owner' }]);
    const rights = await owner.query(
      `SELECT has_schema_privilege('nexus_app', 'pgboss', 'USAGE') AS uses, has_schema_privilege('nexus_app', 'pgboss', 'CREATE') AS creates,
              (SELECT count(*)::int FROM pg_class WHERE relowner = 'nexus_app'::regrole) AS app_owns`,
    );
    expect(rights.rows[0]).toEqual({ uses: true, creates: false, app_owns: 0 });
  });
});

describe('sending a job', () => {
  it('keeps the company of the request with the job, and refuses a job outside a company', async () => {
    const id = await runWithContext(ctx(A), () => sendJob(probe, { label: 'kept for later' }));
    expect(typeof id).toBe('string');
    const row = (await owner.query(`SELECT name, data FROM pgboss.job WHERE id::text = $1`, [id])).rows[0];
    expect(row).toMatchObject({ name: 'core.probe-0021', data: { companyId: A, data: { label: 'kept for later' } } });
    await expect(sendJob(probe, { label: 'x' })).rejects.toThrow('a job needs the company');
    await expect(runWithContext({ requestId: 'r', background: false }, () => sendJob(probe, { label: 'x' }))).rejects.toThrow('a job needs the company');
  });
});

describe('running jobs', () => {
  it('runs each job once, in a fresh background context and a transaction of the job’s company only', async () => {
    seen.length = 0;
    await runWithContext(ctx(A), () => sendJob(probe, { label: 'for A' }));
    await runWithContext(ctx(B), () => sendJob(probe, { label: 'for B' }));
    const jobs = startJobs({ jobs: [probe, failing], logger });
    try {
      await eventually(() => seen.length, (count) => count >= 3, 30_000);
      await pause(1_000);
    } finally {
      await jobs.stop();
    }
    const ran = seen.filter((s) => s.label === 'for A' || s.label === 'for B');
    expect(ran).toEqual(
      expect.arrayContaining([
        { label: 'for A', companyId: A, background: true, hasTx: true },
        { label: 'for B', companyId: B, background: true, hasTx: true },
      ]),
    );
    expect(ran).toHaveLength(2);
    expect(await activity(A)).toContain('for A');
    expect(await activity(A)).not.toContain('for B');
    expect(await activity(B)).toContain('for B');
  });

  it('logs a failed job with its ID, keeps a cleaned error under its company, retries it, and stores nothing secret', async () => {
    failures = 0;
    const start = lines.length;
    const id = await runWithContext(ctx(A), () => sendJob(failing, { label: 'breaks' }));
    const jobs = startJobs({ jobs: [probe, failing], logger });
    try {
      await eventually(() => failures, (count) => count >= 2, 60_000);
      await eventually(async () => (await owner.query(`SELECT state FROM pgboss.job WHERE id::text = $1`, [id])).rows[0]?.state, (s) => s === 'failed', 20_000);
    } finally {
      await jobs.stop();
    }
    expect(failures).toBe(2);
    const failedLines = logged(start).filter((line) => line.msg === 'job failed');
    expect(failedLines.length).toBeGreaterThanOrEqual(2);
    expect(failedLines.every((line) => line.level === 50 && line.jobId === id)).toBe(true);
    const job = (await owner.query(`SELECT state, output FROM pgboss.job WHERE id::text = $1`, [id])).rows[0];
    expect(job.state).toBe('failed');
    expect(JSON.stringify(job.output)).toContain('Failed query: select 1');
    await owner.query('BEGIN');
    const kept = await owner.query(`SET LOCAL ROLE nexus_system; SELECT company_id, source, message FROM core.error_events WHERE message LIKE 'Failed query: select 1%'`).then(
      (results) => (Array.isArray(results) ? results[1]! : results),
    );
    await owner.query('COMMIT');
    expect(kept.rows.length).toBeGreaterThanOrEqual(1);
    expect(kept.rows[0]).toMatchObject({ company_id: A, source: 'worker', message: 'Failed query: select 1' });
    const everything = JSON.stringify(job) + lines.slice(start).join('\n') + JSON.stringify(kept.rows);
    expect(everything).not.toContain('SECRET');
  });

  it('stop() waits for a running job, then leaves no timer behind', async () => {
    const timers = () => process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length;
    let finished = false;
    const slow = defineJob<{ label: string }>({
      name: 'core.probe-0021',
      retries: 0,
      handle: async () => {
        await pause(1_500);
        finished = true;
      },
    });
    await runWithContext(ctx(A), () => sendJob(slow, { label: 'slow' }));
    const before = timers();
    const jobs = startJobs({ jobs: [slow], logger });
    await eventually(async () => (await owner.query(`SELECT count(*)::int AS n FROM pgboss.job WHERE name = 'core.probe-0021' AND state = 'active'`)).rows[0].n, (count) => count > 0);
    await jobs.stop();
    expect(finished).toBe(true);
    await pause(200);
    expect(timers()).toBeLessThanOrEqual(before);
  });
});

describe('the connection budget', () => {
  it('keeps the API’s and the worker’s pools and the job queue’s own pool well under the database’s limit', async () => {
    const limit = Number((await owner.query('SHOW max_connections')).rows[0].max_connections);
    const { request, security } = poolSettings({ DATABASE_URL_APP: 'postgres://nexus_app:x@localhost:5432/nexus' });
    const total = 2 * (Number(request.max) + Number(security.max)) + JOB_POOL_SIZE;
    expect(JOB_POOL_SIZE).toBeGreaterThanOrEqual(1);
    expect(JOB_POOL_SIZE).toBeLessThanOrEqual(4);
    expect(total).toBeLessThanOrEqual(limit - 20);
  });
});
