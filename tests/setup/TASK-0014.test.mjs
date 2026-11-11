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

test('the accounts command reads infra/.env before any other file loads', () => {
  // Every import runs before the importing file's own lines, so the read must be the first import
  // (TECH-DESIGN section 12 point 46; TASK-0090 checks the same for main.ts and worker.ts).
  const imports = read('apps/api/scripts/db-accounts.ts')
    .split(/\r?\n/)
    .filter((line) => /^import\b/.test(line));
  assert.equal(imports[0], "import '../src/load-settings.js';");
});

test("GitHub's check run has the same PostgreSQL, ready before the tests, with the test settings", () => {
  const wf = read('.github/workflows/verify.yml').replace(/\r\n/g, '\n');
  const services = wf.slice(wf.indexOf('\n    services:\n'), wf.indexOf('\n    steps:\n'));
  assert.ok(services.length > 0, 'the verify job has a services block before its steps');
  const composeImage = read('infra/compose.dev.yaml').match(/^\s+image:\s*(postgres:\S+)\s*$/m)[1];
  const password = parseEnv(read('infra/.env.test.example')).POSTGRES_SUPERUSER_PASSWORD;
  // The postgres service exactly as the card gives it, indentation included: GitHub refuses a misindented
  // workflow, and nothing in verify parses it. Only this service is compared, so later cards may add others.
  const lines = services.split('\n');
  const start = lines.indexOf('      postgres:');
  assert.ok(start > 0, 'the services block has a postgres service (6 spaces before postgres:)');
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('        ')) end++;
  assert.equal(
    lines.slice(start, end).join('\n'),
    [
      '      postgres:',
      `        image: ${composeImage}`,
      '        env:',
      `          POSTGRES_PASSWORD: ${password}`,
      '        ports:',
      '          - 5432:5432',
      '        options: >-',
      '          --health-cmd "pg_isready -U postgres -h 127.0.0.1"',
      '          --health-interval 5s',
      '          --health-timeout 5s',
      '          --health-retries 10',
    ].join('\n'),
  );
  const runs = [...wf.matchAll(/^\s+- run:\s*(.+?)\s*$/gm)].map((m) => m[1]);
  assert.equal(runs.at(-1), 'pnpm verify');
  assert.equal(runs.at(-2), 'cp infra/.env.test.example infra/.env.test');
  assert.match(wf, /^ {6}- run: cp infra\/\.env\.test\.example infra\/\.env\.test\n {6}- run: pnpm verify$/m);
});
