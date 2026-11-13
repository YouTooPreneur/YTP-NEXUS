// TASK-0022 · Double-click keys: the table, its rights, and the real step from createHooks(): a repeat gets the first answer and runs nothing; no key, a wrong key, a failed request, another person or door, another company, expiry, two at once. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { AppError } from '../../src/shared/errors.js';
import { getContext, runWithContext } from '../../src/shared/context.js';
import { defineRoute, mountRoutes, type RouteHooks } from '../../src/shared/route.js';
import { closePools } from '../../src/db/database.js';
import { createHooks } from '../../src/shared/hooks.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const OTHER_PERSON = '0190f2a6-6c1e-7b3a-9d2f-6f5e4d3c2b1a';
const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
let A = '';
let B = '';
let runs = 0;
let nextAnswer: () => unknown = () => ({ ok: true, run: runs });

const contract = (method: 'get' | 'post' | 'delete', path: string, operationId: string) =>
  defineContract({ method, path, operationId, module: 'core', summary: 'A door used only by this test', response: z.any() });
const PATH = '/api/test/double-click';

// The real transaction and double-click steps from createHooks(), with a stand-in session (TASK-0033 builds the real one).
function testApp(who: { companyId?: string; userId?: string } = {}) {
  const real = createHooks();
  const hooks: RouteHooks = {
    session: async () => {
      const context = getContext();
      context.companyId = who.companyId ?? A;
      context.userId = who.userId ?? PERSON;
    },
    inTransaction: real.inTransaction,
    idleTimeout: async () => {},
    twoStepGate: async () => {},
    personLimit: async () => {},
    featureSwitch: async () => {},
    permission: async () => {},
    idempotency: real.idempotency,
    hideFields: (_info, answer) => answer,
  };
  const handler = async () => {
    // The handler's own work goes into the same transaction, so a failed request undoes it with the key.
    await getContext().tx!.execute(sql`SELECT pg_sleep(0.2)`);
    runs += 1;
    return nextAnswer();
  };
  const routes = [
    defineRoute({ contract: contract('post', PATH, 'testDoubleClick'), permission: { module: 'core', action: 'edit' }, feature: 'core.test', handler }),
    defineRoute({ contract: contract('delete', PATH, 'testDoubleClickDelete'), permission: { module: 'core', action: 'edit' }, feature: 'core.test', handler }),
    defineRoute({ contract: contract('get', PATH, 'testDoubleClickRead'), permission: { module: 'core', action: 'view' }, feature: 'core.test', handler }),
  ];
  return createApp({ logger: quiet(), hooks, routes: (app) => mountRoutes(app, routes, hooks) });
}

