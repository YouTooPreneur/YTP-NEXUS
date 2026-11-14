// TASK-0094 · Announcements delivered by the worker: once to each listener, each in a savepoint of its own after its receipt, company by company in contexts of their own, each try counted before the listeners run, with tries again later, a limit, a share per round, clean errors, and the loop that never overlaps; and the two new helpers of database.ts. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Writable } from 'node:stream';
import { sql } from 'drizzle-orm';
import { allAnnouncements } from '../../src/announcements.js';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { createLogger } from '../../src/shared/logging.js';
import {
  closePools,
  inCompanyTransaction,
  inRequestTransaction,
  listCompanyIds,
  securityWrite,
} from '../../src/db/database.js';
import { announce } from '../../src/modules/core/repository/outbox.js';
import { writeActivity } from '../../src/modules/core/repository/activity-log.js';
import { recordError } from '../../src/modules/core/repository/error-events.js';
import {
  MAX_ATTEMPTS,
  PER_ROUND,
  deliverPending,
  startDelivery,
  type Delivered,
  type Listener,
} from '../../src/modules/core/events/delivery.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

// The real error recorder, which one test makes fail once.
vi.mock('../../src/modules/core/repository/error-events.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/modules/core/repository/error-events.js')>();
  return { ...real, recordError: vi.fn(real.recordError) };
});

const owner = clientFor('DATABASE_URL_OWNER');
const EVENT = 'core.probe.delivered';
const OTHER = 'core.probe.other';
const RECORD = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let A = '';
let B = '';
let n = 0;
let savedSettings: NodeJS.ProcessEnv = {};

const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const logged = (msg: string) => lines.map((line) => JSON.parse(line) as Record<string, any>).filter((line) => line.msg === msg);

const ctx = (companyId?: string): RequestContext => {
  n += 1;
  return { requestId: `req-0094-${n}`, background: false, companyId, userId: RECORD };
};

// The two companies in the order a round takes them (by ID).
const inOrder = () => [A, B].sort() as [string, string];

// Posts an announcement in a save of the company, as a module does.
function post(companyId: string, version = 1, payload: Record<string, unknown> = { recordId: RECORD }): Promise<string> {
  return runWithContext(ctx(companyId), () => inRequestTransaction(() => announce({ event: EVENT, version, payload })));
}

// What each listener was handed, and the context it ran in.
const calls: { listener: string; id: string; companyId?: string; requestId: string; background: boolean }[] = [];

function listener(name: string, work: (announcement: Delivered) => Promise<void> = async () => {}, more: Partial<Listener> = {}): Listener {
  return {
    name,
    event: EVENT,
    versions: [1],
    module: 'core',
    handle: async (announcement) => {
      const context = getContext();
      calls.push({ listener: name, id: announcement.id, companyId: context.companyId, requestId: context.requestId, background: context.background });
      await work(announcement);
    },
    ...more,
  };
}

const deliver = (listeners: Listener[]) => deliverPending({ listeners, logger });

// Rows of a company table, read by its owner with the company set (the row rule binds the owner too).
async function asOwner(companyId: string, query: string, values: unknown[] = []): Promise<Record<string, any>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query(query, values)).rows;
  } finally {
    await owner.query('COMMIT');
  }
}

// An announcement, with how many seconds are left before its next try.
const announcement = async (companyId: string, id: string) =>
  (await asOwner(companyId, 'SELECT *, extract(epoch FROM next_attempt_at - now()) AS wait FROM core.outbox WHERE id = $1', [id]))[0]!;
// Makes a tried announcement due now, as if its wait were over (it waits while a broken delivery still holds the row).
const due = (companyId: string, id: string) => asOwner(companyId, 'UPDATE core.outbox SET next_attempt_at = now() WHERE id = $1', [id]);
const waiting = (companyId: string) => asOwner(companyId, 'SELECT id FROM core.outbox WHERE published_at IS NULL');
const receipts = async () => (await owner.query('SELECT listener, event_id FROM core.event_receipts ORDER BY listener, event_id')).rows;
const activity = (companyId: string, recordId: string) =>
  asOwner(companyId, 'SELECT actor_type, actor_label, action, request_id FROM audit.activity_log WHERE record_id = $1 ORDER BY at, id', [recordId]);

