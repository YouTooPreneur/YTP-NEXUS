// TASK-0016 · The request's transaction and the short security writes: one transaction per request with its company, all or nothing, the security pool beside the request pool, and broken connections. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { AppError } from '../../src/shared/errors.js';
import { getContext, type RequestContext } from '../../src/shared/context.js';
import { defineRoute, mountRoutes, type RouteHooks, type RouteInfo } from '../../src/shared/route.js';
import { closePools, securityWrite } from '../../src/db/database.js';
import { createHooks } from '../../src/shared/hooks.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

// A throwaway company table, made by nexus_owner the way a later card's database change makes one.
const probe = pgSchema('core').table('probe_0016', {
  id: uuid('id').primaryKey().default(sql`core.uuid_v7()`),
  companyId: uuid('company_id').notNull(),
  label: text('label').notNull(),
});
const owner = clientFor('DATABASE_URL_OWNER');
const PATH = '/api/test/transaction';
const contract = defineContract({
  method: 'post',
  path: PATH,
  operationId: 'testTransaction',
  module: 'core',
  summary: 'A door used only by this test',
  response: z.object({ ok: z.boolean() }),
});
const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
let A = '';
let B = '';

type Step = (info: RouteInfo) => Promise<void>;

// The real transaction step from createHooks(), with stand-ins for the steps later cards build (TASK-0033 to TASK-0035).
function testApp(steps: { session?: Step; idleTimeout?: Step; personLimit?: Step; handler?: () => Promise<unknown> } = {}) {
  const hooks: RouteHooks = {
    session:
      steps.session ??
      (async () => {
        getContext().companyId = A;
      }),
    inTransaction: createHooks().inTransaction,
    idleTimeout: steps.idleTimeout ?? (async () => {}),
    twoStepGate: async () => {},
    personLimit: steps.personLimit ?? (async () => {}),
    featureSwitch: async () => {},
    permission: async () => {},
    idempotency: (_info, run) => run(),
    hideFields: (_info, answer) => answer,
  };
  const route = defineRoute({
    contract,
    permission: { module: 'core', action: 'edit' },
    feature: 'core.test',
    handler: async () => (steps.handler ? steps.handler() : { ok: true }),
  });
  return createApp({ logger: quiet(), hooks, routes: (app) => mountRoutes(app, [route], hooks) });
}

const labels = async (companyId: string) => {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query('SELECT label FROM core.probe_0016 ORDER BY label')).rows.map((row) => String(row.label));
  } finally {
    await owner.query('COMMIT');
  }
};
const securityCount = (label: string) => async () => {
  await securityWrite(A, (tx) => tx.insert(probe).values({ companyId: A, label }));
};

beforeAll(async () => {
  await owner.connect();
  await owner.query('DROP TABLE IF EXISTS core.probe_0016');
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
  await owner.query(`CREATE TABLE core.probe_0016 (
    id uuid PRIMARY KEY DEFAULT core.uuid_v7(),
    company_id uuid NOT NULL REFERENCES core.companies (id),
    label text NOT NULL)`);
  await owner.query(`CALL core.add_company_rules('core.probe_0016')`);
  await owner.query('GRANT SELECT, INSERT, UPDATE, DELETE ON core.probe_0016 TO nexus_app');
});

afterEach(async () => {
  vi.restoreAllMocks();
  delete process.env.DB_POOL_SIZE;
  await closePools();
  await owner.query('TRUNCATE core.probe_0016');
});

afterAll(async () => {
  await closePools();
  await owner.query('DROP TABLE IF EXISTS core.probe_0016');
  await resetCompanies(owner);
  await owner.end();
});

