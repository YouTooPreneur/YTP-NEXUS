// TASK-0095 · The door kinds read plainly in route.ts, the door check accepting signed-in doors, and the routes listing marking them. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkDoors } from '../../tools/verify/checks/doors.mjs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

test('route.ts reads the door kinds plainly, with no casts and no non-null assertion on the hooks', () => {
  const route = read('apps/api/src/shared/route.ts');
  for (const kind of ['def.public === true', 'def.signedIn === true', 'def.permission', 'def.feature']) {
    assert.ok(route.includes(kind), `route.ts reads ${kind}`);
  }
  assert.doesNotMatch(route, /\bas (never|unknown|\{)|hooks!/);
  assert.match(route, /the answer does not match its contract/);
});

test('the door check accepts a signed-in door with a feature key and still reports the others', () => {
  const signedIn = { operationId: 'getMyProfile', public: false, signedIn: true, permission: null, feature: 'core.profile' };
  const noFeature = { operationId: 'getMine', public: false, signedIn: true, permission: null, feature: null };
  const neither = { operationId: 'getLoose', public: false, permission: null, feature: 'core.test' };
  assert.deepEqual(checkDoors({ routes: [signedIn], authRoutes: [], allowedAuthRoutes: [] }), []);
  assert.deepEqual(checkDoors({ routes: [noFeature, neither], authRoutes: [], allowedAuthRoutes: [] }), [
    'door without permission or feature: getLoose',
    'door without permission or feature: getMine',
  ]);
});

test('the routes listing marks signed-in doors and leaves the key out on every other door', () => {
  assert.match(read('apps/api/scripts/list-routes.ts'), /\.\.\.\(r\.signedIn \? \{ signedIn: true \} : \{\}\)/);
});
