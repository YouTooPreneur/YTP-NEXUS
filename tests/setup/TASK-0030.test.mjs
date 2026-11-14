// TASK-0030 · Roles, the permission list and default grants: the two database changes (found by name, so their numbers may change at merge), the schema and service files' shape, and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));
const change = (name) => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  const mine = tags.filter((tag) => tag.replace(/^\d{4}_/, '') === name);
  assert.equal(mine.length, 1, `one ${name} change in the journal`);
  assert.ok(readdirSync('apps/api/drizzle').includes(`${mine[0]}.sql`), `${mine[0]}.sql exists`);
  return { tag: mine[0], index: tags.indexOf(mine[0]) };
};

test('the table change and the rules and rights change come one after the other; the second is exactly the card’s', () => {
  const tables = change('core_roles');
  const rights = change('core_roles_rights');
  assert.equal(rights.index, tables.index + 1);
  assert.equal(
    read(`apps/api/drizzle/${rights.tag}.sql`),
    [
      "-- The four company tables of roles (DATA-MODEL 3.2): each gets the company row rule in its own change.",
      "CALL core.add_company_rules('core.roles');",
      "--> statement-breakpoint",
      "CALL core.add_company_rules('core.role_permissions');",
      "--> statement-breakpoint",
      "CALL core.add_company_rules('core.role_hidden_fields');",
      "--> statement-breakpoint",
      "CALL core.add_company_rules('core.default_grants_applied');",
      "--> statement-breakpoint",
      "-- The app reads and keeps roles (a role is deleted by setting deleted_at, never removed), grants and removes permissions",
      "-- and hidden fields, and registers the permission list (a system table) on every start.",
      "GRANT SELECT, INSERT, UPDATE ON core.roles TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON core.role_permissions TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, DELETE ON core.role_hidden_fields TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE ON core.permission_catalogue TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE ON core.default_grants_applied TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s schema and links grants and hidden fields to the role of the same company', () => {
  const path = 'apps/api/src/modules/core/schema/roles.ts';
  const schema = read(path);
  assert.ok(imports(path).some((line) => line === "import { core } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/);
  assert.match(schema, /core\.enum\('permission_scope', \['own', 'team', 'all'\]\)/);
  for (const name of ['roles', 'rolePermissions', 'roleHiddenFields', 'permissionCatalogue', 'defaultGrantsApplied']) {
    assert.match(schema, new RegExp(`export const ${name} = core\\.table\\(`), `${name} is exported`);
  }
  assert.equal((schema.match(/foreignColumns: \[roles\.companyId, roles\.id\]/g) || []).length, 2, 'two links to (company_id, id) of roles');
});

test('the service works in the transaction on the request context, filters company tables by company and logs new roles', () => {
  const path = 'apps/api/src/modules/core/service/roles.ts';
  const service = read(path);
  assert.ok(imports(path).includes("import { getContext } from '../../../shared/context.js';"));
  assert.ok(imports(path).includes("import { writeActivity } from '../repository/activity-log.js';"));
  assert.ok(imports(path).every((line) => !/db\/database\.js'/.test(line)), 'never the pools');
  assert.match(service, /forCompany\(/);
  assert.match(service, /'the roles need the transaction'/);
  for (const name of ['CORE_PERMISSIONS', 'DEFAULT_ROLES', 'registerPermissions', 'makeDefaultRoles', 'applyDefaultGrants']) {
    assert.match(service, new RegExp(`export (const|async function) ${name}\\b`), `${name} is exported`);
  }
  assert.doesNotMatch(service, /\.transaction\(|withCompany|securityWrite/);
});

test('Core’s module card lists the four lines under Data after the double-click keys, and the rule after the settings rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const first = lines.indexOf("- `core.roles`: a company's roles, nine made by default (`makeDefaultRoles`), each with its two-step, sign-out time and phone menu; a company table the app may read, add and change, never delete (DATA-MODEL 3.2, USR-002, USR-006)");
  assert.ok(first > data && first < rules, 'under ## Data');
  assert.ok(lines[first - 1].startsWith('- `core.idempotency_keys`:'), 'right after the double-click keys line');
  assert.deepEqual(lines.slice(first, first + 4), ["- `core.roles`: a company's roles, nine made by default (`makeDefaultRoles`), each with its two-step, sign-out time and phone menu; a company table the app may read, add and change, never delete (DATA-MODEL 3.2, USR-002, USR-006)", "- `core.role_permissions` and `core.role_hidden_fields`: what each role may do, with its scope, and which fields it does not see; company tables linked to the role of the same company (USR-002)", "- `core.permission_catalogue`: every action a module offers, registered from code on every start (`registerPermissions`); a system table the app may read, add and change (USR-003)", "- `core.default_grants_applied`: which module defaults a company has already received, so each version is given once (USR-006)"]);
  const rule = lines.indexOf("- Permissions are registered with `registerPermissions` (`modules/core/service/roles.ts`), and each module's default grants are given with `applyDefaultGrants` once per version, never undoing the Owner's changes; a link between two company tables always includes `company_id` on both sides (for example `FOREIGN KEY (company_id, role_id) REFERENCES core.roles (company_id, id)`), and the catalogue check refuses one that does not (TECH-DESIGN 5.1, USR-002, USR-003, USR-006)");
  assert.ok(rule > rules && lines[rule - 1].startsWith('- Each setting is defined once in code'), 'right after the settings rule');
});
