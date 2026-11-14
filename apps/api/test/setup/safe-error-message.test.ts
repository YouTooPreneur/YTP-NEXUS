// TASK-0019 · safeErrorMessage: the one cleaned message for every column kept outside the log (TECH-DESIGN section 7). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { safeErrorMessage } from '../../src/shared/logging.js';

describe('safeErrorMessage', () => {
  it('gives an error’s own message and nothing else from it', () => {
    expect(safeErrorMessage(new Error('the door crashed'))).toBe('the door crashed');
    const address = Object.assign(new TypeError('Invalid URL'), { input: 'postgres://nexus:SECRET-PW@localhost/nexus', code: 'ERR_INVALID_URL' });
    expect(safeErrorMessage(address)).toBe('Invalid URL');
  });

  it('cuts a failed query’s values, as the log does', () => {
    const failed = Object.assign(new Error('Failed query: select $1::int as n\nparams: SECRET-P'), { params: ['SECRET-P'] });
    expect(safeErrorMessage(failed)).toBe('Failed query: select $1::int as n');
    expect(safeErrorMessage({ message: 'x\nparams: SECRET-P', params: ['SECRET-P'] })).toBe('x');
  });

  it('gives an error with no message its type', () => {
    expect(safeErrorMessage(new TypeError(''))).toBe('TypeError');
  });

  it('reads the raw error inside a wrapper, as the log does', () => {
    expect(safeErrorMessage({ message: 'wrapper', raw: new RangeError('the raw one') })).toBe('the raw one');
  });

  it('gives only what kind of value anything thrown that is not an error is', () => {
    expect(safeErrorMessage('SECRET-STRING')).toBe('string');
    expect(safeErrorMessage(42)).toBe('number');
    expect(safeErrorMessage(undefined)).toBe('undefined');
    expect(safeErrorMessage(null)).toBe('object');
    expect(safeErrorMessage({ code: 'SECRET-CODE' })).toBe('object');
  });
});
