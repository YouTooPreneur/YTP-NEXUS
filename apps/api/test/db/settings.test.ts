// TASK-0024 · The settings store: the table and its rights, defining a setting, reading with defaults, and saving with the value check, the version and the activity-log entry in the same transaction. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { AppError } from '../../src/shared/errors.js';
import { closePools, inRequestTransaction } from '../../src/db/database.js';
import { defineSetting, findSetting, getSetting, setSetting } from '../../src/modules/core/service/settings.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
let A = '';
let B = '';
let n = 0;

// Probe settings, made only for this test (each card defines its real settings itself).
const tries = defineSetting({
  key: 'probe.lock_after_tries',
  module: 'core',
  schema: z.number().int().min(3).max(10),
  default: 5,
  help: 'Wrong passwords before an account is locked',
});
const colour = defineSetting({
  key: 'probe.default_colour',
  module: 'core',
  schema: z.enum(['emerald', 'ocean']),
  default: 'emerald' as 'emerald' | 'ocean',
  help: 'The colour new people start with',
});

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0024-${n}`, background: false, companyId: A, userId: PERSON, ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));

async function asOwner(companyId: string, text: string): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await owner.query(text)).rows;
  } finally {
    await owner.query('COMMIT');
  }
}
const stored = (companyId: string) => asOwner(companyId, 'SELECT key, module, value, version, updated_by FROM core.settings ORDER BY key');
const logged = (companyId: string) =>
  asOwner(companyId, "SELECT module, record_type, record_id, record_label, action, changes, actor_user_id FROM audit.activity_log WHERE record_type = 'setting' ORDER BY at, id");

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE core.settings, audit.activity_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('core.settings (the table)', () => {
  it('has exactly the planned columns, its key of company and key, and a company link that refuses to delete a company', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'settings' ORDER BY ordinal_position`,
    );
    expect(columns.rows).toEqual([
      { name: 'company_id', type: 'uuid', required: true, default: null },
      { name: 'key', type: 'text', required: true, default: null },
      { name: 'module', type: 'text', required: true, default: null },
      { name: 'value', type: 'jsonb', required: true, default: null },
      { name: 'updated_at', type: 'timestamp with time zone', required: true, default: 'now()' },
      { name: 'updated_by', type: 'uuid', required: false, default: null },
      { name: 'version', type: 'integer', required: true, default: '1' },
    ]);
    const constraints = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.settings'::regclass ORDER BY contype`,
    );
    expect(constraints.rows).toEqual([
      { kind: 'f', def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' },
      { kind: 'p', def: 'PRIMARY KEY (company_id, key)' },
    ]);
  });

  it('has the company rule, and the app may read, add and change values but never delete or empty them', async () => {
    const table = await owner.query(
      `SELECT relrowsecurity AS rules, relforcerowsecurity AS forced, (SELECT count(*)::int FROM aclexplode(relacl) a WHERE a.grantee = 0) AS for_everyone
         FROM pg_class WHERE oid = 'core.settings'::regclass`,
    );
    expect(table.rows).toEqual([{ rules: true, forced: true, for_everyone: 0 }]);
    const rights = await owner.query(
      `SELECT r AS right, has_table_privilege('nexus_app', 'core.settings', r) AS app
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

describe('defineSetting', () => {
  it('keeps each definition, findable by its key, and refuses a wrong key, a secret, a repeat or a default that breaks its rule', () => {
    expect(findSetting('probe.lock_after_tries')).toBe(tries);
    expect(findSetting('probe.nothing')).toBeUndefined();
    const base = { module: 'core', schema: z.number(), default: 1, help: 'x' };
    for (const key of ['locktries', 'Probe.tries', 'probe.lock-tries', 'probe.', '.tries', 'probe.a.b', 'probe tries.x']) {
      expect(() => defineSetting({ ...base, key }), key).toThrow(`the setting key ${key} is not <group>.<name> in lower case`);
    }
    for (const key of ['gmail.app_password', 'door.api_key', 'smtp.secret', 'auth.token_minutes']) {
      expect(() => defineSetting({ ...base, key }), key).toThrow(`the setting ${key} looks like a secret, which never goes in settings`);
    }
    expect(() => defineSetting({ ...base, key: 'probe.lock_after_tries' })).toThrow('the setting probe.lock_after_tries is defined twice');
    expect(() => defineSetting({ ...base, key: 'probe.bad_default', default: 'five' as unknown as number })).toThrow(
      'the default of the setting probe.bad_default does not fit its rule',
    );
    expect(() => defineSetting({ ...base, key: 'probe.null_default', schema: z.number().nullable(), default: null })).toThrow(
      'the default of the setting probe.null_default does not fit its rule',
    );
  });
});

describe('getSetting and setSetting', () => {
  it('gives the default until a value is saved, then the saved value; another company keeps its own', async () => {
    expect(await inRequest(ctx(), () => getSetting(tries))).toBe(5);
    const saved = await inRequest(ctx(), () => setSetting(tries, 7, 0));
    expect(saved).toMatchObject({ key: 'probe.lock_after_tries', value: 7, version: 1 });
    expect(saved.updatedAt).toBeInstanceOf(Date);
    expect(await inRequest(ctx(), () => getSetting(tries))).toBe(7);
    expect(await inRequest(ctx({ companyId: B }), () => getSetting(tries))).toBe(5);
    expect(await stored(A)).toEqual([{ key: 'probe.lock_after_tries', module: 'core', value: 7, version: 1, updated_by: PERSON }]);
    expect(await stored(B)).toEqual([]);
  });

  it('counts the version up with each save and writes each change to the activity log, with the default as the first old value', async () => {
    await inRequest(ctx(), () => setSetting(tries, 7, 0));
    expect((await inRequest(ctx(), () => setSetting(tries, 4, 1))).version).toBe(2);
    expect(await logged(A)).toEqual([
      { module: 'core', record_type: 'setting', record_id: A, record_label: 'probe.lock_after_tries', action: 'update', changes: { 'probe.lock_after_tries': { old: 5, new: 7 } }, actor_user_id: PERSON },
      { module: 'core', record_type: 'setting', record_id: A, record_label: 'probe.lock_after_tries', action: 'update', changes: { 'probe.lock_after_tries': { old: 7, new: 4 } }, actor_user_id: PERSON },
    ]);
  });

  it('refuses a save based on an old version with 409 stale_version, and changes and logs nothing', async () => {
    await inRequest(ctx(), () => setSetting(colour, 'ocean', 0));
    for (const version of [0, 2, -1]) {
      const error = await inRequest(ctx(), () => setSetting(colour, 'emerald', version)).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ status: 409, code: 'stale_version', message: 'This was just changed, please review' });
    }
    expect((await stored(A)).map((row) => [row.value, row.version])).toEqual([['ocean', 1]]);
    expect(await logged(A)).toHaveLength(1);
  });

  it('refuses a value that breaks the rule with 400 and the reason, without repeating the value, and saves nothing', async () => {
    for (const value of [2, 11, 4.5, '7', null, undefined]) {
      const error = await inRequest(ctx(), () => setSetting(tries, value, 0)).catch((caught: unknown) => caught);
      expect(error, String(value)).toMatchObject({ status: 400, code: 'invalid_input', message: 'Please check the form' });
      const reason = (error as AppError).fields?.value ?? '';
      expect(reason.length).toBeGreaterThan(0);
      if (typeof value === 'number') expect(reason).not.toContain(String(value));
    }
    // A rule that would let an empty value through still never stores one (the value column is required).
    const maybe = defineSetting({ key: 'probe.maybe_limit', module: 'core', schema: z.number().nullable().optional(), default: 1, help: 'x' });
    for (const value of [null, undefined]) {
      const error = await inRequest(ctx(), () => setSetting(maybe, value, 0)).catch((caught: unknown) => caught);
      expect(error, String(value)).toMatchObject({ status: 400, code: 'invalid_input', fields: { value: 'A value is needed' } });
    }
    expect(await stored(A)).toEqual([]);
    expect(await logged(A)).toEqual([]);
  });

  it('saves nothing and logs nothing when the value is the same, and keeps the version', async () => {
    const same = await inRequest(ctx(), () => setSetting(tries, 5, 0));
    expect(same).toMatchObject({ value: 5, version: 0, updatedAt: null });
    await inRequest(ctx(), () => setSetting(tries, 6, 0));
    expect(await inRequest(ctx(), () => setSetting(tries, 6, 1))).toMatchObject({ value: 6, version: 1 });
    expect((await stored(A)).map((row) => row.version)).toEqual([1]);
    expect(await logged(A)).toHaveLength(1);
  });

  it('keeps the value and its log entry together: when the request fails afterwards, neither stays', async () => {
    await expect(
      inRequest(ctx(), async () => {
        await setSetting(tries, 8, 0);
        throw new Error('a later step failed');
      }),
    ).rejects.toThrow('a later step failed');
    expect(await stored(A)).toEqual([]);
    expect(await logged(A)).toEqual([]);
  });

  it('lets only one of two first saves at the same moment through; the other gets 409, never a server error', async () => {
    const results = await Promise.allSettled([
      inRequest(ctx(), () => setSetting(tries, 6, 0)),
      inRequest(ctx(), () => setSetting(tries, 9, 0)),
    ]);
    const kept = results.filter((r) => r.status === 'fulfilled');
    const refused = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(kept).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]!.reason).toMatchObject({ status: 409, code: 'stale_version' });
    expect(await stored(A)).toHaveLength(1);
    expect(await logged(A)).toHaveLength(1);
  });

  it('lets only one of two saves of the same version at the same moment through; the other gets 409', async () => {
    await inRequest(ctx(), () => setSetting(tries, 6, 0));
    // The first save holds its transaction open for a moment, so the second reads version 1 before the first commits.
    const pause = (seconds: number) => getContext().tx!.execute(sql`SELECT pg_sleep(${seconds})`);
    const results = await Promise.allSettled([
      inRequest(ctx(), async () => {
        const saved = await setSetting(tries, 7, 1);
        await pause(0.6);
        return saved;
      }),
      inRequest(ctx(), async () => {
        await pause(0.2);
        return setSetting(tries, 8, 1);
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((results.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason).toMatchObject({ status: 409, code: 'stale_version' });
    expect((await stored(A)).map((row) => row.version)).toEqual([2]);
    expect(await logged(A)).toHaveLength(2);
  });

  it('refuses a stored value that no longer fits its rule, instead of using it', async () => {
    await asOwner(A, `INSERT INTO core.settings (company_id, key, module, value) VALUES ('${A}', 'probe.lock_after_tries', 'core', '"lots"')`);
    await expect(inRequest(ctx(), () => getSetting(tries))).rejects.toThrow('the stored setting probe.lock_after_tries no longer fits its rule');
  });

  it('works only in the request’s transaction: outside a request, or without its transaction, it refuses', async () => {
    await expect(getSetting(tries)).rejects.toThrow('No request context');
    await expect(runWithContext(ctx(), () => getSetting(tries))).rejects.toThrow('settings need the request transaction and the company');
    await expect(runWithContext(ctx(), () => setSetting(tries, 6, 0))).rejects.toThrow('settings need the request transaction and the company');
  });
});
