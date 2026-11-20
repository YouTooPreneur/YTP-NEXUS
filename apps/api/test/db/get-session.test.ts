// TASK-0098 · get-session and the sign-in answers: GET /api/auth/get-session is counted in the public bucket of the per-address limit, never in the sign-in bucket that everyone behind one office address shares; no answer of the sign-in doors carries the session token, failedSignins or lockedUntil, and the cookie still signs the person in. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools } from '../../src/db/database.js';
import { createSigninUser } from '../../src/modules/core/signin/users.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PASSWORD = 'Correct-Horse-0098';
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let A = '';
let appUrl = '';
let savedSettings: NodeJS.ProcessEnv = {};
const web = createApp({ logger: createLogger(new Writable({ write: (_chunk, _encoding, done) => done() })) });

const counters = async () =>
  (await owner.query('SELECT bucket, count FROM core.rate_counters ORDER BY bucket')).rows.map((row) => [String(row.bucket), Number(row.count)]);
const getSession = (address: string, agent: request.Agent = request.agent(web)) => agent.get('/api/auth/get-session').set('X-Forwarded-For', address);
const signInRequest = (agent: request.Agent, email: string, password: string, address: string) =>
  agent.post('/api/auth/sign-in/email').set('Origin', appUrl).set('Content-Type', 'application/json').set('X-Forwarded-For', address).send({ email, password });
async function signIn(email: string, address: string) {
  await createSigninUser({ companyId: A, email, name: 'Test Person', password: PASSWORD });
  const agent = request.agent(web);
  const res = await signInRequest(agent, email, PASSWORD, address);
  return { agent, res };
}
const tokenOf = async (email: string) =>
  String((await owner.query('SELECT s.token FROM auth.session s JOIN auth."user" u ON u.id = s.user_id WHERE u.email = $1', [email])).rows[0]?.token ?? '');

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A } = await makeTestCompanies(owner));
  appUrl = new URL(process.env.APP_URL!).origin;
});

// Small limits for these tests, read at each request; no test's requests may fall in two windows: when fewer than 8 seconds
// are left in the database clock's minute, the test waits for the next one.
beforeEach(async () => {
  savedSettings = { ...process.env };
  process.env.ADDRESS_LIMITS = 'signin:2/minute,public:4/minute';
  await owner.query('TRUNCATE core.rate_counters');
  const left = Number((await owner.query('SELECT 60 - mod(extract(epoch FROM clock_timestamp()), 60) AS left')).rows[0]!.left);
  if (left < 8) await pause(left * 1_000 + 50);
});

afterEach(async () => {
  await closePools();
  for (const key of Object.keys(process.env)) if (!(key in savedSettings)) delete process.env[key];
  Object.assign(process.env, savedSettings);
  await owner.query('TRUNCATE core.rate_counters');
  await owner.query('TRUNCATE auth.session, auth.account, auth.verification, auth."user" CASCADE');
  await owner.query('TRUNCATE audit.security_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('get-session and the per-address limit', () => {
  it('counts GET get-session in the public bucket, so it never uses up the sign-in limit an office shares', { timeout: 30_000 }, async () => {
    for (let i = 0; i < 3; i += 1) expect((await getSession('203.0.113.60')).status).toBe(200);
    expect(await counters()).toEqual([['public:ip:203.0.113.60', 3]]);
    // The sign-in limit (2 a minute here) is still whole: two sign-ins from the same address both get in.
    const { agent, res } = await signIn('asha@example.com', '203.0.113.60');
    expect(res.status).toBe(200);
    expect((await signInRequest(agent, 'asha@example.com', PASSWORD, '203.0.113.60')).status).toBe(200);
    expect(await counters()).toEqual([
      ['public:ip:203.0.113.60', 3],
      ['signin:ip:203.0.113.60', 2],
    ]);
  });

  it('still limits get-session, with the public limit', { timeout: 30_000 }, async () => {
    const answers: number[] = [];
    for (let i = 0; i < 5; i += 1) answers.push((await getSession('203.0.113.61')).status);
    expect(answers).toEqual([200, 200, 200, 200, 429]);
    expect(await counters()).toEqual([['public:ip:203.0.113.61', 5]]);
  });

  it('counts every other request under /api/auth, get-session by any other method included, in the sign-in bucket as before', async () => {
    const asPost = await request(web).post('/api/auth/get-session').set('Origin', appUrl).set('Content-Type', 'application/json').set('X-Forwarded-For', '203.0.113.62').send({});
    expect(asPost.status).toBe(404);
    expect((await request(web).get('/api/auth/x').set('X-Forwarded-For', '203.0.113.62')).status).toBe(404);
    expect(await counters()).toEqual([['signin:ip:203.0.113.62', 2]]);
  });
});

describe('the answers of the sign-in doors', () => {
  it('get-session gives the session and the person, without the session token, failedSignins or lockedUntil', { timeout: 30_000 }, async () => {
    const { agent, res } = await signIn('ravi@example.com', '203.0.113.63');
    expect(res.status).toBe(200);
    const token = await tokenOf('ravi@example.com');
    expect(token.length).toBeGreaterThan(10);
    const session = await getSession('203.0.113.63', agent);
    expect(session.status).toBe(200);
    expect(session.body.user).toMatchObject({ email: 'ravi@example.com', companyId: A, status: 'active' });
    expect(session.body.session).toMatchObject({ userId: session.body.user.id });
    expect(typeof session.body.session.id).toBe('string');
    expect(session.body.session).not.toHaveProperty('token');
    expect(session.body.user).not.toHaveProperty('failedSignins');
    expect(session.body.user).not.toHaveProperty('lockedUntil');
    expect(JSON.stringify(session.body)).not.toContain(token);
    expect((await getSession('203.0.113.63')).body).toBeNull();
  });

  it('the email sign-in answer leaves out the session token, failedSignins and lockedUntil, and its cookie still signs the person in', { timeout: 30_000 }, async () => {
    const { agent, res } = await signIn('meena@example.com', '203.0.113.64');
    expect(res.status).toBe(200);
    const token = await tokenOf('meena@example.com');
    expect(token.length).toBeGreaterThan(10);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'meena@example.com' });
    expect(res.body.user).not.toHaveProperty('failedSignins');
    expect(res.body.user).not.toHaveProperty('lockedUntil');
    expect(JSON.stringify(res.body)).not.toContain(token);
    expect(String(res.headers['set-cookie'])).toMatch(/session_token=/);
    expect((await getSession('203.0.113.64', agent)).body?.user?.email).toBe('meena@example.com');
  });

  it('keeps a refused sign-in’s answer as Better Auth gives it', async () => {
    await createSigninUser({ companyId: A, email: 'kumar@example.com', name: 'Kumar', password: PASSWORD });
    const res = await signInRequest(request.agent(web), 'kumar@example.com', 'Wrong-Horse-0098', '203.0.113.65');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) });
  });
});
