// TASK-0031 · Core's one permission check (accessFor, checkPermission, currentAccess) and the real permission and hideFields steps on doors: the person's role from core.users in the request's transaction; the grant's scope and every field the role does not see, in every module, on the request's own context; 401 not_signed_in for a person missing in the company, deleted or purged; 403 not_allowed for no grant or a deleted role, the Owner included; no cache and no lock; on doors, hidden fields gone at every path, a repeated answer hidden too, a refused door running nothing, a signed-in-only door untouched. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Request } from 'express';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { AppError } from '../../src/shared/errors.js';
import { getContext, runWithContext, type RequestContext } from '../../src/shared/context.js';
import { defineRoute, mountRoutes, type RouteHooks } from '../../src/shared/route.js';
import { closePools, inRequestTransaction } from '../../src/db/database.js';
import { createHooks } from '../../src/shared/hooks.js';
import {
  CORE_PERMISSIONS,
  applyDefaultGrants,
  makeDefaultRoles,
  registerPermissions,
  type PermissionEntry,
} from '../../src/modules/core/service/roles.js';
import { accessFor, checkPermission, currentAccess } from '../../src/modules/core/service/access.js';
import { clientFor, makeTestCompanies, resetCompanies } from './helpers.js';

const owner = clientFor('DATABASE_URL_OWNER');
const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
const SYSTEM = '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f';
let A = '';
let B = '';
let n = 0;
let rolesA: Record<string, string> = {};
let people = { ownerA: '', staffA: '', goneA: '', purgedA: '', studentA: '', staffB: '' };

// Three probe permissions: Staff sees invoices (its own) without their total, and people (its team) without salaries.
const PROBES: PermissionEntry[] = [
  {
    module: 'probe.invoices',
    action: 'view',
    label: 'View invoices',
    hideableFields: ['probe.invoice.total', 'probe.invoice.price'],
    defaultGrants: { owner: { scope: 'all' }, staff: { scope: 'own', hidden: ['probe.invoice.total'] } },
    grantsVersion: 1,
    release: 1,
  },
  { module: 'probe.invoices', action: 'edit', label: 'Edit invoices', defaultGrants: { owner: { scope: 'all' } }, grantsVersion: 1, release: 1 },
  {
    module: 'probe.people',
    action: 'view',
    label: 'View people',
    hideableFields: ['probe.person.salary'],
    defaultGrants: { owner: { scope: 'all' }, staff: { scope: 'team', hidden: ['probe.person.salary'] } },
    grantsVersion: 1,
    release: 1,
  },
];
const STAFF_HIDDEN = ['probe.invoice.total', 'probe.person.salary'];

const ctx = (more: Partial<RequestContext> = {}): RequestContext => {
  n += 1;
  return { requestId: `req-0031-${n}`, background: false, ...more };
};
const inRequest = <T>(context: RequestContext, work: () => Promise<T>) => runWithContext(context, () => inRequestTransaction(work));
const check = (companyId: string, userId: string, module: string, action: string) =>
  inRequest(ctx({ companyId, userId }), () => accessFor({ module, action }));
// What a promise ends in: 'allowed', or what it was refused with.
const refusal = (promise: Promise<unknown>): Promise<unknown> => promise.then(() => 'allowed', (error: unknown) => error);
const roleIn = (ids: Record<string, string>, key: string): string => {
  const id = ids[key];
  if (!id) throw new Error(`no ${key} role`);
  return id;
};

// One statement as the owner for one company: the row rules bind the owner too.
async function asCompany(companyId: string, query: string, values: unknown[] = []): Promise<Record<string, unknown>[]> {
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT set_config('app.company_id', $1, true)", [companyId]);
    const result = await owner.query(query, values);
    await owner.query('COMMIT');
    return result.rows;
  } catch (error) {
    await owner.query('ROLLBACK');
    throw error;
  }
}
async function person(companyId: string, roleId: string): Promise<string> {
  const id = String((await owner.query('SELECT core.uuid_v7() AS id')).rows[0]!.id);
  await asCompany(companyId, `INSERT INTO core.users (id, company_id, display_name, role_id, signin_methods) VALUES ($1, $2, 'Test Person', $3, '{password}')`, [
    id,
    companyId,
    roleId,
  ]);
  return id;
}
async function seed(companyId: string): Promise<Record<string, string>> {
  return inRequest(ctx({ companyId, userId: SYSTEM }), async () => {
    await registerPermissions([...CORE_PERMISSIONS, ...PROBES]);
    const ids = await makeDefaultRoles();
    await applyDefaultGrants();
    return ids;
  });
}

