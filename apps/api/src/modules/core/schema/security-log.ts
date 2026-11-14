import { bigint, jsonb, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { audit } from './schemas.js';
import { companies } from './companies.js';

// The security log (DATA-MODEL 3.3, CORE-092): sign-ins, locks, two-step changes, permission changes, exports and other
// security events, one chain of fingerprints per company plus the system chain (no company). Rows are added only by the
// database function audit.add_security_entry, which takes the chain's lock; nobody changes or deletes a row.
export const securityLog = audit.table(
  'security_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'restrict' }),
    seq: bigint('seq', { mode: 'number' }).notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    event: text('event').notNull(),
    userId: uuid('user_id'),
    targetUserId: uuid('target_user_id'),
    recordType: text('record_type'),
    recordId: uuid('record_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    details: jsonb('details').notNull().default({}),
    requestId: text('request_id'),
    prevHash: text('prev_hash').notNull(),
    hash: text('hash').notNull(),
  },
  (table) => [
    unique('security_log_chain_seq_unique').on(table.companyId, table.seq).nullsNotDistinct(),
  ],
);
