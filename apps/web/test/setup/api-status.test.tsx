// TASK-0013 · The API status line tells the truth: "connected" only when the backend answers, "not reachable" when it fails. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiStatus } from '../../src/ApiStatus';

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
