// TASK-0009 · Allowed-files check and test lock. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
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

test('verify has the Test lock step before the set-up tests, and Allowed files last', () => {
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  assert.ok(names.indexOf('Test lock') >= 0 && names.indexOf('Test lock') < names.indexOf('Set-up tests'));
  assert.equal(names.at(-1), 'Allowed files');
});
