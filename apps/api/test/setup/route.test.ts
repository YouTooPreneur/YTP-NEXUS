// TASK-0011 · The route helper and the order of the shared steps. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { AppError } from '../../src/shared/errors.js';
import { defineRoute, mountRoutes, routeRegistry, type RouteHooks } from '../../src/shared/route.js';

const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
const ITEM = '0b8f0d7e-5d1c-4f43-9a4b-2d7a3e9c1f00';

const echoContract = defineContract({
  method: 'post',
  path: '/api/test/items/{itemId}',
  operationId: 'testEchoItem',
  module: 'core',
  summary: 'A door used only by this test',
  params: z.object({ itemId: z.string().uuid() }),
  body: z.object({ name: z.string().min(1) }),
  response: z.object({ itemId: z.string(), name: z.string() }),
});

function hooks(calls: string[], overrides: Partial<RouteHooks> = {}): RouteHooks {
  return {
    session: async () => void calls.push('session'),
    inTransaction: async (_info, run) => {
      calls.push('transaction:start');
      const result = await run();
      calls.push('transaction:end');
      return result;
    },
    idleTimeout: async () => void calls.push('idleTimeout'),
    twoStepGate: async () => void calls.push('twoStepGate'),
    personLimit: async () => void calls.push('personLimit'),
    featureSwitch: async () => void calls.push('featureSwitch'),
    permission: async () => void calls.push('permission'),
    idempotency: async (_info, run) => {
      calls.push('idempotency');
      return run();
    },
    hideFields: (_info, answer) => {
      calls.push('hideFields');
      const { secret: _secret, ...rest } = answer as Record<string, unknown>;
      return rest;
    },
    ...overrides,
  } as RouteHooks;
}

function appWith(calls: string[], overrides: Partial<RouteHooks> = {}) {
  const h = hooks(calls, overrides);
  const route = defineRoute({
    contract: echoContract,
    permission: { module: 'core', action: 'edit' },
    feature: 'core.test',
    handler: async ({ params, body }) => {
      calls.push('handler');
      return { itemId: params.itemId, name: body.name, secret: 'never-sent' };
    },
  });
  return createApp({ logger: quiet(), hooks: h, routes: (a) => mountRoutes(a, [route], h) });
}

describe('defineRoute', () => {
  it('refuses a door that is neither public nor declares its permission and feature key', () => {
    const noFeature = { contract: echoContract, permission: { module: 'core', action: 'view' }, handler: async () => ({}) };
    expect(() => defineRoute(noFeature as never)).toThrow(
      'Route testEchoItem must declare its permission and feature key, or be public',
    );
    const bare = { contract: echoContract, handler: async () => ({}) };
    expect(() => defineRoute(bare as never)).toThrow('or be public');
  });

  it('refuses a public door that also declares a permission', () => {
    const both = { contract: echoContract, public: true, permission: { module: 'core', action: 'view' }, handler: async () => ({}) };
    expect(() => defineRoute(both as never)).toThrow('Route testEchoItem is public and cannot declare a permission or feature key');
  });

  it('keeps every route in the registry, with the health door public', async () => {
    await import('../../src/routes.js');
    const health = routeRegistry.find((r) => r.operationId === 'getHealth');
    expect(health).toMatchObject({ method: 'get', path: '/api/health', module: 'core', public: true });
  });
});

describe('a non-public door', () => {
  it('runs every shared step in the agreed order and hides fields from the answer', async () => {
    const calls: string[] = [];
    const res = await request(appWith(calls)).post(`/api/test/items/${ITEM}`).send({ name: 'Kaveri' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itemId: ITEM, name: 'Kaveri' });
    expect(calls).toEqual([
      'session',
      'transaction:start',
      'idleTimeout',
      'twoStepGate',
      'personLimit',
      'featureSwitch',
      'permission',
      'idempotency',
      'handler',
      'hideFields',
      'transaction:end',
    ]);
  });

  it('checks the input after the permission, and answers 400 with the fields', async () => {
    const calls: string[] = [];
    const res = await request(appWith(calls)).post('/api/test/items/not-a-uuid').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_input');
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['body.name', 'params.itemId']);
    expect(calls).toContain('permission');
    expect(calls).not.toContain('idempotency');
    expect(calls).not.toContain('handler');
  });

  it('stops at the first step that refuses', async () => {
    const calls: string[] = [];
    const res = await request(
      appWith(calls, {
        featureSwitch: async () => {
          calls.push('featureSwitch');
          throw new AppError(403, 'feature_off', 'This feature is switched off');
        },
      }),
    )
      .post(`/api/test/items/${ITEM}`)
      .send({ name: 'Kaveri' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('feature_off');
    expect(calls).not.toContain('permission');
    expect(calls).not.toContain('handler');
    expect(calls).not.toContain('transaction:end');
  });

  it('cannot be mounted without the shared hooks', () => {
    const route = defineRoute({
      contract: { ...echoContract, operationId: 'testNoHooks' },
      permission: { module: 'core', action: 'view' },
      feature: 'core.test',
      handler: async () => ({ itemId: ITEM, name: 'x' }),
    });
    expect(() => createApp({ logger: quiet(), routes: (a) => mountRoutes(a, [route]) })).toThrow(
      'Route testNoHooks needs the shared hooks',
    );
  });
});

describe('a public door', () => {
  it('runs without any hook', async () => {
    const res = await request(createApp({ logger: quiet() })).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'api' });
  });
});
