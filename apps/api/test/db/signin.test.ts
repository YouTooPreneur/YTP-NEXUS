// TASK-0032 · Sign-in with Better Auth: its tables and rights, adding a sign-in user, email and password sign-in for added people only, the security-log entries, sign-out, the reset link, Google's start, the open doors only, and nothing secret in the log. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { closePools } from '../../src/db/database.js';
import { authLog, getAuth } from '../../src/modules/core/signin/auth.js';
import { createSigninUser } from '../../src/modules/core/signin/users.js';
import { setResetMailer } from '../../src/modules/core/signin/reset-email.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PASSWORD = 'Correct-Horse-0032';
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
let A = '';
let appUrl = '';
const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const web = createApp({ logger });
const mails: { to: string; link: string }[] = [];

// A POST to a sign-in door the way the screens send it: from Nexus's own address.
const post = (agent: request.Agent | ReturnType<typeof request>, path: string, body: object) =>
  (agent as request.Agent).post(path).set('Origin', appUrl).set('Content-Type', 'application/json').send(body);
const signIn = (agent: request.Agent, email: string, password: string) => post(agent, '/api/auth/sign-in/email', { email, password });

// The security log, read by the owner company by company and for the system chain (as the system account).
async function securityLog(): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query('SET LOCAL ROLE nexus_system');
    return (await owner.query('SELECT company_id, event, user_id, ip, details FROM audit.security_log ORDER BY id')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}
const user = async (email: string) =>
  (await owner.query('SELECT id, email, status, company_id FROM auth."user" WHERE email = $1', [email])).rows[0] as Record<string, unknown> | undefined;

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A } = await makeTestCompanies(owner));
  appUrl = new URL(process.env.APP_URL!).origin;
});