// Every kept error, read as the system account, which sees the rows with no company too.
async function errors(): Promise<Record<string, any>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query('SET LOCAL ROLE nexus_system');
    return (await owner.query('SELECT company_id, source, message, request_id FROM core.error_events ORDER BY at, id')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}

// A listener that writes its own activity-log entry for the announcement (the worker has no person: it passes an actor).
const writes = (announcement: Delivered) =>
  writeActivity({
    module: 'core',
    recordType: 'probe',
    recordId: announcement.id,
    recordLabel: 'Probe',
    action: 'listened',
    actor: { type: 'system', label: 'probe listener' },
  }).then(() => undefined);

// A listener's work that ends its own database connection, as a database restart would.
const breakConnection = async () => {
  await getContext().tx!.execute(sql`SELECT pg_terminate_backend(pg_backend_pid())`);
};

// The timers that keep this process running.
const timers = () => process.getActiveResourcesInfo().filter((type) => type === 'Timeout').length;

async function waitFor(check: () => boolean | Promise<boolean>, ms = 10_000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return;
    await pause(20);
  }
  throw new Error('waited too long');
}

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

beforeEach(() => {
  savedSettings = { ...process.env };
  allAnnouncements.push({ name: EVENT, module: 'core' }, { name: OTHER, module: 'core' });
  calls.length = 0;
  lines.length = 0;
});

