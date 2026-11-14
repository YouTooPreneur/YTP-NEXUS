// The screens' own fetch for the generated API client (TASK-0085, TECH-DESIGN section 2 step 6 and 6.7). Orval's
// client calls it for every door. Every change carries a double-click key: the one the screen passes when it sends the
// same change again, otherwise a new one; a read never carries one. A request the screen marks as background (an
// automatic refresh) carries X-Nexus-Background: 1, so it does not keep a session alive. Every answer that is not a
// success becomes an Error with its status. The browser sets Origin and Sec-Fetch-Site itself; this fetch never does.
export type NexusRequestInit = RequestInit & { background?: boolean; idempotencyKey?: string };

export type ErrorType<Info> = Error & { info?: Info; status?: number };

const CHANGES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const NO_BODY = new Set([204, 205, 304]);

export const nexusFetch = async <T>(url: string, init: NexusRequestInit = {}): Promise<T> => {
  const { background, idempotencyKey, ...rest } = init;
  const method = (rest.method ?? 'GET').toUpperCase();
  const headers = new Headers(rest.headers);
  headers.delete('Idempotency-Key');
  headers.delete('X-Nexus-Background');
  if (CHANGES.has(method)) {
    headers.set('Idempotency-Key', idempotencyKey ?? crypto.randomUUID());
  }
  if (background === true) {
    headers.set('X-Nexus-Background', '1');
  }
  const res = await fetch(url, { ...rest, method, headers });
  const text = NO_BODY.has(res.status) ? '' : await res.text();
  let body: unknown;
  let json = false;
  if (text !== '' && (res.headers.get('content-type') ?? '').includes('json')) {
    try {
      body = JSON.parse(text);
      json = true;
    } catch {
      body = undefined;
    }
  }
  // An answer that is not a success, or a success that is not JSON (a page instead of the API), is refused with its
  // status; the message never holds the answer's text.
  if (!res.ok || (text !== '' && !json)) {
    throw Object.assign(new Error(`The API answered ${res.status}`), {
      status: res.status,
      info: body,
    });
  }
  return { data: body, status: res.status, headers: res.headers } as T;
};
