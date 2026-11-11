// TASK-0013 · The API status line tells the truth: "connected" only when the backend answers, "not reachable" when it fails. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiStatus } from '../../src/ApiStatus';
import { getHealth } from '../../src/api/nexus';

function showWithAnswer(answer: () => Response) {
  vi.stubGlobal('fetch', vi.fn(async () => answer()));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ApiStatus />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiStatus', () => {
  it('says "API: connected" when the backend answers ok', async () => {
    showWithAnswer(() => Response.json({ ok: true, service: 'api' }));
    expect(await screen.findByText('API: connected')).toBeTruthy();
  });

  it('says "API: not reachable" when the backend is down (502 with no body)', async () => {
    showWithAnswer(() => new Response(null, { status: 502 }));
    expect(await screen.findByText('API: not reachable')).toBeTruthy();
  });

  it('says "API: not reachable" when the backend answers with an error', async () => {
    showWithAnswer(() =>
      Response.json({ error: { code: 'server_error', message: 'Something went wrong. Please try again.' } }, { status: 500 }),
    );
    expect(await screen.findByText('API: not reachable')).toBeTruthy();
  });
});

// Added in the review of TASK-0013 (CR-014): the generated client itself treats any answer that is not a success as an error
// carrying its status (forceSuccessResponse), so this holds whatever ApiStatus checks, and later guards TASK-0085's custom fetch.
describe('the generated client', () => {
  it('rejects an answer that is not a success, carrying its status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 502 })));
    await expect(getHealth()).rejects.toHaveProperty('status', 502);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: { code: 'server_error', message: 'Something went wrong. Please try again.' } }, { status: 500 }),
      ),
    );
    await expect(getHealth()).rejects.toHaveProperty('status', 500);
  });

  it('returns data, status and headers on a success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, service: 'api' })));
    await expect(getHealth()).resolves.toMatchObject({ status: 200, data: { ok: true, service: 'api' } });
  });
});
