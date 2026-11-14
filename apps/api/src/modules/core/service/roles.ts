import { and, eq, sql } from 'drizzle-orm';
import { forCompany } from '../../../db/company.js';
import { getContext } from '../../../shared/context.js';
import { writeActivity } from '../repository/activity-log.js';
import {
  defaultGrantsApplied,
  permissionCatalogue,
  roleHiddenFields,
  rolePermissions,
  roles,
} from '../schema/roles.js';

export type PermissionScope = 'own' | 'team' | 'all';

export interface PermissionGrant {
  scope: PermissionScope;
  hidden?: string[];
}

export interface PermissionEntry {
  module: string;
  action: string;
  label: string;
  hideableFields?: string[];
  defaultGrants?: Record<string, PermissionGrant>;
  grantsVersion: number;
  release: number;
}

const ownerGrant = { owner: { scope: 'all' as const } };
const ownerAndManagerGrant = {
  owner: { scope: 'all' as const },
  manager: { scope: 'all' as const },
};

export const CORE_PERMISSIONS: PermissionEntry[] = [
  {
    module: 'core.users',
    action: 'view',
    label: 'View people',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.users',
    action: 'create',
    label: 'Add people',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.users',
    action: 'edit',
    label: 'Edit people',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.users',
    action: 'delete',
    label: 'Remove people',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.roles',
    action: 'view',
    label: 'View roles',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.roles',
    action: 'create',
    label: 'Add roles',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.roles',
    action: 'edit',
    label: 'Edit roles',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.roles',
    action: 'delete',
    label: 'Remove roles',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.security',
    action: 'view',
    label: 'View security settings',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.security',
    action: 'edit',
    label: 'Edit security settings',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.settings',
    action: 'view',
    label: 'View settings',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.settings',
    action: 'edit',
    label: 'Edit settings',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.company',
    action: 'view',
    label: 'View company',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.company',
    action: 'edit',
    label: 'Edit company',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.feature_switches',
    action: 'view',
    label: 'View feature switches',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.feature_switches',
    action: 'edit',
    label: 'Edit feature switches',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.languages',
    action: 'view',
    label: 'View languages',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.languages',
    action: 'edit',
    label: 'Edit languages',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.monitoring',
    action: 'view',
    label: 'View monitoring',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.monitoring',
    action: 'edit',
    label: 'Retry a job',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.record_history',
    action: 'view',
    label: 'View record history',
    defaultGrants: ownerAndManagerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.logs',
    action: 'view',
    label: 'View logs',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.logs',
    action: 'export',
    label: 'Export logs',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.security_log',
    action: 'view',
    label: 'View security log',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.security_log',
    action: 'export',
    label: 'Export security log',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.trash',
    action: 'view',
    label: 'View trash',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
  {
    module: 'core.trash',
    action: 'edit',
    label: 'Restore from trash',
    defaultGrants: ownerGrant,
    grantsVersion: 1,
    release: 1,
  },
];

export interface DefaultRole {
  key: string;
  name: string;
  twoStepRequired: boolean;
  idleTimeoutMinutes: number;
  phoneMenu: string[];
}

type RuntimeResult = ReturnType<typeof JSON.parse>;

const home = ['home', 'tasks', 'calendar'];

export const DEFAULT_ROLES: DefaultRole[] = [
  {
    key: 'owner',
    name: 'Owner',
    twoStepRequired: true,
    idleTimeoutMinutes: 30,
    phoneMenu: [...home, 'leads', 'more'],
  },
  {
    key: 'llp_partner',
    name: 'LLP partner',
    twoStepRequired: true,
    idleTimeoutMinutes: 30,
    phoneMenu: [...home, 'leads', 'more'],
  },
  {
    key: 'manager',
    name: 'Manager',
    twoStepRequired: true,
    idleTimeoutMinutes: 480,
    phoneMenu: [...home, 'leads', 'more'],
  },
  {
    key: 'hr',
    name: 'HR',
    twoStepRequired: true,
    idleTimeoutMinutes: 30,
    phoneMenu: [...home, 'attendance', 'more'],
  },
  {
    key: 'accounts',
    name: 'Accounts',
    twoStepRequired: true,
    idleTimeoutMinutes: 30,
    phoneMenu: [...home, 'attendance', 'more'],
  },
  {
    key: 'staff',
    name: 'Staff',
    twoStepRequired: false,
    idleTimeoutMinutes: 480,
    phoneMenu: [...home, 'attendance', 'more'],
  },
  {
    key: 'trainer',
    name: 'Trainer',
    twoStepRequired: false,
    idleTimeoutMinutes: 480,
    phoneMenu: [...home, 'attendance', 'more'],
  },
  {
    key: 'client_contact',
    name: 'Client contact',
    twoStepRequired: false,
    idleTimeoutMinutes: 60,
    phoneMenu: [],
  },
  {
    key: 'student',
    name: 'Student',
    twoStepRequired: false,
    idleTimeoutMinutes: 60,
    phoneMenu: [],
  },
];

function place() {
  const { tx, companyId } = getContext();
  if (!tx || !companyId) {
    throw new Error('the roles need the transaction');
  }
  return { tx, companyId };
}

const companyRoles = (companyId: string) => forCompany(roles.companyId, companyId);

export async function registerPermissions(entries: PermissionEntry[]): Promise<never> {
  const { tx } = place();
  for (const entry of entries) {
    await tx
      .insert(permissionCatalogue)
      .values({
        module: entry.module,
        action: entry.action,
        label: entry.label,
        hideableFields: entry.hideableFields ?? [],
        defaultGrants: entry.defaultGrants ?? {},
        grantsVersion: entry.grantsVersion,
        release: entry.release,
      })
      .onConflictDoUpdate({
        target: [permissionCatalogue.module, permissionCatalogue.action],
        set: {
          label: entry.label,
          hideableFields: entry.hideableFields ?? [],
          defaultGrants: entry.defaultGrants ?? {},
          grantsVersion: entry.grantsVersion,
          release: entry.release,
        },
      });
  }
  return undefined as never;
}

export async function makeDefaultRoles(): Promise<RuntimeResult> {
  const { tx, companyId } = place();
  const existing = await tx
    .select({ key: roles.key, id: roles.id })
    .from(roles)
    .where(companyRoles(companyId));
  const ids = new Map(existing.map((role) => [role.key, role.id]));

  for (const role of DEFAULT_ROLES) {
    if (ids.has(role.key)) continue;
    const [created] = await tx
      .insert(roles)
      .values({
        companyId,
        key: role.key,
        name: role.name,
        isDefault: true,
        twoStepRequired: role.twoStepRequired,
        idleTimeoutMinutes: role.idleTimeoutMinutes,
        phoneMenu: role.phoneMenu,
      })
      .returning({ id: roles.id });
    if (!created) throw new Error('the default role was not saved');
    ids.set(role.key, created.id);
    await writeActivity({
      module: 'core',
      recordType: 'role',
      recordId: created.id,
      recordLabel: role.name,
      action: 'created',
      actor: { type: 'system', label: 'default roles' },
    });
  }

  return Object.fromEntries(DEFAULT_ROLES.map((role) => [role.key, ids.get(role.key)!]));
}

type CatalogueGrant = Record<string, PermissionGrant>;

export async function applyDefaultGrants(): Promise<never> {
  const { tx, companyId } = place();
  const companyRoleRows = await tx
    .select({ key: roles.key, id: roles.id })
    .from(roles)
    .where(companyRoles(companyId));
  const roleIds = new Map(companyRoleRows.map((role) => [role.key, role.id]));
  const entries = await tx.select().from(permissionCatalogue);
  let added = 0;

  for (const entry of entries) {
    const [applied] = await tx
      .select({ grantsVersion: defaultGrantsApplied.grantsVersion })
      .from(defaultGrantsApplied)
      .where(
        and(
          forCompany(defaultGrantsApplied.companyId, companyId),
          eq(defaultGrantsApplied.module, entry.module),
          eq(defaultGrantsApplied.action, entry.action),
        ),
      );
    if (applied && applied.grantsVersion >= entry.grantsVersion) continue;

    const defaults = (entry.defaultGrants ?? {}) as CatalogueGrant;
    for (const [roleKey, grant] of Object.entries(defaults)) {
      const roleId = roleIds.get(roleKey);
      if (!roleId) continue;
      const [existingGrant] = await tx
        .select({ id: rolePermissions.id })
        .from(rolePermissions)
        .where(
          and(
            forCompany(rolePermissions.companyId, companyId),
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.module, entry.module),
            eq(rolePermissions.action, entry.action),
          ),
        );
      if (!existingGrant) {
        await tx.insert(rolePermissions).values({
          companyId,
          roleId,
          module: entry.module,
          action: entry.action,
          scope: grant.scope,
        });
        added += 1;
      }

      for (const field of grant.hidden ?? []) {
        const [existingHidden] = await tx
          .select({ roleId: roleHiddenFields.roleId })
          .from(roleHiddenFields)
          .where(
            and(
              forCompany(roleHiddenFields.companyId, companyId),
              eq(roleHiddenFields.roleId, roleId),
              eq(roleHiddenFields.module, entry.module),
              eq(roleHiddenFields.field, field),
            ),
          );
        if (!existingHidden) {
          await tx
            .insert(roleHiddenFields)
            .values({ companyId, roleId, module: entry.module, field });
        }
      }
    }

    if (applied) {
      await tx
        .update(defaultGrantsApplied)
        .set({ grantsVersion: entry.grantsVersion, appliedAt: sql`now()` })
        .where(
          and(
            forCompany(defaultGrantsApplied.companyId, companyId),
            eq(defaultGrantsApplied.module, entry.module),
            eq(defaultGrantsApplied.action, entry.action),
          ),
        );
    } else {
      await tx.insert(defaultGrantsApplied).values({
        companyId,
        module: entry.module,
        action: entry.action,
        grantsVersion: entry.grantsVersion,
      });
    }
  }

  return added as never;
}
