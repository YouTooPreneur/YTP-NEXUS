// TASK-0049 · Frontend app (TASK-0003's first screen, rewritten for the sign-in page): the app, drawn with no wrapper, holds its own query client and pages, and shows a visitor nobody has signed in the sign-in page. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { sessionIs } from '../msw/fake-api';
import { App } from '../../src/App';

describe('App', () => {
  it('shows the sign-in page to a visitor nobody has signed in', async () => {
    sessionIs('signed out');
    render(<App />);
    const heading = await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    expect(heading).toBeTruthy();
    expect(window.location.pathname).toBe('/sign-in');
  });
});