beforeEach(() => {
  mails.length = 0;
  setResetMailer(async (mail) => {
    mails.push(mail);
  });
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

describe('Better Auth’s tables', () => {
  it('keep time-ordered IDs, the Nexus fields on the user, one row per email, and give the app exactly its rights', async () => {
    const ids = await owner.query(
      `SELECT table_name AS name, column_default AS "default" FROM information_schema.columns
        WHERE table_schema = 'auth' AND column_name = 'id' ORDER BY table_name`,
    );
    expect(ids.rows).toEqual([
      { name: 'account', default: 'core.uuid_v7()' },
      { name: 'session', default: 'core.uuid_v7()' },
      { name: 'user', default: 'core.uuid_v7()' },
      { name: 'verification', default: 'core.uuid_v7()' },
    ]);
    const nexusFields = await owner.query(
      `SELECT column_name AS name, data_type AS type, udt_name AS udt, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'user'
          AND column_name IN ('company_id', 'status', 'failed_signins', 'locked_until') ORDER BY column_name`,
    );
    expect(nexusFields.rows.map((c) => [c.name, c.type === 'USER-DEFINED' ? c.udt : c.type, c.required, c.default])).toEqual([
      ['company_id', 'uuid', true, null],
      ['failed_signins', 'smallint', true, '0'],
      ['locked_until', 'timestamp with time zone', false, null],
      ['status', 'user_status', true, "'invited'::auth.user_status"],
    ]);
    const statuses = await owner.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'auth.user_status'::regtype ORDER BY enumsortorder`);
    expect(statuses.rows.map((s) => s.enumlabel)).toEqual(['invited', 'active', 'disabled']);
    const link = await owner.query(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'auth."user"'::regclass AND contype = 'f'`,
    );
    expect(link.rows).toEqual([{ def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' }]);
    const rights = await owner.query(
      `SELECT t AS "table", r AS right FROM unnest(ARRAY['auth."user"', 'auth.session', 'auth.account', 'auth.verification']) t,
              unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r WHERE has_table_privilege('nexus_app', t, r)`,
    );
    expect(rights.rows.map((x) => `${x.table} ${x.right}`).sort()).toEqual(
      ['auth."user"', 'auth.session', 'auth.account', 'auth.verification'].flatMap((t) => ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].map((r) => `${t} ${r}`)).sort(),
    );
  });
});

describe('adding a sign-in user', () => {
  it('makes an invited person of one company, with a lower-case email, a time-ordered ID and a scrambled password', async () => {
    const id = await createSigninUser({ companyId: A, email: 'Asha.Kumar@Example.com', name: 'Asha Kumar', password: PASSWORD });
    expect(id).toMatch(V7);
    expect(await user('asha.kumar@example.com')).toMatchObject({ id, status: 'invited', company_id: A });
    const accounts = (await owner.query('SELECT provider_id, password FROM auth.account WHERE user_id = $1', [id])).rows;
    expect(accounts).toHaveLength(1);
    expect(accounts[0]!.provider_id).toBe('credential');
    expect(String(accounts[0]!.password)).not.toContain(PASSWORD);
    await expect(createSigninUser({ companyId: A, email: 'asha.kumar@example.com', name: 'Again', password: PASSWORD })).rejects.toThrow();
  });
});

describe('email and password sign-in', () => {
  it('signs an added person in, makes them active, logs signin_ok in their company’s chain, and signs them out', async () => {
    const id = await createSigninUser({ companyId: A, email: 'asha@example.com', name: 'Asha', password: PASSWORD });
    const agent = request.agent(web);
    const res = await signIn(agent, 'asha@example.com', PASSWORD);
    expect(res.status).toBe(200);
    expect(String(res.headers['set-cookie'])).toMatch(/session_token=/);
    expect(await user('asha@example.com')).toMatchObject({ status: 'active' });
    const session = await agent.get('/api/auth/get-session');
    expect(session.status).toBe(200);
    expect(session.body?.user?.email).toBe('asha@example.com');
    expect((await securityLog()).filter((e) => e.event === 'signin_ok')).toEqual([
      expect.objectContaining({ company_id: A, user_id: id }),
    ]);
    expect((await post(agent, '/api/auth/sign-out', {})).status).toBe(200);
    expect((await agent.get('/api/auth/get-session')).body).toBeNull();
  });

  it('refuses a wrong password and an unknown email, logging signin_failed in the company’s chain or the system chain with a fixed reason', async () => {
    await createSigninUser({ companyId: A, email: 'ravi@example.com', name: 'Ravi', password: PASSWORD });
    const wrong = await signIn(request.agent(web), 'ravi@example.com', 'not-the-password');
    const unknown = await signIn(request.agent(web), 'nobody@example.com', PASSWORD);
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    const failed = (await securityLog()).filter((e) => e.event === 'signin_failed');
    expect(failed).toEqual([
      expect.objectContaining({ company_id: A, details: { reason: 'wrong password' } }),
      expect.objectContaining({ company_id: null, user_id: null, details: { reason: 'unknown email' } }),
    ]);
    expect((await owner.query('SELECT count(*)::int AS n FROM auth.session')).rows[0]!.n).toBe(0);
  });

  it('refuses a disabled person even with the right password, and makes no session', async () => {
    await createSigninUser({ companyId: A, email: 'meena@example.com', name: 'Meena', password: PASSWORD });
    await owner.query(`UPDATE auth."user" SET status = 'disabled' WHERE email = 'meena@example.com'`);
    const res = await signIn(request.agent(web), 'meena@example.com', PASSWORD);
    expect([401, 403]).toContain(res.status);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await owner.query('SELECT count(*)::int AS n FROM auth.session')).rows[0]!.n).toBe(0);
    expect((await securityLog()).filter((e) => e.event === 'signin_failed').map((e) => e.details)).toEqual([{ reason: 'disabled' }]);
  });

  it('never lets a person set the Nexus fields of their own record when signing in', async () => {
    await createSigninUser({ companyId: A, email: 'kavi@example.com', name: 'Kavi', password: PASSWORD });
    await post(request.agent(web), '/api/auth/sign-in/email', { email: 'kavi@example.com', password: PASSWORD, status: 'disabled', companyId: null });
    expect(await user('kavi@example.com')).toMatchObject({ status: 'active', company_id: A });
  });
});

describe('only the agreed sign-in doors are open', () => {
  it('answers 404 for self sign-up and every other Better Auth door, the reset link’s GET door included', async () => {
    const closed: [string, string][] = [
      ['post', '/api/auth/sign-up/email'],
      ['post', '/api/auth/update-user'],
      ['post', '/api/auth/change-password'],
      ['post', '/api/auth/change-email'],
      ['post', '/api/auth/delete-user'],
      ['get', '/api/auth/list-accounts'],
      ['post', '/api/auth/link-social'],
      ['get', '/api/auth/reset-password/SOME-TOKEN'],
      ['get', '/api/auth/sign-in/email'],
    ];
    for (const [method, path] of closed) {
      const res = method === 'get' ? await request(web).get(path) : await post(request(web), path, {});
      expect(`${method} ${path} ${res.status}`).toBe(`${method} ${path} 404`);
      expect(res.body).toEqual({ error: { code: 'not_found', message: 'Not found', requestId: res.headers['x-request-id'] } });
    }
    expect((await request(web).get('/api/auth/get-session')).status).toBe(200);
  });
});

describe('password reset', () => {
  it('mails a link to the reset screen at APP_URL, never to a sign-in door, and the token in it sets a new password', async () => {
    await createSigninUser({ companyId: A, email: 'lata@example.com', name: 'Lata', password: PASSWORD });
    const start = lines.length;
    expect((await post(request(web), '/api/auth/request-password-reset', { email: 'lata@example.com' })).status).toBe(200);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.to).toBe('lata@example.com');
    expect(mails[0]!.link.startsWith(`${appUrl}/reset-password?token=`)).toBe(true);
    expect(mails[0]!.link).not.toContain('/api/auth/');
    const token = new URL(mails[0]!.link).searchParams.get('token')!;
    expect(token.length).toBeGreaterThan(10);
    expect((await post(request(web), '/api/auth/reset-password', { token, newPassword: 'Brand-New-0032' })).status).toBe(200);
    expect((await signIn(request.agent(web), 'lata@example.com', 'Brand-New-0032')).status).toBe(200);
    expect((await signIn(request.agent(web), 'lata@example.com', PASSWORD)).status).toBe(401);
    expect(lines.slice(start).join('\n')).not.toContain(token);
  });

  it('answers the same for an unknown email and mails nothing', async () => {
    expect((await post(request(web), '/api/auth/request-password-reset', { email: 'ghost@example.com' })).status).toBe(200);
    expect(mails).toEqual([]);
  });
});

