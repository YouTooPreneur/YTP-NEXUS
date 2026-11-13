import { integer, jsonb, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { core } from './schemas.js';
import { companies } from './companies.js';

// A company's settings (DATA-MODEL 3.1, CORE-012): only the values a company has changed. Each setting's key, rule,
// default and help are defined in code (defineSetting); a setting with no row uses its default. A company table,
// keyed by company and key.
export const settings = core.table(
  'settings',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    key: text('key').notNull(),
    module: text('module').notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    version: integer('version').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.companyId, table.key] })],
);
