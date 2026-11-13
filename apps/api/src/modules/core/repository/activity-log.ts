import { getContext } from '../../../shared/context.js';
import { activityLog } from '../schema/activity-log.js';

// The activity-log writer (TASK-0017, CORE-090, TECH-DESIGN section 2 step 13): every save writes its entry in the
// transaction on the request context, so the entry is kept or undone together with the change. The company and the
// request ID come from the context, never from the entry, and the writer opens no transaction of its own. Work
// outside a request (a job, a command, a test) runs inside runWithContext with its own requestId, companyId and tx.
export type ActorType = 'automation' | 'api' | 'mcp' | 'ai' | 'system';

export interface Actor {
  type: ActorType;
  label: string;
  userId?: string;
}

export interface ActivityEntry {
  module: string;
  recordType: string;
  recordId: string;
  recordLabel: string;
  action: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  clientId?: string;
  actor?: Actor;
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// An ID is checked before it reaches the database, so a wrong value never appears in a database error; a required
// ID that is missing is refused the same way (TASK-0093).
function checkId(value: string | undefined, required = false): void {
  if ((required || value !== undefined) && !ID.test(value ?? '')) {
    throw new Error('the activity entry holds an ID that is not valid');
  }
}

// A field whose name looks like a secret (a password, passcode, secret, token, API key or private key, in any
// spelling) is never stored: a changed field keeps its name with both values hidden, and a deeper one is hidden
// (TASK-0093, RULE-025).
const HIDDEN = '[hidden]';
const SECRET = /pass(word|code)|secret|token|apikey|privatekey/;

function isSecret(name: string): boolean {
  return SECRET.test(name.toLowerCase().replace(/[^a-z]/g, ''));
}

export async function writeActivity(entry: ActivityEntry): Promise<string> {
  const context = getContext();
  if (!context.tx) {
    throw new Error('the activity log needs the transaction');
  }
  if (!context.companyId) {
    throw new Error('the activity log needs the company');
  }
  let who: { actorType: ActorType | 'person'; actorUserId?: string; actorLabel?: string };
  if (entry.actor) {
    who = {
      actorType: entry.actor.type,
      actorUserId: entry.actor.userId,
      actorLabel: entry.actor.label,
    };
  } else if (context.userId) {
    who = { actorType: 'person', actorUserId: context.userId };
  } else {
    throw new Error('the activity log needs who did it');
  }
  checkId(entry.recordId, true);
  checkId(entry.clientId);
  checkId(who.actorUserId);
  // A value left undefined is kept as null, so the entry still shows that the field changed.
  const kept = JSON.parse(
    JSON.stringify(entry.changes ?? {}, (key, value: unknown) =>
      key !== '' && isSecret(key) ? HIDDEN : value === undefined ? null : value,
    ),
  ) as Record<string, unknown>;
  const changes = Object.fromEntries(
    Object.entries(kept).map(([field, change]) => [
      field,
      isSecret(field) ? { old: HIDDEN, new: HIDDEN } : change,
    ]),
  );
  const [row] = await context.tx
    .insert(activityLog)
    .values({
      companyId: context.companyId,
      ...who,
      module: entry.module,
      recordType: entry.recordType,
      recordId: entry.recordId,
      recordLabel: entry.recordLabel,
      action: entry.action,
      changes,
      clientId: entry.clientId,
      requestId: context.requestId,
    })
    .returning({ id: activityLog.id });
  if (!row) {
    throw new Error('the activity entry was not saved');
  }
  return row.id;
}
