// TASK-0009 · Allowed-files check and test lock. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execSync, execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { sha256Of, checkTestLock } from '../../tools/verify/checks/test-lock.mjs';
import {
  readAllowedFiles,
  readStartPoint,
  matchesPattern,
  IGNORED_PATTERNS,
  builderFiles,
  changedFiles,
  checkAllowedFiles,
} from '../../tools/verify/checks/allowed-files.mjs';

const tempDir = () => mkdtempSync(join(tmpdir(), 'nexus-verify-'));
const hex = (text) => createHash('sha256').update(text).digest('hex');

test('sha256Of and checkTestLock spot missing, changed and doubled tests', () => {
  const dir = tempDir();
  try {
    writeFileSync(join(dir, 'a.test.mjs'), 'one');
    writeFileSync(join(dir, 'b.test.mjs'), 'two');
    assert.equal(sha256Of(join(dir, 'a.test.mjs')), hex('one'));
    const entries = [
      { card: 'TASK-0001', path: 'a.test.mjs', sha256: hex('one') },
      { card: 'TASK-0001', path: 'b.test.mjs', sha256: hex('not two') },
      { card: 'TASK-0002', path: 'gone.test.mjs', sha256: hex('x') },
      { card: 'TASK-0003', path: 'a.test.mjs', sha256: hex('one') },
    ];
    const problems = checkTestLock(dir, entries);
    assert.ok(problems.includes('changed: b.test.mjs'));
    assert.ok(problems.includes('missing: gone.test.mjs'));
    assert.ok(problems.includes('listed twice: a.test.mjs'));
    assert.deepEqual(checkTestLock(dir, [entries[0]]), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readAllowedFiles reads the first backticked path of each row', () => {
  const card = [
    '## CONTEXT',
    '| not | this table |',
    '## ALLOWED FILES (touch nothing else)',
    '| File | Action |',
    '|---|---|',
    '| `apps/api/src/app.ts` | edit |',
    '| `apps/api/src/modules/core/**` | create |',
    '',
    '## STEPS',
    '| `not/this.ts` | create |',
  ].join('\n');
  assert.deepEqual(readAllowedFiles(card), ['apps/api/src/app.ts', 'apps/api/src/modules/core/**']);
});

test('readStartPoint reads the start commit from the log', () => {
  assert.equal(readStartPoint('## Start check\n- Start point (commit): 3f2a9c1\n'), '3f2a9c1');
  assert.equal(readStartPoint('## Start check\n- Start point (commit): <hash>\n'), null);
});

test('matchesPattern understands * and **', () => {
  assert.ok(matchesPattern('docs/STATUS.md', 'docs/STATUS.md'));
  assert.ok(matchesPattern('apps/api/src/x.ts', 'apps/api/src/*.ts'));
  assert.ok(!matchesPattern('apps/api/src/a/x.ts', 'apps/api/src/*.ts'));
  assert.ok(matchesPattern('history/sessions/a/b.gz', 'history/**'));
  assert.ok(!matchesPattern('docs/history.md', 'history/**'));
});

test('machine-written paths and the builder\'s own files are always allowed', () => {
  assert.deepEqual(IGNORED_PATTERNS, ['history/**', 'share/**', 'tracker.html']);
  assert.deepEqual(builderFiles('TASK-0042'), [
    'docs/logs/TASK-0042.md',
    'docs/evidence/TASK-0042/**',
    'docs/STATUS.md',
    'docs/tasks/INDEX.md',
  ]);
  const changed = [
    'apps/api/src/app.ts',
    'apps/api/src/sneaky.ts',
    'docs/DECISIONS.md',
    'docs/evidence/TASK-0042/out.txt',
    'docs/logs/TASK-0042.md',
    'history/LATEST.md',
    'tracker.html',
  ];
  assert.deepEqual(checkAllowedFiles({ changed, allowed: ['apps/api/src/app.ts'], card: 'TASK-0042' }), [
    'apps/api/src/sneaky.ts',
    'docs/DECISIONS.md',
  ]);
});

test('changedFiles lists edited, added and untracked files since the start point', () => {
  const dir = tempDir();
  const git = (cmd) => execSync(`git ${cmd}`, { cwd: dir, stdio: 'pipe' });
  try {
    git('init -q');
    git('config user.email test@example.com');
    git('config user.name Test');
    writeFileSync(join(dir, 'kept.txt'), '1');
    writeFileSync(join(dir, 'edited.txt'), '1');
    git('add .');
    git('commit -q -m start');
    const start = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    writeFileSync(join(dir, 'edited.txt'), '2');
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'sub', 'new.txt'), 'n');
    writeFileSync(join(dir, 'committed.txt'), 'c');
    git('add committed.txt');
    git('commit -q -m more');
    assert.deepEqual(changedFiles(dir, start), ['committed.txt', 'edited.txt', 'sub/new.txt']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('changedFiles keeps to each card\'s own commits when later cards are built on top (a batch)', () => {
  const dir = tempDir();
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  const head = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  try {
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    writeFileSync(join(dir, 'base.txt'), '1');
    git('add', '.');
    git('commit', '-q', '-m', 'start');
    const start = head();
    writeFileSync(join(dir, 'first.txt'), 'a');
    git('add', 'first.txt');
    git('commit', '-q', '-m', 'TASK-0100: First card [antigravity]');
    const afterFirst = head();
    writeFileSync(join(dir, 'second.txt'), 'b');
    git('add', 'second.txt');
    git('commit', '-q', '-m', 'TASK-0101: Second card [antigravity]');
    const afterSecond = head();
    writeFileSync(join(dir, 'third.txt'), 'c');
    assert.deepEqual(changedFiles(dir, start, 'TASK-0100'), ['first.txt']);
    assert.deepEqual(changedFiles(dir, afterFirst, 'TASK-0101'), ['second.txt']);
    assert.deepEqual(changedFiles(dir, afterSecond, 'TASK-0102'), ['third.txt']);
    writeFileSync(join(dir, 'first-fix.txt'), 'f');
    git('add', 'first-fix.txt');
    git('commit', '-q', '-m', 'TASK-0100: Fix after review [antigravity]');
    assert.deepEqual(changedFiles(dir, start, 'TASK-0100'), ['first-fix.txt', 'first.txt']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a step that crashes counts as failed, the others still run, and a broken lock is reported', () => {
  const dir = tempDir();
  const run = () => spawnSync(process.execPath, ['tools/verify/verify.mjs'], { cwd: dir, encoding: 'utf8' });
  const lastLine = (text) => text.trim().split(/\r?\n/).at(-1);
  try {
    mkdirSync(join(dir, 'tools', 'verify'), { recursive: true });
    for (const file of ['verify.mjs', 'lib.mjs']) {
      copyFileSync(join('tools', 'verify', file), join(dir, 'tools', 'verify', file));
    }
    writeFileSync(
      join(dir, 'tools', 'verify', 'steps.mjs'),
      "export const steps = [\n  { name: 'Boom', run() { throw new Error('kaboom'); } },\n  { name: 'After', run() { return { ok: true }; } },\n];\n",
    );
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'LOCK'), '# no planner tests here\n');
    mkdirSync(join(dir, 'docs', 'tasks'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'tasks', 'INDEX.md'), '| Task | Status |\n|---|---|\n| TASK-0001 | Done |\n');
    let out = run();
    assert.equal(out.status, 1, out.stdout + out.stderr);
    assert.match(out.stdout, /✖ Boom \(crashed: kaboom\)/);
    assert.match(out.stdout, /✔ After/);
    assert.equal(lastLine(out.stdout), 'verify: FAILED: Boom');
    writeFileSync(join(dir, 'tests', 'LOCK'), 'not a lock line\n');
    out = run();
    assert.equal(out.status, 1, out.stdout + out.stderr);
    assert.equal(lastLine(out.stdout), 'verify: FAILED: tests/LOCK line 1: not a lock line');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('lint finds a misspelt name in verify code (eslint.config.mjs uses defineConfig)', () => {
  const config = readFileSync('eslint.config.mjs', 'utf8');
  assert.match(config, /import \{ defineConfig \} from 'eslint\/config';/);
  assert.match(config, /export default defineConfig\(/);
  const out = spawnSync(
    'pnpm',
    ['exec', 'eslint', '--stdin', '--stdin-filename', 'tools/verify/probe.mjs'],
    { input: 'export function f() {\n  return procss.argv.length;\n}\n', encoding: 'utf8', shell: true },
  );
  assert.notEqual(out.status, 0, `lint passed a misspelt name: ${out.stdout}${out.stderr}`);
  assert.match(out.stdout, /'procss' is not defined/);
});

test('the screens\' walls also cover the shared contracts package', () => {
  const out = spawnSync(
    'pnpm',
    ['exec', 'depcruise', 'apps', 'packages', '--config', resolve('.dependency-cruiser.cjs'), '--output-type', 'json'],
    { cwd: resolve('tests/setup/fixtures/arch'), encoding: 'utf8', shell: true, maxBuffer: 50 * 1024 * 1024 },
  );
  assert.ok(out.stdout, `depcruise printed nothing: ${out.stderr}`);
  const violations = JSON.parse(out.stdout).summary.violations.map((v) => ({ rule: v.rule.name, from: v.from }));
  const found = (rule, from) => violations.some((v) => v.rule === rule && v.from === from);
  for (const [rule, from] of [
    ['frontend-never-imports-backend', 'packages/contracts/src/bad-backend.ts'],
    ['frontend-no-server-packages', 'packages/contracts/src/bad-db.ts'],
  ]) {
    assert.ok(found(rule, from), `${rule} did not report ${from}. Reported: ${JSON.stringify(violations)}`);
  }
  assert.deepEqual(violations.filter((v) => v.from === 'packages/contracts/src/ok.ts'), [], 'the ok fixture was reported');
});

test('verify has the Test lock step before the set-up tests, and Allowed files last', () => {
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  assert.ok(names.indexOf('Test lock') >= 0 && names.indexOf('Test lock') < names.indexOf('Set-up tests'));
  assert.equal(names.at(-1), 'Allowed files');
});
