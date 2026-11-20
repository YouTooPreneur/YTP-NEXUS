// TASK-0031 · hideFields, the shared step that removes the fields a role does not see: synchronous; a copy of the answer without each hidden field at the paths the door's contract names (top level, nested, list items, lists in lists, a list answer), everything else kept and the given answer unchanged; nothing read when the door names no hideable field; a plain error when it names some but the permission step left nothing; no public or signed-in-only door of Nexus names any. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { z } from 'zod';
import { defineContract } from '@ytp/contracts';
import { hideFields } from '../../src/shared/hide-fields.js';
import { runWithContext, type Access } from '../../src/shared/context.js';
import { AppError } from '../../src/shared/errors.js';
import { defineRoute, type RouteInfo } from '../../src/shared/route.js';
import { allRoutes } from '../../src/routes.js';

const HIDEABLE = {
  'invoice.total': 'finance.invoice.total',
  'invoice.client.bank': 'crm.client.bank',
  'items[].total': 'finance.invoice.total',
  'items[].lines[].amount': 'finance.invoice_line.amount',
  salary: 'team.person.salary',
};
const door = (hideableFields?: Readonly<Record<string, string>>) =>
  defineRoute({
    contract: defineContract({
      method: 'get',
      path: '/api/test/hide',
      operationId: 'testHide',
      module: 'core',
      summary: 'A door used only by this test',
      response: z.any(),
      ...(hideableFields ? { hideableFields } : {}),
    }),
    permission: { module: 'finance.invoices', action: 'view' },
    feature: 'core.test',
    handler: async () => ({}),
  });
const info = (hideableFields?: Readonly<Record<string, string>>): RouteInfo => ({ req: {} as Request, route: door(hideableFields) });
const as = <T>(access: Access | undefined, run: () => T): T => runWithContext({ requestId: 'r-0031', background: false, ...(access ? { access } : {}) }, run);
const ALL_HIDDEN: Access = { scope: 'own', hiddenFields: ['crm.client.bank', 'finance.invoice.total', 'finance.invoice_line.amount', 'team.person.salary'] };

const answer = () => ({
  invoice: { number: 'YTP/26-27/0001', total: 118000, client: { name: 'Kaveri Hospitals', bank: 'HDFC 1234' } },
  items: [
    { name: 'Website', total: 100000, lines: [{ label: 'Design', amount: 60000 }, { label: 'Build', amount: 40000 }] },
    { name: 'Hosting', total: 18000, lines: [] },
  ],
  page: 1,
  pageSize: 25,
  total: 2,
  salary: 50000,
});

