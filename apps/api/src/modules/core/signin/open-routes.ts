// The only Better Auth doors left open (TECH-DESIGN 6.1, the agreed list in tools/verify/auth-routes.json): email
// sign-in, Google sign-in and its return address, sign-out, the current session and the two password reset doors.
// Every other door under /api/auth answers 404 (auth-routes.ts). Plain data that imports nothing, so the routes
// listing reads it without loading Better Auth.
export const OPEN_AUTH_ROUTES = [
  'POST /api/auth/sign-in/email',
  'POST /api/auth/sign-in/social',
  'GET /api/auth/callback/google',
  'POST /api/auth/sign-out',
  'GET /api/auth/get-session',
  'POST /api/auth/request-password-reset',
  'POST /api/auth/reset-password',
] as const;
