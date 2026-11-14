// TASK-0018 · The security log with chained fingerprints: the table, its rights and refusal of changes, the add function and its lock, the chains (one per company, plus the system chain), and writeSecurity. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction, securityWrite, securityWriteWithoutCompany } from '../../src/db/database.js';
import { writeSecurity, type SecurityEntry } from '../../src/modules/core/repository/security-log.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
const ZEROS = '0'.repeat(64);
let A = '';
let B = '';
let n = 0;

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0018-${n}`, background: false, companyId: A, userId: PERSON, ip: '203.0.113.7', userAgent: 'Chrome 131', ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));
const entry = (more: Partial<SecurityEntry> = {}): SecurityEntry => ({ event: 'signin_ok', ...more });

// Reads every chain as the system account (the owner may switch to it), which sees the system chain too, and checks
// each fingerprint with the database's own hash function.
async function chains(): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query('SET LOCAL ROLE nexus_system');
    return (
      await owner.query(
        `SELECT *, hash = audit.security_log_hash(prev_hash, company_id, seq, at, event, user_id, target_user_id, record_type,
                 record_id, ip, user_agent, details, request_id) AS hash_ok
           FROM audit.security_log ORDER BY company_id NULLS FIRST, seq`,
      )
    ).rows;
  } finally {
    await owner.query('COMMIT');
  }
}
const chainOf = async (companyId: string | null) => (await chains()).filter((row) => row.company_id === companyId);
// A chain is whole when its numbers run 1, 2, 3 ... and each entry's prev_hash is the entry before's hash.
function whole(rows: Record<string, unknown>[]): boolean {
  return rows.every((row, i) => row.seq === String(i + 1) && row.prev_hash === (i === 0 ? ZEROS : rows[i - 1]!.hash) && row.hash_ok === true);
}

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE audit.security_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('audit.security_log (the table and its rights)', () => {
  it('has exactly the planned columns, a chain key that holds the system chain too, and a company link that refuses deletes', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default", is_identity = 'YES' AS identity
         FROM information_schema.columns WHERE table_schema = 'audit' AND table_name = 'security_log' ORDER BY ordinal_position`,
    );
    expect(columns.rows.map((c) => [c.name, c.type, c.required, c.default, c.identity])).toEqual([
      ['id', 'bigint', true, null, true],
      ['company_id', 'uuid', false, null, false],
      ['seq', 'bigint', true, null, false],
      ['at', 'timestamp with time zone', true, 'now()', false],
      ['event', 'text', true, null, false],
      ['user_id', 'uuid', false, null, false],
      ['target_user_id', 'uuid', false, null, false],
      ['record_type', 'text', false, null, false],
      ['record_id', 'uuid', false, null, false],
      ['ip', 'text', false, null, false],
      ['user_agent', 'text', false, null, false],
      ['details', 'jsonb', true, "'{}'::jsonb", false],
      ['request_id', 'text', false, null, false],
      ['prev_hash', 'text', true, null, false],
      ['hash', 'text', true, null, false],
    ]);
    const constraints = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'audit.security_log'::regclass ORDER BY contype, conname`,
    );
    expect(constraints.rows).toEqual([
      { kind: 'f', def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' },
      { kind: 'p', def: 'PRIMARY KEY (id)' },
      { kind: 'u', def: 'UNIQUE NULLS NOT DISTINCT (company_id, seq)' },
    ]);
  });

  it('lets the app only read its company’s entries and add entries through the function; the system account adds them', async () => {
    const rights = await owner.query(
      `SELECT a AS account, r AS right, has_table_privilege(a, 'audit.security_log', r) AS ok
         FROM unnest(ARRAY['nexus_app', 'nexus_system']) a, unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    expect(Object.fromEntries(rights.rows.map((x) => [`${x.account} ${x.right}`, x.ok]))).toEqual({
      'nexus_app SELECT': true,
      'nexus_app INSERT': false,
      'nexus_app UPDATE': false,
      'nexus_app DELETE': false,
      'nexus_app TRUNCATE': false,
      'nexus_system SELECT': true,
      'nexus_system INSERT': true,
      'nexus_system UPDATE': false,
      'nexus_system DELETE': false,
      'nexus_system TRUNCATE': false,
    });
    const functions = await owner.query(
      `SELECT p.proname AS name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS definer, p.proconfig::text AS config,
              has_function_privilege('nexus_app', p.oid, 'EXECUTE') AS app_runs,
              (SELECT count(*)::int FROM aclexplode(p.proacl) x WHERE x.grantee = 0) AS for_everyone
         FROM pg_proc p WHERE p.pronamespace = 'audit'::regnamespace ORDER BY p.proname`,
    );
    expect(functions.rows).toEqual([
      { name: 'add_security_entry', owner: 'nexus_system', definer: true, config: '{"search_path=pg_catalog, pg_temp",lock_timeout=5s}', app_runs: true, for_everyone: 0 },
      { name: 'security_log_hash', owner: 'nexus_system', definer: false, config: '{"search_path=pg_catalog, pg_temp"}', app_runs: false, for_everyone: 0 },
      { name: 'security_log_refuse_change', owner: 'nexus_owner', definer: false, config: '{"search_path=pg_catalog, pg_temp"}', app_runs: false, for_everyone: 0 },
    ]);
  });

  it('refuses any change or delete of an entry, even by the owner; only the owner may empty the table', async () => {
    await inRequest(ctx(), () => writeSecurity(entry()));
    for (const change of ["UPDATE audit.security_log SET event = 'export'", 'DELETE FROM audit.security_log']) {
      await owner.query('BEGIN');
      await owner.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await expect(owner.query(change)).rejects.toThrow('the security log cannot be changed');
      await owner.query('ROLLBACK');
    }
    await expect(
      inRequest(ctx(), () => getContext().tx!.execute(sql`INSERT INTO audit.security_log (seq, event, prev_hash, hash) VALUES (9, 'export', 'x', 'y')`)),
    ).rejects.toThrow();
    expect(await chainOf(A)).toHaveLength(1);
  });
});

