// TASK-0049 · Who is signed in, until TASK-0046 and TASK-0052: one get-session per page load (StrictMode included, never again on focus, reconnect or another tab's message), the redirects both ways, / only for someone signed in and with no personal data, every 401 from a Nexus door sending the person to the sign-in page, the one query client, and the session token never kept, logged or shown; one page drawn at a time. Written by the planner; builders never edit this file.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import {
  TOKEN,
  answer,
  healthIsUp,
  nexusError,
  sentTo,
  sessionIs,
  signedInAnswer,
} from '../msw/fake-api';
import { openPage } from '../msw/open-page';

const signInHeading = () => screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
const homeHeading = () => screen.findByRole('heading', { level: 1, name: 'YTP Nexus' });
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 60)));

let logged: string[] = [];
beforeEach(() => {
  logged = [];
  for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logged.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('one get-session per page load', () => {
  it('asks once, at the page’s own address, even in StrictMode and after focus, reconnect and another tab’s message', async () => {
    sessionIs('signed in');
    healthIsUp();
    await openPage('/');
    await homeHeading();
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'better-auth.message',
        newValue: JSON.stringify({ event: 'session', data: { trigger: 'signout' }, clientId: 'another-tab', timestamp: 1 }),
      }),
    );
    await settle();
    const calls = sentTo('get', '/api/auth/get-session');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('http://localhost:5310/api/auth/get-session');
    expect(calls[0]!.headers['idempotency-key']).toBeUndefined();
  });

  it('asks once on the sign-in page too, and a new page load asks again', async () => {
    sessionIs('signed out');
    const first = await openPage('/sign-in');
    await signInHeading();
    await settle();
    expect(sentTo('get', '/api/auth/get-session')).toHaveLength(1);
    // The first page closes before the next one loads: one page drawn at a time.
    first.unmount();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    await openPage('/sign-in');
    await signInHeading();
    await settle();
    expect(sentTo('get', '/api/auth/get-session')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('nobody signed in', () => {
  it('replaces / with /sign-in (no new history entry) and never shows the placeholder', async () => {
    sessionIs('signed out');
    const before = window.history.length;
    await openPage('/');
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
    expect(window.history.length).toBe(before);
    expect(screen.queryByRole('heading', { name: 'YTP Nexus' })).toBeNull();
    await settle();
    expect(sentTo('get', '/api/health')).toHaveLength(0);
    // Still one get-session: going from / to /sign-in is not a new page load.
    expect(sentTo('get', '/api/auth/get-session')).toHaveLength(1);
  });

  it('sends any other address to the sign-in page', async () => {
    sessionIs('signed out');
    await openPage('/somewhere/else?x=1');
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
  });

  // One page per test: each check proves what it says.
  it('counts a get-session that fails with an error answer as nobody signed in', async () => {
    sessionIs(() => nexusError(500, 'server_error', 'Something went wrong. Please try again.'));
    await openPage('/');
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('counts a get-session with no answer at all as nobody signed in', async () => {
    sessionIs(() => HttpResponse.error());
    await openPage('/');
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('someone signed in', () => {
  it('shows / only once get-session has answered', async () => {
    let release = () => {};
    const answered = new Promise<void>((resolve) => {
      release = resolve;
    });
    sessionIs(async () => {
      await answered;
      return HttpResponse.json(signedInAnswer);
    });
    healthIsUp();
    await openPage('/');
    await waitFor(() => expect(sentTo('get', '/api/auth/get-session')).toHaveLength(1));
    await settle();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(window.location.pathname).toBe('/');
    release();
    await homeHeading();
    expect(await screen.findByText('API: connected')).toBeTruthy();
  });

  it('replaces /sign-in with /, and neither the page, the console, the storage nor the address holds the token or the person', async () => {
    sessionIs('signed in');
    healthIsUp();
    const before = window.history.length;
    await openPage('/sign-in');
    await homeHeading();
    expect(window.location.pathname).toBe('/');
    expect(window.history.length).toBe(before);
    expect(await screen.findByText('API: connected')).toBeTruthy();
    await settle();
    const kept = [
      document.documentElement.outerHTML,
      logged.join('\n'),
      JSON.stringify({ ...localStorage }),
      JSON.stringify({ ...sessionStorage }),
      document.cookie,
      window.location.href,
      JSON.stringify(window.history.state),
    ].join('\n');
    for (const secret of [TOKEN, signedInAnswer.session.id, signedInAnswer.user.name, signedInAnswer.user.email]) {
      expect(kept).not.toContain(secret);
    }
  });

  it('sends an address that is not a page to /', async () => {
    sessionIs('signed in');
    healthIsUp();
    await openPage('/no-such-page');
    await homeHeading();
    expect(window.location.pathname).toBe('/');
  });
});

describe('a 401 from a Nexus door', () => {
  it('sends the person to the sign-in page when a query is refused, asking only once', async () => {
    sessionIs('signed in');
    answer('get', '/api/health', () => nexusError(401, 'session_ended', 'Please sign in again.'));
    await openPage('/');
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
    await settle();
    expect(sentTo('get', '/api/health')).toHaveLength(1);
  });

  it('sends the person to the sign-in page when a change is refused', async () => {
    sessionIs('signed in');
    healthIsUp();
    await openPage('/');
    await homeHeading();
    const { queryClient } = await import('../../src/requests/query-client');
    await act(async () => {
      const refused = Object.assign(new Error('The API answered 401'), { status: 401 });
      const change = queryClient.getMutationCache().build(queryClient, {
        mutationFn: async () => {
          throw refused;
        },
      });
      await change.execute(undefined).catch(() => undefined);
    });
    await signInHeading();
    expect(window.location.pathname).toBe('/sign-in');
  });

  it('leaves any other refusal on its page, without retrying', async () => {
    sessionIs('signed in');
    answer('get', '/api/health', () => nexusError(500, 'server_error', 'Something went wrong. Please try again.'));
    await openPage('/');
    expect(await screen.findByText('API: not reachable')).toBeTruthy();
    await settle();
    expect(window.location.pathname).toBe('/');
    expect(sentTo('get', '/api/health')).toHaveLength(1);
  });
});

describe('the one query client', () => {
  it('lives in src/requests/query-client.ts, is the one the screens use, and has no retries or refetches of its own', async () => {
    sessionIs('signed in');
    healthIsUp();
    await openPage('/');
    await homeHeading();
    const { queryClient } = await import('../../src/requests/query-client');
    expect(queryClient.getDefaultOptions()).toMatchObject({
      queries: { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
      mutations: { retry: false },
    });
    await waitFor(() => expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0));
  });
});