describe('Google sign-in', () => {
  it('starts at Google with Nexus’s client ID and comes back to the agreed return address', async () => {
    const res = await post(request(web), '/api/auth/sign-in/social', { provider: 'google', callbackURL: `${appUrl}/` });
    expect(res.status).toBe(200);
    const url = new URL(res.body.url);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe(process.env.GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(`${appUrl}/api/auth/callback/google`);
  });
});

describe('the settings Nexus relies on', () => {
  it('has self sign-up, Better Auth’s own limiter, its cookie cache and its telemetry off, and trusts only APP_URL', () => {
    const options = getAuth().options as Record<string, any>;
    expect(options.emailAndPassword?.disableSignUp).toBe(true);
    expect(options.rateLimit?.enabled).toBe(false);
    expect(options.session?.cookieCache?.enabled ?? false).toBe(false);
    expect(options.telemetry?.enabled).toBe(false);
    expect(options.trustedOrigins).toEqual([appUrl]);
  });

  it('writes Better Auth’s own log lines through Nexus’s logger, with the message and a cleaned error only', () => {
    const start = lines.length;
    const failure = Object.assign(new Error('Failed query: select 1
params: SECRET-P-0032'), { params: ['SECRET-P-0032'] });
    authLog(logger)('error', 'sign-in broke', { password: 'SECRET-PW-0032', token: 'SECRET-T-0032' }, failure);
    authLog(logger)('success', 'all fine', { idToken: 'SECRET-ID-0032' });
    const text = lines.slice(start).join('
');
    expect(text).toContain('sign-in broke');
    expect(text).toContain('all fine');
    expect(text).not.toContain('SECRET');
  });

  it('never writes a password or a session token to the log during a sign-in', async () => {
    await createSigninUser({ companyId: A, email: 'deepa@example.com', name: 'Deepa', password: PASSWORD });
    const start = lines.length;
    const agent = request.agent(web);
    const res = await signIn(agent, 'deepa@example.com', PASSWORD);
    await signIn(request.agent(web), 'deepa@example.com', 'Wrong-Secret-0032');
    const token = String(res.headers['set-cookie']).match(/session_token=([^;.]+)/)?.[1] ?? 'no-token';
    const text = lines.slice(start).join('\n');
    for (const secret of [PASSWORD, 'Wrong-Secret-0032', token]) expect(text).not.toContain(secret);
  });
});
