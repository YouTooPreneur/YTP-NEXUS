import { sql } from 'drizzle-orm';
import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { audit } from './schemas.js';
import { companies } from './companies.js';

// The activity log (DATA-MODEL 3.3, CORE-090): one entry per change or automatic action, written in the same
// transaction as the change. A company table the app may only add to and read; personal values are removed only
// through the delete-on-request path (TASK-0025).
export const actorType = audit.enum('actor_type', [
  'person',
  'automation',
  'api',
  'mcp',
  'ai',
  'system',
]);

export const activityLog = audit.table(
  'activity_log',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorType: actorType('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    actorLabel: text('actor_label'),
    module: text('module').notNull(),
    recordType: text('record_type').notNull(),
    recordId: uuid('record_id').notNull(),
    recordLabel: text('record_label').notNull(),
    action: text('action').notNull(),
    changes: jsonb('changes').notNull().default({}),
    clientId: uuid('client_id'),
    requestId: text('request_id'),
  },
  (table) => [
    index('activity_log_record_idx').on(
      table.companyId,
      table.module,
      table.recordType,
      table.recordId,
      table.at,
    ),
    index('activity_log_client_idx').on(table.companyId, table.clientId, table.at),
    index('activity_log_actor_idx').on(table.companyId, table.actorUserId, table.at),
    index('activity_log_at_idx').on(table.companyId, table.at),
  ],
);