describe('the request transaction (step 5)', () => {
  it('runs every later step and the handler in one transaction with the request’s company set, kept on the request context', async () => {
    const seen: { step: string; company: unknown; txid: unknown }[] = [];
    const look = (step: string) => async () => {
      const result = await getContext().tx!.execute(
        sql`SELECT current_setting('app.company_id', true) AS company, txid_current() AS txid`,
      );
      seen.push({ step, company: result.rows[0]!.company, txid: result.rows[0]!.txid });
    };
    const res = await request(
      testApp({
        idleTimeout: look('idleTimeout'),
        personLimit: async () => {
          await securityCount('counter')();
          await look('personLimit')();
        },
        handler: async () => {
          await look('handler')();
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(200);
    expect(seen.map((s) => [s.step, s.company])).toEqual([
      ['idleTimeout', A],
      ['personLimit', A],
      ['handler', A],
    ]);
    expect(new Set(seen.map((s) => String(s.txid))).size).toBe(1);
    expect(await labels(A)).toEqual(['counter']);
  });

  it('keeps what the request saves when it succeeds, and saves nothing when a later step fails (all or nothing)', async () => {
    const save = (label: string) => getContext().tx!.insert(probe).values({ companyId: A, label });
    expect(
      (
        await request(
          testApp({
            handler: async () => {
              await save('kept');
              return { ok: true };
            },
          }),
        ).post(PATH)
      ).status,
    ).toBe(200);
    const refused = await request(
      testApp({
        handler: async () => {
          await save('undone');
          throw new AppError(409, 'changed', 'This was just changed, please review');
        },
      }),
    ).post(PATH);
    expect(refused.status).toBe(409);
    expect(await labels(A)).toEqual(['kept']);
  });

  it('takes the transaction off the request context when it ends, also when the request is refused', async () => {
    let context: RequestContext | undefined;
    const res = await request(
      testApp({
        handler: async () => {
          context = getContext();
          expect(context.tx).toBeDefined();
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(200);
    expect(context).toBeDefined();
    expect(context!.tx).toBeUndefined();
    let refusedContext: RequestContext | undefined;
    const refused = await request(
      testApp({
        handler: async () => {
          refusedContext = getContext();
          expect(refusedContext.tx).toBeDefined();
          throw new AppError(409, 'changed', 'This was just changed, please review');
        },
      }),
    ).post(PATH);
    expect(refused.status).toBe(409);
    expect(refusedContext).toBeDefined();
    expect(refusedContext!.tx).toBeUndefined();
  });

  it('refuses a request whose company is not known, before any step inside the transaction runs', async () => {
    let ran = false;
    const res = await request(
      testApp({
        session: async () => {},
        idleTimeout: async () => {
          ran = true;
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    expect(ran).toBe(false);
  });

  it('uses at most DB_POOL_SIZE connections for requests, so with 1 the requests take turns', async () => {
    process.env.DB_POOL_SIZE = '1';
    await closePools();
    const events: string[] = [];
    let n = 0;
    const app = testApp({
      handler: async () => {
        const me = ++n;
        events.push(`start ${me}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        events.push(`end ${me}`);
        return { ok: true };
      },
    });
    const answers = await Promise.all([request(app).post(PATH), request(app).post(PATH)]);
    expect(answers.map((r) => r.status)).toEqual([200, 200]);
    expect(events).toEqual(['start 1', 'end 1', 'start 2', 'end 2']);
  });
});

describe('the short security writes (their own pool)', () => {
  it('with the request pool’s size set to 1, a request whose per-person step makes a security write answers 200 within 5 seconds', { timeout: 30_000 }, async () => {
    process.env.DB_POOL_SIZE = '1';
    await closePools();
    const started = Date.now();
    const res = await request(testApp({ personLimit: securityCount('counter') })).post(PATH);
    expect(res.status).toBe(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(await labels(A)).toEqual(['counter']);
  });

  it('with the request pool’s size set to 2, six such requests at once all answer 200', { timeout: 30_000 }, async () => {
    process.env.DB_POOL_SIZE = '2';
    await closePools();
    const app = testApp({ personLimit: securityCount('counter') });
    const answers = await Promise.all(Array.from({ length: 6 }, () => request(app).post(PATH)));
    expect(answers.map((r) => r.status)).toEqual([200, 200, 200, 200, 200, 200]);
    expect(await labels(A)).toHaveLength(6);
  });

  it('keeps a security write when the request is refused: the session end written at the idle-timeout step stays', async () => {
    const res = await request(
      testApp({
        idleTimeout: async () => {
          await securityCount('session ended')();
          throw new AppError(401, 'session_ended', 'Please sign in again');
        },
        handler: async () => {
          throw new Error('the handler must not run');
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(401);
    expect(await labels(A)).toEqual(['session ended']);
    expect(await labels(B)).toEqual([]);
  });

  it('sets the company for the security write, and waits at most 5 seconds for a lock there', async () => {
    const security = await securityWrite(B, (tx) =>
      tx.execute(sql`SELECT current_setting('app.company_id', true) AS company, current_setting('lock_timeout') AS lock_timeout`),
    );
    expect(security.rows[0]).toEqual({ company: B, lock_timeout: '5s' });
  });

  it('undoes a security write that fails, and its error reaches the step that made it', async () => {
    await expect(
      securityWrite(A, async (tx) => {
        await tx.insert(probe).values({ companyId: A, label: 'failed write' });
        throw new Error('the write failed');
      }),
    ).rejects.toThrow('the write failed');
    const res = await request(
      testApp({
        personLimit: async () =>
          securityWrite(A, async (tx) => {
            await tx.insert(probe).values({ companyId: A, label: 'failed write' });
            throw new Error('the write failed');
          }),
        handler: async () => {
          throw new Error('the handler must not run');
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    expect(await labels(A)).toEqual([]);
  });

  it('holds its own transaction on the request context while it runs, so a write that reads it there stays when the request is refused', async () => {
    let inside = false;
    let back = false;
    const res = await request(
      testApp({
        idleTimeout: async () => {
          const requestTx = getContext().tx;
          await securityWrite(A, async (tx) => {
            inside = getContext().tx === tx && tx !== requestTx;
            await getContext().tx!.insert(probe).values({ companyId: A, label: 'read from the context' });
          });
          back = getContext().tx === requestTx;
          throw new AppError(401, 'session_ended', 'Please sign in again');
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(401);
    expect([inside, back]).toEqual([true, true]);
    expect(await labels(A)).toEqual(['read from the context']);
  });

  it('prints nothing while a request saves and makes a security write (no query logger)', async () => {
    const spies = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'debug'),
      vi.spyOn(process.stdout, 'write'),
    ];
    const res = await request(
      testApp({
        personLimit: securityCount('counter'),
        handler: async () => {
          await getContext().tx!.insert(probe).values({ companyId: A, label: 'kept' });
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(200);
    expect(await labels(A)).toEqual(['counter', 'kept']);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

describe('a connection that breaks', () => {
  const cut = sql`SELECT pg_terminate_backend(pg_backend_pid())`;
  const pause = () => new Promise((resolve) => setTimeout(resolve, 300));

  it('fails only the request or security write that holds it; the API keeps running and the next one works', { timeout: 30_000 }, async () => {
    const broken = await request(
      testApp({
        handler: async () => {
          await getContext().tx!.execute(cut);
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(broken.status).toBe(500);
    expect((await request(testApp()).post(PATH)).status).toBe(200);
    await expect(securityWrite(A, (tx) => tx.execute(cut))).rejects.toThrow();
    await securityCount('after the break')();
    expect(await labels(A)).toEqual(['after the break']);
  });

  it('is dropped from its pool while it waits there, and the next request and security write get a new one', { timeout: 30_000 }, async () => {
    const pid = sql`SELECT pg_backend_pid() AS pid`;
    const pids: number[] = [];
    const first = await request(
      testApp({
        personLimit: async () => {
          pids.push(Number((await securityWrite(A, (tx) => tx.execute(pid))).rows[0]!.pid));
        },
        handler: async () => {
          pids.push(Number((await getContext().tx!.execute(pid)).rows[0]!.pid));
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(first.status).toBe(200);
    expect(new Set(pids).size).toBe(2);
    const cutter = clientFor('DATABASE_URL_APP');
    await cutter.connect();
    try {
      const done = await cutter.query('SELECT pg_terminate_backend(pid) AS done FROM unnest($1::int[]) AS pid', [pids]);
      expect(done.rows.map((row) => row.done)).toEqual([true, true]);
    } finally {
      await cutter.end();
    }
    await pause();
    expect((await request(testApp({ personLimit: securityCount('after the break') })).post(PATH)).status).toBe(200);
    expect(await labels(A)).toEqual(['after the break']);
  });

});
