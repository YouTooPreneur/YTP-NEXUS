// TASK-0085 · The screens' own fetch for the generated API client: the double-click key on every change and never on a read, the background mark, and every answer that is not a success turned into an Error with its status. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nexusFetch, type ErrorType } from '../../src/requests/nexus-fetch';
import { getGetHealthQueryOptions, getHealth } from '../../src/api/nexus';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type Call = [string, RequestInit];

// A stand-in for the browser's fetch that answers with the given Response and remembers what it was asked.
function answerWith(answer: () => Response) {
  const stub = vi.fn(async (_url: string, _init: RequestInit) => answer());
  vi.stubGlobal('fetch', stub);
  return stub;
}
const headersOf = (stub: ReturnType<typeof answerWith>, call = 0) => new Headers((stub.mock.calls[call] as Call)[1].headers);
const refusal = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(Error);
  return error as ErrorType<unknown>;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nexusFetch: the headers it sends', () => {
  it('sends a read with no double-click key and no background mark, to the address as given', async () => {
    const stub = answerWith(() => Response.json({ ok: true }));
    await nexusFetch('/api/health');
    await nexusFetch('/api/health', { method: 'head' as string, idempotencyKey: '0190f2a6-6c1e-7b3a-9d2f-1a2b3c4d5e6f' });
    for (const call of [0, 1]) {
      expect((stub.mock.calls[call] as Call)[0]).toBe('/api/health');
      expect(headersOf(stub, call).has('Idempotency-Key')).toBe(false);
      expect(headersOf(stub, call).has('X-Nexus-Background')).toBe(false);
    }
    expect((stub.mock.calls[0] as Call)[1].method).toBe('GET');
    expect((stub.mock.calls[1] as Call)[1].method).toBe('HEAD');
  });

  it('gives every change a new double-click key, unless the screen passes the key of a change it sends again', async () => {
    const stub = answerWith(() => Response.json({ ok: true }));
    for (const method of ['POST', 'put', 'PATCH', 'delete']) await nexusFetch('/api/x', { method });
    const keys = [0, 1, 2, 3].map((call) => headersOf(stub, call).get('Idempotency-Key'));
    expect(keys.every((key) => UUID.test(key ?? ''))).toBe(true);
    expect(new Set(keys).size).toBe(4);
    expect([0, 1, 2, 3].map((call) => (stub.mock.calls[call] as Call)[1].method)).toEqual(['POST', 'PUT', 'PATCH', 'DELETE']);
    const again = '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f';
    await nexusFetch('/api/x', { method: 'POST', idempotencyKey: again });
    await nexusFetch('/api/x', { method: 'POST', idempotencyKey: again });
    expect([4, 5].map((call) => headersOf(stub, call).get('Idempotency-Key'))).toEqual([again, again]);
  });

  it('never sends a key or background mark the caller put in the headers itself', async () => {
    const stub = answerWith(() => Response.json({ ok: true }));
    await nexusFetch('/api/x', { headers: { 'Idempotency-Key': 'mine', 'X-Nexus-Background': '1' } });
    await nexusFetch('/api/x', { method: 'POST', headers: { 'Idempotency-Key': 'mine' } });
    expect(headersOf(stub, 0).has('Idempotency-Key')).toBe(false);
    expect(headersOf(stub, 0).has('X-Nexus-Background')).toBe(false);
    expect(UUID.test(headersOf(stub, 1).get('Idempotency-Key') ?? '')).toBe(true);
  });

  it('marks a request as background only when the screen says so', async () => {
    const stub = answerWith(() => Response.json({ ok: true }));
    await nexusFetch('/api/x', { background: true });
    await nexusFetch('/api/x', { background: false });
    await nexusFetch('/api/x', { method: 'POST', background: true });
    expect(headersOf(stub, 0).get('X-Nexus-Background')).toBe('1');
    expect(headersOf(stub, 1).has('X-Nexus-Background')).toBe(false);
    expect(headersOf(stub, 2).get('X-Nexus-Background')).toBe('1');
  });

  it('passes the rest through: the body, the content type, the signal; its own options never reach fetch', async () => {
    const stub = answerWith(() => Response.json({ ok: true }));
    const signal = new AbortController().signal;
    await nexusFetch('/api/x', {
      method: 'POST',
      body: '{"name":"Kaveri Hospitals"}',
      headers: { 'Content-Type': 'application/json' },
      signal,
      background: true,
      idempotencyKey: '0190f2a6-6c1e-7b3a-9d2f-0a0b0c0d0e0f',
    });
    const init = (stub.mock.calls[0] as Call)[1] as Record<string, unknown>;
    expect(init.body).toBe('{"name":"Kaveri Hospitals"}');
    expect(init.signal).toBe(signal);
    expect(headersOf(stub).get('Content-Type')).toBe('application/json');
    expect('background' in init || 'idempotencyKey' in init).toBe(false);
    expect(headersOf(stub).has('Origin') || headersOf(stub).has('Sec-Fetch-Site')).toBe(false);
  });
});

