// TASK-0088 · Root files type-checked, lint warnings as errors, every end-to-end test runs. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { steps } from '../../tools/verify/steps.mjs';

const read = (path) => readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const run = (args, input) => spawnSync('pnpm', args, { input, encoding: 'utf8', shell: true });
const lint = (filename, text) => run(['exec', 'eslint', '--stdin', '--stdin-filename', filename], text);
// Probe files live in a throwaway folder inside tests/e2e (eslint and prettier skip tests/, listTestFiles reads only the files
// directly in tests/e2e, and nothing else picks up a subfolder); every test removes its folder in finally.
const probeFolder = () => mkdtempSync(join('tests', 'e2e', 'probe-0088-'));

test('TypeScript and Node types are pinned at the root, and the root files are covered', () => {
  const pkg = json('package.json');
  assert.equal(pkg.devDependencies.typescript, '6.0.3');
  assert.equal(pkg.devDependencies['@types/node'], '24.19.2');
  const root = json('tsconfig.json');
  assert.equal(root.extends, './tsconfig.base.json');
  // Lenient on purpose: a later card may add a root config file or another types entry.
  assert.ok(root.include.includes('playwright.config.ts'), 'playwright.config.ts is type-checked');
  assert.ok(!root.include.some((p) => p.startsWith('tests')), 'tests/e2e is added by the Type check step, not by include');
  assert.ok(root.compilerOptions.types.includes('node'), "Node's types are on at the root");
  assert.equal(root.compilerOptions.noEmit, true);
  assert.ok(json('apps/web/tsconfig.json').include.includes('orval.config.ts'), 'orval.config.ts is type-checked with the screens');
});

test('the root settings catch misspelt options and a misspelt name in a Playwright config', () => {
  const dir = probeFolder();
  try {
    // One mistake per file: TypeScript reports only one wrong option per defineConfig call, and none when the call also holds a wrong name.
    const config = (body) => `import { defineConfig } from '@playwright/test';\n\nexport default defineConfig({\n${body}\n});\n`;
    writeFileSync(join(dir, 'top-option.ts'), config('  forbidOnyl: true,'));
    writeFileSync(join(dir, 'phone-option.ts'), config("  projects: [{ name: 'phone', use: { isMobil: true } }],"));
    writeFileSync(join(dir, 'wrong-name.ts'), 'export const onGitHub = !!proces.env.CI;\n');
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({ extends: '../../../tsconfig.json', include: ['top-option.ts', 'phone-option.ts', 'wrong-name.ts'] }),
    );
    const out = run(['exec', 'tsc', '--noEmit', '-p', join(dir, 'tsconfig.json')]);
    const text = out.stdout + out.stderr;
    assert.notEqual(out.status, 0, text);
    assert.doesNotMatch(text, /TS5083|TS6053|TS2688/, `the root tsconfig.json or its Node types are missing: ${text}`);
    for (const name of ['forbidOnyl', 'isMobil']) assert.match(text, new RegExp(`'${name}'`), `${name} was not reported: ${text}`);
    // "Did you mean 'process'" needs Node's types at the root (types: ["node"]).
    assert.match(text, /Cannot find name 'proces'\. Did you mean 'process'\?/, text);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the screens catch a misspelt option in their API client settings (orval)', () => {
  const dir = mkdtempSync(join('apps', 'web', 'probe-0088-'));
  try {
    writeFileSync(
      join(dir, 'orval-probe.ts'),
      "import { defineConfig } from 'orval';\n\nexport default defineConfig({\n  nexus: {\n    input: 'x.json',\n    output: { target: 'x.ts', override: { fetch: { forceSucessResponse: true } } },\n  },\n});\n",
    );
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: '../tsconfig.json', include: ['orval-probe.ts'] }));
    const out = run(['--filter', '@ytp/web', 'exec', 'tsc', '--noEmit', '-p', join(dir, 'tsconfig.json').replace(/^apps[\\/]web[\\/]/, '')]);
    const text = out.stdout + out.stderr;
    assert.notEqual(out.status, 0, text);
    assert.match(text, /'forceSucessResponse'/, text);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the Type check step type-checks the root files and the selected end-to-end files', () => {
  const dir = probeFolder();
  try {
    const probe = join(dir, 'wrong-type.ts').replace(/\\/g, '/');
    writeFileSync(probe, "export const count: number = 'not a number';\n");
    // The step runs in its own process, so its planted TS2322 line is read here and never printed into a verify run.
    const script = `import('./tools/verify/steps.mjs').then(({ steps }) => process.exit(steps.find((s) => s.name === 'Type check').run({ root: '.', selected: ['${probe}'] }).ok ? 0 : 1))`;
    const out = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    assert.equal(out.status, 1, out.stdout + out.stderr);
    assert.match(out.stdout, /wrong-type\.ts\(1,14\): error TS2322/, out.stdout + out.stderr);
    // The root files stay in the list: playwright.config.ts is type-checked together with the selected end-to-end files.
    assert.deepEqual(json('tsconfig.verify.json').include, [...json('tsconfig.json').include, probe]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('lint fails on a missing hook dependency (screens and ui), an unused eslint-disable and a mistake in a .js or .cjs file', () => {
  const hookProbe =
    "import { useEffect } from 'react';\n\nexport function Probe({ id }: { id: string }) {\n  useEffect(() => {\n    document.title = id;\n  }, []);\n  return null;\n}\n";
  for (const where of ['apps/web/src', 'packages/ui/src']) {
    const hook = lint(`${where}/probe-0088.tsx`, hookProbe);
    assert.notEqual(hook.status, 0, `${where}: ${hook.stdout}`);
    assert.match(hook.stdout, /error\s+React Hook useEffect has a missing dependency/, `${where}: ${hook.stdout}`);
  }
  const directive = lint('apps/api/src/probe-0088.ts', '// eslint-disable-next-line no-console\nexport const value = 1;\n');
  assert.notEqual(directive.status, 0, directive.stdout);
  assert.match(directive.stdout, /error\s+Unused eslint-disable directive/);
  // A .cjs file gets the recommended rules and Node's globals, and may use require().
  const cjs = lint('probe-0088.cjs', "const path = require('node:path');\nmodule.exports = { value: notDefinedAnywhere, path };\n");
  assert.notEqual(cjs.status, 0, cjs.stdout);
  assert.match(cjs.stdout, /'notDefinedAnywhere' is not defined/);
  assert.doesNotMatch(cjs.stdout, /'module' is not defined|'require' is not defined|no-require-imports/, cjs.stdout);
  const plainJs = lint('probe-0088.js', 'export const value = notDefinedAnywhere;\n');
  assert.notEqual(plainJs.status, 0, plainJs.stdout);
  assert.match(plainJs.stdout, /'notDefinedAnywhere' is not defined/);
});

test('every selected end-to-end test runs, tagged @smoke or not', () => {
  const smoke = steps.find((s) => s.name === 'End-to-end smoke');
  assert.doesNotMatch(smoke.run.toString(), /--grep|@smoke/, 'the step runs every test in the selected files');
  const dir = probeFolder();
  try {
    const probe = join(dir, 'untagged.spec.ts').replace(/\\/g, '/');
    writeFileSync(probe, "import { test } from '@playwright/test';\n\ntest('an untagged probe', () => {});\n");
    const out = run(['exec', 'playwright', 'test', '--list', probe]);
    assert.equal(out.status, 0, out.stdout + out.stderr);
    assert.match(out.stdout, /an untagged probe/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
