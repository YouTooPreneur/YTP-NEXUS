import type { pino } from 'pino';
import { ownOrigin } from '../../../shared/same-site.js';

// The password reset email (SCR-003, TECH-DESIGN 6.1). Its link goes to the reset screen at APP_URL, never to a
// sign-in door: Better Auth's own link is its GET door /reset-password/<token>, which stays closed and whose path,
// token included, the request log would keep.
export interface ResetMail {
  to: string;
  link: string;
}

export type ResetMailer = (mail: ResetMail) => Promise<void>;

let mailer: ResetMailer | undefined;

export function resetLink(token: string): string {
  const origin = ownOrigin(process.env.APP_URL);
  if (!origin) throw new Error('APP_URL is not set or not an address');
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}

// Sets the function that sends the email (the email door from TASK-0029; the tests set their own).
export function setResetMailer(send: ResetMailer): void {
  mailer = send;
}

// Hands the person's email and link to the mailer. Until the email door exists none is set, and only the person's ID
// is logged, never the link or the token.
export async function sendResetEmail(
  person: { id: string; email: string },
  token: string,
  logger: pino.Logger,
): Promise<void> {
  if (!mailer) {
    logger.warn({ userId: person.id }, 'reset email not sent: the email door comes with TASK-0029');
    return;
  }
  await mailer({ to: person.email, link: resetLink(token) });
}
