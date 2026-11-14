// TASK-0096 · The role functions give their plain return types again (TASK-0030 had to hide them while a planner test refused them). Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const service = readFileSync('apps/api/src/modules/core/service/roles.ts', 'utf8').replace(/\r\n/g, '\n');

test('the three role functions declare their plain return types', () => {
  assert.match(service, /export async function registerPermissions\(entries: PermissionEntry\[\]\): Promise<void> \{/);
  assert.match(service, /export async function makeDefaultRoles\(\): Promise<Record<string, string>> \{/);
  assert.match(service, /export async function applyDefaultGrants\(\): Promise<number> \{/);
});

test('the service hides no type: no cast to never, no any, no non-null assertion', () => {
  assert.doesNotMatch(service, /\bas never\b/);
  assert.doesNotMatch(service, /RuntimeResult|JSON\.parse/);
  assert.doesNotMatch(service, /:\s*any\b|<any>|\bas any\b/);
  assert.doesNotMatch(service, /[\w)\]]!(?!=)/);
});

test('the behaviour stays: the same messages and the same activity entry', () => {
  for (const text of ["'the roles need the transaction'", "'the default role was not saved'", "actor: { type: 'system', label: 'default roles' }"]) {
    assert.ok(service.includes(text), `the service still has ${text}`);
  }
});
