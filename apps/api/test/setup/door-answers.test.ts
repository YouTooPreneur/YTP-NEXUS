// TASK-0095 · Every door's answer is checked against its contract before it leaves, and signed-in doors (a feature key, no permission) run every shared step except the permission check. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { defineRoute, mountRoutes, type RegisteredRoute, type RouteHooks } from '../../src/shared/route.js';

const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
const contract = (operationId: string, response: z.ZodType) =>
  defineContract({ method: 'post', path: `/api/test/${operationId}`, operationId, module: 'core', summary: 'A door used only by this test', response });

// Shared steps that only record what ran, and what the double-click step would store.
function hooks(calls: string[], seen: { stored?: unknown } = {}): RouteHooks {
  return {
    session: async () => void calls.push('session'),
    inTransaction: async (_info, run) => {
      calls.push('transaction:start');
      try {
        const result = await run();
        calls.push('transaction:commit');
        return result;
      } catch (error) {
        calls.push('transaction:undo');
        throw error;
      }
    },
    idleTimeout: async () => void calls.push('idleTimeout'),
    twoStepGate: async () => void calls.push('twoStepGate'),
    personLimit: async () => void calls.push('personLimit'),
    featureSwitch: async () => void calls.push('featureSwitch'),
    permission: async () => void calls.push('permission'),
    idempotency: async (_info, run) => {
      calls.push('idempotency');
      const answer = await run();
      seen.stored = answer;
      return answer;
    },
    hideFields: (_info, answer) => {
      calls.push('hideFields');
      return answer;
    },
  } as RouteHooks;
}
const appWith = (routes: RegisteredRoute[], h?: RouteHooks) => createApp({ logger, ...(h ? { hooks: h } : {}), routes: (a) => mountRoutes(a, routes, h) });

describe('the answer check on a public door', () => {
  it('drops every field the contract does not declare', async () => {
    const door = defineRoute({
      contract: contract('testExtra', z.object({ name: z.string() })),
      public: true,
      handler: async () => ({ name: 'Asha', passwordHash: 'scrambled' }),
    });
    const res = await request(appWith([door])).post('/api/test/testExtra');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Asha' });
  });

  it('answers a plain 500 for a wrong shape and logs only which door, never the checker’s details', async () => {
    const door = defineRoute({
      contract: contract('testWrong', z.object({ itemId: z.string() })),
      public: true,
      handler: async () => ({ itemId: 5 }),
    });
    const start = lines.length;
    const res = await request(appWith([door])).post('/api/test/testWrong');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    const text = lines.slice(start).join('\n');
    expect(text).toContain('testWrong: the answer does not match its contract');
    expect(text).not.toMatch(/invalid_type|ZodError|expected string/);
  });

  it('refuses a Date where the contract wants a time as text, and accepts the same time as ISO text', async () => {
    const at = new Date('2026-10-01T04:30:00.000Z');
    const asDate = defineRoute({ contract: contract('testDate', z.object({ at: z.iso.datetime() })), public: true, handler: async () => ({ at }) });
    const asText = defineRoute({ contract: contract('testText', z.object({ at: z.iso.datetime() })), public: true, handler: async () => ({ at: at.toISOString() }) });
    expect((await request(appWith([asDate])).post('/api/test/testDate')).status).toBe(500);
    const ok = await request(appWith([asText])).post('/api/test/testText');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ at: '2026-10-01T04:30:00.000Z' });
  });
});

describe('the answer check on a non-public door', () => {
  it('checks the answer inside the double-click step, so the stored answer is the checked one', async () => {
    const calls: string[] = [];
    const seen: { stored?: unknown } = {};
    const door = defineRoute({
      contract: contract('testStored', z.object({ name: z.string() })),
      permission: { module: 'core', action: 'edit' },
      feature: 'core.test',
      handler: async () => ({ name: 'Kaveri', secret: 'never-stored' }),
    });
    const h = hooks(calls, seen);
    const res = await request(appWith([door], h)).post('/api/test/testStored');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Kaveri' });
    expect(seen.stored).toEqual({ name: 'Kaveri' });
    expect(calls).toContain('transaction:commit');
  });

  it('undoes the transaction when the answer has the wrong shape', async () => {
    const calls: string[] = [];
    const door = defineRoute({
      contract: contract('testUndo', z.object({ name: z.string() })),
      permission: { module: 'core', action: 'edit' },
      feature: 'core.test',
      handler: async () => ({ name: 7 }),
    });
    const res = await request(appWith([door], hooks(calls))).post('/api/test/testUndo');
    expect(res.status).toBe(500);
    expect(calls).toContain('transaction:undo');
    expect(calls).not.toContain('transaction:commit');
  });
});

describe('signed-in doors', () => {
  it('run every shared step except the permission check', async () => {
    const calls: string[] = [];
    const door = defineRoute({
      contract: contract('testMine', z.object({ ok: z.boolean() })),
      signedIn: true,
      feature: 'core.profile',
      handler: async () => {
        calls.push('handler');
        return { ok: true };
      },
    });
    const res = await request(appWith([door], hooks(calls))).post('/api/test/testMine');
    expect(res.status).toBe(200);
    expect(calls).toEqual([
      'session',
      'transaction:start',
      'idleTimeout',
      'twoStepGate',
      'personLimit',
      'featureSwitch',
      'idempotency',
      'handler',
      'hideFields',
      'transaction:commit',
    ]);
  });

  it('are registered with signedIn: true, which other doors do not carry at all', () => {
    const mine = defineRoute({ contract: contract('testMineKind', z.object({})), signedIn: true, feature: 'core.profile', handler: async () => ({}) });
    const guarded = defineRoute({
      contract: contract('testGuardedKind', z.object({})),
      permission: { module: 'core', action: 'view' },
      feature: 'core.test',
      handler: async () => ({}),
    });
    const open = defineRoute({ contract: contract('testOpenKind', z.object({})), public: true, handler: async () => ({}) });
    expect(mine).toMatchObject({ public: false, signedIn: true, feature: 'core.profile' });
    expect('permission' in mine).toBe(false);
    expect('signedIn' in guarded).toBe(false);
    expect('signedIn' in open).toBe(false);
  });

  it('need their feature key and no permission, and are never public', () => {
    const base = { contract: contract('testBadKind', z.object({})), handler: async () => ({}) };
    expect(() => defineRoute({ ...base, signedIn: true, feature: 'core.profile', permission: { module: 'core', action: 'view' } } as never)).toThrow(
      'Route testBadKind is signed in only and cannot declare a permission',
    );
    expect(() => defineRoute({ ...base, signedIn: true } as never)).toThrow('Route testBadKind is signed in only and must declare its feature key');
    expect(() => defineRoute({ ...base, signedIn: true, public: true, feature: 'core.profile' } as never)).toThrow(
      'Route testBadKind cannot be both public and signed in only',
    );
  });
});

describe('the existing doors', () => {
  it('still answer: the health door', async () => {
    const res = await request(createApp({ logger })).get('/api/health');
    expect(res.status).toBe(200);
  });
});
