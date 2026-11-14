import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { core } from './schemas.js';
import { companies } from './companies.js';

// Announcements (DATA-MODEL 3.3, D-014, NFR-003): one row per announcement a save posts, written in the save's own
// transaction and kept until the worker has delivered it to every listener. A company table: the worker sets each
// announcement's company before delivering it. The app may change only the delivery columns, never the announcement.
export const outbox = core.table(
  'outbox',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    event: text('event').notNull(),
    eventVersion: smallint('event_version').notNull(),
    payload: jsonb('payload').notNull().default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('outbox_waiting_idx')
      .on(table.companyId, table.id)
      .where(sql`${table.publishedAt} IS NULL`),
  ],
);

// What each listener has handled (DATA-MODEL 3.3, NFR-003): a system table, so a listener never handles the same
// announcement twice, whichever company it belongs to.
export const eventReceipts = core.table(
  'event_receipts',
  {
    listener: text('listener').notNull(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => outbox.id, { onDelete: 'restrict' }),
    handledAt: timestamp('handled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.listener, table.eventId] })],
);