const key = () => crypto.randomUUID();
const keysOf = async (companyId: string) => {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query('SELECT key, user_id, action, result, expires_at FROM core.idempotency_keys ORDER BY key')).rows;
  } finally {
    await owner.query('COMMIT');
  }
};

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  runs = 0;
  nextAnswer = () => ({ ok: true, run: runs });
  await closePools();
  await owner.query('TRUNCATE core.idempotency_keys');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('core.idempotency_keys (the table)', () => {
  it('has exactly the planned columns, its key of company and key, and a company link that refuses to delete a company', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'idempotency_keys' ORDER BY ordinal_position`,
    );
    expect(columns.rows).toEqual([
      { name: 'company_id', type: 'uuid', required: true, default: null },
      { name: 'key', type: 'text', required: true, default: null },
      { name: 'user_id', type: 'uuid', required: true, default: null },
      { name: 'action', type: 'text', required: true, default: null },
      { name: 'result', type: 'jsonb', required: false, default: null },
      { name: 'expires_at', type: 'timestamp with time zone', required: true, default: "(now() + '24:00:00'::interval)" },
    ]);
    const constraints = await owner.query(
      `SELECT contype AS kind, confdeltype AS on_delete, pg_get_constraintdef(oid) AS def
         FROM pg_constraint WHERE conrelid = 'core.idempotency_keys'::regclass ORDER BY contype`,
    );
    expect(constraints.rows).toEqual([
      { kind: 'f', on_delete: 'r', def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' },
      { kind: 'p', on_delete: ' ', def: 'PRIMARY KEY (company_id, key)' },
    ]);
  });

  it('has the company rule, and the app may read, add and update keys but never delete or empty them', async () => {
    const table = await owner.query(
      `SELECT pg_get_userbyid(relowner) AS owner, relrowsecurity AS rules, relforcerowsecurity AS forced,
              (SELECT count(*)::int FROM aclexplode(relacl) a WHERE a.grantee = 0) AS for_everyone
         FROM pg_class WHERE oid = 'core.idempotency_keys'::regclass`,
    );
    expect(table.rows).toEqual([{ owner: 'nexus_owner', rules: true, forced: true, for_everyone: 0 }]);
    const rights = await owner.query(
      `SELECT r AS right, has_table_privilege('nexus_app', 'core.idempotency_keys', r) AS app
         FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) r`,
    );
    expect(Object.fromEntries(rights.rows.map((row) => [row.right, row.app]))).toEqual({
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

describe('the double-click step (createHooks().idempotency)', () => {
  it('runs a change once: a repeat with the same key gets the first answer and runs nothing', async () => {
    const app = testApp();
    const k = key();
    const first = await request(app).post(PATH).set('Idempotency-Key', k);
    const again = await request(app).post(PATH).set('Idempotency-Key', k);
    expect([first.status, again.status]).toEqual([200, 200]);
    expect(first.body).toEqual({ ok: true, run: 1 });
    expect(again.body).toEqual(first.body);
    expect(runs).toBe(1);
    const [row] = await keysOf(A);
    expect(row).toMatchObject({ key: k, user_id: PERSON, action: 'testDoubleClick', result: { answer: { ok: true, run: 1 } } });
    const hours = ((row!.expires_at as Date).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThan(24.1);
  });

  it('runs again for a new key, and counts an upper-case key as the same key', async () => {
    const app = testApp();
    const k = key();
    await request(app).post(PATH).set('Idempotency-Key', k);
    await request(app).post(PATH).set('Idempotency-Key', k.toUpperCase());
    expect(runs).toBe(1);
    await request(app).post(PATH).set('Idempotency-Key', key());
    expect(runs).toBe(2);
  });

  it('refuses a change without a key, or with a key that is not a UUID, with 400 and runs nothing', async () => {
    const app = testApp();
    for (const call of [
      request(app).post(PATH),
      request(app).post(PATH).set('Idempotency-Key', ''),
      request(app).post(PATH).set('Idempotency-Key', 'click-1'),
      request(app).delete(PATH).set('Idempotency-Key', `${key()}x`),
    ]) {
      const res = await call;
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ code: 'idempotency_key_required', message: 'Please try again' });
    }
    expect(runs).toBe(0);
    expect(await keysOf(A)).toEqual([]);
  });

  it('lets a reading request through without a key, every time, and keeps nothing', async () => {
    const app = testApp();
    const k = key();
    expect((await request(app).get(PATH)).status).toBe(200);
    expect((await request(app).get(PATH).set('Idempotency-Key', k)).status).toBe(200);
    expect((await request(app).get(PATH).set('Idempotency-Key', k)).status).toBe(200);
    expect(runs).toBe(3);
    expect(await keysOf(A)).toEqual([]);
  });

  it('keeps no key when the request fails, so the same key may be sent again and runs then', async () => {
    const app = testApp();
    const k = key();
    nextAnswer = () => {
      throw new AppError(409, 'stale_version', 'This was just changed, please review');
    };
    expect((await request(app).post(PATH).set('Idempotency-Key', k)).status).toBe(409);
    expect(await keysOf(A)).toEqual([]);
    nextAnswer = () => ({ ok: true, run: runs });
    const retry = await request(app).post(PATH).set('Idempotency-Key', k);
    expect(retry.status).toBe(200);
    expect(retry.body).toEqual({ ok: true, run: 2 });
  });

  it('refuses a key that another person or another door already used, with 409, and never shows their answer', async () => {
    const k = key();
    await request(testApp()).post(PATH).set('Idempotency-Key', k);
    const otherPerson = await request(testApp({ userId: OTHER_PERSON })).post(PATH).set('Idempotency-Key', k);
    const otherDoor = await request(testApp()).delete(PATH).set('Idempotency-Key', k);
    for (const res of [otherPerson, otherDoor]) {
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'idempotency_key_reused' });
      expect(JSON.stringify(res.body)).not.toContain('"run"');
    }
    expect(runs).toBe(1);
  });

  it('keeps each company’s keys apart: the same key in another company runs there', async () => {
    const k = key();
    await request(testApp()).post(PATH).set('Idempotency-Key', k);
    const inB = await request(testApp({ companyId: B })).post(PATH).set('Idempotency-Key', k);
    expect(inB.status).toBe(200);
    expect(runs).toBe(2);
    expect((await keysOf(A)).map((row) => row.key)).toEqual([k]);
    expect((await keysOf(B)).map((row) => row.key)).toEqual([k]);
  });

  it('runs again once a key’s 24 hours are over, and keeps the new answer', async () => {
    const app = testApp();
    const k = key();
    await request(app).post(PATH).set('Idempotency-Key', k);
    await owner.query('BEGIN');
    await owner.query("SELECT set_config('app.company_id', $1, true)", [A]);
    await owner.query("UPDATE core.idempotency_keys SET expires_at = now() - interval '1 second'");
    await owner.query('COMMIT');
    const later = await request(app).post(PATH).set('Idempotency-Key', k);
    expect(later.body).toEqual({ ok: true, run: 2 });
    expect((await request(app).post(PATH).set('Idempotency-Key', k)).body).toEqual({ ok: true, run: 2 });
    expect(runs).toBe(2);
  });

  it('runs once when the same key arrives twice at the same moment, and both get its answer', async () => {
    const app = testApp();
    const k = key();
    const [one, two] = await Promise.all([
      request(app).post(PATH).set('Idempotency-Key', k),
      request(app).post(PATH).set('Idempotency-Key', k),
    ]);
    expect([one.status, two.status]).toEqual([200, 200]);
    expect(one.body).toEqual({ ok: true, run: 1 });
    expect(two.body).toEqual(one.body);
    expect(runs).toBe(1);
  });

  it('gives back an answer of null or false on a repeat too', async () => {
    const app = testApp();
    for (const answer of [null, false]) {
      nextAnswer = () => answer;
      const k = key();
      expect((await request(app).post(PATH).set('Idempotency-Key', k)).body).toBe(answer);
      const again = await request(app).post(PATH).set('Idempotency-Key', k);
      expect(again.status).toBe(200);
      expect(again.body).toBe(answer);
    }
    expect(runs).toBe(2);
  });

  it('refuses without the person or the transaction, before anything runs (a plain error: 500)', async () => {
    const real = createHooks();
    const info = { req: { get: () => key() }, route: { method: 'post', operationId: 'x' } } as never;
    await expect(real.idempotency(info, async () => 'ran')).rejects.toThrow('No request context');
    await expect(
      runWithContext({ requestId: 'r', background: false, companyId: A, userId: PERSON }, () => real.idempotency(info, async () => 'ran')),
    ).rejects.toThrow('the double-click key needs the request transaction and the person');
  });
});
