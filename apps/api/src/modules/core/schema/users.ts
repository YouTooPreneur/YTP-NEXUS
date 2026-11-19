import {
  date,
  foreignKey,
  integer,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { core } from './schemas.js';
import { companies } from './companies.js';
import { roles } from './roles.js';

// A person's own colour and clock (CORE-112, choice 4). The clock's type is named clock_format, never time_format:
// drizzle-kit 0.31.11 writes a type whose name starts with a built-in type's name without its schema.
export const themeColour = core.enum('theme_colour', ['emerald', 'navy']);
export const timeFormat = core.enum('clock_format', ['h12', 'h24']);

// The people who can sign in (DATA-MODEL 3.2, USR-001): one row per person, keyed by their sign-in ID (no default and
// no database link to the sign-in record), with their company, name, one role of the same company, sign-in methods
// (Google, a password or both: the check is in the rights change) and manager of the same company. A company table;
// people are never removed: the 30-day clean-up marks them purged.
export const users = core.table(
  'users',
  {
    id: uuid('id').primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    displayName: text('display_name').notNull(),
    // No link until the files table exists (TASK-0069).
    photoFileId: uuid('photo_file_id'),
    roleId: uuid('role_id').notNull(),
    signinMethods: text('signin_methods').array().notNull(),
    managerUserId: uuid('manager_user_id'),
    switchEmailBy: date('switch_email_by'),
    lastSigninAt: timestamp('last_signin_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    version: integer('version').notNull().default(1),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by'),
    purgedAt: timestamp('purged_at', { withTimezone: true }),
  },
  (table) => [
    unique('users_company_id_id_unique').on(table.companyId, table.id),
    foreignKey({
      columns: [table.companyId, table.roleId],
      foreignColumns: [roles.companyId, roles.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.companyId, table.managerUserId],
      foreignColumns: [table.companyId, table.id],
    }).onDelete('restrict'),
  ],
);

// Each person's preferences (DATA-MODEL 3.2, SCR-008, CORE-112), keyed by company and person: an empty language or
// colour means the company's (the languages table comes with TASK-0067); India's time, 12-hour times and DD MMM YYYY
// by default; the daily summary time is stored now and used from Release 9. A company table.
export const userPreferences = core.table(
  'user_preferences',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull(),
    languageCode: text('language_code'),
    colour: themeColour('colour'),
    timeZone: text('time_zone').notNull().default('Asia/Kolkata'),
    timeFormat: timeFormat('time_format').notNull().default('h12'),
    dateFormat: text('date_format').notNull().default('DD MMM YYYY'),
    dailySummaryTime: time('daily_summary_time'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.userId] }),
    foreignKey({
      columns: [table.companyId, table.userId],
      foreignColumns: [users.companyId, users.id],
    }).onDelete('restrict'),
  ],
);