// Doors with the real transaction, permission, double-click and hideFields steps, and a stand-in session.
let who = { companyId: '', userId: '' };
let runs = 0;
let seenAccess: unknown;
const real = createHooks();
const hooks: RouteHooks = {
  session: async () => {
    const context = getContext();
    context.companyId = who.companyId;
    context.userId = who.userId;
  },
  inTransaction: real.inTransaction,
  idleTimeout: async () => {},
  twoStepGate: async () => {},
  personLimit: async () => {},
  featureSwitch: async () => {},
  permission: real.permission,
  idempotency: real.idempotency,
  hideFields: real.hideFields,
};
const invoiceAnswer = z.object({
  invoice: z.object({ number: z.string(), total: z.number().optional(), price: z.number().optional() }),
  items: z.array(z.object({ name: z.string(), total: z.number().optional() })),
  total: z.number(),
  salary: z.number().optional(),
});
const HIDEABLE = { 'invoice.total': 'probe.invoice.total', 'invoice.price': 'probe.invoice.price', 'items[].total': 'probe.invoice.total', salary: 'probe.person.salary' };
const FULL = {
  invoice: { number: 'YTP/26-27/0001', total: 118000, price: 100000 },
  items: [
    { name: 'Website', total: 100000 },
    { name: 'Hosting', total: 18000 },
  ],
  total: 2,
  salary: 50000,
};
const FOR_STAFF = { invoice: { number: 'YTP/26-27/0001', price: 100000 }, items: [{ name: 'Website' }, { name: 'Hosting' }], total: 2 };
const handler = async () => {
  runs += 1;
  seenAccess = getContext().access;
  return FULL;
};
const invoiceDoor = (method: 'get' | 'post' | 'patch', operationId: string, action: 'view' | 'edit') =>
  defineRoute({
    contract: defineContract({ method, path: '/api/test/invoices', operationId, module: 'core', summary: 'A door used only by this test', response: invoiceAnswer, hideableFields: HIDEABLE }),
    permission: { module: 'probe.invoices', action },
    feature: 'core.test',
    handler,
  });
const mineDoor = defineRoute({
  contract: defineContract({ method: 'get', path: '/api/test/mine', operationId: 'testMine', module: 'core', summary: 'A door used only by this test', response: z.object({ ok: z.boolean() }) }),
  signedIn: true,
  feature: 'core.test',
  handler: async () => {
    seenAccess = getContext().access;
    return { ok: true };
  },
});
const routes = [invoiceDoor('get', 'testInvoicesRead', 'view'), invoiceDoor('post', 'testInvoicesSearch', 'view'), invoiceDoor('patch', 'testInvoicesEdit', 'edit'), mineDoor];
const web = createApp({ logger: quiet(), hooks, routes: (a) => mountRoutes(a, routes, hooks) });
const keysOf = async (companyId: string) => asCompany(companyId, 'SELECT key FROM core.idempotency_keys');

beforeAll(async () => {
  await owner.connect();
  await resetCompanies(owner);
  ({ a: A, b: B } = await makeTestCompanies(owner));
});

