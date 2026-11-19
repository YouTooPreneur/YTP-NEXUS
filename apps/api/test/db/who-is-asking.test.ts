// TASK-0033 · The "who is asking" step: Better Auth reads the session, and the step puts the person, their company and the session's ID on the request's own context before the transaction opens; no session, a tampered cookie, a signed-out or expired session, or a person who is not active answers 401 not_signed_in before anything else runs; the step refreshes nothing; the session token never reaches the context or the log. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { getContext } from '../../src/shared/context.js';
import { defineRoute, mountRoutes, type RouteHooks } from '../../src/shared/route.js';
import { closePools } from '../../src/db/database.js';
import { createHooks } from '../../src/shared/hooks.js';
import { createSigninUser } from '../../src/modules/core/signin/users.js';
import { getAuth } from '../../src/modules/core/signin/auth.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PASSWORD = 'Correct-Horse-0033';
const DOOR = '/api/test/who';
let A = '';
let B = '';
let appUrl = '';
const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));

// What the door's handler saw on the request context, and which steps ran, in order.
let seen: Record<string, unknown> | undefined;
let steps: string[] = [];

// The real who-is-asking and transaction steps from createHooks(), with stand-ins for the steps later cards build.
const real = createHooks();
const hooks: RouteHooks = {
  session: async (info) => {
    steps.push('session');
    await real.session(info);
  },
  inTransaction: async (info, run) => {
    steps.push('transaction');
    return real.inTransaction(info, run);
  },
  idleTimeout: async () => {},
  twoStepGate: async () => {},
  personLimit: async () => {},
  featureSwitch: async () => {},
  permission: async () => {},
  idempotency: async (_info, run) => run(),
  hideFields: (_info, answer) => answer,
};
const door = defineRoute({
  contract: defineContract({
    method: 'get',
    path: DOOR,
    operationId: 'testWhoIsAsking',
    module: 'core',
    summary: 'A door used only by this test',
    response: z.object({ ok: z.boolean() }),
  }),
  permission: { module: 'core', action: 'view' },
  feature: 'core.test',
  handler: async () => {
    const context = getContext();
    const setting = await context.tx!.execute(sql`SELECT current_setting('app.company_id', true) AS company`);
    const fields = Object.fromEntries(Object.entries(context).filter(([key]) => key !== 'tx'));
    seen = { ...fields, company: String(setting.rows[0]?.company), whole: JSON.stringify(fields) };
    return { ok: true };
  },
});
const web = createApp({ logger, hooks, routes: (a) => mountRoutes(a, [door], hooks) });

// A POST to a sign-in door the way the screens send it, and a person added and signed in with a password.
const post = (agent: request.Agent, path: string, body: object) => agent.post(path).set('Origin', appUrl).set('Content-Type', 'application/json').send(body);
async function signIn(companyId: string, email: string): Promise<{ agent: request.Agent; id: string; cookie: string }> {
  const id = await createSigninUser({ companyId, email, name: 'Test Person', password: PASSWORD });
  const agent = request.agent(web);
  const res = await post(agent, '/api/auth/sign-in/email', { email, password: PASSWORD });
  expect(res.status).toBe(200);
  const cookie = [res.headers['set-cookie']].flat().map(String).find((c) => c.includes('session_token='));
  expect(cookie).toBeDefined();
  return { agent, id, cookie: String(cookie).split(';')[0]! };
}
const sessionOf = async (userId: string) =>
  (await owner.query('SELECT id, token, expires_at FROM auth.session WHERE user_id = $1', [userId])).rows[0] as { id: string; token: string; expires_at: Date } | undefined;

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
  appUrl = new URL(process.env.APP_URL!).origin;
});

// Each test starts with no sign-in counts (infra/.env.test allows signin:20/minute from one address) and no record of a step.
beforeEach(async () => {
  steps = [];
  seen = undefined;
  await owner.query('TRUNCATE core.rate_counters');
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE auth.session, auth.account, auth.verification, auth."user" CASCADE');
  await owner.query('TRUNCATE audit.security_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('a signed-in person', () => {
  it('is put on the request’s own context with their company and the session’s ID, and the rest of the request runs in that company', async () => {
    const { agent, id } = await signIn(A, 'asha@example.com');
    const session = await sessionOf(id);
    const res = await agent.get(DOOR);
    expect(res.status).toBe(200);
    expect(seen).toMatchObject({ requestId: res.headers['x-request-id'], userId: id, companyId: A, sessionId: session!.id, company: A });
    expect(steps).toEqual(['session', 'transaction']);
  });

  it('stays in their own company: two people of two companies each get their own', async () => {
    const a = await signIn(A, 'arun@example.com');
    const b = await signIn(B, 'bala@example.com');
    expect((await b.agent.get(DOOR)).status).toBe(200);
    expect(seen).toMatchObject({ userId: b.id, companyId: B, company: B });
    expect((await a.agent.get(DOOR)).status).toBe(200);
    expect(seen).toMatchObject({ userId: a.id, companyId: A, company: A });
  });

  it('is never refreshed by the step: a session that Better Auth would refresh keeps its expiry, and the answer sets no cookie', async () => {
    const { agent, id } = await signIn(A, 'nila@example.com');
    await owner.query(`UPDATE auth.session SET expires_at = now() + interval '1 day' WHERE user_id = $1`, [id]);
    const before = (await sessionOf(id))!.expires_at;
    const res = await agent.get(DOOR);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await sessionOf(id))!.expires_at).toEqual(before);
  });
});

