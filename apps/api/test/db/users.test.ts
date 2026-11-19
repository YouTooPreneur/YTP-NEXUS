// TASK-0033 · People and their preferences: core.users and core.user_preferences exactly, their keys, the links that keep every person and preference in one company, the sign-in methods check, the defaults, the app's rights and the row rules. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
let A = '';
let B = '';

const columnsOf = async (table: string) =>
  (
    await owner.query(
      `SELECT column_name AS name, data_type AS type, udt_name AS udt, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
  ).rows.map((c) => [c.name, c.type === 'USER-DEFINED' || c.type === 'ARRAY' ? c.udt : c.type, c.required, c.default]);
// Keys and links (the sign-in methods check is tested by what it refuses).
const keysOf = async (table: string) =>
  (
    await owner.query(
      `SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = $1::regclass AND contype <> 'c'
        ORDER BY contype, pg_get_constraintdef(oid) COLLATE "C"`,
      [`core.${table}`],
    )
  ).rows.map((c) => `${c.kind} ${c.def}`);
const enumOf = async (name: string) =>
  (await owner.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = $1::regtype ORDER BY enumsortorder`, [name])).rows.map((e) => e.enumlabel);

// One statement as the app (or the owner) for one company: the row rules bind both accounts.
async function asCompany(client: typeof owner, companyId: string, query: string, values: unknown[] = []) {
  await client.query('BEGIN');
  try {
    await client.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    const result = await client.query(query, values);
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
const newId = async () => String((await owner.query('SELECT core.uuid_v7() AS id')).rows[0]!.id);
const roleOf = async (companyId: string) =>
  String((await asCompany(owner, companyId, `INSERT INTO core.roles (company_id, key, name, idle_timeout_minutes) VALUES ($1, 'staff', 'Staff', 480) RETURNING id`, [companyId]))[0]!.id);
const personIn = async (companyId: string, roleId: string, methods = '{password}') => {
  const id = await newId();
  await asCompany(appClient, companyId, `INSERT INTO core.users (id, company_id, display_name, role_id, signin_methods) VALUES ($1, $2, 'Asha', $3, $4)`, [id, companyId, roleId, methods]);
  return id;
};

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await owner.query('TRUNCATE core.user_preferences, core.users, core.roles CASCADE');
});