// Every test starts from fresh roles and grants in both companies, and the same people.
beforeEach(async () => {
  await owner.query(
    'TRUNCATE core.user_preferences, core.users, core.default_grants_applied, core.role_hidden_fields, core.role_permissions, core.roles, core.permission_catalogue, core.idempotency_keys, audit.activity_log CASCADE',
  );
  rolesA = await seed(A);
  const rolesB = await seed(B);
  people = {
    ownerA: await person(A, roleIn(rolesA, 'owner')),
    staffA: await person(A, roleIn(rolesA, 'staff')),
    goneA: await person(A, roleIn(rolesA, 'staff')),
    purgedA: await person(A, roleIn(rolesA, 'staff')),
    studentA: await person(A, roleIn(rolesA, 'student')),
    staffB: await person(B, roleIn(rolesB, 'staff')),
  };
  await asCompany(A, 'UPDATE core.users SET deleted_at = now() WHERE id = $1', [people.goneA]);
  await asCompany(A, 'UPDATE core.users SET purged_at = now() WHERE id = $1', [people.purgedA]);
  runs = 0;
  seenAccess = undefined;
});

afterEach(async () => {
  await closePools();
});

afterAll(async () => {
  await closePools();
  await resetCompanies(owner);
  await owner.end();
});

describe('accessFor: Core’s one permission check', () => {
  it('gives the Owner every permission through its own grants, scope all and nothing hidden, with no way around a removed grant', async () => {
    for (const p of [...CORE_PERMISSIONS, ...PROBES]) {
      expect(await check(A, people.ownerA, p.module, p.action), `${p.module}.${p.action}`).toEqual({ scope: 'all', hiddenFields: [] });
    }
    await asCompany(A, `DELETE FROM core.role_permissions WHERE role_id = $1 AND module = 'core.settings' AND action = 'view'`, [roleIn(rolesA, 'owner')]);
    expect(await refusal(check(A, people.ownerA, 'core.settings', 'view'))).toMatchObject({ status: 403, code: 'not_allowed' });
    // No special path for the Owner's scope or hidden fields either: they come from its rows like any role's.
    await asCompany(A, `UPDATE core.role_permissions SET scope = 'own' WHERE role_id = $1 AND module = 'probe.invoices' AND action = 'view'`, [roleIn(rolesA, 'owner')]);
    await asCompany(A, `INSERT INTO core.role_hidden_fields (company_id, role_id, module, field) VALUES ($1, $2, 'probe.invoices', 'probe.invoice.total')`, [
      A,
      roleIn(rolesA, 'owner'),
    ]);
    expect(await check(A, people.ownerA, 'probe.invoices', 'view')).toEqual({ scope: 'own', hiddenFields: ['probe.invoice.total'] });
  });

  it('gives a role its grant’s scope and every field it does not see, in every module, sorted', async () => {
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toEqual({ scope: 'own', hiddenFields: STAFF_HIDDEN });
    expect(await check(A, people.staffA, 'probe.people', 'view')).toEqual({ scope: 'team', hiddenFields: STAFF_HIDDEN });
    // A module the role has no grant in, a name hidden under two modules, and a name that sorts first but is added last.
    await asCompany(
      A,
      `INSERT INTO core.role_hidden_fields (company_id, role_id, module, field) VALUES ($1, $2, 'probe.payroll', 'probe.bank.account'), ($1, $2, 'probe.payroll', 'probe.invoice.total')`,
      [A, roleIn(rolesA, 'staff')],
    );
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toEqual({ scope: 'own', hiddenFields: ['probe.bank.account', ...STAFF_HIDDEN] });
  });

  it('refuses 403 not_allowed, never an empty scope, when the role has no grant for the action', async () => {
    for (const [module, action] of [
      ['probe.invoices', 'edit'],
      ['core.settings', 'view'],
      ['nowhere.module', 'view'],
    ] as const) {
      const refused = await refusal(check(A, people.staffA, module, action));
      expect(refused, `${module}.${action}`).toBeInstanceOf(AppError);
      expect(refused).toMatchObject({ status: 403, code: 'not_allowed', message: 'You are not allowed to do this.' });
    }
    expect(await refusal(check(A, people.studentA, 'probe.invoices', 'view'))).toMatchObject({ status: 403, code: 'not_allowed' });
  });

  it('refuses 401 not_signed_in for a person missing in the request’s company, deleted or purged', async () => {
    for (const userId of [crypto.randomUUID(), people.staffB, people.goneA, people.purgedA]) {
      const refused = await refusal(check(A, userId, 'probe.invoices', 'view'));
      expect(refused).toBeInstanceOf(AppError);
      expect(refused).toMatchObject({ status: 401, code: 'not_signed_in', message: 'Please sign in.' });
    }
  });

  it('refuses 403 not_allowed for a person whose role is deleted', async () => {
    await asCompany(A, 'UPDATE core.roles SET deleted_at = now() WHERE id = $1', [roleIn(rolesA, 'staff')]);
    // The message too (added on 20 Nov 2026 after the independent check of TASK-0031, plan gap 3).
    const refused = await refusal(check(A, people.staffA, 'probe.invoices', 'view'));
    expect(refused).toBeInstanceOf(AppError);
    expect(refused).toMatchObject({ status: 403, code: 'not_allowed', message: 'You are not allowed to do this.' });
  });

  it('reads the grants afresh every time: a change applies to the very next request', async () => {
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toMatchObject({ scope: 'own' });
    await asCompany(A, `UPDATE core.role_permissions SET scope = 'all' WHERE role_id = $1 AND module = 'probe.invoices' AND action = 'view'`, [roleIn(rolesA, 'staff')]);
    await asCompany(A, `DELETE FROM core.role_hidden_fields WHERE role_id = $1 AND field = 'probe.invoice.total'`, [roleIn(rolesA, 'staff')]);
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toEqual({ scope: 'all', hiddenFields: ['probe.person.salary'] });
  });

  it('reads the person afresh every time: a new role or a removal applies to the very next request', async () => {
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toEqual({ scope: 'own', hiddenFields: STAFF_HIDDEN });
    await asCompany(A, 'UPDATE core.users SET role_id = $2 WHERE id = $1', [people.staffA, roleIn(rolesA, 'owner')]);
    expect(await check(A, people.staffA, 'probe.invoices', 'view')).toEqual({ scope: 'all', hiddenFields: [] });
    await asCompany(A, 'UPDATE core.users SET deleted_at = now() WHERE id = $1', [people.staffA]);
    expect(await refusal(check(A, people.staffA, 'probe.invoices', 'view'))).toMatchObject({ status: 401, code: 'not_signed_in' });
  });

  it('lets a database failure through as a plain error, never a 4xx answer', async () => {
    const refused = await refusal(
      inRequest(ctx({ companyId: A, userId: people.staffA }), async () => {
        await getContext()
          .tx!.execute(sql`SELECT 1 / 0`)
          .catch(() => undefined);
        return accessFor({ module: 'probe.invoices', action: 'view' });
      }),
    );
    expect(refused).toBeInstanceOf(Error);
    expect(refused).not.toBeInstanceOf(AppError);
  });

  it('takes no lock: rows another save holds never make it wait', async () => {
    const holder = clientFor('DATABASE_URL_OWNER');
    await holder.connect();
    try {
      await holder.query('BEGIN');
      await holder.query("SELECT set_config('app.company_id', $1, true)", [A]);
      await holder.query('SELECT 1 FROM core.users WHERE id = $1 FOR UPDATE', [people.staffA]);
      await holder.query('SELECT 1 FROM core.roles WHERE id = $1 FOR UPDATE', [roleIn(rolesA, 'staff')]);
      await holder.query('SELECT 1 FROM core.role_permissions WHERE role_id = $1 FOR UPDATE', [roleIn(rolesA, 'staff')]);
      await holder.query('SELECT 1 FROM core.role_hidden_fields WHERE role_id = $1 FOR UPDATE', [roleIn(rolesA, 'staff')]);
      const outcome = await Promise.race([
        check(A, people.staffA, 'probe.invoices', 'view').then(() => 'answered'),
        new Promise((resolve) => setTimeout(() => resolve('waited'), 3_000)),
      ]);
      expect(outcome).toBe('answered');
    } finally {
      await holder.query('ROLLBACK');
      await holder.end();
    }
  });

  it('refuses with a plain error, never a 4xx answer, without the request transaction or the person', async () => {
    const attempts = [
      () => runWithContext(ctx({ companyId: A, userId: people.staffA }), () => accessFor({ module: 'probe.invoices', action: 'view' })),
      () => inRequest(ctx({ companyId: A }), () => accessFor({ module: 'probe.invoices', action: 'view' })),
    ];
    for (const run of attempts) {
      const refused = await refusal(run());
      expect(refused).toBeInstanceOf(Error);
      expect(refused).not.toBeInstanceOf(AppError);
      expect((refused as Error).message).toBe('the permission check needs the request transaction and the person');
    }
  });
});