afterEach(async () => {
  for (const name of [EVENT, OTHER]) allAnnouncements.splice(allAnnouncements.findIndex((known) => known.name === name), 1);
  await closePools();
  for (const key of Object.keys(process.env)) if (!(key in savedSettings)) delete process.env[key];
  Object.assign(process.env, savedSettings);
  await owner.query('TRUNCATE core.outbox CASCADE');
  await owner.query('TRUNCATE core.error_events');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('deliverPending (one round)', () => {
  it('hands an announcement once to each listener of its event as it was posted, adds their receipts and marks it delivered after one try', async () => {
    const id = await post(A, 1, { recordId: RECORD, facts: { status: 'done' } });
    const seen: Delivered[] = [];
    const first = listener('core.probe-first', async (handed) => {
      seen.push(handed);
    });
    const second = listener('core.probe-second');
    const elsewhere = listener('core.probe-elsewhere', undefined, { event: OTHER });
    expect(await deliver([first, second, elsewhere])).toBe(1);
    expect(calls.map((call) => call.listener)).toEqual(['core.probe-first', 'core.probe-second']);
    expect(await receipts()).toEqual([
      { listener: 'core.probe-first', event_id: id },
      { listener: 'core.probe-second', event_id: id },
    ]);
    const delivered = await announcement(A, id);
    expect(seen).toEqual([{ id, event: EVENT, version: 1, payload: { recordId: RECORD, facts: { status: 'done' } }, occurredAt: delivered.occurred_at }]);
    expect(delivered).toMatchObject({ attempts: 1, last_error: null });
    expect(delivered.published_at).toBeInstanceOf(Date);
    expect(await deliver([first, second, elsewhere])).toBe(0);
    expect(calls).toHaveLength(2);
  });

  it('adds the listener’s receipt before it runs, in the same transaction', async () => {
    await post(A);
    const found: unknown[] = [];
    await deliver([
      listener('core.probe-first', async (handed) => {
        found.push(...(await getContext().tx!.execute(sql`SELECT listener FROM core.event_receipts WHERE event_id = ${handed.id}`)).rows);
      }),
    ]);
    expect(found).toEqual([{ listener: 'core.probe-first' }]);
  });

  it('delivers an announcement that no listener reads at once, with no receipt', async () => {
    const id = await post(A);
    expect(await deliver([])).toBe(1);
    expect((await announcement(A, id)).published_at).toBeInstanceOf(Date);
    const other = await post(A);
    expect(await deliver([listener('core.probe-elsewhere', undefined, { event: OTHER })])).toBe(1);
    expect((await announcement(A, other)).published_at).toBeInstanceOf(Date);
    expect(await receipts()).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('runs each announcement in a context of its own: a new request ID, in the background, with its company', async () => {
    const ids = [await post(A), await post(A)];
    expect(await deliver([listener('core.probe-first')])).toBe(2);
    expect(calls.map((call) => call.id).sort()).toEqual([...ids].sort());
    expect(calls.every((call) => call.companyId === A && call.background && UUID.test(call.requestId))).toBe(true);
    expect(new Set(calls.map((call) => call.requestId)).size).toBe(2);
  });

  it('delivers two companies’ announcements at once, each listener seeing only its own company (CR-010)', { timeout: 30_000 }, async () => {
    await post(A);
    await post(B);
    // Each listener waits (at most 5 seconds) until the other has started too: they run at the same time only if the
    // second round skips the announcement the first has taken instead of waiting for it.
    let started = 0;
    let release = () => {};
    const together = new Promise<void>((resolve) => (release = resolve));
    const seen: { id: string; company?: string; met: boolean; rows: unknown[] }[] = [];
    const watcher = listener('core.probe-first', async (handed) => {
      started += 1;
      if (started === 2) release();
      const met = await Promise.race([together.then(() => true), pause(5_000).then(() => false)]);
      const rows = (await getContext().tx!.execute(sql`SELECT id, company_id, current_setting('app.company_id', true) AS setting FROM core.outbox`)).rows;
      seen.push({ id: handed.id, company: getContext().companyId, met, rows });
    });
    const taken = await Promise.all([deliver([watcher]), deliver([watcher])]);
    expect(taken).toEqual([1, 1]);
    expect(seen.map((one) => one.met)).toEqual([true, true]);
    expect(seen.map((one) => one.company).sort()).toEqual([A, B].sort());
    for (const one of seen) expect(one.rows).toEqual([{ id: one.id, company_id: one.company, setting: one.company }]);
    expect(new Set(calls.map((call) => call.requestId)).size).toBe(2);
  });

  it('never delivers one announcement twice when two rounds run at once', { timeout: 30_000 }, async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i += 1) ids.push(await post(A));
    const slow = listener('core.probe-first', () => pause(30));
    const taken = await Promise.all([deliver([slow]), deliver([slow])]);
    expect(taken.reduce((x, y) => x + y)).toBe(6);
    expect(calls.map((call) => call.id).sort()).toEqual([...ids].sort());
    for (const id of ids) expect(await announcement(A, id)).toMatchObject({ attempts: 1, last_error: null });
    for (const id of ids) expect((await announcement(A, id)).published_at).toBeInstanceOf(Date);
    expect(await receipts()).toHaveLength(6);
  });

  it('undoes what a failing listener wrote and its receipt, keeps the others’ work, later runs only the one that failed and clears the error', async () => {
    const id = await post(A);
    let failing = true;
    const good = listener('core.probe-good', writes);
    const bad = listener('core.probe-bad', async (handed) => {
      await writes(handed);
      if (failing) throw new Error('the listener failed');
    });
    expect(await deliver([good, bad])).toBe(1);
    expect(await announcement(A, id)).toMatchObject({ published_at: null, attempts: 1, last_error: 'core.probe-bad: the listener failed' });
    expect(await receipts()).toEqual([{ listener: 'core.probe-good', event_id: id }]);
    const requestId = calls[0]!.requestId;
    expect(await activity(A, id)).toEqual([{ actor_type: 'system', actor_label: 'probe listener', action: 'listened', request_id: requestId }]);
    expect(logged('announcement failed')).toMatchObject([{ level: 50, eventId: id, listener: 'core.probe-bad', err: { message: 'the listener failed' } }]);
    expect(await errors()).toEqual([{ company_id: A, source: 'worker', message: 'the listener failed', request_id: requestId }]);

    expect(await deliver([good, bad])).toBe(0);
    failing = false;
    await due(A, id);
    calls.length = 0;
    expect(await deliver([good, bad])).toBe(1);
    expect(calls.map((call) => call.listener)).toEqual(['core.probe-bad']);
    expect(await receipts()).toEqual([
      { listener: 'core.probe-bad', event_id: id },
      { listener: 'core.probe-good', event_id: id },
    ]);
    const delivered = await announcement(A, id);
    expect(delivered).toMatchObject({ attempts: 2, last_error: null });
    expect(delivered.published_at).toBeInstanceOf(Date);
    expect(await activity(A, id)).toHaveLength(2);
  });

  it('tries a failing listener at most 5 times, waiting 1, 5, 15 and then 60 minutes between tries', { timeout: 30_000 }, async () => {
    expect(MAX_ATTEMPTS).toBe(5);
    const id = await post(A);
    const bad = listener('core.probe-bad', async () => {
      throw new Error('still failing');
    });
    const waits: number[] = [];
    for (let tries = 1; tries <= 5; tries += 1) {
      expect(await deliver([bad])).toBe(1);
      const failed = await announcement(A, id);
      expect(failed).toMatchObject({ published_at: null, attempts: tries, last_error: 'core.probe-bad: still failing' });
      waits.push(Math.round(Number(failed.wait) / 60));
      expect(await deliver([bad])).toBe(0);
      await due(A, id);
    }
    expect(waits.slice(0, 4)).toEqual([1, 5, 15, 60]);
    expect(await deliver([bad])).toBe(0);
    expect(calls).toHaveLength(5);
    expect(await announcement(A, id)).toMatchObject({ published_at: null, attempts: 5 });
  });

  it('records an announcement of a version a listener does not read as not delivered to it, never runs that listener, and hands the version to one that reads it', async () => {
    const id = await post(A, 2);
    const versions: number[] = [];
    const reader = listener('core.probe-first');
    const both = listener(
      'core.probe-both',
      async (handed) => {
        versions.push(handed.version);
      },
      { versions: [1, 2] },
    );
    expect(await deliver([reader, both])).toBe(1);
    expect(calls.map((call) => call.listener)).toEqual(['core.probe-both']);
    expect(versions).toEqual([2]);
    expect(await announcement(A, id)).toMatchObject({ published_at: null, attempts: 1, last_error: 'core.probe-first: the listener does not read version 2' });
    expect(await receipts()).toEqual([{ listener: 'core.probe-both', event_id: id }]);
    expect(logged('announcement failed')).toMatchObject([{ eventId: id, listener: 'core.probe-first' }]);
  });

  it('keeps no secret in a log line, last_error or kept error, and a failed query leaves the next listener working', async () => {
    const id = await post(A);
    const params = listener('core.probe-params', async () => {
      throw Object.assign(new Error('the query failed'), { params: ['SECRET-P'] });
    });
    const plain = listener('core.probe-plain', async () => {
      throw { message: 'x', params: ['SECRET-P'], input: 'postgres://u:SECRET-PW@h/d' };
    });
    const query = listener('core.probe-query', async () => {
      await getContext().tx!.execute(sql`SELECT ${'SECRET-Q'}::text AS x FROM core.no_such_table`);
    });
    const after = listener('core.probe-after', writes);
    expect(await deliver([params, plain, query, after])).toBe(1);
    expect(logged('announcement failed').map((line) => line.listener)).toEqual(['core.probe-params', 'core.probe-plain', 'core.probe-query']);
    expect(lines.join('\n')).not.toContain('SECRET');
    const failed = await announcement(A, id);
    expect(failed.last_error).toMatch(/^core\.probe-params: the query failed; core\.probe-plain: x; core\.probe-query: \S/);
    expect(failed.last_error).not.toContain('SECRET');
    const kept = await errors();
    expect(kept.map((error) => error.message).slice(0, 2)).toEqual(['the query failed', 'x']);
    expect(kept).toHaveLength(3);
    expect(JSON.stringify(kept)).not.toContain('SECRET');
    expect(await receipts()).toEqual([{ listener: 'core.probe-after', event_id: id }]);
    expect(await activity(A, id)).toHaveLength(1);
  });

  it('removes every NUL character from last_error before cutting it to 2000 characters, and goes on', async () => {
    const id = await post(A);
    await deliver([
      listener('core.probe-bad', async () => {
        throw new Error('a\u0000b\u0000c\u0000');
      }),
    ]);
    expect(await announcement(A, id)).toMatchObject({ attempts: 1, last_error: 'core.probe-bad: abc' });
    expect(logged('announcement failed')).toHaveLength(1);
    // Kept, or (while recordError keeps a NUL, which PostgreSQL text refuses) logged as not recorded.
    expect((await errors()).length === 1 || logged('error not recorded').length === 1).toBe(true);
    const long = await post(A);
    await deliver([
      listener('core.probe-long', async () => {
        throw new Error(`\u0000${'y'.repeat(3000)}`);
      }),
    ]);
    const cut = await announcement(A, long);
    expect(cut.last_error).toHaveLength(2000);
    expect(cut.last_error).toMatch(/^core\.probe-long: y+$/);
  });

  it('logs a failure to keep an error as a warning and goes on with the next announcement', async () => {
    const ids = [await post(A), await post(A)];
    vi.mocked(recordError).mockRejectedValueOnce(Object.assign(new Error('the store is down'), { params: ['SECRET-P'] }));
    const bad = listener('core.probe-bad', async () => {
      throw new Error('the listener failed');
    });
    expect(await deliver([bad])).toBe(2);
    const warned = logged('error not recorded');
    expect(warned).toMatchObject([{ level: 40, listener: 'core.probe-bad', err: { message: 'the store is down' } }]);
    expect(ids).toContain(warned[0]!.eventId);
    expect(logged('announcement failed')).toHaveLength(2);
    expect(await errors()).toHaveLength(1);
    expect(lines.join('\n')).not.toContain('SECRET');
    for (const id of ids) expect(await announcement(A, id)).toMatchObject({ attempts: 1, published_at: null });
  });

  it('refuses, before any work, two listeners with one name, a listener of an announcement that is not registered and one that reads no version', async () => {
    const id = await post(A);
    const first = listener('core.probe-first');
    await expect(deliver([first, listener('core.probe-first', undefined, { versions: [2] })])).rejects.toThrow('two listeners have the same name');
    await expect(deliver([first, listener('core.probe-unknown', undefined, { event: 'core.probe.unknown' })])).rejects.toThrow(
      'a listener listens to an announcement that is not registered',
    );
    await expect(deliver([first, listener('core.probe-none', undefined, { versions: [] })])).rejects.toThrow('a listener reads no version');
    expect(await announcement(A, id)).toMatchObject({ published_at: null, attempts: 0, last_error: null });
    expect(calls).toEqual([]);
  });

  it('goes on with the next company when a delivery breaks off; the broken one has used its try and is taken again after its wait', { timeout: 30_000 }, async () => {
    const [first, second] = inOrder();
    const broken = await post(first);
    const fine = await post(second);
    let cut = true;
    const breaker = listener('core.probe-first', async (handed) => {
      if (handed.id !== broken || !cut) return;
      cut = false;
      await breakConnection();
    });
    expect(await deliver([breaker])).toBe(1);
    expect((await announcement(second, fine)).published_at).toBeInstanceOf(Date);
    const tried = await announcement(first, broken);
    expect(tried).toMatchObject({ published_at: null, attempts: 1, last_error: null });
    expect(Math.round(Number(tried.wait) / 60)).toBe(1);
    expect(await receipts()).toEqual([{ listener: 'core.probe-first', event_id: fine }]);
    expect(logged('delivery failed')).toMatchObject([{ level: 50, companyId: first, err: { message: expect.any(String) } }]);
    expect(await errors()).toMatchObject([{ company_id: first, source: 'worker', request_id: calls[0]!.requestId }]);

    expect(await deliver([breaker])).toBe(0);
    await due(first, broken);
    expect(await deliver([breaker])).toBe(1);
    const delivered = await announcement(first, broken);
    expect(delivered).toMatchObject({ attempts: 2, last_error: null });
    expect(delivered.published_at).toBeInstanceOf(Date);
    expect(calls.map((call) => call.id)).toEqual([broken, fine, broken]);
  });

  it('stops trying a delivery that keeps breaking off after 5 tries', { timeout: 60_000 }, async () => {
    const id = await post(A);
    const breaker = listener('core.probe-first', breakConnection);
    for (let tries = 1; tries <= MAX_ATTEMPTS; tries += 1) {
      expect(await deliver([breaker])).toBe(0);
      expect(await announcement(A, id)).toMatchObject({ published_at: null, attempts: tries });
      await due(A, id);
    }
    expect(await deliver([breaker])).toBe(0);
    expect(calls).toHaveLength(MAX_ATTEMPTS);
    expect(logged('delivery failed')).toHaveLength(MAX_ATTEMPTS);
  });

  it('delivers at most 100 announcements of one company in a round, so a busy company never holds the others back', { timeout: 60_000 }, async () => {
    expect(PER_ROUND).toBe(100);
    const [busy, other] = inOrder();
    await runWithContext(ctx(busy), () =>
      inRequestTransaction(async () => {
        for (let i = 0; i <= PER_ROUND; i += 1) await announce({ event: EVENT, version: 1, payload: { recordId: RECORD } });
      }),
    );
    const single = await post(other);
    expect(await deliver([])).toBe(PER_ROUND + 1);
    expect((await announcement(other, single)).published_at).toBeInstanceOf(Date);
    expect(await waiting(busy)).toHaveLength(1);
    expect(await deliver([])).toBe(1);
    expect(await waiting(busy)).toEqual([]);
  });
});

describe('startDelivery (the worker’s loop)', () => {
  it('empties the backlog in its first round, before any wait', { timeout: 30_000 }, async () => {
    const ids = [await post(A), await post(A), await post(B)];
    const delivery = startDelivery({ listeners: [listener('core.probe-first')], logger, everyMs: 60_000 });
    try {
      await waitFor(() => calls.length === 3, 5_000);
    } finally {
      await delivery.stop();
    }
    expect(calls.map((call) => call.id).sort()).toEqual([...ids].sort());
  });

  it('waits everyMs after a round before the next one', { timeout: 30_000 }, async () => {
    const [first, last] = inOrder();
    // Once the last company's announcement is delivered, the first round has passed the first company.
    const backlog = await post(last);
    const delivery = startDelivery({ listeners: [listener('core.probe-first')], logger, everyMs: 60_000 });
    try {
      await waitFor(async () => (await announcement(last, backlog)).published_at !== null);
      const later = await post(first);
      await pause(300);
      expect((await announcement(first, later)).published_at).toBeNull();
      expect(calls).toHaveLength(1);
    } finally {
      await delivery.stop();
    }
  });

  it('never runs two rounds at once', { timeout: 30_000 }, async () => {
    for (let i = 0; i < 3; i += 1) await post(A);
    let active = 0;
    let most = 0;
    const slow = listener('core.probe-first', async () => {
      active += 1;
      most = Math.max(most, active);
      await pause(100);
      active -= 1;
    });
    const delivery = startDelivery({ listeners: [slow], logger, everyMs: 5 });
    try {
      await waitFor(() => calls.length === 3);
    } finally {
      await delivery.stop();
    }
    expect(most).toBe(1);
  });

  it('stop() during a later round waits for that round, and no round runs after it', { timeout: 30_000 }, async () => {
    const [first, last] = inOrder();
    let entered = false;
    let finished = false;
    const slow = listener('core.probe-first', async (handed) => {
      if (!handed.payload.slow) return;
      entered = true;
      await pause(300);
      finished = true;
    });
    // The outbox is empty when the loop starts. Once an announcement of the last company is delivered, a round has passed
    // the first company, so the slow announcement posted then in the first company is delivered in a later round.
    const delivery = startDelivery({ listeners: [slow], logger, everyMs: 20 });
    let id = '';
    try {
      const marker = await post(last);
      await waitFor(async () => (await announcement(last, marker)).published_at !== null);
      id = await post(first, 1, { recordId: RECORD, slow: true });
      await waitFor(() => entered);
    } finally {
      await delivery.stop();
    }
    expect(finished).toBe(true);
    expect((await announcement(first, id)).published_at).toBeInstanceOf(Date);
    const later = await post(first);
    await pause(200);
    expect((await announcement(first, later)).published_at).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it('stop() between rounds ends the wait and leaves no timer behind', { timeout: 30_000 }, async () => {
    const before = timers();
    const waits = vi.spyOn(globalThis, 'setTimeout');
    const id = await post(A);
    const delivery = startDelivery({ listeners: [listener('core.probe-first')], logger, everyMs: 60_000 });
    try {
      await waitFor(async () => (await announcement(A, id)).published_at !== null);
      // The first round has ended once the loop has set its wait.
      await waitFor(() => waits.mock.calls.some(([, ms]) => ms === 60_000));
    } finally {
      await delivery.stop();
      waits.mockRestore();
    }
    await closePools();
    expect(timers()).toBe(before);
  });

  it('logs a failed round with its error, and the loop goes on', { timeout: 30_000 }, async () => {
    const twins = [listener('core.probe-first'), listener('core.probe-first')];
    const delivery = startDelivery({ listeners: twins, logger, everyMs: 20 });
    try {
      await waitFor(() => logged('delivery round failed').length >= 2);
    } finally {
      await delivery.stop();
    }
    expect(logged('delivery round failed')[0]).toMatchObject({ level: 50, err: { message: 'two listeners have the same name' } });
  });
});

describe('the company transaction and the company list (database.ts)', () => {
  it('inCompanyTransaction runs work in one transaction with the company set, on a copy of the context that holds it', async () => {
    const outer: RequestContext = { requestId: 'job-0094-1', background: true };
    const seen = await runWithContext(outer, () =>
      inCompanyTransaction(A, async (tx) => {
        const context = getContext();
        const setting = (await tx.execute(sql`SELECT current_setting('app.company_id', true) AS company`)).rows[0];
        return { company: context.companyId, sameTx: context.tx === tx, requestId: context.requestId, background: context.background, setting };
      }),
    );
    expect(seen).toEqual({ company: A, sameTx: true, requestId: 'job-0094-1', background: true, setting: { company: A } });
    expect(outer).toEqual({ requestId: 'job-0094-1', background: true });
  });

  it('inCompanyTransaction keeps the work when it succeeds and nothing when it fails', async () => {
    const [kept, undone] = ['0190f2a6-6c1e-7b3a-9d2f-00000000a001', '0190f2a6-6c1e-7b3a-9d2f-00000000a002'];
    const job = (recordId: string) => () =>
      writeActivity({ module: 'core', recordType: 'probe', recordId, recordLabel: 'Probe', action: 'ran', actor: { type: 'system', label: 'probe job' } });
    await runWithContext(ctx(), () => inCompanyTransaction(A, job(kept)));
    await expect(
      runWithContext(ctx(), () =>
        inCompanyTransaction(A, async () => {
          await job(undone)();
          throw new Error('the job failed');
        }),
      ),
    ).rejects.toThrow('the job failed');
    expect(await activity(A, kept)).toHaveLength(1);
    expect(await activity(A, undone)).toEqual([]);
  });

  it('inCompanyTransaction uses the request pool (DB_POOL_SIZE), so with 1 the transactions take turns', { timeout: 30_000 }, async () => {
    process.env.DB_POOL_SIZE = '1';
    const order: string[] = [];
    const job = (label: string) =>
      runWithContext(ctx(), () =>
        inCompanyTransaction(A, async () => {
          order.push(`${label} start`);
          await pause(150);
          order.push(`${label} end`);
        }),
      );
    await Promise.all([job('one'), job('two')]);
    expect(order).toEqual(['one start', 'one end', 'two start', 'two end']);
  });

  it('inCompanyTransaction refuses without a context, inside another transaction, and a value that is not a company ID', async () => {
    await expect(inCompanyTransaction(A, async () => 1)).rejects.toThrow('a company transaction needs its own context');
    const inside = 'a company transaction cannot run inside another transaction';
    await expect(runWithContext(ctx(A), () => inRequestTransaction(() => inCompanyTransaction(A, async () => 1)))).rejects.toThrow(inside);
    await expect(runWithContext(ctx(A), () => securityWrite(A, () => inCompanyTransaction(A, async () => 1)))).rejects.toThrow(inside);
    await expect(runWithContext(ctx(), () => inCompanyTransaction(A, () => inCompanyTransaction(B, async () => 1)))).rejects.toThrow(inside);
    await expect(runWithContext(ctx(), () => inCompanyTransaction('not-a-company', async () => 1))).rejects.toThrow('the company is not a valid ID');
  });

  it('listCompanyIds reads every company’s ID with no company set on the request pool, and never inside a transaction', { timeout: 30_000 }, async () => {
    expect((await listCompanyIds()).sort()).toEqual([A, B].sort());
    const made = await owner.query(`INSERT INTO core.companies (name, slug) VALUES ('Test Company C', 'test-company-c') RETURNING id`);
    try {
      const C = String(made.rows[0]!.id);
      expect((await runWithContext(ctx(), () => listCompanyIds())).sort()).toEqual([A, B, C].sort());
    } finally {
      await owner.query(`DELETE FROM core.companies WHERE slug = 'test-company-c'`);
    }
    await expect(runWithContext(ctx(A), () => inRequestTransaction(() => listCompanyIds()))).rejects.toThrow(
      'the companies are not read inside a transaction',
    );
    // Not the security pool: the list answers while a security write holds that pool's only connection.
    await closePools();
    process.env.DB_SECURITY_POOL_SIZE = '1';
    expect((await securityWrite(A, () => listCompanyIds())).sort()).toEqual([A, B].sort());
  });
});
