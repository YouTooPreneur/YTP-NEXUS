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

// An ID is checked before it reaches the database, so a wrong value never appears in a database error.
function checkId(value: string | undefined): void {
  if (value !== undefined && !ID.test(value)) {
    throw new Error('the activity entry holds an ID that is not valid');
  }
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
  checkId(entry.recordId);
  checkId(entry.clientId);
  checkId(who.actorUserId);
  // A value left undefined is kept as null, so the entry still shows that the field changed.
  const changes = JSON.parse(
    JSON.stringify(entry.changes ?? {}, (_key, value: unknown) =>
      value === undefined ? null : value,
    ),
  ) as Record<string, unknown>;
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
