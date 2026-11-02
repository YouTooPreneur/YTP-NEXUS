// TASK-0005 · Generated API client. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const read = (path) => readFileSync(path, 'utf8');

test('the root has one command that makes the API description and the client', () => {
  const root = JSON.parse(read('package.json'));
  assert.equal(
    root.scripts?.['api:generate'],
    'pnpm --filter @ytp/contracts openapi && pnpm --filter @ytp/web api',
  );
});

test('the contract package and the client tool are pinned', () => {
  const contracts = JSON.parse(read('packages/contracts/package.json'));
  assert.equal(contracts.name, '@ytp/contracts');
  assert.equal(contracts.dependencies.zod, '4.6.7');
  assert.equal(contracts.dependencies['@asteasolutions/zod-to-openapi'], '9.1.0');
  const web = JSON.parse(read('apps/web/package.json'));
  assert.equal(web.devDependencies.orval, '8.45.0');
  assert.equal(web.dependencies['@tanstack/react-query'], '5.104.5');
  assert.equal(web.scripts.api, 'orval --config orval.config.ts');
});

test('the screens make the API client before they start or build', () => {
  const web = JSON.parse(read('apps/web/package.json'));
  assert.equal(web.scripts.dev, 'pnpm --workspace-root run api:generate && vite');
  assert.equal(web.scripts.build, 'pnpm --workspace-root run api:generate && vite build');
});

test('running the command writes openapi.json and the typed client with a health hook', () => {
  execSync('pnpm api:generate', { stdio: 'pipe' });
  assert.ok(existsSync('packages/contracts/openapi.json'));
  const doc = JSON.parse(read('packages/contracts/openapi.json'));
  assert.equal(doc.paths['/api/health'].get.operationId, 'getHealth');
  const client = read('apps/web/src/api/nexus.ts');
  assert.match(client, /export (const|function) getHealth\b/);
  assert.match(client, /export (const|function) useGetHealth\b/);
});

test('the generated files are never committed', () => {
  const ignored = execSync('git check-ignore apps/web/src/api/nexus.ts packages/contracts/openapi.json', {
    encoding: 'utf8',
  });
  assert.match(ignored, /apps\/web\/src\/api\/nexus\.ts/);
  assert.match(ignored, /packages\/contracts\/openapi\.json/);
});
