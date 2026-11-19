// TASK-0031 · The permission and hideFields lines in hooks.ts, the access type and field on the request context, the contract's hideableFields map, the shape of access.ts and hide-fields.ts, and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const code = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

const ACCESS_TYPES = `// What the permission step found for the door (TASK-0031): the scope of the records the person may reach and the
// names of the fields their role does not see, declared here so the request context imports nothing more.
export type AccessScope = 'own' | 'team' | 'all';
export interface Access {
  scope: AccessScope;
  hiddenFields: readonly string[];
}
`;
const ACCESS_FIELD = `  // The permission step's answer (TASK-0031); absent on public and signed-in-only doors.
  access?: Access;
`;
const RULE_LINE =
  "- Every door with a permission runs Core's one permission check, `checkPermission` (`modules/core/service/access.ts`), after the feature switch: it reads the person's role from `core.users` in the request's transaction, takes no lock and caches nothing, and puts `access` (the grant's scope and every field the role does not see, in every module) on the request context; a person missing in the company, deleted or purged answers 401 `not_signed_in`, and no grant for the door, or a deleted role, 403 `not_allowed`; the Owner has no way around its own grants. Then `hideFields` (`src/shared/hide-fields.ts`) removes those fields from the answer at the paths the door's contract names (`hideableFields`), and module repositories read the scope with `currentAccess()` (TECH-DESIGN section 2, steps 10 and 14, and 6.2; USR-002, USR-003)";

test('hooks.ts runs the real permission and hideFields steps, and nothing else in it changes for them', () => {
  const hooks = read('apps/api/src/shared/hooks.ts');
  assert.match(hooks, /^import \{ checkPermission \} from '\.\.\/modules\/core\/service\/access\.js';$/m);
  assert.match(hooks, /^import \{ hideFields \} from '\.\/hide-fields\.js';$/m);
  assert.match(hooks, /^ {4}permission: async \(info\) => checkPermission\(info\),$/m);
  assert.match(hooks, /^ {4}hideFields: \(info, answer\) => hideFields\(info, answer\),$/m);
  assert.doesNotMatch(hooks, /notBuilt\('(permission|hideFields)'\)/);
});

test('the request context declares the access type itself and carries it as one optional field', () => {
  const context = read('apps/api/src/shared/context.ts');
  assert.ok(context.includes(ACCESS_TYPES), 'the access types, word for word');
  assert.ok(context.includes(`  sessionId?: string;\n${ACCESS_FIELD}`), 'the access field, right after the session ID');
  assert.doesNotMatch(context, /^import .*(access|roles)\.js'/m, 'the types come from no other file');
});

test('a contract names its hideable fields as a map from answer path to hidden name', () => {
  assert.match(read('packages/contracts/src/contract.ts'), /^ {2}hideableFields\?: Readonly<Record<string, string>>;$/m);
  assert.match(read('packages/contracts/src/index.ts'), /^export \* from '\.\/hideable\.js';$/m);
  assert.match(read('packages/contracts/src/hideable.ts'), /^export function hideableProblems\(contract: Contract\): string\[\] \{$/m);
});

test('the permission check reads, never locks, and answers only with the agreed refusals', () => {
  const access = read('apps/api/src/modules/core/service/access.ts');
  assert.match(access, /^export async function accessFor\(permission: \{ module: string; action: string \}\): Promise<Access> \{$/m);
  assert.match(access, /^export async function checkPermission\(info: RouteInfo\): Promise<void> \{$/m);
  assert.match(access, /^export function currentAccess\(\): Access \{$/m);
  assert.ok(access.includes("new AppError(401, 'not_signed_in', 'Please sign in.')"));
  assert.ok(access.includes("new AppError(403, 'not_allowed', 'You are not allowed to do this.')"));
  const body = code(access);
  for (const table of ['users', 'roles', 'rolePermissions', 'roleHiddenFields']) {
    assert.match(body, new RegExp(`forCompany\\(\\s*(\\w+\\.)?${table}\\.companyId\\s*,`), `forCompany on ${table}, a company table the check reads`);
  }
  assert.doesNotMatch(body, /\.for\(|FOR (UPDATE|SHARE|NO KEY|KEY)|pg_advisory|\.transaction\(|withCompany|securityWrite|inCompanyTransaction/);
  assert.doesNotMatch(body, /\b(logger|console)\b|writeActivity|writeSecurity|\.insert\(|\.update\(|\.delete\(/);
});

test('hideFields is a plain synchronous function', () => {
  const hide = read('apps/api/src/shared/hide-fields.ts');
  assert.match(hide, /^export function hideFields\(info: RouteInfo, answer: unknown\): unknown \{$/m);
  assert.doesNotMatch(code(hide), /\basync\b|\bawait\b|Promise/);
});

test('Core’s module card has the permission rule right after the who-is-asking rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rules = lines.indexOf('## Rules');
  const rule = lines.indexOf(RULE_LINE);
  assert.ok(rule > rules, 'the rule is under ## Rules');
  assert.ok(lines[rule - 1].startsWith('- Every non-public door first learns who is asking with `whoIsAsking`'), 'right after the who-is-asking rule');
});
