// TASK-0030 · Roles, the permission list and default grants: the five tables, their rights and company-safe links, registerPermissions, makeDefaultRoles and applyDefaultGrants. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { runWithContext, type RequestContext } from '../../src/shared/context.js';
import { closePools, inRequestTransaction } from '../../src/db/database.js';
import {
  CORE_PERMISSIONS,
  DEFAULT_ROLES,
  applyDefaultGrants,
  makeDefaultRoles,
  registerPermissions,
  type PermissionEntry,
} from '../../src/modules/core/service/roles.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const appClient = clientFor('DATABASE_URL_APP');
const PERSON = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
let A = '';
let B = '';
let n = 0;

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0030-${n}`, background: false, companyId: A, userId: PERSON, ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));

// Rows of a company table as the app reads them for one company (its row rule binds it).
async function rowsOf(companyId: string, query: string): Promise<Record<string, unknown>[]> {
  await appClient.query('BEGIN');
  try {
    await appClient.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    return (await appClient.query(query)).rows;
  } finally {
    await appClient.query('COMMIT');
  }
}
const columnsOf = async (table: string) =>
  (
    await owner.query(
      `SELECT column_name AS name, data_type AS type, udt_name AS udt, is_nullable = 'NO' AS required, column_default AS "default"
         FROM information_schema.columns WHERE table_schema = 'core' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
  ).rows.map((c) => [c.name, c.type === 'USER-DEFINED' ? c.udt : c.type, c.required, c.default]);
const keysOf = async (table: string) =>
  (
    await owner.query(`SELECT contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = $1::regclass ORDER BY contype, pg_get_constraintdef(oid) COLLATE "C"`, [
      `core.${table}`,
    ])
  ).rows.map((c) => `${c.kind} ${c.def}`);
const grants = async (companyId: string) =>
  (
    await rowsOf(
      companyId,
      `SELECT r.key, p.module, p.action, p.scope FROM core.role_permissions p JOIN core.roles r ON r.id = p.role_id ORDER BY 1, 2, 3`,
    )
  ).map((g) => `${g.key} ${g.module}.${g.action} ${g.scope}`);

