import { sql } from 'drizzle-orm';
import { boolean, index, pgSchema, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from '../modules/core/schema/companies.js';

// Better Auth's sign-in tables (DATA-MODEL 3.2, TECH-DESIGN 5.1) in their own `auth` schema: the columns Better Auth
// 1.7.14's Drizzle adapter writes for email and password, Google, sessions and reset links, under the names its own
// schema generator gives them, each key a time-ordered ID made by core.uuid_v7(). System tables with no row rule:
// they are read before the company is known, so only Core's sign-in and users code and src/db touch them (the
// auth-schema wall). The person also has Nexus's fields, which no request can set: the company, the status, the
// failed sign-ins and the lock. Times are timestamptz and every link is ON DELETE RESTRICT (DATA-MODEL section 2).
export const authSchema = pgSchema('auth');

export const userStatus = authSchema.enum('user_status', ['invited', 'active', 'disabled']);

export const user = authSchema.table('user', {
  id: uuid('id')
    .primaryKey()
    .default(sql`core.uuid_v7()`),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'restrict' }),
  status: userStatus('status').notNull().default('invited'),
  failedSignins: smallint('failed_signins').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});

export const session = authSchema.table(
  'session',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = authSchema.table(
  'account',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = authSchema.table(
  'verification',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);
