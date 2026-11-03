// TASK-0010 · Request context and the trusted proxy. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { getContext, runWithContext } from '../../src/shared/context.js';

const quietLogger = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));

const app = () =>
  createApp({
    logger: quietLogger(),
    routes: (a) => {
      a.get('/api/test/context', (req, res) => {
        const ctx = getContext();
        res.json({ requestId: ctx.requestId, background: ctx.background, ip: req.ip });
      });
    },
  });

describe('request context', () => {
  it('gives every request its own ID, also in the x-request-id answer header', async () => {
    const a = await request(app()).get('/api/test/context');
    const b = await request(app()).get('/api/test/context');
    expect(a.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.headers['x-request-id']).toBe(a.body.requestId);
    expect(b.body.requestId).not.toBe(a.body.requestId);
  });

  it('marks automatic refreshes as background requests', async () => {
    const normal = await request(app()).get('/api/test/context');
    const background = await request(app()).get('/api/test/context').set('x-nexus-background', '1');
    expect(normal.body.background).toBe(false);
    expect(background.body.background).toBe(true);
  });

  it('trusts exactly one proxy, so the person\'s own address is seen', async () => {
    const res = await request(app()).get('/api/test/context').set('x-forwarded-for', '203.0.113.5');
    expect(res.body.ip).toBe('203.0.113.5');
    // A person can write a made-up address in front; only the last one, added by our one proxy, counts.
    const faked = await request(app()).get('/api/test/context').set('x-forwarded-for', '198.51.100.9, 203.0.113.5');
    expect(faked.body.ip).toBe('203.0.113.5');
    expect(app().get('trust proxy')).toBe(1);
  });

  it('works outside a request only through runWithContext', () => {
    expect(() => getContext()).toThrow('No request context');
    const id = runWithContext({ requestId: 'job-1', background: true }, () => getContext().requestId);
    expect(id).toBe('job-1');
  });

  it('does not tell the world it is Express', async () => {
    const res = await request(app()).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
