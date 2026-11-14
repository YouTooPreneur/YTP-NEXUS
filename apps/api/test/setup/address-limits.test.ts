// TASK-0023 · Reading ADDRESS_LIMITS: the per-address limits from the environment file (TECH-DESIGN 6.6). Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { addressLimits } from '../../src/shared/address-limit.js';

describe('addressLimits', () => {
  it('reads each name’s count and window, with spaces allowed around the parts', () => {
    expect(addressLimits('signin:20/minute,public:60/minute')).toEqual({
      signin: { max: 20, windowSeconds: 60 },
      public: { max: 60, windowSeconds: 60 },
    });
    expect(addressLimits(' public:5/second , signin:100/hour ')).toEqual({
      signin: { max: 100, windowSeconds: 3600 },
      public: { max: 5, windowSeconds: 1 },
    });
  });

  it('uses the example values when the setting is missing or blank', () => {
    const example = { signin: { max: 20, windowSeconds: 60 }, public: { max: 60, windowSeconds: 60 } };
    expect(addressLimits(undefined)).toEqual(example);
    expect(addressLimits('   ')).toEqual(example);
  });

  it('reads the setting at each call, never once at start', () => {
    const saved = process.env.ADDRESS_LIMITS;
    try {
      process.env.ADDRESS_LIMITS = 'signin:3/minute,public:9/minute';
      expect(addressLimits().signin.max).toBe(3);
      process.env.ADDRESS_LIMITS = 'signin:4/minute,public:9/minute';
      expect(addressLimits().signin.max).toBe(4);
    } finally {
      if (saved === undefined) delete process.env.ADDRESS_LIMITS;
      else process.env.ADDRESS_LIMITS = saved;
    }
  });

  it('refuses a part that is not <name>:<count>/<unit>, naming it', () => {
    for (const part of ['signin:0/minute', 'signin:-5/minute', 'signin:ten/minute', 'signin:20/week', 'signin:20/constructor', 'login:20/minute', 'signin 20/minute', 'signin:1000000/minute']) {
      expect(() => addressLimits(`${part},public:60/minute`)).toThrow(`ADDRESS_LIMITS has a part that is not <name>:<count>/<unit>: ${part}`);
    }
  });

  it('refuses a name given twice or left out', () => {
    expect(() => addressLimits('signin:20/minute,signin:30/minute,public:60/minute')).toThrow('ADDRESS_LIMITS gives signin twice');
    expect(() => addressLimits('signin:20/minute')).toThrow('ADDRESS_LIMITS has no limit for public');
  });
});
