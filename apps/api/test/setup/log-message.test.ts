// TASK-0087 · An error logged with no message never puts its raw message, a failed query's values included, into the log (TECH-DESIGN section 7). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';

function capture() {
  const lines: string[] = [];
  const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
  return { lines, logger };
}

const parsed = (lines: string[]) => lines.map((line) => JSON.parse(line) as Record<string, any>);

// Like the database library's error for a failed query: its message repeats every value after "params:".
class DrizzleQueryError extends Error {
  constructor(
    query: string,
    public readonly params: unknown[],
  ) {
    super(`Failed query: ${query}\nparams: ${params.join(',')}`);
  }
}

describe('error messages in logs', () => {
  it('an error logged with no message gets its cleaned message, never the values', () => {
    const { lines, logger } = capture();
    logger.error(new DrizzleQueryError('select 1', ['SECRET-FIRST']));
    logger.error({ err: new DrizzleQueryError('select 2', ['SECRET-ERR']) });
    logger.warn({ err: { message: 'Failed query: select 3\nparams: SECRET-PLAIN', params: ['SECRET-PLAIN'] } });
    const text = lines.join('\n');
    for (const secret of ['SECRET-FIRST', 'SECRET-ERR', 'SECRET-PLAIN']) expect(text).not.toContain(secret);
    expect(parsed(lines).map((l) => l.msg)).toEqual([
      'Failed query: select 1',
      'Failed query: select 2',
      'Failed query: select 3',
    ]);
  });

  it('a message given with the error is kept exactly as before', () => {
    const { lines, logger } = capture();
    const err = new DrizzleQueryError('select 4', ['SECRET-WITH-MESSAGE']);
    logger.error({ err }, 'saving the invite failed');
    logger.error(err, 'saving %s failed', 'the invite');
    logger.info({ err, msg: 'already set' });
    expect(lines.join('\n')).not.toContain('SECRET-WITH-MESSAGE');
    expect(parsed(lines).map((l) => l.msg)).toEqual(['saving the invite failed', 'saving the invite failed', 'already set']);
  });

  it('the request logger (req.log) does the same', async () => {
    const { lines, logger } = capture();
    const app = createApp({
      logger,
      routes: (a) => {
        a.get('/api/test/no-message', (req, res) => {
          req.log.error(new DrizzleQueryError('select 5', ['SECRET-REQ-LOG']));
          res.json({ ok: true });
        });
      },
    });
    const res = await request(app).get('/api/test/no-message');
    expect(res.status).toBe(200);
    expect(lines.join('\n')).not.toContain('SECRET-REQ-LOG');
    const line = parsed(lines).find((l) => l.msg === 'Failed query: select 5');
    expect(line?.req?.id).toBe(res.headers['x-request-id']);
  });
});
