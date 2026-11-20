// TASK-0049 · Opens a page in a screen test as a browser loads it: at the given address, with every screen module loaded afresh (a new page load: the one get-session call starts again) and drawn in StrictMode as main.tsx draws it. Written by the planner; builders never edit this file.
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

export async function openPage(path: string): Promise<ReturnType<typeof render>> {
  window.history.replaceState(null, '', path);
  vi.resetModules();
  const { App } = await import('../../src/App');
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
