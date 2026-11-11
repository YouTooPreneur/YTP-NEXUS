// TASK-0014 · The database driver, the accounts command, and PostgreSQL in GitHub's check run. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const read = (path) => readFileSync(path, 'utf8');

test('the backend uses the pinned PostgreSQL driver and has the accounts command', () => {
  const pkg = JSON.parse(read('apps/api/package.json'));
  assert.equal(pkg.dependencies.pg, '8.23.1');
  assert.equal(pkg.devDependencies['@types/pg'], '8.23.1');
  assert.equal(pkg.scripts['db:accounts'], 'tsx scripts/db-accounts.ts');
});

test("GitHub's check run has the same PostgreSQL, ready before the tests, with the test settings", () => {
  const wf = read('.github/workflows/verify.yml');
  const services = wf.slice(wf.indexOf('\n    services:\n'), wf.indexOf('\n    steps:\n'));
  assert.ok(services.length > 0, 'the verify job has a services block before its steps');
  const composeImage = read('infra/compose.dev.yaml').match(/^\s+image:\s*(postgres:\S+)\s*$/m)[1];
  assert.match(services, /^ {6}postgres:\s*$/m);
  assert.equal(services.match(/^\s+image:\s*(\S+)\s*$/m)[1], composeImage);
  const password = parseEnv(read('infra/.env.test.example')).POSTGRES_SUPERUSER_PASSWORD;
  assert.equal(services.match(/^\s+POSTGRES_PASSWORD:\s*(\S+)\s*$/m)[1], password);
  assert.match(services, /^\s+- "?5432:5432"?\s*$/m);
  assert.match(services, /--health-cmd "pg_isready -U postgres -h 127\.0\.0\.1"/);
  const runs = [...wf.matchAll(/^\s+- run:\s*(.+?)\s*$/gm)].map((m) => m[1]);
  assert.equal(runs.at(-1), 'pnpm verify');
  assert.equal(runs.at(-2), 'cp infra/.env.test.example infra/.env.test');
});
