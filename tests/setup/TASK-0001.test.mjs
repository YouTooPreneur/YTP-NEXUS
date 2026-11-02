// TASK-0001 · Workspace root. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const read = (path) => readFileSync(path, 'utf8');
const lines = (path) => read(path).split(/\r?\n/);

test('package.json is the private workspace root', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, 'ytp-nexus');
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.packageManager, 'pnpm@11.10.0');
  assert.equal(pkg.engines?.node, '>=24 <25');
  assert.equal(typeof pkg.scripts, 'object');
});

test('the pnpm workspace lists the apps and packages folders', () => {
  const ws = read('pnpm-workspace.yaml');
  assert.match(ws, /^packages:\s*$/m);
  assert.match(ws, /^\s*-\s*["']?apps\/\*["']?\s*$/m);
  assert.match(ws, /^\s*-\s*["']?packages\/\*["']?\s*$/m);
  assert.match(ws, /^allowBuilds:\s*$/m, 'pnpm 11 needs the allowBuilds list');
  assert.match(ws, /^\s+esbuild:\s*true\s*$/m, 'esbuild must be allowed to run its install script');
});

test('the Node version file says 24', () => {
  assert.equal(read('.node-version').trim(), '24');
});

test('the shared TypeScript settings are strict', () => {
  const options = JSON.parse(read('tsconfig.base.json')).compilerOptions;
  assert.equal(options.target, 'ES2023');
  assert.equal(options.strict, true);
  assert.equal(options.noUncheckedIndexedAccess, true);
  assert.equal(options.noImplicitOverride, true);
  assert.equal(options.verbatimModuleSyntax, true);
  assert.equal(options.isolatedModules, true);
  assert.equal(options.skipLibCheck, true);
});

test('editor and line-ending rules exist', () => {
  const editor = read('.editorconfig');
  assert.match(editor, /^root\s*=\s*true/m);
  assert.match(editor, /end_of_line\s*=\s*lf/);
  assert.match(editor, /indent_size\s*=\s*2/);
  assert.match(read('.gitattributes'), /^\*\s+text=auto\s+eol=lf\s*$/m);
});

test('.gitignore keeps generated and local files out, and keeps the old lines', () => {
  const ignored = lines('.gitignore');
  for (const line of [
    'node_modules/',
    '.env',
    'apps/web/src/api/',
    'packages/contracts/openapi.json',
    '*.tsbuildinfo',
    'playwright-report/',
    'test-results/',
  ]) {
    assert.ok(ignored.includes(line), `.gitignore is missing the line: ${line}`);
  }
});

test('the pinned pnpm is the one in use', () => {
  assert.equal(execSync('pnpm --version', { encoding: 'utf8' }).trim(), '11.10.0');
  assert.ok(existsSync('package.json'));
});
