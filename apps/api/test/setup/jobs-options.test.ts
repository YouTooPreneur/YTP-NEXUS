// TASK-0097 · How the job queue makes pg-boss, checked with a stand-in for pg-boss: once per process; never changing its schema and making nothing at run time (no scheduler); doing its upkeep only when the worker's startJobs made it, the API's sendJob only sending; an error listener added before it starts, which logs `job queue error` and never throws. Written by the planner; builders never edit this file.
import { describe, expect, it, vi } from 'vitest';
import { Writable } from 'node:stream';

interface Made {
  options: Record<string, unknown>;
  calls: string[];
  listeners: Map<string, (value: unknown) => void>;
}
const { made } = vi.hoisted(() => ({ made: [] as Made[] }));

vi.mock('pg-boss', () => ({
  PgBoss: class {
    private readonly record: Made;
    constructor(options: Record<string, unknown>) {
      this.record = { options, calls: [], listeners: new Map() };
      made.push(this.record);
    }
    on(event: string, listener: (value: unknown) => void) {
      this.record.calls.push(`on:${event}`);
      this.record.listeners.set(event, listener);
      return this;
    }
    async start() {
      this.record.calls.push('start');
      return this;
    }
    async send() {
      this.record.calls.push('send');
      return 'job-0097';
    }
    async work() {
      this.record.calls.push('work');
      return 'worker-0097';
    }
    async stop() {
      this.record.calls.push('stop');
    }
  },
}));

async function fresh() {
  vi.resetModules();
  made.length = 0;
  const jobs = await import('../../src/jobs/jobs.js');
  const context = await import('../../src/shared/context.js');
  const logging = await import('../../src/shared/logging.js');
  return { ...jobs, runWithContext: context.runWithContext, createLogger: logging.createLogger };
}
const inCompany = { requestId: 'req-0097', background: false, companyId: '0190f2a6-6c1e-7b3a-9d2f-000000000097' };
const quiet = () => new Writable({ write: (_chunk, _encoding, done) => done() });

describe('the job queue’s pg-boss', () => {
  it('is made once by sendJob in the API: no upkeep, no scheduler, its schema left alone, its errors listened to before it starts', async () => {
    const { defineJob, sendJob, runWithContext, JOB_POOL_SIZE } = await fresh();
    const job = defineJob<{ n: number }>({ name: 'core.probe-0097', retries: 0, handle: () => {} });
    await runWithContext(inCompany, () => sendJob(job, { n: 1 }));
    await runWithContext(inCompany, () => sendJob(job, { n: 2 }));
    expect(made).toHaveLength(1);
    expect(made[0]!.options).toMatchObject({ schema: 'pgboss', max: JOB_POOL_SIZE, migrate: false, schedule: false, supervise: false });
    expect(made[0]!.calls).toEqual(['on:error', 'start', 'send', 'send']);
  });

  it('is made by startJobs in the worker with its upkeep on, and sendJob then uses that one', async () => {
    const { defineJob, sendJob, startJobs, runWithContext, createLogger } = await fresh();
    const job = defineJob<{ n: number }>({ name: 'core.probe-0097', retries: 0, handle: () => {} });
    const jobs = startJobs({ jobs: [job], logger: createLogger(quiet()) });
    await vi.waitFor(() => expect(made[0]?.calls).toContain('work'));
    await runWithContext(inCompany, () => sendJob(job, { n: 3 }));
    await jobs.stop();
    expect(made).toHaveLength(1);
    expect(made[0]!.options).toMatchObject({ migrate: false, schedule: false, supervise: true });
    expect(made[0]!.calls.slice(0, 2)).toEqual(['on:error', 'start']);
    expect(made[0]!.calls).toContain('send');
    expect(made[0]!.calls.at(-1)).toBe('stop');
  });

  it('logs pg-boss’s own errors as job queue error with startJobs’s logger, and never throws', async () => {
    const { startJobs, createLogger } = await fresh();
    const lines: string[] = [];
    const logger = createLogger(new Writable({ write: (chunk, _encoding, done) => (lines.push(String(chunk)), done()) }));
    const jobs = startJobs({ jobs: [], logger });
    await vi.waitFor(() => expect(made[0]?.calls).toContain('start'));
    const listener = made[0]!.listeners.get('error');
    expect(listener).toBeTypeOf('function');
    expect(() => listener!(new Error('Connection terminated unexpectedly'))).not.toThrow();
    expect(() => listener!({ message: 'fetch failed', queue: 'core.probe-0097' })).not.toThrow();
    await jobs.stop();
    const errors = lines.map((line) => JSON.parse(line) as Record<string, any>).filter((line) => line.msg === 'job queue error');
    expect(errors).toHaveLength(2);
    expect(errors.every((line) => line.level === 50)).toBe(true);
    expect(errors[0]!.err.message).toBe('Connection terminated unexpectedly');
  });

  it('also listens when sendJob made it, logging with a logger of its own, and never throws', async () => {
    const { defineJob, sendJob, runWithContext } = await fresh();
    const job = defineJob<{ n: number }>({ name: 'core.probe-0097', retries: 0, handle: () => {} });
    await runWithContext(inCompany, () => sendJob(job, { n: 4 }));
    const listener = made[0]!.listeners.get('error');
    expect(listener).toBeTypeOf('function');
    expect(() => listener!(new Error('Connection terminated unexpectedly'))).not.toThrow();
  });
});
