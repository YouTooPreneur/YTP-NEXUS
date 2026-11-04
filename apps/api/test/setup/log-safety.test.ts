// TASK-0086 · Logs never hold secrets: deep fields, addresses, refused bodies, error values, the log level (TECH-DESIGN section 7). Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { cleanError, createLogger } from '../../src/shared/logging.js';

function capture() {
  const lines: string[] = [];
  const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
  return { lines, logger };
}

const parsed = (lines: string[]) => lines.map((line) => JSON.parse(line) as Record<string, any>);

// Like the database library's error for a failed query: its message and `params` repeat every value.
class DrizzleQueryError extends Error {
  constructor(
    public readonly query: string,
    public readonly params: unknown[],
    cause?: unknown,
  ) {
    super(`Failed query: ${query}\nparams: ${params.join(',')}`, { cause });
  }
}

const savedLevel = process.env.LOG_LEVEL;
afterEach(() => {
  if (savedLevel === undefined) delete process.env.LOG_LEVEL;
  else process.env.LOG_LEVEL = savedLevel;
});

describe('safe logs', () => {
  it('removes secret fields at the top level and up to three levels deep', () => {
    const { lines, logger } = capture();
    logger.info({ password: 'TOP-PW', token: 'TOP-TOKEN', name: 'Asha' }, 'top');
    logger.info({ req: { body: { password: 'DEEP-PW', code: '654321', newPassword: 'NEW-PW' } } }, 'deep');
    const text = lines.join('\n');
    for (const secret of ['TOP-PW', 'TOP-TOKEN', 'DEEP-PW', '654321', 'NEW-PW']) expect(text).not.toContain(secret);
    expect(text).toContain('Asha');
  });

  it('never logs an address query, a Referer or a redirect address', async () => {
    const { lines, logger } = capture();
    const app = createApp({
      logger,
      routes: (a) => {
        a.get('/api/test/redirect', (_req, res) => {
          res.redirect('/reset?token=LOCATION-TOKEN');
        });
      },
    });
    const res = await request(app)
      .get('/api/health?token=QUERY-TOKEN&invite=QUERY-INVITE&q=asha@example.com')
      .set('Referer', 'http://localhost:5173/reset?token=REFERER-TOKEN');
    expect(res.status).toBe(200);
    await request(app).get('/api/test/redirect');
    const text = lines.join('\n');
    for (const secret of ['QUERY-TOKEN', 'QUERY-INVITE', 'asha@example.com', 'REFERER-TOKEN', 'LOCATION-TOKEN']) {
      expect(text).not.toContain(secret);
    }
    const line = parsed(lines).find((l) => l.req?.id === res.headers['x-request-id']);
    expect(line?.req?.url).toBe('/api/health');
    expect(line?.req).not.toHaveProperty('query');
  });

  it('a refused body still gets its request line, with method, address and status, never the body', async () => {
    const { lines, logger } = capture();
    const res = await request(createApp({ logger }))
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"email":"a@b.c","password": Hunter2-secret}');
    expect(res.status).toBe(400);
    const line = parsed(lines).find((l) => l.msg === 'request completed' && l.req?.id === res.headers['x-request-id']);
    expect(line).toMatchObject({ req: { method: 'POST', url: '/api/health' }, res: { statusCode: 400 } });
    expect(lines.join('\n')).not.toContain('Hunter2');
  });

  it('an unexpected error is logged with its type, message, code and stack frames, never the values it carries', async () => {
    const { lines, logger } = capture();
    const app = createApp({
      logger,
      routes: (a) => {
        a.get('/api/test/query', () => {
          const cause = Object.assign(new Error('duplicate key value violates unique constraint "people_email"'), {
            code: '23505',
            detail: 'Key (email)=(asha@example.com) already exists.',
          });
          throw new DrizzleQueryError('insert into "core"."people" ("email", "token") values ($1, $2)', ['asha@example.com', 'TOKEN-VALUE-123'], cause);
        });
        a.get('/api/test/address', () => {
          throw Object.assign(new TypeError('Invalid URL'), { code: 'ERR_INVALID_URL', input: 'postgres://nexus:DB-PASSWORD@localhost/nexus' });
        });
      },
    });
    for (const path of ['/api/test/query', '/api/test/address']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('server_error');
    }
    const text = lines.join('\n');
    for (const secret of ['asha@example.com', 'TOKEN-VALUE-123', 'DB-PASSWORD']) expect(text).not.toContain(secret);
    const errors = parsed(lines).filter((l) => l.level === 50 && l.err);
    expect(errors).toHaveLength(2);
    expect(errors[0]?.err).toMatchObject({ type: 'DrizzleQueryError', cause: { errorCode: '23505' } });
    expect(errors[0]?.err.message).toContain('Failed query: insert into "core"."people"');
    expect(errors[0]?.err.stack).toMatch(/\n\s+at /);
    expect(errors[1]?.err).toMatchObject({ type: 'TypeError', message: 'Invalid URL', errorCode: 'ERR_INVALID_URL' });
  });

  it('an error logged under any other top-level key is cleaned the same way', () => {
    const { lines, logger } = capture();
    logger.error({ error: new DrizzleQueryError('select 1', ['asha@example.com', 'TOKEN-VALUE-123']) }, 'under error');
    logger.warn({ cause: Object.assign(new TypeError('Invalid URL'), { input: 'postgres://nexus:DB-PASSWORD@localhost/nexus' }) }, 'under cause');
    const text = lines.join('\n');
    for (const secret of ['asha@example.com', 'TOKEN-VALUE-123', 'DB-PASSWORD']) expect(text).not.toContain(secret);
    const [first, second] = parsed(lines);
    expect(first?.error).toMatchObject({ type: 'DrizzleQueryError', message: 'Failed query: select 1' });
    expect(second?.cause).toMatchObject({ type: 'TypeError', message: 'Invalid URL' });
  });

  it('cleanError keeps only the type, message, code, stack and cause of anything thrown', () => {
    expect(cleanError('a plain string')).toEqual({ type: 'string' });
    const cleaned = cleanError(Object.assign(new Error('boom'), { body: 'RAW-BODY', config: { password: 'X' } }));
    expect(Object.keys(cleaned as object).sort()).toEqual(['message', 'stack', 'type']);
  });

  it('an error logged through the request logger (req.log) is cleaned the same way, with its real type and cause', async () => {
    const { lines, logger } = capture();
    const app = createApp({
      logger,
      routes: (a) => {
        a.get('/api/test/request-log', (req, res) => {
          const cause = Object.assign(new Error('duplicate key value violates unique constraint "people_email"'), {
            code: '23505',
            detail: 'Key (email)=(asha@example.com) already exists.',
          });
          const err = Object.assign(new DrizzleQueryError('select 1', ['asha@example.com', 'TOKEN-VALUE-123'], cause), {
            input: 'postgres://nexus:DB-PASSWORD@localhost/nexus',
          });
          req.log.error({ err }, 'through the request logger');
          res.json({ ok: true });
        });
      },
    });
    const res = await request(app).get('/api/test/request-log');
    expect(res.status).toBe(200);
    const text = lines.join('\n');
    for (const secret of ['asha@example.com', 'TOKEN-VALUE-123', 'DB-PASSWORD']) expect(text).not.toContain(secret);
    const line = parsed(lines).find((l) => l.msg === 'through the request logger');
    expect(line?.req?.id).toBe(res.headers['x-request-id']);
    expect(line?.err).toMatchObject({ type: 'DrizzleQueryError', message: 'Failed query: select 1', cause: { errorCode: '23505' } });
  });

  it('a blank LOG_LEVEL falls back to info', () => {
    process.env.LOG_LEVEL = '';
    expect(createLogger().level).toBe('info');
    delete process.env.LOG_LEVEL;
    expect(createLogger().level).toBe('info');
  });
});