afterAll(async () => {
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('the tables', () => {
  it('core.users has exactly its columns, the sign-in ID as its key with no default, and the key its links use', async () => {
    expect(await columnsOf('users')).toEqual([
      ['id', 'uuid', true, null],
      ['company_id', 'uuid', true, null],
      ['display_name', 'text', true, null],
      ['photo_file_id', 'uuid', false, null],
      ['role_id', 'uuid', true, null],
      ['signin_methods', '_text', true, null],
      ['manager_user_id', 'uuid', false, null],
      ['switch_email_by', 'date', false, null],
      ['last_signin_at', 'timestamp with time zone', false, null],
      ['created_at', 'timestamp with time zone', true, 'now()'],
      ['created_by', 'uuid', false, null],
      ['updated_at', 'timestamp with time zone', true, 'now()'],
      ['updated_by', 'uuid', false, null],
      ['version', 'integer', true, '1'],
      ['deleted_at', 'timestamp with time zone', false, null],
      ['deleted_by', 'uuid', false, null],
      ['purged_at', 'timestamp with time zone', false, null],
    ]);
    expect(await keysOf('users')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, manager_user_id) REFERENCES core.users(company_id, id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, role_id) REFERENCES core.roles(company_id, id) ON DELETE RESTRICT',
      'p PRIMARY KEY (id)',
      'u UNIQUE (company_id, id)',
    ]);
  });

  it('core.user_preferences has exactly its columns and defaults, keyed by company and person and linked to the person of the same company', async () => {
    expect(await columnsOf('user_preferences')).toEqual([
      ['company_id', 'uuid', true, null],
      ['user_id', 'uuid', true, null],
      ['language_code', 'text', false, null],
      ['colour', 'theme_colour', false, null],
      ['time_zone', 'text', true, "'Asia/Kolkata'::text"],
      ['time_format', 'clock_format', true, "'h12'::core.clock_format"],
      ['date_format', 'text', true, "'DD MMM YYYY'::text"],
      ['daily_summary_time', 'time without time zone', false, null],
      ['updated_at', 'timestamp with time zone', true, 'now()'],
    ]);
    expect(await keysOf('user_preferences')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, user_id) REFERENCES core.users(company_id, id) ON DELETE RESTRICT',
      'p PRIMARY KEY (company_id, user_id)',
    ]);
    expect(await enumOf('core.theme_colour')).toEqual(['emerald', 'navy']);
    expect(await enumOf('core.clock_format')).toEqual(['h12', 'h24']);
  });

  it('gives the app exactly its rights: people and preferences are read, added and changed, never deleted', async () => {
    const rights = await owner.query(
      `SELECT t AS "table", r AS right, has_table_privilege('nexus_app', 'core.' || t, r) AS ok
         FROM unnest(ARRAY['users', 'user_preferences']) t, unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    expect(rights.rows.filter((x) => x.ok).map((x) => `${x.table} ${x.right}`).sort()).toEqual(
      ['users SELECT', 'users INSERT', 'users UPDATE', 'user_preferences SELECT', 'user_preferences INSERT', 'user_preferences UPDATE'].sort(),
    );
    const rules = await owner.query(
      `SELECT relname AS name, relrowsecurity AND relforcerowsecurity AS rules FROM pg_class
        WHERE relnamespace = 'core'::regnamespace AND relname IN ('users', 'user_preferences') ORDER BY relname`,
    );
    expect(rules.rows).toEqual([
      { name: 'user_preferences', rules: true },
      { name: 'users', rules: true },
    ]);
  });
});

describe('one company per person', () => {
  it('never lets a person take another company’s role or manager, nor a preference point at another company’s person', async () => {
    const roleA = await roleOf(A);
    const roleB = await roleOf(B);
    const personB = await personIn(B, roleB);
    await expect(personIn(A, roleB)).rejects.toThrow('violates foreign key constraint');
    await expect(
      asCompany(appClient, A, `INSERT INTO core.users (id, company_id, display_name, role_id, signin_methods, manager_user_id) VALUES ($1, $2, 'Ravi', $3, '{google}', $4)`, [
        await newId(),
        A,
        roleA,
        personB,
      ]),
    ).rejects.toThrow('violates foreign key constraint');
    await expect(asCompany(appClient, A, `INSERT INTO core.user_preferences (company_id, user_id) VALUES ($1, $2)`, [A, personB])).rejects.toThrow(
      'violates foreign key constraint',
    );
  });

  it('shows each company only its own people and preferences', async () => {
    const roleB = await roleOf(B);
    const personA = await personIn(A, await roleOf(A));
    const personB = await personIn(B, roleB);
    await asCompany(appClient, A, `INSERT INTO core.user_preferences (company_id, user_id) VALUES ($1, $2)`, [A, personA]);
    await asCompany(appClient, B, `INSERT INTO core.user_preferences (company_id, user_id) VALUES ($1, $2)`, [B, personB]);
    expect((await asCompany(appClient, A, 'SELECT id FROM core.users')).map((r) => r.id)).toEqual([personA]);
    expect((await asCompany(appClient, B, 'SELECT user_id FROM core.user_preferences')).map((r) => r.user_id)).toEqual([personB]);
    await expect(asCompany(appClient, A, `INSERT INTO core.users (id, company_id, display_name, role_id, signin_methods) VALUES ($1, $2, 'Kavi', $3, '{google}')`, [await newId(), B, roleB])).rejects.toThrow(
      'row-level security',
    );
  });
});

describe('the values', () => {
  it('needs at least one sign-in method, and only google or password', async () => {
    const role = await roleOf(A);
    for (const methods of ['{}', '{email}', '{google,sms}']) {
      await expect(personIn(A, role, methods), methods).rejects.toThrow('users_signin_methods_check');
    }
    await expect(personIn(A, role, '{google}')).resolves.toMatch(/^[0-9a-f-]{36}$/);
    await expect(personIn(A, role, '{google,password}')).resolves.toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gives a new person’s preferences the defaults: Indian time, 12-hour times, the company’s language and colour', async () => {
    const person = await personIn(A, await roleOf(A));
    await asCompany(appClient, A, `INSERT INTO core.user_preferences (company_id, user_id) VALUES ($1, $2)`, [A, person]);
    expect(
      await asCompany(appClient, A, 'SELECT language_code, colour, time_zone, time_format, date_format, daily_summary_time FROM core.user_preferences'),
    ).toEqual([{ language_code: null, colour: null, time_zone: 'Asia/Kolkata', time_format: 'h12', date_format: 'DD MMM YYYY', daily_summary_time: null }]);
    await asCompany(appClient, A, `UPDATE core.user_preferences SET time_zone = 'Asia/Dubai', colour = 'navy', time_format = 'h24', daily_summary_time = '08:30'`);
    expect(await asCompany(appClient, A, 'SELECT time_zone, colour, time_format, daily_summary_time FROM core.user_preferences')).toEqual([
      { time_zone: 'Asia/Dubai', colour: 'navy', time_format: 'h24', daily_summary_time: '08:30:00' },
    ]);
  });

  it('never lets the app remove a person or their preferences', async () => {
    const person = await personIn(A, await roleOf(A));
    await asCompany(appClient, A, `INSERT INTO core.user_preferences (company_id, user_id) VALUES ($1, $2)`, [A, person]);
    await expect(asCompany(appClient, A, 'DELETE FROM core.user_preferences')).rejects.toThrow('permission denied');
    await expect(asCompany(appClient, A, 'DELETE FROM core.users')).rejects.toThrow('permission denied');
  });
});
