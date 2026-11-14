import type { RequestHandler } from 'express';
import { AppError } from './errors.js';
import { hitLimit } from '../modules/core/repository/rate-counters.js';

// The per-address limit (TASK-0023, TECH-DESIGN section 2 step 2, NFR-020): on the sign-in doors, the two-step doors
// and, later, the public pages, every request from one address is counted, refused ones included, before anyone is
// known; past the limit the door answers 429 until the window ends. The values come from the environment file's
// ADDRESS_LIMITS, read at each request, as "<name>:<count>/<unit>" parts separated by commas, one for each name.
const NAMES = ['signin', 'public'] as const;
export type AddressLimitName = (typeof NAMES)[number];
const UNITS = new Map([
  ['second', 1],
  ['minute', 60],
  ['hour', 3600],
]);
const DEFAULT_LIMITS = 'signin:20/minute,public:60/minute';
const PART = /^([a-z]+):([1-9][0-9]{0,5})\/([a-z]+)$/;

export function addressLimits(
  value: string | undefined = process.env.ADDRESS_LIMITS,
): Record<AddressLimitName, { max: number; windowSeconds: number }> {
  const limits: Partial<Record<AddressLimitName, { max: number; windowSeconds: number }>> = {};
  for (const raw of (value?.trim() || DEFAULT_LIMITS).split(',')) {
    const part = raw.trim();
    const match = PART.exec(part);
    const name = match?.[1] as AddressLimitName | undefined;
    const windowSeconds = match ? UNITS.get(match[3]!) : undefined;
    if (!match || !name || !NAMES.includes(name) || windowSeconds === undefined) {
      throw new Error(`ADDRESS_LIMITS has a part that is not <name>:<count>/<unit>: ${part}`);
    }
    if (limits[name]) {
      throw new Error(`ADDRESS_LIMITS gives ${name} twice`);
    }
    limits[name] = { max: Number(match[2]), windowSeconds };
  }
  for (const name of NAMES) {
    if (!limits[name]) {
      throw new Error(`ADDRESS_LIMITS has no limit for ${name}`);
    }
  }
  return limits as Record<AddressLimitName, { max: number; windowSeconds: number }>;
}

// The address that is counted: the one the proxy saw (Express trusts exactly one proxy), without an IPv4 address's
// IPv6 prefix.
function addressOf(ip: string | undefined): string {
  return (ip ?? '').replace(/^::ffff:/, '').slice(0, 64) || 'unknown';
}

export function addressLimit(name: AddressLimitName): RequestHandler {
  return async (req, res, next) => {
    const { max, windowSeconds } = addressLimits()[name];
    const counted = await hitLimit({ name, key: `ip:${addressOf(req.ip)}`, max, windowSeconds });
    if (counted.refused) {
      res.setHeader('Retry-After', String(counted.retryAfterSeconds));
      throw new AppError(
        429,
        'too_many_requests',
        `Too many tries. Please try again in ${counted.retryAfterSeconds} seconds.`,
      );
    }
    next();
  };
}
