import type { RequestHandler } from 'express';
import { AppError } from './errors.js';

// The same-site check (TASK-0084, TECH-DESIGN section 2 step 1 and section 7): a request that changes data
// (POST, PUT, PATCH or DELETE) must come from Nexus's own address, for every door. The browser says where a
// request comes from in Sec-Fetch-Site; a browser that does not send it sends Origin, compared with APP_URL.
// A request with neither comes from no browser (a script or a test), so it cannot carry someone's sign-in
// cookie to Nexus without them knowing.
const CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Nexus's own address as a browser writes it in Origin, or undefined when APP_URL is missing or not an address.
export function ownOrigin(appUrl: string | undefined): string | undefined {
  if (!appUrl) {
    return undefined;
  }
  try {
    const origin = new URL(appUrl).origin;
    return origin === 'null' ? undefined : origin;
  } catch {
    return undefined;
  }
}

export function sameSiteCheck(): RequestHandler {
  return (req, _res, next) => {
    if (!CHANGING.has(req.method)) {
      next();
      return;
    }
    const site = req.headers['sec-fetch-site'];
    const origin = req.headers.origin;
    const allowed =
      site !== undefined
        ? site === 'same-origin' || site === 'none'
        : origin === undefined || origin === ownOrigin(process.env.APP_URL);
    if (allowed) {
      next();
      return;
    }
    next(new AppError(403, 'not_same_site', 'This request did not come from Nexus'));
  };
}
