import { and, eq, isNull } from 'drizzle-orm';
import { forCompany } from '../../../db/company.js';
import { getContext, type Access } from '../../../shared/context.js';
import { AppError } from '../../../shared/errors.js';
import type { RouteInfo } from '../../../shared/route.js';
import { roleHiddenFields, rolePermissions, roles } from '../schema/roles.js';
import { users } from '../schema/users.js';

// Core's one permission check (D-019; TECH-DESIGN section 2, step 10, and 6.2; USR-002, USR-003). For one permission
// it reads, in the request's own transaction, the person's row in core.users with their role, the role's grant for
// exactly that permission, and every field the role does not see, in every module. It takes no lock, opens no
// transaction, writes, logs and keeps nothing, so a change to a grant, a hidden field or the person applies to the very
// next request; the Owner passes only through its own grants, like any role. A person missing in the request's
// company, deleted or purged answers 401 not_signed_in; a deleted role, or no grant, 403 not_allowed. A database
// failure goes through as it is (500).
export async function accessFor(permission: { module: string; action: string }): Promise<Access> {
  const { tx, companyId, userId } = getContext();
  if (!tx || !companyId || !userId) {
    throw new Error('the permission check needs the request transaction and the person');
  }

  const [person] = await tx
    .select({ roleId: users.roleId, roleDeletedAt: roles.deletedAt })
    .from(users)
    .innerJoin(roles, and(eq(roles.companyId, users.companyId), eq(roles.id, users.roleId)))
    .where(
      and(
        forCompany(users.companyId, companyId),
        forCompany(roles.companyId, companyId),
        eq(users.id, userId),
        isNull(users.deletedAt),
        isNull(users.purgedAt),
      ),
    );
  if (!person) {
    throw new AppError(401, 'not_signed_in', 'Please sign in.');
  }
  if (person.roleDeletedAt !== null) {
    throw new AppError(403, 'not_allowed', 'You are not allowed to do this.');
  }

  const [grant] = await tx
    .select({ scope: rolePermissions.scope })
    .from(rolePermissions)
    .where(
      and(
        forCompany(rolePermissions.companyId, companyId),
        eq(rolePermissions.roleId, person.roleId),
        eq(rolePermissions.module, permission.module),
        eq(rolePermissions.action, permission.action),
      ),
    );
  if (!grant) {
    throw new AppError(403, 'not_allowed', 'You are not allowed to do this.');
  }

  const hidden = await tx
    .select({ field: roleHiddenFields.field })
    .from(roleHiddenFields)
    .where(
      and(
        forCompany(roleHiddenFields.companyId, companyId),
        eq(roleHiddenFields.roleId, person.roleId),
      ),
    );
  // Each name once, sorted by JavaScript itself, never left to the database's order or collation.
  const hiddenFields = [...new Set(hidden.map((row) => row.field))].sort();
  return { scope: grant.scope, hiddenFields };
}

// The permission step of every door with a permission (route.ts runs it after the feature switch): the access it finds
// goes on the request's own context, where the hidden-fields step and the module repositories read it.
export async function checkPermission(info: RouteInfo): Promise<void> {
  const permission = info.route.permission;
  if (!permission) {
    throw new Error(`${info.route.operationId}: the permission step needs the door's permission`);
  }
  const access = await accessFor(permission);
  getContext().access = access;
}

// The scope and hidden fields of the door being served, for a module's repository. Without the permission step it
// refuses (500), so a missing scope is never read as "all".
export function currentAccess(): Access {
  const { access } = getContext();
  if (!access) {
    throw new Error('the scope needs the permission step');
  }
  return access;
}