describe('writeSecurity and the chains', () => {
  it('adds an entry to the company’s chain with who, where, the request and a fingerprint that checks out', async () => {
    const id = await inRequest(ctx(), () =>
      writeSecurity(entry({ event: 'permission_changed', targetUserId: '0190f2a6-6c1e-7b3a-9d2f-6f5e4d3c2b1a', recordType: 'role', recordId: '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f', details: { from: 'Accounts', to: 'Owner' } })),
    );
    expect(typeof id).toBe('number');
    const [row] = await chainOf(A);
    expect(row).toMatchObject({
      company_id: A,
      seq: '1',
      event: 'permission_changed',
      user_id: PERSON,
      target_user_id: '0190f2a6-6c1e-7b3a-9d2f-6f5e4d3c2b1a',
      record_type: 'role',
      record_id: '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f',
      ip: '203.0.113.7',
      user_agent: 'Chrome 131',
      details: { from: 'Accounts', to: 'Owner' },
      prev_hash: ZEROS,
      hash_ok: true,
    });
    expect(String(row!.id)).toBe(String(id));
    expect(row!.request_id).toMatch(/^req-0018-/);
    expect(String(row!.hash)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps one whole chain per company, each starting at 1', async () => {
    for (const company of [A, B, A, A, B]) await inRequest(ctx({ companyId: company }), () => writeSecurity(entry()));
    expect((await chainOf(A)).map((r) => r.seq)).toEqual(['1', '2', '3']);
    expect((await chainOf(B)).map((r) => r.seq)).toEqual(['1', '2']);
    expect(whole(await chainOf(A)) && whole(await chainOf(B))).toBe(true);
  });

  it('keeps the chain whole when many entries are written at the same moment', async () => {
    await Promise.all(Array.from({ length: 12 }, () => inRequest(ctx(), () => writeSecurity(entry({ event: 'signin_failed' })))));
    const rows = await chainOf(A);
    expect(rows).toHaveLength(12);
    expect(whole(rows)).toBe(true);
  });

  it('leaves no gap when a request is undone: the next entry continues from the last one kept', async () => {
    await inRequest(ctx(), () => writeSecurity(entry()));
    await expect(
      inRequest(ctx(), async () => {
        await writeSecurity(entry({ event: 'export' }));
        throw new Error('a later step failed');
      }),
    ).rejects.toThrow('a later step failed');
    await inRequest(ctx(), () => writeSecurity(entry({ event: 'session_ended' })));
    const rows = await chainOf(A);
    expect(rows.map((r) => [r.seq, r.event])).toEqual([
      ['1', 'signin_ok'],
      ['2', 'session_ended'],
    ]);
    expect(whole(rows)).toBe(true);
  });

  it('keeps an entry written in a security write when the request is refused', async () => {
    await expect(
      inRequest(ctx(), async () => {
        await securityWrite(A, () => writeSecurity(entry({ event: 'session_ended', details: { reason: 'timed out' } })));
        throw new Error('refused');
      }),
    ).rejects.toThrow('refused');
    expect((await chainOf(A)).map((r) => [r.event, r.details])).toEqual([['session_ended', { reason: 'timed out' }]]);
  });

  it('runs a security write’s entry before the request’s own: the other order waits for the chain lock and gives up after 5 seconds', { timeout: 30_000 }, async () => {
    await inRequest(ctx(), async () => {
      await securityWrite(A, () => writeSecurity(entry({ event: 'session_ended' })));
      await writeSecurity(entry({ event: 'permission_changed' }));
    });
    const started = Date.now();
    await expect(
      inRequest(ctx(), async () => {
        await writeSecurity(entry({ event: 'export' }));
        await securityWrite(A, () => writeSecurity(entry({ event: 'session_ended' })));
      }),
    ).rejects.toThrow();
    const waited = Date.now() - started;
    expect(waited).toBeGreaterThanOrEqual(4_500);
    expect(waited).toBeLessThan(15_000);
    expect((await chainOf(A)).map((r) => r.event)).toEqual(['session_ended', 'permission_changed']);
  });

  it('writes an entry with no company into the system chain, which the app never sees', async () => {
    await runWithContext(ctx({ companyId: undefined, userId: undefined }), () =>
      securityWriteWithoutCompany(() => writeSecurity(entry({ event: 'signin_failed', details: { email: 'unknown' } }))),
    );
    await runWithContext(ctx({ companyId: A }), () => securityWriteWithoutCompany(() => writeSecurity(entry({ event: 'signin_failed' }))));
    await inRequest(ctx(), () => writeSecurity(entry()));
    const system = await chainOf(null);
    expect(system.map((r) => [r.seq, r.event])).toEqual([
      ['1', 'signin_failed'],
      ['2', 'signin_failed'],
    ]);
    expect(whole(system)).toBe(true);
    expect((await chainOf(A)).map((r) => r.seq)).toEqual(['1']);
    const seen = await inRequest(ctx(), async () => (await getContext().tx!.execute(sql`SELECT company_id FROM audit.security_log`)).rows);
    expect(seen).toEqual([{ company_id: A }]);
    // Inside it, the request context holds its own transaction and no company.
    const inside = await runWithContext(ctx(), () => securityWriteWithoutCompany(async (tx) => [getContext().companyId, getContext().tx === tx]));
    expect(inside).toEqual([undefined, true]);
  });

  it('never stores a code, key, password or token in the details, and keeps everything else', async () => {
    await inRequest(ctx(), () =>
      writeSecurity(entry({ event: 'two_step_changed', details: { method: 'app', code: '123456', key: 'k-1', backup: { otp: '9', recoveryToken: 't', newPassword: 'p' }, note: undefined } })),
    );
    const [row] = await chainOf(A);
    expect(row!.details).toEqual({ method: 'app', code: '[hidden]', key: '[hidden]', backup: { otp: '[hidden]', recoveryToken: '[hidden]', newPassword: '[hidden]' }, note: null });
  });

  it('refuses an unknown event, a wrong ID (never repeating it), no transaction, or no request, and saves nothing', async () => {
    await expect(inRequest(ctx(), () => writeSecurity({ event: 'signin_maybe' as SecurityEntry['event'] }))).rejects.toThrow('the security log does not know this event');
    const bad = "x'); DROP TABLE y; --";
    for (const more of [{ userId: bad }, { targetUserId: bad }, { recordId: bad }]) {
      const error = await inRequest(ctx(), () => writeSecurity(entry(more))).catch((caught: unknown) => caught);
      expect((error as Error).message).toBe('the security entry holds an ID that is not valid');
    }
    await expect(runWithContext(ctx(), () => writeSecurity(entry()))).rejects.toThrow('the security log needs the transaction');
    await expect(writeSecurity(entry())).rejects.toThrow('No request context');
    expect(await chains()).toEqual([]);
  });
});
