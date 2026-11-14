import { sql } from 'drizzle-orm';
import { securityWriteWithoutCompany } from '../../../db/database.js';
import { writeSecurity } from './security-log.js';

// The counter of the limits (TASK-0023, NFR-020). hitLimit counts one request in its bucket's current window, refused
// requests included, in a short security write of its own with no company (never a lock in the request's transaction),
// and says whether the limit is passed. The window is fixed and worked out by the database's clock. The first request
// over the limit in a window writes one limit_hit entry in the security log's system chain, in the same write. It runs
// inside a request (the security log takes the address and browser from the request context).
export interface Limit {
  // The limit's name, for example signin.
  name: string;
  // Who is counted, for example ip:203.0.113.7.
  key: string;
  // The requests allowed in one window.
  max: number;
  windowSeconds: number;
}

export interface Counted {
  count: number;
  refused: boolean;
  // The seconds until the window ends, at least 1.
  retryAfterSeconds: number;
}

export async function hitLimit(limit: Limit): Promise<Counted> {
  const bucket = `${limit.name}:${limit.key}`;
  const seconds = limit.windowSeconds;
  return securityWriteWithoutCompany(async (tx) => {
    const result = await tx.execute(
      sql`INSERT INTO core.rate_counters AS counter (bucket, window_start, count)
          VALUES (${bucket}, to_timestamp(floor(extract(epoch FROM clock_timestamp()) / ${seconds}::int) * ${seconds}::int), 1)
          ON CONFLICT (bucket, window_start) DO UPDATE SET count = counter.count + 1
          RETURNING counter.count,
            ceil(extract(epoch FROM counter.window_start) + ${seconds}::int - extract(epoch FROM clock_timestamp()))::int AS retry_after`,
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('the request was not counted');
    }
    const count = Number(row.count);
    if (count === limit.max + 1) {
      await writeSecurity({
        event: 'limit_hit',
        details: { limit: limit.name, max: limit.max, windowSeconds: seconds },
      });
    }
    return {
      count,
      refused: count > limit.max,
      retryAfterSeconds: Math.max(1, Number(row.retry_after)),
    };
  });
}
