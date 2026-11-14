import { sql } from 'drizzle-orm';
import { text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { core } from './schemas.js';
import { companies } from './companies.js';

// Which program met the error (DATA-MODEL 3.4): the API or the worker. Errors on the screens go straight to Sentry.
export const errorSource = core.enum('error_source', ['api', 'worker']);

// Recent errors for Monitoring (DATA-MODEL 3.4, CORE-140): one row per unexpected error, under the company of the
// request or job that met it, or with no company (a system error). Rows are added only by the database function
// core.record_error, with the cleaned message only; rows with no company are read only through core.system_errors.
export const errorEvents = core.table('error_events', {
  id: uuid('id')
    .primaryKey()
    .default(sql`core.uuid_v7()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'restrict' }),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  source: errorSource('source').notNull(),
  message: text('message').notNull(),
  requestId: text('request_id'),
  externalId: text('external_id'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
});
