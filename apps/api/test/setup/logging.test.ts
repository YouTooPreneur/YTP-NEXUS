// TASK-0010 · Logs never hold secrets (TECH-DESIGN section 7). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../../src/app.js';
import { createLogger, REDACT_PATHS } from '../../src/shared/logging.js';

function capture() {
  const lines: string[] = [];
  const logger = createLogger(new Writable({ write: (chunk, _e, done) => (lines.push(String(chunk)), done()) }));
  return { lines, logger };
}

describe('logging', () => {
  it('removes cookies and authorisation headers from request logs', async () => {
    const { lines, logger } = capture();
    await request(createApp({ logger }))
      .get('/api/health')
      .set('Cookie', 'nexus.session=SECRET-SESSION-TOKEN')
      .set('Authorization', 'Bearer SECRET-BEARER');
    const text = lines.join('\n');
    expect(text).not.toContain('SECRET-SESSION-TOKEN');
    expect(text).not.toContain('SECRET-BEARER');
    expect(text).toContain('[removed]');
  });

  it('removes password, code, token and secret fields from anything logged', () => {
    const { lines, logger } = capture();
    logger.info({ body: { password: 'P1', code: '123456', token: 'T1', secret: 'S1', name: 'Asha' } }, 'sign-in');
    const text = lines.join('\n');
    for (const secret of ['"P1"', '"123456"', '"T1"', '"S1"']) expect(text).not.toContain(secret);
    expect(text).toContain('Asha');
  });

  it('keeps the agreed list of removed paths', () => {
    for (const path of ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', '*.password', '*.code', '*.token', '*.secret']) {
      expect(REDACT_PATHS).toContain(path);
    }
  });
});
