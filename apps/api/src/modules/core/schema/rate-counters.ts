import { integer, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { core } from './schemas.js';

// The request counters of the limits (DATA-MODEL 3.4, NFR-020): one row per bucket (for example
// signin:ip:203.0.113.7) and fixed time window, with the number of requests counted in it, refused ones included. A
// system table with no company: the per-address limit counts before anyone is known.
export const rateCounters = core.table(
  'rate_counters',
  {
    bucket: text('bucket').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull(),
  },
  (table) => [primaryKey({ columns: [table.bucket, table.windowStart] })],
);
