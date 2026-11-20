// TASK-0031 · Hideable fields in the contracts: each answer path a role may hide is .optional() in the answer, so the generated client never promises a field that hideFields removes; the paths follow the agreed form and the names are <module>.<record type>.<field>; every contract of Nexus passes. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { allContracts, defineContract, hideableProblems, type Contract } from '../src/index.js';

const contracts: readonly Contract[] = allContracts;
const make = (response: z.ZodType, hideableFields: Readonly<Record<string, string>>): Contract =>
  defineContract({
    method: 'get',
    path: '/api/test/hide',
    operationId: 'testHide',
    module: 'test',
    summary: 'A contract used only by this test',
    response,
    hideableFields,
  });

const invoice = z.object({
  number: z.string(),
  total: z.number().optional(),
  note: z.string().nullish(),
  client: z.object({ bank: z.string().optional(), name: z.string() }).nullable(),
  lines: z.array(z.object({ amount: z.number().optional(), label: z.string() })),
});
const page = z.object({ items: z.array(invoice), page: z.number(), pageSize: z.number(), total: z.number() });

describe('hideable fields the client never counts on', () => {
  it('accepts .optional() and .nullish() fields at the top, nested, in list items, in lists in lists and in a list answer', () => {
    expect(
      hideableProblems(
        make(invoice, {
          total: 'finance.invoice.total',
          note: 'finance.invoice.note',
          'client.bank': 'crm.client.bank',
          'lines[].amount': 'finance.invoice_line.amount',
        }),
      ),
    ).toEqual([]);
    expect(hideableProblems(make(page, { 'items[].total': 'finance.invoice.total', 'items[].lines[].amount': 'finance.invoice_line.amount' }))).toEqual([]);
    expect(hideableProblems(make(z.array(invoice), { '[].total': 'finance.invoice.total', '[].client.bank': 'crm.client.bank' }))).toEqual([]);
    expect(hideableProblems(make(invoice, {}))).toEqual([]);
  });

  it('walks through .optional(), .nullish() and .readonly() parents, optional lists and nullable list items', () => {
    const wrapped = z.object({
      client: z.object({ bank: z.string().optional() }).optional(),
      owner: z.object({ pan: z.string().optional() }).nullish(),
      fixed: z.object({ rate: z.number().optional() }).readonly(),
      tags: z.array(z.object({ cost: z.number().optional() }).nullable()).optional(),
      batch: z.array(invoice).readonly(),
    });
    expect(
      hideableProblems(
        make(wrapped, {
          'client.bank': 'crm.client.bank',
          'owner.pan': 'team.person.pan',
          'fixed.rate': 'finance.invoice.rate',
          'tags[].cost': 'crm.tag.cost',
          'batch[].total': 'finance.invoice.total',
        }),
      ),
    ).toEqual([]);
  });

  it('refuses a field the client would still promise: required, .nullable() alone, .optional() then .nullable(), .exactOptional(), .default() or z.any()', () => {
    const answer = z.object({
      number: z.string(),
      paidAt: z.string().nullable(),
      later: z.string().optional().nullable(),
      exact: z.number().exactOptional(),
      count: z.number().default(0),
      anything: z.any(),
    });
    expect(
      hideableProblems(
        make(answer, {
          number: 'finance.invoice.number',
          paidAt: 'finance.invoice.paidAt',
          later: 'finance.invoice.later',
          exact: 'finance.invoice.exact',
          count: 'finance.invoice.count',
          anything: 'finance.invoice.anything',
        }),
      ),
    ).toEqual([
      'testHide: number must be .optional() in the answer',
      'testHide: paidAt must be .optional() in the answer',
      'testHide: later must be .optional() in the answer',
      'testHide: exact must be .optional() in the answer',
      'testHide: count must be .optional() in the answer',
      'testHide: anything must be .optional() in the answer',
    ]);
  });

  it('refuses a path that is not in the answer, and one that is not written in the agreed form', () => {
    expect(
      hideableProblems(
        make(page, {
          'items.total': 'finance.invoice.total',
          'page[].x': 'finance.invoice.x',
          missing: 'finance.invoice.missing',
          'items[].client.bank.x': 'crm.client.x',
          'items[]': 'finance.invoice.items',
          'items[0].total': 'finance.invoice.total',
          'items..total': 'finance.invoice.total',
          '': 'finance.invoice.total',
        }),
      ),
    ).toEqual([
      'testHide: items.total is not in the answer',
      'testHide: page[].x is not in the answer',
      'testHide: missing is not in the answer',
      'testHide: items[].client.bank.x is not in the answer',
      'testHide: items[] is not a valid answer path',
      'testHide: items[0].total is not a valid answer path',
      'testHide: items..total is not a valid answer path',
      'testHide:  is not a valid answer path',
    ]);
    const either = z.union([z.object({ x: z.number().optional() }), z.object({ y: z.string() })]);
    expect(hideableProblems(make(either, { x: 'finance.invoice.x' }))).toEqual(['testHide: x is not in the answer']);
    const byMonth = z.object({ months: z.record(z.string(), z.object({ total: z.number().optional() })) });
    expect(hideableProblems(make(byMonth, { 'months.april.total': 'finance.invoice.total' }))).toEqual(['testHide: months.april.total is not in the answer']);
    expect(hideableProblems(make(invoice, { '[].total': 'finance.invoice.total' }))).toEqual(['testHide: [].total is not in the answer']);
  });

  // Added on 20 Nov 2026 after the independent check of TASK-0031 (plan gaps 1 and 2): an object's catchall and a
  // .default() parent end the walk, and an object is followed only by its own keys, never by one it inherits.
  it('ends the walk at an object’s catchall and at a .default() parent, and follows an object only by its own keys', () => {
    const catchall = z.object({ months: z.object({}).catchall(z.object({ total: z.number().optional() })) });
    expect(hideableProblems(make(catchall, { 'months.april.total': 'finance.invoice.total' }))).toEqual(['testHide: months.april.total is not in the answer']);
    const withDefault = z.object({ client: z.object({ bank: z.string().optional() }).default({}) });
    expect(hideableProblems(make(withDefault, { 'client.bank': 'crm.client.bank' }))).toEqual(['testHide: client.bank is not in the answer']);
    expect(
      hideableProblems(make(invoice, { constructor: 'finance.invoice.total', toString: 'finance.invoice.note', 'client.hasOwnProperty': 'crm.client.bank' })),
    ).toEqual([
      'testHide: constructor is not in the answer',
      'testHide: toString is not in the answer',
      'testHide: client.hasOwnProperty is not in the answer',
    ]);
  });

  it('refuses a name that is not <module>.<record type>.<field>', () => {
    expect(
      hideableProblems(
        make(invoice, {
          total: 'total',
          note: 'Finance.invoice.note',
          'client.bank': 'crm.client.bank.iban',
          'lines[].amount': 'finance.invoice-line.amount',
        }),
      ),
    ).toEqual([
      'testHide: total is hidden as total, which is not <module>.<record type>.<field>',
      'testHide: note is hidden as Finance.invoice.note, which is not <module>.<record type>.<field>',
      'testHide: client.bank is hidden as crm.client.bank.iban, which is not <module>.<record type>.<field>',
      'testHide: lines[].amount is hidden as finance.invoice-line.amount, which is not <module>.<record type>.<field>',
    ]);
    // One entry can give two problems: its path's, then its name's.
    expect(hideableProblems(make(page, { 'items.total': 'Finance.invoice.total' }))).toEqual([
      'testHide: items.total is not in the answer',
      'testHide: items.total is hidden as Finance.invoice.total, which is not <module>.<record type>.<field>',
    ]);
  });

  it('finds no problem in any contract of Nexus', () => {
    for (const contract of contracts) expect(hideableProblems(contract), contract.operationId).toEqual([]);
  });
});
