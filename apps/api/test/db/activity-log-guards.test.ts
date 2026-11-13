// TASK-0093 · Two guards in the activity-log writer, from Codex's check of TASK-0017: a missing record ID is refused before the database sees it, and a field that looks like a secret is never stored. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction } from '../../src/db/database.js';
import { writeActivity, type ActivityEntry } from '../../src/modules/core/repository/activity-log.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const RECORD = '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f';
let A = '';
let n = 0;

const ctx = (): RequestContext => {
  n += 1;
  return { requestId: `req-0093-${n}`, background: false, companyId: A, userId: PERSON };
};
const write = (entry: ActivityEntry) => runWithContext(ctx(), () => inRequestTransaction(() => writeActivity(entry)));
const entry = (more: Partial<ActivityEntry> = {}): ActivityEntry => ({
  module: 'core',
  recordType: 'user',
  recordId: RECORD,
  recordLabel: 'Harini S',
  action: 'update',
  ...more,
});

async function rows(): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [A]);
    return (await owner.query('SELECT * FROM audit.activity_log ORDER BY at, id')).rows;
  } finally {
    await owner.query('COMMIT');
  }
}

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE audit.activity_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('the activity-log writer’s guards (TASK-0093)', () => {
  it('refuses an entry with no record ID, or an empty one, before the database sees it, and saves nothing', async () => {
    for (const recordId of [undefined, '', null]) {
      const error = await write(entry({ recordId: recordId as unknown as string })).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('the activity entry holds an ID that is not valid');
    }
    expect(await rows()).toEqual([]);
  });

  it('keeps a secret-looking field as changed, with both values hidden, in any spelling', async () => {
    await write(
      entry({
        changes: {
          password: { old: 'old-pass-1', new: 'new-pass-2' },
          newPassword: { old: null, new: 'new-pass-3' },
          two_step_passcode: { old: '111111', new: '222222' },
          clientSecret: { old: 'sec-1', new: 'sec-2' },
          'gmail.app_password': { old: 'app-1', new: 'app-2' },
          accessToken: { old: 'tok-1', new: 'tok-2' },
          'API-Key': { old: 'key-1', new: 'key-2' },
          private_key: { old: 'pk-1', new: 'pk-2' },
        },
      }),
    );
    const hidden = { old: '[hidden]', new: '[hidden]' };
    const [row] = await rows();
    expect(row!.changes).toEqual({
      password: hidden,
      newPassword: hidden,
      two_step_passcode: hidden,
      clientSecret: hidden,
      'gmail.app_password': hidden,
      accessToken: hidden,
      'API-Key': hidden,
      private_key: hidden,
    });
  });

  it('hides a secret-looking part deeper inside a value, and keeps everything else as it is', async () => {
    await write(
      entry({
        changes: {
          email_door: {
            old: { host: 'smtp.gmail.com', smtpPassword: 'old-smtp', options: { token: 'old-t', port: 587 } },
            new: { host: 'smtp.zoho.in', smtpPassword: 'new-smtp', options: { token: 'new-t', port: 465 } },
          },
          code: { old: 'CL-0041', new: 'CL-0042' },
          key: { old: 'security.lock_after_tries', new: 'security.lock_after_tries' },
          phone: { old: undefined, new: '98400 22222' },
        },
      }),
    );
    const [row] = await rows();
    expect(row!.changes).toEqual({
      email_door: {
        old: { host: 'smtp.gmail.com', smtpPassword: '[hidden]', options: { token: '[hidden]', port: 587 } },
        new: { host: 'smtp.zoho.in', smtpPassword: '[hidden]', options: { token: '[hidden]', port: 465 } },
      },
      code: { old: 'CL-0041', new: 'CL-0042' },
      key: { old: 'security.lock_after_tries', new: 'security.lock_after_tries' },
      phone: { old: null, new: '98400 22222' },
    });
  });

  it('never stores a secret value anywhere in the entry', async () => {
    const secrets = ['old-pass-1', 'new-pass-2', 'sec-2', 'tok-2', 'deep-secret'];
    await write(
      entry({
        changes: {
          password: { old: 'old-pass-1', new: 'new-pass-2' },
          clientSecret: { old: null, new: 'sec-2' },
          refreshToken: { old: null, new: 'tok-2' },
          door: { old: null, new: { list: [{ secret: 'deep-secret' }] } },
        },
      }),
    );
    const stored = JSON.stringify(await rows());
    for (const secret of secrets) expect(stored).not.toContain(secret);
  });
});
