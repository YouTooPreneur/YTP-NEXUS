import { allAnnouncements } from '../../../announcements.js';
import { getContext } from '../../../shared/context.js';
import { outbox } from '../schema/outbox.js';

// The announcement poster (TASK-0020, D-014, NFR-003, TECH-DESIGN section 2 step 13): a save posts its announcement in
// the transaction on the request context, after its activity-log entry, so the announcement is kept or undone together
// with the change; the worker delivers it later, once to each listener. The company comes from the context, never from
// the announcement, and the poster opens no transaction of its own. Only an announcement registered in
// allAnnouncements (and so listed on its module card) may be posted; its payload holds IDs and the facts needed, never a
// copy of another module's record and never a secret.
export interface Announcement {
  // <module>.<record>.<what happened>, for example core.user.disabled.
  event: string;
  // The payload's shape, from 1: a listener reads only the versions it knows.
  version: number;
  payload: Record<string, unknown>;
}

const SECRET = /pass(word|code)|secret|token|apikey|privatekey/;

function isSecret(name: string): boolean {
  return SECRET.test(name.toLowerCase().replace(/[^a-z]/g, ''));
}

export async function announce(announcement: Announcement): Promise<string> {
  const context = getContext();
  if (!context.tx) {
    throw new Error('an announcement needs the transaction');
  }
  if (!context.companyId) {
    throw new Error('an announcement needs the company');
  }
  if (!allAnnouncements.some((known) => known.name === announcement.event)) {
    throw new Error('this announcement is not registered');
  }
  const { version, payload } = announcement;
  if (!Number.isInteger(version) || version < 1 || version > 32767) {
    throw new Error('an announcement needs a version from 1 to 32767');
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('an announcement needs a payload object');
  }
  // A field whose name looks like a secret, at any depth, is refused: nothing is posted. The copy that was checked is
  // the one saved, so the payload cannot change between the check and the save.
  const checked = JSON.parse(
    JSON.stringify(payload, (key, value: unknown) => {
      if (key !== '' && isSecret(key)) {
        throw new Error('an announcement never carries a secret');
      }
      return value;
    }),
  ) as Record<string, unknown>;
  const [row] = await context.tx
    .insert(outbox)
    .values({
      companyId: context.companyId,
      event: announcement.event,
      eventVersion: version,
      payload: checked,
    })
    .returning({ id: outbox.id });
  if (!row) {
    throw new Error('the announcement was not saved');
  }
  return row.id;
}
