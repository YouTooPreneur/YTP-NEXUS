// TASK-0013 · Smoke test set-up and the GitHub check run. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { listTestFiles } from '../../tools/verify/lib.mjs';

const read = (path) => readFileSync(path, 'utf8');

test('Playwright is pinned and checks computer and phone width', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.devDependencies['@playwright/test'], '1.64.1');
  const config = read('playwright.config.ts');
  assert.match(config, /testDir:\s*['"]tests\/e2e['"]/);
  assert.match(config, /name:\s*['"]computer['"][\s\S]*?width:\s*1600[\s\S]*?height:\s*1000/);
  assert.match(config, /name:\s*['"]phone['"][\s\S]*?width:\s*375[\s\S]*?height:\s*812/);
  assert.match(config, /baseURL:\s*['"]http:\/\/localhost:5173['"]/);
  assert.match(config, /http:\/\/localhost:3000\/api\/health/);
  assert.equal((config.match(/reuseExistingServer:\s*false/g) || []).length, 2, 'both webServer entries keep reuseExistingServer: false (CR-010)');
  assert.doesNotMatch(config, /reuseExistingServer:\s*true/);
});

test('the end-to-end tests are found and run before Allowed files', () => {
  assert.ok(listTestFiles('.').includes('tests/e2e/smoke.spec.ts'));
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  assert.equal(names.at(-2), 'End-to-end smoke');
  assert.equal(names.at(-1), 'Allowed files');
});

test('GitHub runs pnpm verify on every change with pinned actions', () => {
  const wf = read('.github/workflows/verify.yml');
  assert.match(wf, /^name:\s*verify\s*$/m);
  assert.match(wf, /push/);
  assert.match(wf, /pull_request/);
  assert.match(wf, /runs-on:\s*ubuntu-24\.04/);
  assert.match(wf, /uses:\s*actions\/checkout@v7\.0\.1/);
  assert.match(wf, /uses:\s*pnpm\/action-setup@v6\.1\.0/);
  assert.match(wf, /uses:\s*actions\/setup-node@v7\.1\.0/);
  assert.match(wf, /node-version-file:\s*\.node-version/);
  assert.match(wf, /pnpm install --frozen-lockfile/);
  assert.match(wf, /playwright install --with-deps chromium/);
  assert.match(wf, /run:\s*pnpm verify\s*$/m);
  assert.doesNotMatch(wf, /@(main|master|v\d+)\s*$/m);
});

test('the page shows the API status from the generated client', () => {
  const status = read('apps/web/src/ApiStatus.tsx');
  assert.match(status, /useGetHealth/);
  for (const text of ['API: checking…', 'API: connected', 'API: not reachable']) assert.ok(status.includes(text), text);
  assert.match(read('apps/web/src/App.tsx'), /QueryClientProvider/);
});
