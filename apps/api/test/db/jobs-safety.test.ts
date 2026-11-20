// TASK-0097 · The real pg-boss on the test database: starting the job queue makes no queue of its own (its scheduler is off), and when its connections are cut it logs `job queue error`, nothing stops, and the next job still runs. Written by the planner; builders never edit this file.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools } from '../../src/db/database.js';
import { defineJob, sendJob, startJobs } from '../../src/jobs/jobs.js';
import { queueSql } from '../../src/jobs/queues.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _encoding, done) => (lines.push(String(chunk)), done()) }));
const logged = (from: number) => lines.slice(from).map((line) => JSON.parse(line) as Record<string, unknown>);
let A = '';
let n = 0;
const ctx = (): RequestContext => {
  n += 1;
  return { requestId: `req-0097-${n}`, background: false, companyId: A };
};
async function eventually<T>(read: () => Promise<T> | T, done: (value: T) => boolean, ms = 20_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (done(value) || Date.now() > until) return value;
    await pause(200);
  }
}
const queues = async () => (await owner.query('SELECT name FROM pgboss.queue ORDER BY name')).rows.map((row) => String(row.name));

const ran: string[] = [];
const probe = defineJob<{ label: string }>({
  name: 'core.probe-0097',
  retries: 0,
  handle: async (data) => {
    ran.push(data.label);
  },
});

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A } = await makeTestCompanies(owner));
  await owner.query(queueSql('core.probe-0097'));
  // A queue the scheduler of an earlier build may have made in this database.
  await owner.query(`SELECT pgboss.delete_queue(name) FROM pgboss.queue WHERE name = '__pgboss__send-it'`);
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('starting the job queue', () => {
  it('makes no queue of its own: only the queues made by database changes are there', { timeout: 60_000 }, async () => {
    const before = await queues();
    expect(before).toContain('core.probe-0097');
    expect(before).not.toContain('__pgboss__send-it');
    const jobs = startJobs({ jobs: [probe], logger });
    try {
      await runWithContext(ctx(), () => sendJob(probe, { label: 'started' }));
      await eventually(() => ran.includes('started'), Boolean);
      await pause(1_000);
    } finally {
      await jobs.stop();
    }
    expect(ran).toContain('started');
    expect(await queues()).toEqual(before);
  });
});

describe('a lost connection', () => {
  it('is logged as job queue error, stops nothing, and the next job still runs', { timeout: 60_000 }, async () => {
    const start = lines.length;
    const jobs = startJobs({ jobs: [probe], logger });
    const cutter = clientFor('DATABASE_URL_APP');
    await cutter.connect();
    try {
      await runWithContext(ctx(), () => sendJob(probe, { label: 'before the cut' }));
      await eventually(() => ran.includes('before the cut'), Boolean);
      const cut = await cutter.query(
        `SELECT count(*)::int AS n FROM (SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name LIKE 'pgboss%' AND pid <> pg_backend_pid()) AS cut`,
      );
      expect(cut.rows[0].n).toBeGreaterThan(0);
      await eventually(() => logged(start).filter((line) => line.msg === 'job queue error').length, (count) => count > 0, 15_000);
      // Right after a cut, a send may still meet a connection the pool has not dropped yet: it fails once, as any
      // request would; the job queue itself keeps working.
      const sent = await eventually(
        () => runWithContext(ctx(), () => sendJob(probe, { label: 'after the cut' })).then(() => true, () => false),
        Boolean,
        15_000,
      );
      expect(sent).toBe(true);
      await eventually(() => ran.includes('after the cut'), Boolean, 30_000);
    } finally {
      await cutter.end();
      await jobs.stop();
    }
    const errors = logged(start).filter((line) => line.msg === 'job queue error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((line) => line.level === 50)).toBe(true);
    expect(ran).toContain('after the cut');
  });
});
