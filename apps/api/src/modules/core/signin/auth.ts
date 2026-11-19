import type { RequestHandler } from 'express';
import type { pino } from 'pino';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { toNodeHandler } from 'better-auth/node';
import { and, eq, type SQL } from 'drizzle-orm';
import { account, session, user, verification } from '../../../db/auth-schema.js';
import { authDatabase, securityWrite, securityWriteWithoutCompany } from '../../../db/database.js';
import { createLogger } from '../../../shared/logging.js';
import { ownOrigin } from '../../../shared/same-site.js';
import { writeSecurity, type SecurityEntry } from '../repository/security-log.js';
import { sendResetEmail } from './reset-email.js';

// Sign-in with Better Auth (TECH-DESIGN 6.1, CORE-001), pinned to 1.7.14: email and password, Google, sign-out, the
// current session and password reset links, at /api/auth. Only people the Owner added may sign in (self sign-up is
// off), a disabled person gets no session, and every email sign-in leaves one entry in the security log.

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

// Better Auth's own log lines through Nexus's logger (TECH-DESIGN section 7): only the message and a cleaned error,
// never the other arguments, which can hold a password, a token or a whole request. Its success lines are info.
export function authLog(logger: pino.Logger) {
  return (level: LogLevel, message: string, ...args: unknown[]): void => {
    logger[level === 'success' ? 'info' : level](
      { err: args.find((a) => a instanceof Error) },
      message,
    );
  };
}

// A setting the sign-in needs, read when Better Auth is made; a missing one names itself, never a value.
function setting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function findPerson(where: SQL) {
  const [person] = await authDatabase()
    .select({ id: user.id, companyId: user.companyId, status: user.status })
    .from(user)
    .where(where)
    .limit(1);
  return person;
}

// One security entry for each email sign-in attempt (CORE-092), in a short security write of its own: signin_ok, or
// signin_failed with a fixed reason, in the person's company chain, or in the system chain when nobody has the email.
async function recordEmailSignIn(
  email: unknown,
  signedInUserId: string | undefined,
): Promise<void> {
  const where =
    signedInUserId !== undefined
      ? eq(user.id, signedInUserId)
      : typeof email === 'string'
        ? eq(user.email, email.toLowerCase())
        : undefined;
  const person = where ? await findPerson(where) : undefined;
  if (!person) {
    await securityWriteWithoutCompany(() =>
      writeSecurity({ event: 'signin_failed', details: { reason: 'unknown email' } }),
    );
    return;
  }
  const entry: SecurityEntry =
    signedInUserId !== undefined
      ? { event: 'signin_ok', userId: person.id }
      : {
          event: 'signin_failed',
          userId: person.id,
          details: { reason: person.status === 'disabled' ? 'disabled' : 'wrong password' },
        };
  await securityWrite(person.companyId, () => writeSecurity(entry));
}

function makeAuth() {
  const origin = ownOrigin(process.env.APP_URL);
  if (!origin) throw new Error('APP_URL is not set or not an address');
  const logger = createLogger();
  return betterAuth({
    baseURL: origin,
    basePath: '/api/auth',
    trustedOrigins: [origin],
    secret: setting('BETTER_AUTH_SECRET'),
    database: drizzleAdapter(authDatabase(), {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    // Every key is made by the database (core.uuid_v7()), never by Better Auth.
    advanced: { database: { generateId: false } },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      sendResetPassword: ({ user: person, token }) => sendResetEmail(person, token, logger),
    },
    socialProviders: {
      google: {
        clientId: setting('GOOGLE_CLIENT_ID'),
        clientSecret: setting('GOOGLE_CLIENT_SECRET'),
        disableSignUp: true,
      },
    },
    // Nexus's fields on the person: no request can set them.
    user: {
      additionalFields: {
        companyId: { type: 'string', required: true, input: false },
        status: { type: ['invited', 'active', 'disabled'], required: false, input: false },
        failedSignins: { type: 'number', required: false, input: false },
        lockedUntil: { type: 'date', required: false, input: false },
      },
    },
    session: { cookieCache: { enabled: false } },
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
    logger: { log: authLog(logger) },
    databaseHooks: {
      session: {
        create: {
          // A disabled person, or one with no company, gets no session, whichever way they sign in (CORE-006).
          before: async (newSession) => {
            const person = await findPerson(eq(user.id, newSession.userId));
            if (!person || person.status === 'disabled' || !person.companyId) return false;
          },
          // The first good sign-in of an invited person makes them active.
          after: async (created) => {
            await authDatabase()
              .update(user)
              .set({ status: 'active' })
              .where(and(eq(user.id, created.userId), eq(user.status, 'invited')));
          },
        },
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;
        await recordEmailSignIn(ctx.body?.email, ctx.context.newSession?.user.id);
      }),
    },
  });
}

let auth: ReturnType<typeof makeAuth> | undefined;

// Better Auth, made on first use from APP_URL, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, never
// when this file is loaded.
export function getAuth(): ReturnType<typeof makeAuth> {
  auth ??= makeAuth();
  return auth;
}

// The Express handler for the open sign-in doors: Better Auth's own, made on first use, so the app is made with no
// settings at all.
export function authHandler(): RequestHandler {
  let handle: ReturnType<typeof toNodeHandler> | undefined;
  return async (req, res) => {
    handle ??= toNodeHandler(getAuth());
    await handle(req, res);
  };
}
