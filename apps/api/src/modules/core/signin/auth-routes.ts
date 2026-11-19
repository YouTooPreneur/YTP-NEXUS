import type { RequestHandler } from 'express';
import { AppError } from '../../../shared/errors.js';
import { OPEN_AUTH_ROUTES } from './open-routes.js';

const OPEN = new Set<string>(OPEN_AUTH_ROUTES);

// Mounted on /api/auth before Better Auth (TECH-DESIGN 6.1): a request whose method and exact path are not one of the
// open doors answers 404 not_found in Nexus's own error format and never reaches Better Auth, whatever Better Auth
// itself would do with it (self sign-up, account changes, the reset link's own GET door).
export function openAuthRoutesOnly(): RequestHandler {
  return (req, _res, next) => {
    if (OPEN.has(`${req.method} ${req.baseUrl}${req.path}`)) {
      next();
      return;
    }
    next(new AppError(404, 'not_found', 'Not found'));
  };
}
