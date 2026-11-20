// TASK-0049 · The screens' fake API for screen tests (MSW, TEST-PLAN section 2). The test page's own address is http://localhost:5310/ (apps/web/vite.config.ts), so the screens' relative /api addresses reach these handlers, and every request the page sends is recorded. A request no handler answers never leaves the test: MSW answers it 500 itself, nothing is printed, and the test that sent it fails. Written by the planner; builders never edit this file.
import { afterAll, afterEach, beforeAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export interface SentRequest {
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
}

// Every request the page sent in this test, in order.
export const sent: SentRequest[] = [];

// A request that reached no handler: answered 500 by MSW, never reaching the network, and it fails the test that sent it
// (afterEach below).
const unanswered: string[] = [];

export const server = setupServer();

async function record(request: Request): Promise<unknown> {
  const url = new URL(request.url);
  const text = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.clone().text();
  let body: unknown = text === '' ? undefined : text;
  try {
    body = text === '' ? undefined : JSON.parse(text);
  } catch {
    // not JSON: kept as text
  }
  sent.push({
    method: request.method,
    url: request.url,
    path: url.pathname,
    headers: Object.fromEntries(request.headers.entries()),
    body,
  });
  return body;
}

type Method = 'get' | 'post';
type Reply = (body: unknown) => Response | Promise<Response>;

// Answers one door for the rest of the test: every request to it is recorded, then answered by `reply`.
export function answer(method: Method, path: string, reply: Reply): void {
  server.use(
    http[method](path, async ({ request }) => {
      const body = await record(request);
      return reply(body);
    }),
  );
}

// The requests of this test to one door.
export function sentTo(method: string, path: string): SentRequest[] {
  return sent.filter((request) => request.method === method.toUpperCase() && request.path === path);
}

// A signed-in person's get-session answer as Better Auth 1.7.14 gave it before TASK-0098, token included, so a test can
// prove the screens never keep, log or show it.
export const TOKEN = 'SECRET-TOKEN-0049-a1b2c3';
export const signedInAnswer = {
  session: {
    id: '0190a1b2-0000-7000-8000-000000000001',
    token: TOKEN,
    userId: '0190a1b2-0000-7000-8000-000000000002',
    expiresAt: '2026-11-27T10:00:00.000Z',
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  },
  user: {
    id: '0190a1b2-0000-7000-8000-000000000002',
    name: 'Asha Kumar',
    email: 'asha.kumar@example.com',
    emailVerified: false,
    image: null,
    companyId: '0190a1b2-0000-7000-8000-000000000003',
    status: 'active',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
};

// get-session's answer for this test: nobody signed in (null), the signed-in person, or any other answer.
export function sessionIs(reply: 'signed out' | 'signed in' | Reply): void {
  answer('get', '/api/auth/get-session', () => {
    if (reply === 'signed out') return HttpResponse.json(null);
    if (reply === 'signed in') return HttpResponse.json(signedInAnswer);
    return reply(undefined);
  });
}

// The API's health door answers as the real one does, so a signed-in page's status line works.
export function healthIsUp(): void {
  answer('get', '/api/health', () => HttpResponse.json({ ok: true, service: 'api' }));
}

// Nexus's own error shape (TECH-DESIGN 6.7) and Better Auth's own { code, message }.
export const nexusError = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, requestId: 'req-0049' } }, { status });
export const betterAuthError = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message }, { status });

// Starts and stops the fake API around every test of the file that imports this module.
beforeAll(() => {
  server.listen({
    // A request no handler answers is recorded (its method and address only, never its body), and this throws: MSW then
    // answers it 500 itself, so it never reaches the network, and nothing is printed. (MSW's defaults.error() only prints
    // the request, its body and so a typed password included, and then lets it through to the network.)
    onUnhandledFrame: ({ frame }) => {
      const request = (frame.data as { request?: Request } | undefined)?.request;
      unanswered.push(request ? `${request.method} ${request.url}` : 'a request with no handler');
      throw new Error('a request with no handler: answered 500 here, never sent on');
    },
  });
});

afterEach(async () => {
  // One macrotask first: a request still on its way as the test ends reaches this test's handlers, so it is never
  // counted against the next test.
  await new Promise((resolve) => setTimeout(resolve, 0));
  server.resetHandlers();
  sent.length = 0;
  const left = unanswered.splice(0);
  if (left.length > 0) throw new Error(`requests with no handler: ${left.join(', ')}`);
});

afterAll(() => {
  server.close();
});
