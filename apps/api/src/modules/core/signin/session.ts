import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from './auth.js';
import { getContext } from '../../../shared/context.js';
import { AppError } from '../../../shared/errors.js';

// Who is asking (TECH-DESIGN section 2, step 4; CORE-006): the first shared step of every non-public door, before its
// transaction opens. Better Auth reads the session cookie and the session's row, once per request, never refreshing
// the session (only the open sign-in door get-session does) and never answering from its cookie cache, so a person
// disabled while their session is open is refused at once. No session, a tampered, signed-out or expired one, a person
// who is not active or a person with no company answers 401 not_signed_in, and nothing else runs. Otherwise the
// person's ID, their company and the session's ID (never the session itself) go on the request's own context, and the
// transaction step then works in that company. A lock after wrong passwords stops new password sign-ins only, never
// an open session, so it is not read here. Nothing is written or logged here, and nothing is caught: an error from
// Better Auth answers 500 through the error handler.
export async function whoIsAsking(req: Request): Promise<void> {
  const signedIn = await getAuth().api.getSession({
    headers: fromNodeHeaders(req.headers),
    query: { disableRefresh: true, disableCookieCache: true },
  });
  if (!signedIn || signedIn.user.status !== 'active' || !signedIn.user.companyId) {
    throw new AppError(401, 'not_signed_in', 'Please sign in.');
  }
  const context = getContext();
  context.userId = signedIn.user.id;
  context.companyId = signedIn.user.companyId;
  context.sessionId = signedIn.session.id;
}