describe('checkPermission and currentAccess', () => {
  it('checkPermission puts the access on the request’s own context, and refuses a door that names no permission', async () => {
    const context = ctx({ companyId: A, userId: people.staffA });
    await runWithContext(context, () => inRequestTransaction(() => checkPermission({ req: {} as Request, route: routes[0]! })));
    expect(context.access).toEqual({ scope: 'own', hiddenFields: STAFF_HIDDEN });
    const refused = await refusal(
      runWithContext(ctx({ companyId: A, userId: people.staffA }), () => inRequestTransaction(() => checkPermission({ req: {} as Request, route: mineDoor }))),
    );
    expect(refused).toBeInstanceOf(Error);
    expect(refused).not.toBeInstanceOf(AppError);
    expect((refused as Error).message).toBe("testMine: the permission step needs the door's permission");
  });

  it('currentAccess gives back the access the permission step left, or refuses with a plain error', () => {
    const access = { scope: 'own' as const, hiddenFields: ['probe.invoice.total'] };
    expect(runWithContext(ctx({ access }), () => currentAccess())).toBe(access);
    let caught: unknown;
    try {
      runWithContext(ctx(), () => currentAccess());
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(AppError);
    expect((caught as Error).message).toBe('the scope needs the permission step');
  });
});

describe('the permission and hideFields steps on doors', () => {
  it('shows the Owner the whole answer, and a role the answer without the fields it does not see, the list count kept', async () => {
    who = { companyId: A, userId: people.ownerA };
    const mine = await request(web).get('/api/test/invoices');
    expect(mine.status).toBe(200);
    expect(mine.body).toEqual(FULL);
    expect(seenAccess).toEqual({ scope: 'all', hiddenFields: [] });
    who = { companyId: A, userId: people.staffA };
    const theirs = await request(web).get('/api/test/invoices');
    expect(theirs.status).toBe(200);
    expect(theirs.body).toEqual(FOR_STAFF);
    expect(seenAccess).toEqual({ scope: 'own', hiddenFields: STAFF_HIDDEN });
  });

  it('refuses a role with no grant before the input is read or the handler runs, and keeps nothing', async () => {
    who = { companyId: A, userId: people.staffA };
    const res = await request(web).patch('/api/test/invoices').set('Idempotency-Key', crypto.randomUUID()).send({ anything: true });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: { code: 'not_allowed', message: 'You are not allowed to do this.', requestId: res.headers['x-request-id'] } });
    expect(runs).toBe(0);
    expect(await keysOf(A)).toEqual([]);
  });

  it('hides the fields of a repeated answer too, which the double-click step kept whole', async () => {
    who = { companyId: A, userId: people.staffA };
    const key = crypto.randomUUID();
    const first = await request(web).post('/api/test/invoices').set('Idempotency-Key', key).send({});
    const again = await request(web).post('/api/test/invoices').set('Idempotency-Key', key).send({});
    expect(runs).toBe(1);
    for (const res of [first, again]) {
      expect(res.status).toBe(200);
      expect(res.body).toEqual(FOR_STAFF);
    }
  });

  it('answers 401 for a person with no row; a signed-in-only door needs no grant, gets no access and hides nothing', async () => {
    who = { companyId: A, userId: crypto.randomUUID() };
    const nobody = await request(web).get('/api/test/invoices');
    expect(nobody.status).toBe(401);
    expect(nobody.body.error.code).toBe('not_signed_in');
    who = { companyId: A, userId: people.studentA };
    const mine = await request(web).get('/api/test/mine');
    expect(mine.status).toBe(200);
    expect(mine.body).toEqual({ ok: true });
    expect(seenAccess).toBeUndefined();
  });
});