describe('everyone else', () => {
  it('gets 401 not_signed_in before anything else runs: no session cookie, a tampered one, or the cookie of a signed-out session', async () => {
    const { agent, id, cookie } = await signIn(A, 'ravi@example.com');
    const at = cookie.indexOf('=') + 1;
    const tampered = `${cookie.slice(0, at)}${cookie[at] === 'A' ? 'B' : 'A'}${cookie.slice(at + 1)}`;
    const answers = [await request(web).get(DOOR), await request(web).get(DOOR).set('Cookie', tampered)];
    expect((await post(agent, '/api/auth/sign-out', {})).status).toBe(200);
    expect(await sessionOf(id)).toBeUndefined();
    answers.push(await request(web).get(DOOR).set('Cookie', cookie));
    for (const res of answers) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: { code: 'not_signed_in', message: 'Please sign in.', requestId: res.headers['x-request-id'] } });
    }
    expect(steps).toEqual(['session', 'session', 'session']);
    expect(seen).toBeUndefined();
    expect((await request(web).get('/api/health')).status).toBe(200);
  });

  it('refuses at once a person who is disabled while their session is open (CORE-006), and anyone who is not active', async () => {
    const { agent, id } = await signIn(A, 'meena@example.com');
    expect((await agent.get(DOOR)).status).toBe(200);
    for (const status of ['disabled', 'invited']) {
      await owner.query(`UPDATE auth."user" SET status = $2 WHERE id = $1`, [id, status]);
      const res = await agent.get(DOOR);
      expect(res.status, status).toBe(401);
      expect(res.body).toEqual({ error: { code: 'not_signed_in', message: 'Please sign in.', requestId: res.headers['x-request-id'] } });
    }
    await owner.query(`UPDATE auth."user" SET status = 'active' WHERE id = $1`, [id]);
    expect((await agent.get(DOOR)).status).toBe(200);
  });

  it('refuses an expired session', async () => {
    const { agent, id } = await signIn(A, 'kavi@example.com');
    // A day in the past: Better Auth compares with the API's clock, the database writes with its own.
    await owner.query(`UPDATE auth.session SET expires_at = now() - interval '1 day' WHERE user_id = $1`, [id]);
    const res = await agent.get(DOOR);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'not_signed_in', message: 'Please sign in.', requestId: res.headers['x-request-id'] } });
  });
});

describe('asking Better Auth', () => {
  it('asks it exactly once for every request, one with no cookie included, never to refresh and never from its cookie cache', async () => {
    const { agent } = await signIn(A, 'uma@example.com');
    const ask = vi.spyOn(getAuth().api, 'getSession');
    try {
      expect((await request(web).get(DOOR)).status).toBe(401);
      expect((await agent.get(DOOR)).status).toBe(200);
      expect(ask).toHaveBeenCalledTimes(2);
      for (const call of ask.mock.calls) expect(call[0]).toMatchObject({ query: { disableRefresh: true, disableCookieCache: true } });
    } finally {
      ask.mockRestore();
    }
  });
});

describe('the session token', () => {
  it('never reaches the context or the log, even when the session cannot be read', async () => {
    const { agent, id } = await signIn(A, 'tara@example.com');
    const { token } = (await sessionOf(id))!;
    const start = lines.length;
    expect((await agent.get(DOOR)).status).toBe(200);
    expect(String(seen?.whole)).not.toContain(token);
    // The session cannot be read: the database settings are gone, and the failed query holds the token.
    await closePools();
    const saved = process.env.DATABASE_URL_APP;
    delete process.env.DATABASE_URL_APP;
    try {
      const res = await agent.get(DOOR);
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('server_error');
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL_APP = saved;
    }
    expect(lines.slice(start).join('\n')).not.toContain(token);
  });
});
