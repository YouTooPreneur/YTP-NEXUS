// TASK-0004 · The first screen part. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../src/index';

describe('Button', () => {
  it('is a primary, non-submitting button by default', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('data-variant')).toBe('primary');
    expect(button.className).toContain('bg-[var(--primary-bg)]');
    expect(button.className).toContain('text-[var(--primary-ink)]');
    expect(button.className).toContain('min-h-11');
  });

  it('shows the secondary and ghost looks', () => {
    render(
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">More</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Cancel' }).getAttribute('data-variant')).toBe('secondary');
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('border-[var(--line)]');
    expect(screen.getByRole('button', { name: 'More' }).className).toContain('bg-transparent');
  });

  it('passes clicks, the disabled state and extra class names through', () => {
    let clicks = 0;
    render(
      <Button className="w-full" onClick={() => (clicks += 1)} aria-label="Add lead">
        +
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add lead' });
    fireEvent.click(button);
    expect(clicks).toBe(1);
    expect(button.className.endsWith('w-full')).toBe(true);
  });

  it('can be a submit button and can be disabled', () => {
    render(
      <Button type="submit" disabled>
        Send
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button.getAttribute('type')).toBe('submit');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
