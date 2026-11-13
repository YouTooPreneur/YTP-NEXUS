// TASK-0084 · The same-site check: a request that changes data must come from Nexus's own address; reading and non-browser requests pass; it runs before the body is read, for every path. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Writable } from 'node:stream';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging.js';
import { ownOrigin } from '../../src/shared/same-site.js';

const PATH = '/api/test/same-site';
const OWN = 'http://localhost:5310';
const quiet = () => createLogger(new Writable({ write: (_c, _e, done) => done() }));
const before = process.env.APP_URL;

let handled = 0;
function testApp(): Express {
  handled = 0;
  return createApp({
    logger: quiet(),
    routes: (app) => {
      app.all(PATH, (req, res) => {
        handled += 1;
        res.json({ ok: true, body: req.body ?? null });
      });
    },
  });
}

const CHANGING = ['post', 'put', 'patch', 'delete'] as const;
const send = (app: Express, method: (typeof CHANGING)[number], headers: Record<string, string>, path = PATH) => {
  let call = request(app)[method](path);
  for (const [name, value] of Object.entries(headers)) {
    call = call.set(name, value);
  }
  return call;
};
const refused = (res: request.Response) => {
  expect(res.status).toBe(403);
  expect(res.body).toEqual({
    error: { code: 'not_same_site', message: 'This request did not come from Nexus', requestId: res.headers['x-request-id'] },
  });
};

afterEach(() => {
  if (before === undefined) {
    delete process.env.APP_URL;
  } else {
    process.env.APP_URL = before;
  }
});

describe('the same-site check (TECH-DESIGN section 2, step 1)', () => {
  it('lets every GET, HEAD and OPTIONS through, even from another site', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    const cross = { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://other.example' };
    expect((await request(app).get(PATH).set(cross)).status).toBe(200);
    expect((await request(app).head(PATH).set(cross)).status).toBe(200);
    expect((await request(app).options(PATH).set(cross)).status).toBe(200);
    expect(handled).toBe(3);
  });

  it('lets a request that changes data through when the browser says it comes from Nexus itself, or from no other page', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    for (const method of CHANGING) {
      expect((await send(app, method, { 'Sec-Fetch-Site': 'same-origin' })).status).toBe(200);
      expect((await send(app, method, { 'Sec-Fetch-Site': 'none' })).status).toBe(200);
    }
    expect(handled).toBe(8);
  });

  it('refuses a POST, PUT, PATCH or DELETE from another site or a sister site with 403, before its handler runs', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    for (const method of CHANGING) {
      refused(await send(app, method, { 'Sec-Fetch-Site': 'cross-site' }));
      refused(await send(app, method, { 'Sec-Fetch-Site': 'same-site' }));
      refused(await send(app, method, { 'Sec-Fetch-Site': 'something-else' }));
      refused(await send(app, method, { 'Sec-Fetch-Site': '' }));
    }
    expect(handled).toBe(0);
  });

  it('decides by Sec-Fetch-Site alone when the browser sends both headers', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    expect((await send(app, 'post', { 'Sec-Fetch-Site': 'same-origin', Origin: 'https://other.example' })).status).toBe(200);
    refused(await send(app, 'post', { 'Sec-Fetch-Site': 'cross-site', Origin: OWN }));
  });

  it('without Sec-Fetch-Site, accepts only Nexus’s own address in Origin, taken from APP_URL', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    for (const method of CHANGING) {
      expect((await send(app, method, { Origin: OWN })).status).toBe(200);
    }
    for (const origin of ['http://localhost:3000', 'https://localhost:5310', 'http://127.0.0.1:5310', 'https://other.example', 'null', 'http://localhost:5310.other.example']) {
      refused(await send(app, 'post', { Origin: origin }));
    }
    process.env.APP_URL = 'https://nexus.youtoopreneur.com/';
    expect((await send(app, 'post', { Origin: 'https://nexus.youtoopreneur.com' })).status).toBe(200);
    refused(await send(app, 'post', { Origin: 'http://nexus.youtoopreneur.com' }));
    refused(await send(app, 'post', { Origin: 'https://other.youtoopreneur.com' }));
  });

  it('refuses every Origin when APP_URL is missing or not an address, and still lets Sec-Fetch-Site same-origin through', async () => {
    delete process.env.APP_URL;
    const app = testApp();
    refused(await send(app, 'post', { Origin: OWN }));
    expect((await send(app, 'post', { 'Sec-Fetch-Site': 'same-origin' })).status).toBe(200);
    process.env.APP_URL = 'not an address';
    refused(await send(app, 'post', { Origin: OWN }));
    process.env.APP_URL = '';
    refused(await send(app, 'post', { Origin: OWN }));
  });

  it('lets a request with neither header through: no browser sent it, so it carries no one’s sign-in by mistake', async () => {
    delete process.env.APP_URL;
    const app = testApp();
    for (const method of CHANGING) {
      expect((await send(app, method, {})).status).toBe(200);
    }
  });

  it('reads APP_URL when each request comes, not when the app is made', async () => {
    process.env.APP_URL = 'https://other.example';
    const app = testApp();
    refused(await send(app, 'post', { Origin: OWN }));
    process.env.APP_URL = OWN;
    expect((await send(app, 'post', { Origin: OWN })).status).toBe(200);
  });

  it('runs after the request ID and before the body is read, for every path, a missing one included', async () => {
    process.env.APP_URL = OWN;
    const app = testApp();
    const broken = await request(app)
      .post(PATH)
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Content-Type', 'application/json')
      .send('{"not": json');
    refused(broken);
    expect(broken.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    refused(await send(app, 'post', { 'Sec-Fetch-Site': 'cross-site' }, '/api/no-such-door'));
    expect((await send(app, 'post', {}, '/api/no-such-door')).status).toBe(404);
    const ok = await request(app).post(PATH).set('Sec-Fetch-Site', 'same-origin').send({ name: 'Kaveri Hospitals' });
    expect(ok.status).toBe(200);
    expect(ok.body.body).toEqual({ name: 'Kaveri Hospitals' });
  });
});

describe('ownOrigin', () => {
  it('gives the address as a browser writes it in Origin, or nothing', () => {
    expect(ownOrigin('http://localhost:5310')).toBe('http://localhost:5310');
    expect(ownOrigin('http://localhost:5310/')).toBe('http://localhost:5310');
    expect(ownOrigin('https://nexus.youtoopreneur.com:443/app?x=1')).toBe('https://nexus.youtoopreneur.com');
    expect(ownOrigin('HTTPS://Nexus.YouTooPreneur.com')).toBe('https://nexus.youtoopreneur.com');
    expect(ownOrigin(undefined)).toBeUndefined();
    expect(ownOrigin('')).toBeUndefined();
    expect(ownOrigin('not an address')).toBeUndefined();
    expect(ownOrigin('file:///C:/nexus')).toBeUndefined();
  });
});