beforeAll(async () => {
  await owner.connect();
  await appClient.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

afterEach(async () => {
  await closePools();
  await owner.query('TRUNCATE core.default_grants_applied, core.role_hidden_fields, core.role_permissions, core.roles, core.permission_catalogue, audit.activity_log');
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await appClient.end();
  await owner.end();
});

describe('the tables', () => {
  it('core.roles has exactly its columns, its key, a unique key per company and the key the links use', async () => {
    expect(await columnsOf('roles')).toEqual([
      ['id', 'uuid', true, 'core.uuid_v7()'],
      ['company_id', 'uuid', true, null],
      ['key', 'text', true, null],
      ['name', 'text', true, null],
      ['description', 'text', false, null],
      ['is_default', 'boolean', true, 'false'],
      ['two_step_required', 'boolean', true, 'false'],
      ['idle_timeout_minutes', 'integer', true, null],
      ['phone_menu', 'jsonb', true, "'[]'::jsonb"],
      ['created_at', 'timestamp with time zone', true, 'now()'],
      ['created_by', 'uuid', false, null],
      ['updated_at', 'timestamp with time zone', true, 'now()'],
      ['updated_by', 'uuid', false, null],
      ['version', 'integer', true, '1'],
      ['deleted_at', 'timestamp with time zone', false, null],
    ]);
    expect(await keysOf('roles')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'p PRIMARY KEY (id)',
      'u UNIQUE (company_id, id)',
      'u UNIQUE (company_id, key)',
    ]);
  });

  it('core.role_permissions grants one action to one role with a scope, linked to the role of the same company', async () => {
    expect(await columnsOf('role_permissions')).toEqual([
      ['id', 'uuid', true, 'core.uuid_v7()'],
      ['company_id', 'uuid', true, null],
      ['role_id', 'uuid', true, null],
      ['module', 'text', true, null],
      ['action', 'text', true, null],
      ['scope', 'permission_scope', true, null],
      ['updated_at', 'timestamp with time zone', true, 'now()'],
      ['updated_by', 'uuid', false, null],
    ]);
    expect(await keysOf('role_permissions')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, role_id) REFERENCES core.roles(company_id, id) ON DELETE RESTRICT',
      'p PRIMARY KEY (id)',
      'u UNIQUE (company_id, role_id, module, action)',
    ]);
    const scopes = await owner.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'core.permission_scope'::regtype ORDER BY enumsortorder`);
    expect(scopes.rows.map((s) => s.enumlabel)).toEqual(['own', 'team', 'all']);
  });

  it('core.role_hidden_fields, core.permission_catalogue and core.default_grants_applied have exactly their columns and keys', async () => {
    expect(await columnsOf('role_hidden_fields')).toEqual([
      ['company_id', 'uuid', true, null],
      ['role_id', 'uuid', true, null],
      ['module', 'text', true, null],
      ['field', 'text', true, null],
    ]);
    expect(await keysOf('role_hidden_fields')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'f FOREIGN KEY (company_id, role_id) REFERENCES core.roles(company_id, id) ON DELETE RESTRICT',
      'p PRIMARY KEY (company_id, role_id, module, field)',
    ]);
    expect(await columnsOf('permission_catalogue')).toEqual([
      ['module', 'text', true, null],
      ['action', 'text', true, null],
      ['label', 'text', true, null],
      ['hideable_fields', 'jsonb', true, "'[]'::jsonb"],
      ['default_grants', 'jsonb', true, "'{}'::jsonb"],
      ['grants_version', 'smallint', true, '1'],
      ['release', 'smallint', true, null],
    ]);
    expect(await keysOf('permission_catalogue')).toEqual(['p PRIMARY KEY (module, action)']);
    expect(await columnsOf('default_grants_applied')).toEqual([
      ['company_id', 'uuid', true, null],
      ['module', 'text', true, null],
      ['action', 'text', true, null],
      ['grants_version', 'smallint', true, null],
      ['applied_at', 'timestamp with time zone', true, 'now()'],
    ]);
    expect(await keysOf('default_grants_applied')).toEqual([
      'f FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE RESTRICT',
      'p PRIMARY KEY (company_id, module, action)',
    ]);
  });

  it('gives the app exactly its rights: roles are never deleted, hidden fields never changed, the catalogue never shrinks', async () => {
    const rights = await owner.query(
      `SELECT t AS "table", r AS right, has_table_privilege('nexus_app', 'core.' || t, r) AS ok
         FROM unnest(ARRAY['roles', 'role_permissions', 'role_hidden_fields', 'permission_catalogue', 'default_grants_applied']) t,
              unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) r`,
    );
    const yes = rights.rows.filter((x) => x.ok).map((x) => `${x.table} ${x.right}`);
    expect(yes.sort()).toEqual(
      [
        'roles SELECT',
        'roles INSERT',
        'roles UPDATE',
        'role_permissions SELECT',
        'role_permissions INSERT',
        'role_permissions UPDATE',
        'role_permissions DELETE',
        'role_hidden_fields SELECT',
        'role_hidden_fields INSERT',
        'role_hidden_fields DELETE',
        'permission_catalogue SELECT',
        'permission_catalogue INSERT',
        'permission_catalogue UPDATE',
        'default_grants_applied SELECT',
        'default_grants_applied INSERT',
        'default_grants_applied UPDATE',
      ].sort(),
    );
    const rules = await owner.query(
      `SELECT relname AS name, relrowsecurity AS rules FROM pg_class WHERE relnamespace = 'core'::regnamespace
          AND relname IN ('roles', 'role_permissions', 'role_hidden_fields', 'permission_catalogue', 'default_grants_applied') ORDER BY relname`,
    );
    expect(rules.rows).toEqual([
      { name: 'default_grants_applied', rules: true },
      { name: 'permission_catalogue', rules: false },
      { name: 'role_hidden_fields', rules: true },
      { name: 'role_permissions', rules: true },
      { name: 'roles', rules: true },
    ]);
  });

  it('never lets a grant or a hidden field point at another company’s role', async () => {
    const roles = await inRequest(ctx({ companyId: B }), () => makeDefaultRoles());
    await appClient.query('BEGIN');
    try {
      await appClient.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await expect(
        appClient.query(`INSERT INTO core.role_permissions (company_id, role_id, module, action, scope) VALUES ($1, $2, 'core.users', 'view', 'all')`, [A, roles.owner]),
      ).rejects.toThrow('violates foreign key constraint');
    } finally {
      await appClient.query('ROLLBACK');
    }
  });
});

describe('registerPermissions', () => {
  it('lists the 27 Release 1 permissions of Core, Owner only except record history for the Manager', () => {
    expect(CORE_PERMISSIONS.map((p) => `${p.module}.${p.action}`).sort()).toEqual(
      [
        'core.users.view', 'core.users.create', 'core.users.edit', 'core.users.delete',
        'core.roles.view', 'core.roles.create', 'core.roles.edit', 'core.roles.delete',
        'core.security.view', 'core.security.edit', 'core.settings.view', 'core.settings.edit',
        'core.company.view', 'core.company.edit', 'core.feature_switches.view', 'core.feature_switches.edit',
        'core.languages.view', 'core.languages.edit', 'core.monitoring.view', 'core.monitoring.edit',
        'core.record_history.view', 'core.logs.view', 'core.logs.export', 'core.security_log.view',
        'core.security_log.export', 'core.trash.view', 'core.trash.edit',
      ].sort(),
    );
    for (const p of CORE_PERMISSIONS) {
      expect(p.label).toMatch(/\S/);
      expect(p).toMatchObject({ grantsVersion: 1, release: 1 });
      const expected = p.module === 'core.record_history' ? { owner: { scope: 'all' }, manager: { scope: 'all' } } : { owner: { scope: 'all' } };
      expect(p.defaultGrants).toEqual(expected);
    }
  });

  it('adds the permissions to the catalogue and, run again, keeps one row each with the newer label and version', async () => {
    await inRequest(ctx(), () => registerPermissions(CORE_PERMISSIONS));
    await inRequest(ctx({ companyId: B }), () => registerPermissions(CORE_PERMISSIONS));
    expect((await owner.query('SELECT count(*)::int AS n FROM core.permission_catalogue')).rows[0]!.n).toBe(27);
    const changed: PermissionEntry = { ...CORE_PERMISSIONS[0]!, label: 'See everyone', grantsVersion: 2, hideableFields: ['core.users.salary'] };
    await inRequest(ctx(), () => registerPermissions([changed]));
    const row = (await owner.query('SELECT * FROM core.permission_catalogue WHERE module = $1 AND action = $2', [changed.module, changed.action])).rows[0];
    expect(row).toMatchObject({ label: 'See everyone', grants_version: 2, hideable_fields: ['core.users.salary'], release: 1 });
    expect((await owner.query('SELECT count(*)::int AS n FROM core.permission_catalogue')).rows[0]!.n).toBe(27);
  });
});

describe('makeDefaultRoles', () => {
  it('makes the nine roles with their starting values in the request’s company, once', async () => {
    const first = await inRequest(ctx(), () => makeDefaultRoles());
    const again = await inRequest(ctx(), () => makeDefaultRoles());
    expect(again).toEqual(first);
    expect(Object.keys(first).sort()).toEqual(['accounts', 'client_contact', 'hr', 'llp_partner', 'manager', 'owner', 'staff', 'student', 'trainer']);
    const roles = await rowsOf(A, 'SELECT key, name, is_default, two_step_required, idle_timeout_minutes, phone_menu, version FROM core.roles ORDER BY key');
    const home = ['home', 'tasks', 'calendar'];
    expect(roles).toEqual([
      { key: 'accounts', name: 'Accounts', is_default: true, two_step_required: true, idle_timeout_minutes: 30, phone_menu: [...home, 'attendance', 'more'], version: 1 },
      { key: 'client_contact', name: 'Client contact', is_default: true, two_step_required: false, idle_timeout_minutes: 60, phone_menu: [], version: 1 },
      { key: 'hr', name: 'HR', is_default: true, two_step_required: true, idle_timeout_minutes: 30, phone_menu: [...home, 'attendance', 'more'], version: 1 },
      { key: 'llp_partner', name: 'LLP partner', is_default: true, two_step_required: true, idle_timeout_minutes: 30, phone_menu: [...home, 'leads', 'more'], version: 1 },
      { key: 'manager', name: 'Manager', is_default: true, two_step_required: true, idle_timeout_minutes: 480, phone_menu: [...home, 'leads', 'more'], version: 1 },
      { key: 'owner', name: 'Owner', is_default: true, two_step_required: true, idle_timeout_minutes: 30, phone_menu: [...home, 'leads', 'more'], version: 1 },
      { key: 'staff', name: 'Staff', is_default: true, two_step_required: false, idle_timeout_minutes: 480, phone_menu: [...home, 'attendance', 'more'], version: 1 },
      { key: 'student', name: 'Student', is_default: true, two_step_required: false, idle_timeout_minutes: 60, phone_menu: [], version: 1 },
      { key: 'trainer', name: 'Trainer', is_default: true, two_step_required: false, idle_timeout_minutes: 480, phone_menu: [...home, 'attendance', 'more'], version: 1 },
    ]);
    expect(DEFAULT_ROLES).toHaveLength(9);
    expect(await rowsOf(B, 'SELECT key FROM core.roles')).toEqual([]);
  });

  it('logs each new role in the activity log as made by the system, once', async () => {
    await inRequest(ctx(), () => makeDefaultRoles());
    await inRequest(ctx(), () => makeDefaultRoles());
    const entries = await rowsOf(A, `SELECT actor_type, record_type, record_label, action FROM audit.activity_log ORDER BY record_label`);
    expect(entries).toHaveLength(9);
    for (const entry of entries) expect(entry).toMatchObject({ actor_type: 'system', record_type: 'role', action: 'created' });
  });
});

describe('applyDefaultGrants', () => {
  it('gives each default role its starting grants once: every Core permission to the Owner, record history to the Manager', async () => {
    await inRequest(ctx(), async () => {
      await registerPermissions(CORE_PERMISSIONS);
      await makeDefaultRoles();
    });
    expect(await inRequest(ctx(), () => applyDefaultGrants())).toBe(28);
    expect(await inRequest(ctx(), () => applyDefaultGrants())).toBe(0);
    const given = await grants(A);
    expect(given.filter((g) => g.startsWith('owner '))).toHaveLength(27);
    expect(given.every((g) => g.endsWith(' all'))).toBe(true);
    expect(given.filter((g) => !g.startsWith('owner '))).toEqual(['manager core.record_history.view all']);
    const applied = await rowsOf(A, 'SELECT module, action, grants_version FROM core.default_grants_applied');
    expect(applied).toHaveLength(27);
    expect(applied.every((row) => row.grants_version === 1)).toBe(true);
    expect(await grants(B)).toEqual([]);
  });

  it('never gives back a grant the Owner removed, until the module raises its version; and gives hidden fields too', async () => {
    const probe: PermissionEntry = {
      module: 'probe.invoices',
      action: 'view',
      label: 'View invoices',
      hideableFields: ['probe.invoices.total'],
      defaultGrants: { owner: { scope: 'all' }, staff: { scope: 'own', hidden: ['probe.invoices.total'] }, ghost: { scope: 'all' } },
      grantsVersion: 1,
      release: 1,
    };
    await inRequest(ctx(), async () => {
      await registerPermissions([probe]);
      await makeDefaultRoles();
    });
    expect(await inRequest(ctx(), () => applyDefaultGrants())).toBe(2);
    expect(await grants(A)).toEqual(['owner probe.invoices.view all', 'staff probe.invoices.view own']);
    expect(await rowsOf(A, 'SELECT module, field FROM core.role_hidden_fields')).toEqual([{ module: 'probe.invoices', field: 'probe.invoices.total' }]);
    await appClient.query('BEGIN');
    try {
      await appClient.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await appClient.query(`DELETE FROM core.role_permissions WHERE module = 'probe.invoices' AND scope = 'own'`);
    } finally {
      await appClient.query('COMMIT');
    }
    expect(await inRequest(ctx(), () => applyDefaultGrants())).toBe(0);
    expect(await grants(A)).toEqual(['owner probe.invoices.view all']);
    await inRequest(ctx(), () => registerPermissions([{ ...probe, grantsVersion: 2 }]));
    expect(await inRequest(ctx(), () => applyDefaultGrants())).toBe(1);
    expect(await grants(A)).toEqual(['owner probe.invoices.view all', 'staff probe.invoices.view own']);
  });
});

describe('outside a save', () => {
  it('refuses to run without the transaction on the request context', async () => {
    await expect(registerPermissions(CORE_PERMISSIONS)).rejects.toThrow('No request context');
    for (const run of [() => registerPermissions(CORE_PERMISSIONS), () => makeDefaultRoles(), () => applyDefaultGrants()]) {
      await expect(runWithContext(ctx(), run)).rejects.toThrow('the roles need the transaction');
    }
  });
});
