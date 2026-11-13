import { and, eq, sql } from 'drizzle-orm';
import { getContext } from './context.js';
import { AppError } from './errors.js';
import type { RouteInfo } from './route.js';
import { forCompany } from '../db/company.js';
import { idempotencyKeys } from '../modules/core/schema/idempotency-keys.js';

// The double-click key (TASK-0022, NFR-021, TECH-DESIGN section 2 step 12): a request that changes data carries the
// screen's Idempotency-Key. The first request with a key runs and its answer is kept for 24 hours; a repeat in that
// time gets the same answer and runs nothing. It all happens in the request's transaction, so a request that fails
// keeps no key and may be sent again. A reading request needs no key.
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function doubleClickKey<T>(info: RouteInfo, run: () => Promise<T>): Promise<T> {
  if (info.route.method === 'get') {
    return run();
  }
  const { tx, companyId, userId } = getContext();
  if (!tx || !companyId || !userId) {
    throw new Error('the double-click key needs the request transaction and the person');
  }
  const given = info.req.get('Idempotency-Key');
  if (!given || !KEY.test(given)) {
    throw new AppError(400, 'idempotency_key_required', 'Please try again');
  }
  const key = given.toLowerCase();
  const action = info.route.operationId;
  const mine = and(forCompany(idempotencyKeys.companyId, companyId), eq(idempotencyKeys.key, key));
  // A new key, or one whose 24 hours are over, is claimed; a live key returns no row.
  const claimed = await tx
    .insert(idempotencyKeys)
    .values({ companyId, key, userId, action })
    .onConflictDoUpdate({
      target: [idempotencyKeys.companyId, idempotencyKeys.key],
      set: { userId, action, result: null, expiresAt: sql`now() + interval '24 hours'` },
      setWhere: sql`${idempotencyKeys.expiresAt} <= now()`,
    })
    .returning({ key: idempotencyKeys.key });
  if (claimed.length > 0) {
    const answer = await run();
    // The answer is kept inside an object, so an answer of null is kept too.
    await tx.update(idempotencyKeys).set({ result: { answer } }).where(mine);
    return answer;
  }
  const [first] = await tx.select().from(idempotencyKeys).where(mine);
  if (!first || first.userId !== userId || first.action !== action) {
    throw new AppError(
      409,
      'idempotency_key_reused',
      'This was already sent for something else. Please try again',
    );
  }
  if (!first.result) {
    throw new Error('the double-click key has no answer');
  }
  return (first.result as { answer: T }).answer;
}
