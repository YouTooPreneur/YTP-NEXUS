import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNull, lt, lte, sql } from 'drizzle-orm';
import type { pino } from 'pino';
import { allAnnouncements } from '../../../announcements.js';
import { forCompany } from '../../../db/company.js';
import { inCompanyTransaction, listCompanyIds } from '../../../db/database.js';
import { getContext, runWithContext } from '../../../shared/context.js';
import { safeErrorMessage } from '../../../shared/logging.js';
import { recordError } from '../repository/error-events.js';
import { eventReceipts, outbox } from '../schema/outbox.js';

// The delivery of announcements (TASK-0094, D-014, NFR-003): the worker hands each waiting announcement to every
// listener of its event, company by company, each announcement in a context of its own. Its try is counted first, in a
// transaction of its own, so a delivery that breaks off (a broken connection) has used up its try too and is taken again
// later. Then, in a second transaction with its company set, each listener runs in a savepoint of its own, after its
// receipt is added, so it handles an announcement at most once and what it writes is kept only together with its
// receipt. An announcement is marked delivered once every listener has its receipt; otherwise it is tried again later,
// and its errors are logged and kept for Monitoring.

// What a listener is handed: the announcement as it was posted.
export interface Delivered {
  id: string;
  event: string;
  version: number;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface Listener {
  // A permanent key, for example crm.contacts-on-user-disabled: its receipts are kept under it, so it never changes.
  name: string;
  // The announcement it listens to (registered in allAnnouncements), and the versions of its payload it reads; an
  // announcement of another version is recorded as not delivered to it.
  event: string;
  versions: number[];
  // Its module, and its feature key (the switch is checked before it runs from TASK-0057).
  module: string;
  feature?: string;
  // Runs with the announcement's company and its savepoint's transaction on the context; it throws when it fails.
  handle(announcement: Delivered): Promise<void>;
}

// The limit of tries and the wait after each try: 1, 5, 15, then 60 minutes. After the fifth try the announcement waits
// for Retry on the Monitoring screen (TASK-0058). A round delivers at most PER_ROUND announcements of one company, so a
// busy company never holds the others back.
export const MAX_ATTEMPTS = 5;
const RETRY_AFTER_MINUTES = [1, 5, 15, 60];
export const PER_ROUND = 100;

interface Failure {
  listener: string;
  error: unknown;
}

// The failures' text for last_error: each listener's name and its cleaned message only (safeErrorMessage), without NUL
// characters (PostgreSQL text refuses them), at most 2000 characters, like core.error_events.
function failureText(failures: Failure[]): string {
  return failures
    .map(({ listener, error }) => `${listener}: ${safeErrorMessage(error)}`)
    .join('; ')
    .replaceAll('\u0000', '')
    .slice(0, 2000);
}

// The listeners are checked before any work: each name only once (its receipts are kept under it), each event
// registered, and at least one version read.
function checkListeners(listeners: Listener[]): void {
  if (new Set(listeners.map((listener) => listener.name)).size !== listeners.length) {
    throw new Error('two listeners have the same name');
  }
  for (const listener of listeners) {
    if (!allAnnouncements.some((known) => known.name === listener.event)) {
      throw new Error('a listener listens to an announcement that is not registered');
    }
    if (listener.versions.length === 0) {
      throw new Error('a listener reads no version');
    }
  }
}

// Keeps an error for Monitoring under the announcement's company; when that fails too, it logs a warning and goes on.
async function keepError(
  logger: pino.Logger,
  error: unknown,
  fields: Record<string, unknown>,
): Promise<void> {
  try {
    await recordError(error, 'worker');
  } catch (failure) {
    logger.warn({ err: failure, ...fields }, 'error not recorded');
  }
}

// Delivers the company's oldest waiting announcement that is due, in two transactions. The claim takes it (another
// worker skips it while it is taken) and counts its try, with the wait before the next one. The delivery takes it again,
// runs its listeners and marks it delivered, or keeps their errors. It gives back the announcement's ID and the
// listeners that failed, or nothing when none waits; when the delivery breaks off, it throws.
async function deliverNext(
  listeners: Listener[],
  companyId: string,
): Promise<{ id: string; failures: Failure[] } | undefined> {
  // One announcement of this company: both updates name its company too.
  const thisOne = (id: string) => and(forCompany(outbox.companyId, companyId), eq(outbox.id, id));
  const row = await inCompanyTransaction(companyId, async (tx) => {
    const [oldest] = await tx
      .select()
      .from(outbox)
      .where(
        and(
          forCompany(outbox.companyId, companyId),
          isNull(outbox.publishedAt),
          lt(outbox.attempts, MAX_ATTEMPTS),
          lte(outbox.nextAttemptAt, sql`now()`),
        ),
      )
      .orderBy(asc(outbox.id))
      .limit(1)
      .for('update', { skipLocked: true });
    if (oldest) {
      const minutes = RETRY_AFTER_MINUTES[oldest.attempts] ?? 60;
      await tx
        .update(outbox)
        .set({
          attempts: oldest.attempts + 1,
          nextAttemptAt: sql`now() + make_interval(mins => ${minutes})`,
        })
        .where(thisOne(oldest.id));
    }
    return oldest;
  });
  if (!row) return undefined;
  const announcement: Delivered = {
    id: row.id,
    event: row.event,
    version: row.eventVersion,
    payload: row.payload as Record<string, unknown>,
    occurredAt: row.occurredAt,
  };
  const failures = await inCompanyTransaction(companyId, async (tx) => {
    const failed: Failure[] = [];
    const [waiting] = await tx
      .select({ id: outbox.id })
      .from(outbox)
      .where(and(thisOne(row.id), isNull(outbox.publishedAt)))
      .for('update');
    if (!waiting) return failed;
    for (const listener of listeners.filter((one) => one.event === row.event)) {
      if (!listener.versions.includes(row.eventVersion)) {
        failed.push({
          listener: listener.name,
          error: new Error(`the listener does not read version ${row.eventVersion}`),
        });
        continue;
      }
      try {
        // The receipt first: a listener that already has one handled this announcement and does not run again.
        await tx.transaction(async (savepoint) => {
          const [receipt] = await savepoint
            .insert(eventReceipts)
            .values({ listener: listener.name, eventId: row.id })
            .onConflictDoNothing()
            .returning({ listener: eventReceipts.listener });
          if (receipt) {
            await runWithContext({ ...getContext(), tx: savepoint }, () =>
              listener.handle(announcement),
            );
          }
        });
      } catch (error) {
        failed.push({ listener: listener.name, error });
      }
    }
    if (failed.length === 0) {
      await tx
        .update(outbox)
        .set({ publishedAt: sql`now()`, lastError: null })
        .where(thisOne(row.id));
    } else {
      await tx
        .update(outbox)
        .set({ lastError: failureText(failed) })
        .where(thisOne(row.id));
    }
    return failed;
  });
  return { id: row.id, failures };
}

// One round: every company in turn, at most PER_ROUND of its announcements, until none is waiting and due. Each
// announcement gets a new context of its own; each failed listener is logged and its error kept under the company. A
// delivery that breaks off is logged and kept the same way, and the round goes on with the next company. It refuses
// wrong listeners before any work, and gives back how many announcements it delivered or marked failed.
export async function deliverPending(options: {
  listeners: Listener[];
  logger: pino.Logger;
}): Promise<number> {
  const { listeners, logger } = options;
  checkListeners(listeners);
  let taken = 0;
  for (const companyId of await listCompanyIds()) {
    for (let count = 0; count < PER_ROUND; count += 1) {
      const context = { requestId: randomUUID(), background: true, companyId };
      const done = await runWithContext(context, async () => {
        let result: { id: string; failures: Failure[] } | undefined;
        try {
          result = await deliverNext(listeners, companyId);
        } catch (error) {
          logger.error({ err: error, companyId }, 'delivery failed');
          await keepError(logger, error, { companyId });
          return false;
        }
        if (!result) return false;
        for (const { listener, error } of result.failures) {
          logger.error({ err: error, eventId: result.id, listener }, 'announcement failed');
          await keepError(logger, error, { eventId: result.id, listener });
        }
        return true;
      });
      if (!done) break;
      taken += 1;
    }
  }
  return taken;
}

// The worker's loop: a round now, which also catches up after downtime, then the next one everyMs after the last has
// ended, so two rounds never overlap. A failed round is logged and the loop goes on. stop() ends the loop and waits for
// the round that is running.
export function startDelivery(options: {
  listeners: Listener[];
  logger: pino.Logger;
  everyMs: number;
}): { stop(): Promise<void> } {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let round: Promise<void> = Promise.resolve();
  const run = async (): Promise<void> => {
    try {
      await deliverPending(options);
    } catch (error) {
      options.logger.error({ err: error }, 'delivery round failed');
    }
    if (!stopped) timer = setTimeout(next, options.everyMs);
  };
  const next = (): void => {
    round = run();
  };
  next();
  return {
    async stop() {
      stopped = true;
      clearTimeout(timer);
      await round;
    },
  };
}
