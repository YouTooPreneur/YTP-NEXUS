// TASK-0007 · The verify command. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readLock, readIndexStatuses, listTestFiles, selectTests, packageOf } from '../../tools/verify/lib.mjs';

const SHA = 'a'.repeat(64);
const verify = (...args) => spawnSync(process.execPath, ['tools/verify/verify.mjs', ...args], { encoding: 'utf8' });

test('readLock reads the lock lines and skips comments', () => {
  const lock = readLock(`# comment\n\nTASK-0001  tests/setup/TASK-0001.test.mjs  ${SHA}\nTASK-0002 apps/api/test/setup/health.test.ts ${'b'.repeat(64)}\n`);
  assert.deepEqual(lock, [
    { card: 'TASK-0001', path: 'tests/setup/TASK-0001.test.mjs', sha256: SHA },
    { card: 'TASK-0002', path: 'apps/api/test/setup/health.test.ts', sha256: 'b'.repeat(64) },
  ]);
});

test('readLock names the line it cannot read', () => {
  assert.throws(() => readLock(`TASK-0001 tests/a.test.mjs ${SHA}\nTASK-1 tests/b.test.mjs ${SHA}\n`), /line 2/);
  assert.throws(() => readLock(`TASK-0001 tests/a.test.mjs not-a-hash\n`), /line 1/);
});

test('readIndexStatuses finds the Status column by its header', () => {
  const md = [
    '# TASK INDEX',
    '',
    '| Task | Title | Step | Part | Builder | Reviewer | Depends on | Covers | Status | Done by |',
    '|---|---|---|---|---|---|---|---|---|---|',
    '| TASK-0001 | Workspace root | 2.1 | Set-up | Antigravity | Claude | 1.9 | NFR-015 | Done | antigravity |',
    '| TASK-0002 | Backend app | 2.1 | Set-up | Codex | Claude | 0001 | NFR-015 |  To do  | — |',
  ].join('\n');
  const statuses = readIndexStatuses(md);
  assert.equal(statuses.get('TASK-0001'), 'Done');
  assert.equal(statuses.get('TASK-0002'), 'To do');
});

test('selectTests runs Done cards, the named card and unlocked tests, and leaves the rest', () => {
  const files = ['a.test.mjs', 'b.test.mjs', 'c.test.mjs', 'mine.test.mjs'];
  const lock = [
    { card: 'TASK-0001', path: 'a.test.mjs', sha256: SHA },
    { card: 'TASK-0002', path: 'b.test.mjs', sha256: SHA },
    { card: 'TASK-0003', path: 'c.test.mjs', sha256: SHA },
  ];
  const statuses = new Map([['TASK-0001', 'Done'], ['TASK-0002', 'To do'], ['TASK-0003', 'In progress']]);
  assert.deepEqual(selectTests({ files, lock, statuses, card: null }), {
    run: ['a.test.mjs', 'mine.test.mjs'],
    left: ['b.test.mjs', 'c.test.mjs'],
  });
  assert.deepEqual(selectTests({ files, lock, statuses, card: 'TASK-0003' }), {
    run: ['a.test.mjs', 'c.test.mjs', 'mine.test.mjs'],
    left: ['b.test.mjs'],
  });
});

test('packageOf finds the package of a test file', () => {
  assert.equal(packageOf('apps/api/test/setup/health.test.ts'), 'apps/api');
  assert.equal(packageOf('packages/ui/test/button.test.tsx'), 'packages/ui');
  assert.equal(packageOf('tests/setup/TASK-0001.test.mjs'), null);
});

test('listTestFiles finds the planner tests and never the fixtures', () => {
  const files = listTestFiles('.');
  assert.ok(files.includes('tests/setup/TASK-0001.test.mjs'));
  assert.ok(files.includes('apps/api/test/setup/health.test.ts'));
  assert.ok(files.includes('apps/web/test/setup/app.test.tsx'));
  assert.ok(files.every((f) => !f.includes('node_modules') && !f.startsWith('tests/setup/fixtures/')));
  assert.deepEqual(files, [...files].sort());
});

test('the real lock file reads cleanly and every file in it exists', () => {
  for (const entry of readLock(readFileSync('tests/LOCK', 'utf8'))) {
    assert.ok(existsSync(entry.path), `tests/LOCK names a missing file: ${entry.path}`);
  }
});

test('--list shows the four first steps in order', () => {
  const out = verify('--list');
  assert.equal(out.status, 0);
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  const order = ['API client', 'Type check', 'Set-up tests', 'Unit and API tests'].map((n) => names.indexOf(n));
  assert.ok(order.every((i) => i >= 0), `missing a step in: ${names.join(', ')}`);
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
});

test('a wrong or unknown card is refused with exit code 2', () => {
  const bad = verify('--card', 'TASK-1');
  assert.equal(bad.status, 2);
  assert.match(bad.stdout + bad.stderr, /unknown card TASK-1/);
  const missing = verify('--card', 'TASK-9999');
  assert.equal(missing.status, 2);
  assert.match(missing.stdout + missing.stderr, /unknown card TASK-9999/);
  const other = verify('--fast');
  assert.equal(other.status, 2);
  assert.match(other.stdout + other.stderr, /unknown argument --fast/);
});

test('the root script runs it', () => {
  assert.equal(JSON.parse(readFileSync('package.json', 'utf8')).scripts.verify, 'node tools/verify/verify.mjs');
});
