// TASK-0016 · The request's transaction and the short security writes: one transaction per request with its company, all or nothing, and the security pool beside the request pool. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
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
import { closePools, inRequestTransaction, securityWrite } from '../../src/db/database.js';
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

// The real transaction step, with stand-ins for the steps later cards build (TASK-0033 to TASK-0035).
function testApp(steps: { session?: Step; idleTimeout?: Step; personLimit?: Step; handler?: () => Promise<unknown> } = {}) {
  const hooks: RouteHooks = {
    session:
      steps.session ??
      (async () => {
        getContext().companyId = A;
      }),
    inTransaction: (_info, run) => inRequestTransaction(run),
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
        personLimit: look('personLimit'),
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

  it('takes the transaction off the request context when it ends', async () => {
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

  it('sets the company for the security write, and waits at most 5 seconds for a lock there; requests keep the database’s default', async () => {
    const security = await securityWrite(B, (tx) =>
      tx.execute(sql`SELECT current_setting('app.company_id', true) AS company, current_setting('lock_timeout') AS lock_timeout`),
    );
    expect(security.rows[0]).toEqual({ company: B, lock_timeout: '5s' });
    let requestLock: unknown;
    const res = await request(
      testApp({
        handler: async () => {
          requestLock = (await getContext().tx!.execute(sql`SELECT current_setting('lock_timeout') AS lock_timeout`)).rows[0]!.lock_timeout;
          return { ok: true };
        },
      }),
    ).post(PATH);
    expect(res.status).toBe(200);
    expect(requestLock).toBe('0');
  });
});
