import { sql } from 'drizzle-orm';
import { getContext } from '../../../shared/context.js';

// The security-log writer (TASK-0018, CORE-092). It adds an entry through the database function
// audit.add_security_entry, in the transaction on the request context: the function takes the chain's lock (held
// until that transaction ends, waiting at most 5 seconds), continues the company's chain (or the system chain when the
// transaction has no company) and works out the fingerprint. Inside a security write the context holds that write's
// own transaction, so the entry stays even when the request is refused. Within one request, every security write that
// writes an entry runs before any entry the request's own transaction writes.
export type SecurityEvent =
  | 'signin_ok'
  | 'signin_failed'
  | 'account_locked'
  | 'two_step_changed'
  | 'two_step_reset'
  | 'signin_email_changed'
  | 'session_ended'
  | 'permission_changed'
  | 'role_viewed_as'
  | 'export'
  | 'sensitive_field_viewed'
  | 'vault_reference_opened'
  | 'api_call'
  | 'setting_changed'
  | 'data_erased';

export interface SecurityEntry {
  event: SecurityEvent;
  userId?: string;
  targetUserId?: string;
  recordType?: string;
  recordId?: string;
  details?: Record<string, unknown>;
}

const EVENTS = new Set<string>([
  'signin_ok',
  'signin_failed',
  'account_locked',
  'two_step_changed',
  'two_step_reset',
  'signin_email_changed',
  'session_ended',
  'permission_changed',
  'role_viewed_as',
  'export',
  'sensitive_field_viewed',
  'vault_reference_opened',
  'api_call',
  'setting_changed',
  'data_erased',
]);
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HIDDEN = '[hidden]';
const SECRET = /pass(word|code)|secret|token|apikey|privatekey/;

// A part of the details whose name looks like a secret, or is exactly a code or a key, is never stored.
function isSecret(name: string): boolean {
  const letters = name.toLowerCase().replace(/[^a-z]/g, '');
  return SECRET.test(letters) || letters === 'code' || letters === 'key' || letters === 'otp';
}

function checkId(value: string | undefined): void {
  if (value !== undefined && !ID.test(value)) {
    throw new Error('the security entry holds an ID that is not valid');
  }
}

export async function writeSecurity(entry: SecurityEntry): Promise<number> {
  const context = getContext();
  if (!context.tx) {
    throw new Error('the security log needs the transaction');
  }
  if (!EVENTS.has(entry.event)) {
    throw new Error('the security log does not know this event');
  }
  const userId = entry.userId ?? context.userId;
  checkId(userId);
  checkId(entry.targetUserId);
  checkId(entry.recordId);
  const details = JSON.stringify(entry.details ?? {}, (key, value: unknown) =>
    key !== '' && isSecret(key) ? HIDDEN : value === undefined ? null : value,
  );
  const result = await context.tx.execute(
    sql`SELECT audit.add_security_entry(${entry.event}, ${userId ?? null}::uuid, ${entry.targetUserId ?? null}::uuid, ${entry.recordType ?? null}, ${entry.recordId ?? null}::uuid, ${context.ip ?? null}, ${context.userAgent ?? null}, ${details}::jsonb, ${context.requestId}) AS id`,
  );
  const id = result.rows[0]?.id;
  if (id === undefined || id === null) {
    throw new Error('the security entry was not saved');
  }
  return Number(id);
}
