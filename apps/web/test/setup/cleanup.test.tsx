// TASK-0004 · Every screen test starts from an empty page (the test set-up clears the last test's page). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('the screen test set-up', () => {
  it('draws a page in the first test', () => {
    render(<p>Drawn once</p>);
    expect(screen.getAllByText('Drawn once')).toHaveLength(1);
  });

  it('starts the next test from an empty page', () => {
    expect(screen.queryAllByText('Drawn once')).toHaveLength(0);
    render(<p>Drawn once</p>);
    expect(screen.getAllByText('Drawn once')).toHaveLength(1);
  });
});
