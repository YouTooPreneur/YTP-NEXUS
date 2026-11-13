// TASK-0016 · The shared hooks and the pool settings: every step not built yet refuses, making the hooks touches no database, and the pool sizes and limits. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { defineContract } from '@ytp/contracts';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { defineRoute, mountRoutes, type RouteInfo } from '../../src/shared/route.js';
import { createHooks } from '../../src/shared/hooks.js';
import { poolSettings, poolSize } from '../../src/db/database.js';

const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
const contract = defineContract({
  method: 'post',
  path: '/api/test/hooks',
  operationId: 'testHooks',
  module: 'core',
  summary: 'A door used only by this test',
  response: z.object({ ok: z.boolean() }),
});
const info = {} as RouteInfo;
const ADDRESS = 'postgres://nexus_app:made%40up@db.example:6543/nexus_x';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createHooks', () => {
  it('reads no setting, opens no connection and prints nothing', () => {
    const saved = process.env.DATABASE_URL_APP;
    delete process.env.DATABASE_URL_APP;
    const out = vi.spyOn(process.stdout, 'write');
    const err = vi.spyOn(process.stderr, 'write');
    try {
      expect(() => createHooks()).not.toThrow();
      expect(out).not.toHaveBeenCalled();
      expect(err).not.toHaveBeenCalled();
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL_APP = saved;
    }
  });

  it('refuses at every step not built yet, and lets every feature through until the feature switches exist', async () => {
    const hooks = createHooks();
    const never = async () => {
      throw new Error('a refused step must not run the rest');
    };
    for (const step of ['session', 'idleTimeout', 'twoStepGate', 'personLimit', 'permission'] as const) {
      await expect(hooks[step](info)).rejects.toThrow(`${step} is not built yet`);
    }
    await expect(hooks.idempotency(info, never)).rejects.toThrow('idempotency is not built yet');
    expect(() => hooks.hideFields(info, { ok: true })).toThrow('hideFields is not built yet');
    await expect(hooks.featureSwitch(info)).resolves.toBeUndefined();
  });

  it('answers 500 for a non-public door mounted with them, without running its handler', async () => {
    let ran = false;
    const route = defineRoute({
      contract,
      permission: { module: 'core', action: 'view' },
      feature: 'core.test',
      handler: async () => {
        ran = true;
        return { ok: true };
      },
    });
    const app = createApp({ logger: quiet(), routes: (a) => mountRoutes(a, [route], createHooks()) });
    const res = await request(app).post('/api/test/hooks');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('server_error');
    expect(ran).toBe(false);
  });
});

describe('the pool settings (TECH-DESIGN 6.6)', () => {
  it('takes a whole number above 0 as a pool size, and the default for anything else', () => {
    expect(poolSize('4', 10)).toBe(4);
    expect(poolSize(' 3 ', 10)).toBe(3);
    for (const value of [undefined, '', '   ', 'abc', '0', '-2', '2.5', '4x']) expect(poolSize(value, 10)).toBe(10);
  });

  it('signs both pools in as the app, with a wait limit, the default sizes and a lock limit for the security pool', () => {
    const address = { host: 'db.example', port: 6543, user: 'nexus_app', password: 'made@up', database: 'nexus_x', connectionTimeoutMillis: 10_000 };
    expect(poolSettings({ DATABASE_URL_APP: ADDRESS })).toEqual({
      request: { ...address, max: 10 },
      security: { ...address, max: 3, lock_timeout: 5_000 },
    });
    const sized = poolSettings({ DATABASE_URL_APP: ADDRESS, DB_POOL_SIZE: '4', DB_SECURITY_POOL_SIZE: '2' });
    expect([sized.request.max, sized.security.max]).toEqual([4, 2]);
  });

  it('refuses a missing or wrong app address', () => {
    expect(() => poolSettings({})).toThrow('DATABASE_URL_APP is not set');
    expect(() => poolSettings({ DATABASE_URL_APP: 'not an address' })).toThrow('DATABASE_URL_APP is not a database address');
    expect(() => poolSettings({ DATABASE_URL_APP: ADDRESS.replace('nexus_app', 'nexus_owner') })).toThrow(
      'DATABASE_URL_APP must sign in as nexus_app',
    );
  });
});
