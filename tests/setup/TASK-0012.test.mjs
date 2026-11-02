// TASK-0012 · Contract, door and module-card checks. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { compareRoutesToContracts } from '../../tools/verify/checks/contract.mjs';
import { checkDoors } from '../../tools/verify/checks/doors.mjs';
import { checkModuleCards, SECTIONS } from '../../tools/verify/checks/module-cards.mjs';

const health = { operationId: 'getHealth', method: 'get', path: '/api/health', module: 'core', public: true, permission: null, feature: null };
const listUsers = {
  operationId: 'listUsers', method: 'get', path: '/api/core/users', module: 'core', public: false,
  permission: { module: 'core.users', action: 'view' }, feature: 'core.users',
};
const openapi = {
  paths: {
    '/api/health': { get: { operationId: 'getHealth' } },
    '/api/core/users': { get: { operationId: 'listUsers' } },
  },
};

test('compareRoutesToContracts finds doors missing on either side', () => {
  assert.deepEqual(compareRoutesToContracts([health, listUsers], openapi), []);
  assert.deepEqual(compareRoutesToContracts([health], openapi), ['contract without route: get /api/core/users listUsers']);
  const extra = { ...listUsers, operationId: 'deleteUser', method: 'delete', path: '/api/core/users/{userId}' };
  assert.deepEqual(compareRoutesToContracts([health, listUsers, extra], openapi), [
    'route without contract: delete /api/core/users/{userId} deleteUser',
  ]);
});

test('checkDoors finds doors without a permission or feature, and checks the sign-in list once it exists', () => {
  const allowed = JSON.parse(readFileSync('tools/verify/auth-routes.json', 'utf8'));
  assert.equal(allowed.length, 7);
  assert.ok(allowed.includes('POST /api/auth/sign-in/email'));
  assert.deepEqual(checkDoors({ routes: [health, listUsers], authRoutes: [], allowedAuthRoutes: allowed }), []);
  const sloppy = { ...listUsers, feature: null };
  assert.deepEqual(checkDoors({ routes: [sloppy], authRoutes: [], allowedAuthRoutes: allowed }), [
    'door without permission or feature: listUsers',
  ]);
  const open = [...allowed.filter((r) => r !== 'POST /api/auth/sign-out'), 'POST /api/auth/update-user'];
  assert.deepEqual(checkDoors({ routes: [], authRoutes: open, allowedAuthRoutes: allowed }), [
    'sign-in door not on the list: POST /api/auth/update-user',
    'sign-in door on the list but missing: POST /api/auth/sign-out',
  ]);
});

test('checkModuleCards wants the six parts, every door and every announcement', () => {
  assert.deepEqual(SECTIONS, ['## Data', '## Rules', '## Screens', '## Window', '## Announcements', '## Night checklist']);
  const good = SECTIONS.map((s) =>
    s === '## Window' ? `${s}\n- \`getHealth\`: GET /api/health\n- \`listUsers\`: GET /api/core/users` :
    s === '## Announcements' ? `${s}\n- \`core.user.disabled\`: when a person is disabled` : `${s}\n- (none yet)`,
  ).join('\n\n');
  const announcements = [{ name: 'core.user.disabled', module: 'core' }];
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: good }], routes: [health, listUsers], announcements }), []);

  const missingDoor = good.replace('- `listUsers`: GET /api/core/users', '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: missingDoor }], routes: [health, listUsers], announcements }), [
    'listUsers is not listed under Window in core/MODULE.md',
  ]);

  const doorUnderWrongSection = good.replace('## Rules\n- (none yet)', '## Rules\n- `listUsers` is mentioned here only').replace('- `listUsers`: GET /api/core/users', '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: doorUnderWrongSection }], routes: [health, listUsers], announcements }), [
    'listUsers is not listed under Window in core/MODULE.md',
  ]);

  const noNight = good.replace(/## Night checklist[\s\S]*$/, '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: noNight }], routes: [], announcements: [] }), [
    'MODULE.md of core is missing the section ## Night checklist',
  ]);
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'crm', card: null }], routes: [], announcements: [] }), [
    'module crm has no MODULE.md',
  ]);
  assert.deepEqual(
    checkModuleCards({ modules: [{ name: 'core', card: good.replace('`core.user.disabled`', 'core.user.disabled') }], routes: [], announcements }),
    ['core.user.disabled is not listed under Announcements in core/MODULE.md'],
  );
});

test('the real backend lists the health door as public, and the Core card lists it', () => {
  const out = spawnSync('pnpm', ['--filter', '@ytp/api', '--silent', 'routes:list'], { encoding: 'utf8', shell: true });
  const listed = JSON.parse(out.stdout);
  assert.ok(Array.isArray(listed.authRoutes));
  assert.ok(Array.isArray(listed.announcements));
  const h = listed.routes.find((r) => r.operationId === 'getHealth');
  assert.deepEqual(h, health);
  const card = readFileSync('apps/api/src/modules/core/MODULE.md', 'utf8');
  for (const section of SECTIONS) assert.ok(card.includes(section), `Core card is missing ${section}`);
  assert.match(card, /## Window[\s\S]*`getHealth`/);
});

test('verify runs the three checks after Architecture, and Allowed files stays last', () => {
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  const order = ['Architecture', 'Contract', 'Doors', 'Module cards'].map((n) => names.indexOf(n));
  assert.ok(order.every((i) => i >= 0), `missing a step in: ${names.join(', ')}`);
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
  assert.equal(names.at(-1), 'Allowed files');
});
