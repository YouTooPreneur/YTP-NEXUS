import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { companies } from './companies.js';
import { core } from './schemas.js';

export const permissionScope = core.enum('permission_scope', ['own', 'team', 'all']);

export const roles = core.table(
  'roles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').notNull().default(false),
    twoStepRequired: boolean('two_step_required').notNull().default(false),
    idleTimeoutMinutes: integer('idle_timeout_minutes').notNull(),
    phoneMenu: jsonb('phone_menu').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    version: integer('version').notNull().default(1),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    unique('roles_company_id_id_unique').on(table.companyId, table.id),
    unique('roles_company_id_key_unique').on(table.companyId, table.key),
  ],
);

export const rolePermissions = core.table(
  'role_permissions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`core.uuid_v7()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    roleId: uuid('role_id').notNull(),
    module: text('module').notNull(),
    action: text('action').notNull(),
    scope: permissionScope('scope').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  (table) => [
    unique('role_permissions_company_role_action_unique').on(
      table.companyId,
      table.roleId,
      table.module,
      table.action,
    ),
    foreignKey({
      columns: [table.companyId, table.roleId],
      foreignColumns: [roles.companyId, roles.id],
    }).onDelete('restrict'),
  ],
);

export const roleHiddenFields = core.table(
  'role_hidden_fields',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    roleId: uuid('role_id').notNull(),
    module: text('module').notNull(),
    field: text('field').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.roleId, table.module, table.field] }),
    foreignKey({
      columns: [table.companyId, table.roleId],
      foreignColumns: [roles.companyId, roles.id],
    }).onDelete('restrict'),
  ],
);

export const permissionCatalogue = core.table(
  'permission_catalogue',
  {
    module: text('module').notNull(),
    action: text('action').notNull(),
    label: text('label').notNull(),
    hideableFields: jsonb('hideable_fields').notNull().default([]),
    defaultGrants: jsonb('default_grants').notNull().default({}),
    grantsVersion: smallint('grants_version').notNull().default(1),
    release: smallint('release').notNull(),
  },
  (table) => [primaryKey({ columns: [table.module, table.action] })],
);

export const defaultGrantsApplied = core.table(
  'default_grants_applied',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    module: text('module').notNull(),
    action: text('action').notNull(),
    grantsVersion: smallint('grants_version').notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.companyId, table.module, table.action] })],
);