describe('nexusFetch: the answers', () => {
  it('gives back the data, the status and the headers of a success', async () => {
    answerWith(() => Response.json({ ok: true, service: 'api' }, { status: 201, headers: { 'X-Request-Id': 'r-1' } }));
    const answer = await nexusFetch<{ data: unknown; status: number; headers: Headers }>('/api/x');
    expect(answer.data).toEqual({ ok: true, service: 'api' });
    expect(answer.status).toBe(201);
    expect(answer.headers.get('X-Request-Id')).toBe('r-1');
  });

  it('gives back no data for an answer with no content', async () => {
    answerWith(() => new Response(null, { status: 204 }));
    expect(await nexusFetch('/api/x', { method: 'DELETE' })).toEqual(expect.objectContaining({ data: undefined, status: 204 }));
  });

  it('turns an error answer into an Error with its status and its JSON, never the answer text in the message', async () => {
    const body = { error: { code: 'stale_version', message: 'This was just changed, please review', requestId: 'r-2' } };
    answerWith(() => Response.json(body, { status: 409 }));
    const error = await refusal(nexusFetch('/api/x', { method: 'PATCH' }));
    expect(error.status).toBe(409);
    expect(error.info).toEqual(body);
    expect(error.message).toBe('The API answered 409');
  });

  it('turns a 502 with no body, or with a page of HTML, into an Error with that status', async () => {
    answerWith(() => new Response(null, { status: 502 }));
    expect((await refusal(nexusFetch('/api/health'))).status).toBe(502);
    answerWith(() => new Response('<html><body>Bad gateway: secret-ish</body></html>', { status: 502, headers: { 'Content-Type': 'text/html' } }));
    const error = await refusal(nexusFetch('/api/health'));
    expect(error.status).toBe(502);
    expect(error.info).toBeUndefined();
    expect(error.message).not.toContain('secret-ish');
  });

  it('refuses a success that is not JSON (a page instead of the API) or JSON that cannot be read', async () => {
    answerWith(() => new Response('<!doctype html><title>YTP Nexus</title>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
    expect((await refusal(nexusFetch('/api/health'))).status).toBe(200);
    answerWith(() => new Response('{"ok": tru', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    expect((await refusal(nexusFetch('/api/health'))).status).toBe(200);
  });

  it('uses the browser’s fetch as it is when the request is made', async () => {
    const first = answerWith(() => Response.json({ n: 1 }));
    await nexusFetch('/api/x');
    const second = answerWith(() => Response.json({ n: 2 }));
    expect(await nexusFetch('/api/x')).toEqual(expect.objectContaining({ data: { n: 2 } }));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('the generated client uses it', () => {
  it('sends getHealth through nexusFetch, with the background mark when asked', async () => {
    const stub = answerWith(() => Response.json({ ok: true, service: 'api' }));
    const answer = await getHealth({ background: true });
    expect((stub.mock.calls[0] as Call)[0]).toBe('/api/health');
    expect(headersOf(stub).get('X-Nexus-Background')).toBe('1');
    expect(answer).toEqual(expect.objectContaining({ status: 200, data: { ok: true, service: 'api' } }));
  });

  it('switches off the query library’s own retries and refetches, which could not be marked as background', () => {
    const options = getGetHealthQueryOptions();
    expect(options).toMatchObject({ retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
    expect(getGetHealthQueryOptions({ query: { refetchOnWindowFocus: true } }).refetchOnWindowFocus).toBe(true);
  });
});
