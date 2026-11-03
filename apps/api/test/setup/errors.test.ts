// TASK-0010 · One error format for every door (TECH-DESIGN 6.7). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { AppError, errorHandler } from '../../src/shared/errors.js';

const lines: string[] = [];
const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));

const app = createApp({
  logger,
  routes: (a) => {
    a.get('/api/test/stale', () => {
      throw new AppError(409, 'stale_version', 'This was just changed, please review');
    });
    a.post('/api/test/input', () => {
      throw new AppError(400, 'invalid_input', 'Please check the form', { email: 'Enter a valid email' });
    });
    a.get('/api/test/crash', () => {
      throw new Error('database password is hunter2');
    });
  },
});

describe('errors', () => {
  it('the error handler has the four parameters Express needs to treat it as one', () => {
    expect(errorHandler(logger).length).toBe(4);
  });

  it('an unknown door is 404 not_found with the request ID', async () => {
    const res = await request(app).get('/api/no-such-door');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Not found', requestId: res.headers['x-request-id'] } });
  });

  it('an AppError keeps its status, code and message', async () => {
    const res = await request(app).get('/api/test/stale');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'stale_version', message: 'This was just changed, please review' });
    expect(res.body.error.fields).toBeUndefined();
  });

  it('field problems are listed under fields', async () => {
    const res = await request(app).post('/api/test/input').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ email: 'Enter a valid email' });
  });

  it('a body that is not valid JSON is 400 invalid_input, not a server error', async () => {
    const res = await request(app).post('/api/test/input').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_input');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('a body over 1 MB is 413 too_large', async () => {
    const big = JSON.stringify({ text: 'x'.repeat(1_100_000) });
    const res = await request(app).post('/api/test/input').set('Content-Type', 'application/json').send(big);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('too_large');
  });

  it('an unexpected error is a plain 500, logged, with no stack or detail in the answer', async () => {
    const res = await request(app).get('/api/test/crash');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'server_error', message: 'Something went wrong. Please try again.', requestId: res.headers['x-request-id'] },
    });
    expect(res.text).not.toContain('hunter2');
    expect(res.text).not.toMatch(/at .*\.(ts|js):\d+/);
    expect(lines.some((l) => l.includes(res.headers['x-request-id'] as string) && l.includes('"level":50'))).toBe(true);
  });
});
