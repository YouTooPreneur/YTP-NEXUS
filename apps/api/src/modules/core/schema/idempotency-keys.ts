import { sql } from 'drizzle-orm';
import { jsonb, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { core } from './schemas.js';
import { companies } from './companies.js';

// The double-click keys (DATA-MODEL 3.4, NFR-021): the first answer to a request that changes data, kept for 24 hours
// under the screen's Idempotency-Key, so a repeat gets the same answer instead of doing the thing twice. A company
// table; the key is unique per company.
export const idempotencyKeys = core.table(
  'idempotency_keys',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    key: text('key').notNull(),
    userId: uuid('user_id').notNull(),
    action: text('action').notNull(),
    result: jsonb('result'),
    expiresAt: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '24 hours'`),
  },
  (table) => [primaryKey({ columns: [table.companyId, table.key] })],
);
