// TASK-0002 · Backend app. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pkg = () => JSON.parse(readFileSync('apps/api/package.json', 'utf8'));

test('the backend package has the agreed name and scripts', () => {
  const p = pkg();
  assert.equal(p.name, '@ytp/api');
  assert.equal(p.private, true);
  assert.equal(p.type, 'module');
  for (const script of ['dev', 'worker', 'build', 'start', 'typecheck', 'test']) {
    assert.ok(p.scripts?.[script], `missing script: ${script}`);
  }
});

test('every dependency version is exact', () => {
  const p = pkg();
  const all = { ...p.dependencies, ...p.devDependencies };
  assert.equal(all.express, '5.3.0');
  assert.equal(all.typescript, '6.0.3');
  assert.equal(all.vitest, '5.0.5');
  for (const [name, version] of Object.entries(all)) {
    assert.match(version, /^(\d+\.\d+\.\d+|workspace:\*)$/, `${name} must be pinned exactly, found ${version}`);
  }
});

test('the backend has its two start commands', () => {
  assert.ok(existsSync('apps/api/src/main.ts'));
  assert.ok(existsSync('apps/api/src/worker.ts'));
  assert.ok(existsSync('apps/api/src/app.ts'));
});
