import { sql } from 'drizzle-orm';
import { text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { core } from './schemas.js';

// The companies using Nexus (DATA-MODEL 3.1): a system table, with no company row rule. Rows are made only by
// the first-start command (TECH-DESIGN 6.8); nexus_app may only read them. Each key is a time-ordered ID.
export const companyStatus = core.enum('company_status', ['active', 'paused']);

export const companies = core.table('companies', {
  id: uuid('id')
    .primaryKey()
    .default(sql`core.uuid_v7()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: companyStatus('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
