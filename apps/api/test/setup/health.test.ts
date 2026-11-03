// TASK-0002 · Backend app with a health door. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';

const quietLogger = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));

describe('GET /api/health', () => {
  it('answers 200 with ok and the service name', async () => {
    const res = await request(createApp({ logger: quietLogger() })).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'api' });
  });
});