describe('hideFields', () => {
  it('is synchronous and gives back the very answer, reading nothing, when the door names no hideable field', () => {
    const given = answer();
    const result = hideFields(info(), given);
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toBe(given);
    expect(hideFields(info({}), given)).toBe(given);
  });

  it('removes each hidden field at every path the contract names: top level, nested, list items and lists in lists', () => {
    const result = as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), answer()));
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toStrictEqual({
      invoice: { number: 'YTP/26-27/0001', client: { name: 'Kaveri Hospitals' } },
      items: [
        { name: 'Website', lines: [{ label: 'Design' }, { label: 'Build' }] },
        { name: 'Hosting', lines: [] },
      ],
      page: 1,
      pageSize: 25,
      total: 2,
    });
  });

  it('keeps the list count and every field the role still sees, and ignores hidden names the door does not name', () => {
    const some = as({ scope: 'all', hiddenFields: ['finance.invoice_line.amount', 'hr.person.pan'] }, () => hideFields(info(HIDEABLE), answer()));
    expect(some).toStrictEqual({
      ...answer(),
      items: [
        { name: 'Website', total: 100000, lines: [{ label: 'Design' }, { label: 'Build' }] },
        { name: 'Hosting', total: 18000, lines: [] },
      ],
    });
    expect(as({ scope: 'all', hiddenFields: [] }, () => hideFields(info(HIDEABLE), answer()))).toStrictEqual(answer());
  });

  it('never changes the answer it was given', () => {
    const given = answer();
    as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), given));
    expect(given).toStrictEqual(answer());
  });

  // Added on 20 Nov 2026 after the independent check of TASK-0031 (plan gap 5): a copy only along the paths it changes.
  it('copies only along the paths it changes: unchanged parts keep their identity, and nothing is copied when no hidden name applies', () => {
    const given = answer();
    expect(as({ scope: 'all', hiddenFields: ['hr.person.pan'] }, () => hideFields(info(HIDEABLE), given))).toBe(given);
    expect(as({ scope: 'all', hiddenFields: [] }, () => hideFields(info(HIDEABLE), given))).toBe(given);
    const top = as({ scope: 'own', hiddenFields: ['team.person.salary'] }, () => hideFields(info(HIDEABLE), given)) as ReturnType<typeof answer>;
    expect(top).not.toBe(given);
    expect(top).not.toHaveProperty('salary');
    expect(top.invoice).toBe(given.invoice);
    expect(top.items).toBe(given.items);
    const deep = as({ scope: 'own', hiddenFields: ['crm.client.bank'] }, () => hideFields(info(HIDEABLE), given)) as ReturnType<typeof answer>;
    expect(deep.invoice).not.toBe(given.invoice);
    expect(deep.invoice.client).not.toBe(given.invoice.client);
    expect(deep.invoice.client).not.toHaveProperty('bank');
    expect(deep.items).toBe(given.items);
    expect(given.invoice.client).toHaveProperty('bank', 'HDFC 1234');
  });

  it('removes from each item of a list answer, and skips a path whose parent is missing, null or not what the path expects', () => {
    const list = info({ '[].total': 'finance.invoice.total', '[].client.bank': 'crm.client.bank' });
    expect(
      as(ALL_HIDDEN, () =>
        hideFields(list, [{ number: '1', total: 5, client: null }, { number: '2', client: { bank: 'x', name: 'y' } }, 'not an object', null]),
      ),
    ).toStrictEqual([{ number: '1', client: null }, { number: '2', client: { name: 'y' } }, 'not an object', null]);
    expect(as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), { invoice: null, items: 'not a list', other: 1 }))).toStrictEqual({
      invoice: null,
      items: 'not a list',
      other: 1,
    });
    expect(as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), null))).toBeNull();
    expect(as(ALL_HIDDEN, () => hideFields(list, { not: 'a list' }))).toStrictEqual({ not: 'a list' });
  });

  it('skips a part whose parent is absent or the wrong kind even when the key is there, and never changes a list answer', () => {
    const list = info({ '[].total': 'finance.invoice.total', '[].client.bank': 'crm.client.bank' });
    expect(as(ALL_HIDDEN, () => hideFields(list, { total: 5, client: { bank: 'x' } }))).toStrictEqual({ total: 5, client: { bank: 'x' } });
    expect(as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), { other: 1 }))).toStrictEqual({ other: 1 });
    expect(as(ALL_HIDDEN, () => hideFields(info(HIDEABLE), { invoice: [{ total: 1 }], items: { total: 2, lines: { amount: 3 } } }))).toStrictEqual({
      invoice: [{ total: 1 }],
      items: { total: 2, lines: { amount: 3 } },
    });
    const given = [{ number: '1', total: 5, client: { bank: 'x' } }];
    expect(as(ALL_HIDDEN, () => hideFields(list, given))).toStrictEqual([{ number: '1', client: {} }]);
    expect(given).toStrictEqual([{ number: '1', total: 5, client: { bank: 'x' } }]);
  });

  it('refuses with a plain error, never an answer for the screen, when the door names hideable fields but the permission step left no access', () => {
    let caught: unknown;
    try {
      as(undefined, () => hideFields(info(HIDEABLE), answer()));
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(AppError);
    expect((caught as Error).message).toBe('testHide: hidden fields need the permission step');
  });
});

describe('the doors of Nexus', () => {
  it('name hideable fields only where the permission step runs: never on a public or signed-in-only door', () => {
    for (const route of allRoutes) {
      if (route.public || route.signedIn) expect(Object.keys(route.contract.hideableFields ?? {}), route.operationId).toEqual([]);
    }
  });
});
