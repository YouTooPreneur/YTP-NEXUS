// TASK-0020 · Announcements: core.outbox and core.event_receipts with their rights, and announce, which posts an announcement in the save's own transaction. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { allAnnouncements } from '../../src/announcements.js';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction, securityWrite } from '../../src/db/database.js';
import { announce, type Announcement } from '../../src/modules/core/repository/outbox.js';
import { writeActivity } from '../../src/modules/core/repository/activity-log.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
const EVENT = 'core.probe.happened';
const RECORD = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
let A = '';
let B = '';
let n = 0;

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0020-${n}`, background: false, companyId: A, userId: RECORD, ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));
const probe = (more: Partial<Announcement> = {}): Announcement => ({ event: EVENT, version: 1, payload: { recordId: RECORD }, ...more });

// Every announcement of both test companies, read by the table's owner one company at a time (the row rule binds the
// owner too; nobody else may read every company's rows).
async function allRows(): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (const companyId of [A, B]) {
    await owner.query('BEGIN');
    try {
      await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
      rows.push(...(await owner.query('SELECT * FROM core.outbox ORDER BY id')).rows);
    } finally {
      await owner.query('COMMIT');
    }
  }
  return rows.sort((x, y) => String(x.id).localeCompare(String(y.id)));
}

// The app's own client inside a transaction with a company set, as the worker will use it.
async function asApp<T>(companyId: string, work: () => Promise<T>): Promise<T> {
  await appClient.query('BEGIN');
  try {
    await appClient.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return await work();
  } finally {
    await appClient.query('ROLLBACK');
  }
}

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

beforeEach(() => {
  allAnnouncements.push({ name: EVENT, module: 'core' });
});

afterEach(async () => {
  allAnnouncements.splice(allAnnouncements.findIndex((known) => known.name === EVENT), 1);
  await closePools();
  await owner.query('TRUNCATE core.outbox CASCADE');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('core.outbox and core.event_receipts (the tables and their rights)', () => {
  it('has exactly the planned announcement columns, its own key, a company link that refuses deletes and the index of waiting rows', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'outbox' ORDER BY ordinal_position`,
    );
    expect(columns.rows.map((c) => [c.name, c.type, c.required, c.default])).toEqual([
      ['id', 'uuid', true, 'core.uuid_v7()'],
      ['company_id', 'uuid', true, null],
      ['event', 'text', true, null],
      ['event_version', 'smallint', true, null],
      ['payload', 'jsonb', true, "'{}'::jsonb"],
      ['occurred_at', 'timestamp with time zone', true, 'now()'],
      ['published_at', 'timestamp with time zone', false, null],
      ['attempts', 'integer', true, '0'],
      ['last_error', 'text', false, null],
      ['next_attempt_at', 'timestamp with time zone', true, 'now()'],
    ]);
    const keys = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.outbox'::regclass ORDER BY contype`,
    );
    expect(keys.rows).toEqual([
      { kind: 'f', def: 'FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT' },
      { kind: 'p', def: 'PRIMARY KEY (id)' },
    ]);
    const waiting = await owner.query(`SELECT indexdef FROM pg_indexes WHERE schemaname = 'core' AND indexname = 'outbox_waiting_idx'`);
    expect(waiting.rows).toEqual([{ indexdef: 'CREATE INDEX outbox_waiting_idx ON core.outbox USING btree (company_id, id) WHERE (published_at IS NULL)' }]);
  });

  it('keeps receipts by listener and announcement, linked to the announcement, with no company and no row rule', async () => {
    const columns = await owner.query(
      `SELECT column_name AS name, data_type AS type, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'event_receipts' ORDER BY ordinal_position`,
    );
    expect(columns.rows.map((c) => [c.name, c.type, c.required, c.default])).toEqual([
      ['listener', 'text', true, null],
      ['event_id', 'uuid', true, null],
      ['handled_at', 'timestamp with time zone', true, 'now()'],
    ]);
    const keys = await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'core.event_receipts'::regclass ORDER BY contype`,
    );
    expect(keys.rows).toEqual([
      { kind: 'f', def: 'FOREIGN KEY (event_id) REFERENCES core.outbox(id) ON DELETE RESTRICT' },
      { kind: 'p', def: 'PRIMARY KEY (listener, event_id)' },
    ]);
    const rules = await owner.query(
      `SELECT relname AS name, relrowsecurity AS rules FROM pg_class WHERE oid IN ('core.outbox'::regclass, 'core.event_receipts'::regclass) ORDER BY relname`,
    );
    expect(rules.rows).toEqual([
      { name: 'event_receipts', rules: false },
      { name: 'outbox', rules: true },
    ]);
  });

  it('lets the app read and add announcements and change only the delivery columns; receipts are only read and added', async () => {
    const tables = await owner.query(
      `SELECT t AS "table", r AS right, has_table_privilege('nexus_app', t, r) AS ok
         FROM unnest(ARRAY['core.outbox', 'core.event_receipts']) t, unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    expect(Object.fromEntries(tables.rows.map((x) => [`${x.table} ${x.right}`, x.ok]))).toEqual({
      'core.outbox SELECT': true,
      'core.outbox INSERT': true,
      'core.outbox UPDATE': false,
      'core.outbox DELETE': false,
      'core.outbox TRUNCATE': false,
      'core.event_receipts SELECT': true,
      'core.event_receipts INSERT': true,
      'core.event_receipts UPDATE': false,
      'core.event_receipts DELETE': false,
      'core.event_receipts TRUNCATE': false,
    });
    const columns = await owner.query(
      `SELECT attname AS name, has_column_privilege('nexus_app', 'core.outbox', attname, 'UPDATE') AS ok
         FROM pg_attribute WHERE attrelid = 'core.outbox'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
    );
    expect(columns.rows.filter((c) => c.ok).map((c) => c.name)).toEqual(['published_at', 'attempts', 'last_error', 'next_attempt_at']);
  });
});

describe('announce', () => {
  it('posts an announcement in the save’s own transaction, under the save’s company, waiting for delivery', async () => {
    const id = await inRequest(ctx(), async () => {
      await writeActivity({ module: 'core', recordType: 'probe', recordId: RECORD, recordLabel: 'Probe', action: 'changed' });
      return announce(probe({ version: 2, payload: { recordId: RECORD, facts: { status: 'done' } } }));
    });
    const rows = await allRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      company_id: A,
      event: EVENT,
      event_version: 2,
      payload: { recordId: RECORD, facts: { status: 'done' } },
      published_at: null,
      attempts: 0,
      last_error: null,
    });
    expect(String(id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
    const ages = await asApp(A, () => appClient.query(`SELECT extract(epoch FROM now() - occurred_at) AS posted, extract(epoch FROM now() - next_attempt_at) AS next FROM core.outbox`));
    expect(Math.abs(Number(ages.rows[0]!.posted))).toBeLessThan(60);
    expect(Math.abs(Number(ages.rows[0]!.next))).toBeLessThan(60);
    expect((await asApp(A, async () => (await appClient.query('SELECT id FROM core.outbox')).rows)).map((r) => r.id)).toEqual([id]);
    expect(await asApp(B, async () => (await appClient.query('SELECT id FROM core.outbox')).rows)).toEqual([]);
  });

  it('keeps nothing when the save is undone', async () => {
    await expect(
      inRequest(ctx(), async () => {
        await announce(probe());
        throw new Error('the save failed');
      }),
    ).rejects.toThrow('the save failed');
    expect(await allRows()).toEqual([]);
  });

  it('takes the company from the save, never from the announcement', async () => {
    await inRequest(ctx({ companyId: B }), () => announce(probe({ payload: { companyId: A } })));
    expect((await allRows()).map((row) => row.company_id)).toEqual([B]);
  });

  it('refuses an announcement outside a save, or one that is not registered, and posts nothing', async () => {
    await expect(announce(probe())).rejects.toThrow('No request context');
    await expect(runWithContext(ctx(), () => announce(probe()))).rejects.toThrow('an announcement needs the transaction');
    await expect(
      inRequest(ctx(), async () => {
        const context = getContext();
        return runWithContext({ ...context, companyId: undefined }, () => announce(probe()));
      }),
    ).rejects.toThrow('an announcement needs the company');
    await expect(inRequest(ctx(), () => announce(probe({ event: 'core.probe.unknown' })))).rejects.toThrow('this announcement is not registered');
    expect(await allRows()).toEqual([]);
  });

  it('refuses a version outside 1 to 32767 and a payload that is not an object', async () => {
    for (const version of [0, -1, 1.5, 32768, Number.NaN]) {
      await expect(inRequest(ctx(), () => announce(probe({ version })))).rejects.toThrow('an announcement needs a version from 1 to 32767');
    }
    expect(await inRequest(ctx(), () => announce(probe({ version: 32767 })))).toBeTruthy();
    for (const payload of [null, [RECORD], 'text']) {
      await expect(inRequest(ctx(), () => announce(probe({ payload: payload as never })))).rejects.toThrow('an announcement needs a payload object');
    }
    expect((await allRows()).map((row) => row.event_version)).toEqual([32767]);
  });

  it('refuses a payload holding a secret at any depth, and posts nothing', async () => {
    for (const payload of [{ password: 'x' }, { person: { apiToken: 'x' } }, { list: [{ client_secret: 'x' }] }, { 'Private-Key': 'x' }, { passCode: 'x' }, { apiKey: 'x' }]) {
      await expect(inRequest(ctx(), () => announce(probe({ payload })))).rejects.toThrow('an announcement never carries a secret');
    }
    expect(await allRows()).toEqual([]);
  });

  it('posts nothing when a refusal is caught and the save goes on', async () => {
    await inRequest(ctx(), async () => {
      await expect(announce(probe({ event: 'core.probe.unknown' }))).rejects.toThrow('this announcement is not registered');
      await expect(announce(probe({ version: 0 }))).rejects.toThrow('an announcement needs a version from 1 to 32767');
      await expect(announce(probe({ payload: { person: { password: 'x' } } }))).rejects.toThrow('an announcement never carries a secret');
    });
    expect(await allRows()).toEqual([]);
  });

  it('saves the payload it checked, even if the caller changes it while the save runs', async () => {
    const payload: Record<string, unknown> = { recordId: RECORD };
    await inRequest(ctx(), async () => {
      const posting = announce(probe({ payload }));
      payload.password = 'SECRET-LATE';
      await posting;
    });
    expect((await allRows()).map((row) => row.payload)).toEqual([{ recordId: RECORD }]);
  });

  it('posts into a security write’s transaction when called inside one, which is why the rule forbids it there', async () => {
    await expect(
      inRequest(ctx(), async () => {
        await securityWrite(A, () => announce(probe()));
        throw new Error('the save failed');
      }),
    ).rejects.toThrow('the save failed');
    expect((await allRows()).map((row) => row.event)).toEqual([EVENT]);
  });
});

describe('what the worker will rely on', () => {
  it('lets the app mark an announcement delivered or failed, but never change what it says, delete it or move it to another company', async () => {
    const id = await inRequest(ctx(), () => announce(probe()));
    await asApp(A, async () => {
      const changed = await appClient.query(
        `UPDATE core.outbox SET published_at = now(), attempts = attempts + 1, last_error = 'x', next_attempt_at = now() WHERE id = $1`,
        [id],
      );
      expect(changed.rowCount).toBe(1);
    });
    for (const change of [`UPDATE core.outbox SET event = 'x'`, `UPDATE core.outbox SET payload = '{}'`, `UPDATE core.outbox SET company_id = '${B}'`, 'DELETE FROM core.outbox']) {
      await expect(asApp(A, () => appClient.query(change))).rejects.toThrow('permission denied for table outbox');
    }
  });

  it('lets two workers take different announcements at once (FOR UPDATE SKIP LOCKED with the app’s rights)', async () => {
    const first = await inRequest(ctx(), () => announce(probe()));
    const second = await inRequest(ctx(), () => announce(probe()));
    const other = clientFor('DATABASE_URL_APP');
    await other.connect();
    try {
      await appClient.query('BEGIN');
      await other.query('BEGIN');
      for (const client of [appClient, other]) await client.query("SELECT set_config('app.company_id', $1, true)", [A]);
      const take = `SELECT id FROM core.outbox WHERE published_at IS NULL ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`;
      const a = (await appClient.query(take)).rows.map((r) => r.id);
      const b = (await other.query(take)).rows.map((r) => r.id);
      // IDs are time-ordered only to the millisecond (core.uuid_v7): two posted back to back may sort either way.
      const [low, high] = [first, second].sort();
      expect([a, b]).toEqual([[low], [high]]);
    } finally {
      await appClient.query('ROLLBACK');
      await other.query('ROLLBACK');
      await other.end();
    }
  });

  it('records a listener’s receipt once only, only for an announcement that exists, and never changes or deletes it', async () => {
    const id = await inRequest(ctx(), () => announce(probe()));
    await appClient.query(`INSERT INTO core.event_receipts (listener, event_id) VALUES ('core.probe-listener', $1)`, [id]);
    await expect(appClient.query(`INSERT INTO core.event_receipts (listener, event_id) VALUES ('core.probe-listener', $1)`, [id])).rejects.toThrow(
      'duplicate key value violates unique constraint "event_receipts_listener_event_id_pk"',
    );
    const kept = await appClient.query(
      `INSERT INTO core.event_receipts (listener, event_id) VALUES ('core.probe-listener', $1) ON CONFLICT DO NOTHING RETURNING listener`,
      [id],
    );
    expect(kept.rows).toEqual([]);
    await expect(appClient.query(`INSERT INTO core.event_receipts (listener, event_id) VALUES ('core.probe-listener', $1)`, [RECORD])).rejects.toThrow(
      'violates foreign key constraint "event_receipts_event_id_outbox_id_fk"',
    );
    for (const change of [`UPDATE core.event_receipts SET handled_at = now()`, 'DELETE FROM core.event_receipts']) {
      await expect(appClient.query(change)).rejects.toThrow('permission denied for table event_receipts');
    }
    await owner.query('BEGIN');
    try {
      await owner.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await expect(owner.query('DELETE FROM core.outbox WHERE id = $1', [id])).rejects.toThrow('violates foreign key constraint');
    } finally {
      await owner.query('ROLLBACK');
    }
    expect((await owner.query('SELECT listener FROM core.event_receipts')).rows).toEqual([{ listener: 'core.probe-listener' }]);
  });

  it('cannot see or take another company’s announcement, even by its ID', async () => {
    const id = await inRequest(ctx(), () => announce(probe()));
    const seen = await asApp(B, async () => (await appClient.query(`SELECT id FROM core.outbox WHERE id = $1 FOR UPDATE SKIP LOCKED`, [id])).rows);
    expect(seen).toEqual([]);
    const marked = await asApp(B, async () => (await appClient.query(`UPDATE core.outbox SET attempts = 9 WHERE id = $1`, [id])).rowCount);
    expect(marked).toBe(0);
    expect((await allRows())[0]).toMatchObject({ attempts: 0 });
  });

  it('runs inside a save with the transaction on the context, like the activity log', async () => {
    const seen = await inRequest(ctx(), async () => {
      await announce(probe());
      return (await getContext().tx!.execute(sql`SELECT count(*)::int AS n FROM core.outbox`)).rows[0]!.n;
    });
    expect(seen).toBe(1);
  });
});
