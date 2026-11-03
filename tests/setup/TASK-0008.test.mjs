// TASK-0008 · Code style and architecture checks. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fixtureRoot = resolve('tests/setup/fixtures/arch');
const config = resolve('.dependency-cruiser.cjs');

function cruiseFixtures() {
  const out = spawnSync(
    'pnpm',
    ['exec', 'depcruise', 'apps', '--config', config, '--output-type', 'json'],
    { cwd: fixtureRoot, encoding: 'utf8', shell: true, maxBuffer: 50 * 1024 * 1024 },
  );
  assert.ok(out.stdout, `depcruise printed nothing: ${out.stderr}`);
  const result = JSON.parse(out.stdout);
  return result.summary.violations.map((v) => ({ rule: v.rule.name, from: v.from, to: v.to }));
}

test('the config files and scripts exist', () => {
  for (const file of ['eslint.config.mjs', '.prettierrc.json', '.prettierignore', '.dependency-cruiser.cjs']) {
    assert.ok(existsSync(file), `missing ${file}`);
  }
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
  assert.equal(scripts.lint, 'eslint .');
  assert.equal(scripts['format:check'], 'prettier --check .');
  assert.equal(scripts.depcruise, 'depcruise apps packages --config .dependency-cruiser.cjs');
  const prettier = JSON.parse(readFileSync('.prettierrc.json', 'utf8'));
  assert.deepEqual(prettier, { singleQuote: true, semi: true, printWidth: 100, trailingComma: 'all', endOfLine: 'lf' });
});

test('every architecture rule catches its broken fixture', () => {
  const violations = cruiseFixtures();
  const found = (rule, fromEnd) =>
    violations.some((v) => (v.rule === rule || v.rule.startsWith(rule)) && v.from.endsWith(fromEnd));
  const expected = [
    ['frontend-never-imports-backend', 'apps/web/src/bad-backend.ts'],
    ['frontend-no-server-packages', 'apps/web/src/bad-db.ts'],
    ['module-walls', 'apps/api/src/modules/finance/bad-wall.ts'],
    ['core-asks-no-module', 'apps/api/src/modules/core/bad-upward.ts'],
    ['floor-rules-crm', 'apps/api/src/modules/crm/bad-floor.ts'],
    ['auth-schema-wall', 'apps/api/src/modules/crm/bad-auth.ts'],
  ];
  for (const [rule, from] of expected) {
    assert.ok(found(rule, from), `${rule} did not report ${from}. Reported: ${JSON.stringify(violations)}`);
  }
  assert.ok(
    violations.some((v) => v.rule === 'no-circular' && /\/bad-loop-[ab]\.ts$/.test(v.from)),
    `no-circular did not report the loop. Reported: ${JSON.stringify(violations)}`,
  );
});

test('the allowed paths are never reported', () => {
  const violations = cruiseFixtures();
  const okFiles = violations.filter((v) => /\/ok(-[a-z]+)?\.ts$/.test(v.from));
  assert.deepEqual(okFiles, [], 'an ok-* fixture was reported');
});

test('verify runs lint, format and architecture after the type check', () => {
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  const order = ['Type check', 'Lint', 'Format', 'Architecture'].map((n) => names.indexOf(n));
  assert.ok(order.every((i) => i >= 0), `missing a step in: ${names.join(', ')}`);
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
});
