// TASK-0003 · Frontend app. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

describe('App', () => {
  it('shows the product name as the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: 'YTP Nexus' });
    expect(heading).toBeTruthy();
  });
});
