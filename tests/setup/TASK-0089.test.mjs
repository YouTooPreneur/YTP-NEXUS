// TASK-0089 · Tighter module-card, door and commit checks. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { compareRoutesToContracts } from '../../tools/verify/checks/contract.mjs';
import { checkModuleCards, SECTIONS } from '../../tools/verify/checks/module-cards.mjs';
import { commitProblems } from '../../tools/verify/checks/allowed-files.mjs';
import { steps } from '../../tools/verify/steps.mjs';

const health = { operationId: 'getHealth', method: 'get', path: '/api/health', module: 'core', public: true, permission: null, feature: null };
const listUsers = {
  operationId: 'listUsers', method: 'get', path: '/api/core/users', module: 'core', public: false,
  permission: { module: 'core.users', action: 'view' }, feature: 'core.users',
};
// A card with the six parts; Window and Announcements hold the given lines.
const card = (window, announcements = '- (none yet)') =>
  SECTIONS.map((s) => (s === '## Window' ? `${s}\n${window}` : s === '## Announcements' ? `${s}\n${announcements}` : `${s}\n- (none yet)`)).join('\n\n');
const core = (text) => [{ name: 'core', card: text }];

test('a module card section counts only when its heading is a whole line', () => {
  const good = card('- `getHealth`: GET /api/health');
  assert.deepEqual(checkModuleCards({ modules: core(good), routes: [health], announcements: [] }), []);
  assert.deepEqual(checkModuleCards({ modules: core(good.replace(/\n/g, '\r\n')), routes: [health], announcements: [] }), []);
  assert.deepEqual(checkModuleCards({ modules: core(good.replace('## Window\n', '## Windows\n')), routes: [health], announcements: [] }), [
    'MODULE.md of core is missing the section ## Window',
    'getHealth is not listed under Window in core/MODULE.md',
  ]);
  assert.deepEqual(checkModuleCards({ modules: core(good.replace('## Data\n', '## Database\n')), routes: [health], announcements: [] }), [
    'MODULE.md of core is missing the section ## Data',
  ]);
  // A sub-heading such as `### Window notes` is not the Window section, so a door named under it is not listed.
  const underSubheading = good
    .replace('## Rules\n- (none yet)', '## Rules\n### Window notes\n- `getHealth` is mentioned here')
    .replace('## Window\n- `getHealth`: GET /api/health', '## Window\n- (none yet)');
  assert.deepEqual(checkModuleCards({ modules: core(underSubheading), routes: [health], announcements: [] }), [
    'getHealth is not listed under Window in core/MODULE.md',
  ]);
});

test('an entry under Window or Announcements that no longer exists is reported', () => {
  const stale = card('- `getHealth`: GET /api/health\n- `listOldThings`: GET /api/core/old', '- `core.user.disabled`: when a person is disabled');
  assert.deepEqual(checkModuleCards({ modules: core(stale), routes: [health], announcements: [] }), [
    'core.user.disabled is listed under Announcements in core/MODULE.md but is not one of its announcements',
    'listOldThings is listed under Window in core/MODULE.md but is not one of its doors',
  ]);
  // A door listed on another module's card is an old entry there and missing on its own card.
  assert.deepEqual(
    checkModuleCards({
      modules: [{ name: 'core', card: card('- `getHealth`: GET /api/health') }, { name: 'crm', card: card('- `listUsers`: GET /api/core/users') }],
      routes: [health, listUsers],
      announcements: [],
    }),
    ['listUsers is listed under Window in crm/MODULE.md but is not one of its doors', 'listUsers is not listed under Window in core/MODULE.md'],
  );
  // Only the name at the start of each item is an entry: a path or another name later in the line is not.
  assert.deepEqual(
    checkModuleCards({ modules: core(card('- `getHealth`: GET `/api/health`, see also `listUsers`')), routes: [health], announcements: [] }),
    [],
  );
  // ...and a door or announcement named only later in a line, or in a note, is not listed (both directions agree).
  assert.deepEqual(
    checkModuleCards({ modules: core(card('- `getHealth`: GET /api/health, see also `listUsers`')), routes: [health, listUsers], announcements: [] }),
    ['listUsers is not listed under Window in core/MODULE.md'],
  );
  assert.deepEqual(
    checkModuleCards({
      modules: core(card('- `getHealth`: GET /api/health', '- (none yet; `core.user.disabled` comes later)')),
      routes: [health],
      announcements: [{ name: 'core.user.disabled', module: 'core' }],
    }),
    ['core.user.disabled is not listed under Announcements in core/MODULE.md'],
  );
});

test('the same door twice, or one operationId on two doors, is reported', () => {
  const openapi = { paths: { '/api/health': { get: { operationId: 'getHealth' } } } };
  assert.deepEqual(compareRoutesToContracts([health, health], openapi), ['door listed twice: get /api/health', 'operationId used twice: getHealth']);
  assert.ok(compareRoutesToContracts([health, { ...health, operationId: 'checkHealth' }], openapi).includes('door listed twice: get /api/health'));
  assert.ok(compareRoutesToContracts([health, { ...health, path: '/api/status' }], openapi).includes('operationId used twice: getHealth'));
  assert.deepEqual(compareRoutesToContracts([health], openapi), []);
});

test('when routes:list prints something else or fails, the three steps say why and it runs only once', () => {
  const ws = mkdtempSync(join(tmpdir(), 'nexus-routes-'));
  const put = (file, text) => {
    mkdirSync(join(ws, file, '..'), { recursive: true });
    writeFileSync(join(ws, file), text);
  };
  try {
    put('package.json', '{"name":"ws","private":true}');
    // No install before routes:list, so nothing outside this temp folder is touched.
    put('pnpm-workspace.yaml', 'packages:\n  - "apps/*"\nverifyDepsBeforeRun: false\n');
    put('apps/api/package.json', '{"name":"@ytp/api","private":true,"scripts":{"routes:list":"node print.mjs"}}');
    const runs = () => readFileSync(join(ws, 'apps', 'api', 'runs.txt'), 'utf8').split('\n').filter(Boolean).length;
    const run = (name, ctx) => steps.find((s) => s.name === name).run(ctx);

    put('apps/api/print.mjs', "import { appendFileSync } from 'node:fs';\nappendFileSync('runs.txt', 'run\\n');\nconsole.log('api listening on a stray line');\nconsole.log(JSON.stringify({ routes: [], authRoutes: [], announcements: [] }));\n");
    const ctx = { root: ws, card: null, selected: [] };
    for (const name of ['Contract', 'Doors', 'Module cards']) {
      assert.throws(() => run(name, ctx), /^Error: routes:list did not print JSON: api listening on a stray line$/);
    }
    assert.equal(runs(), 1, 'the first failure is kept on ctx for the other two steps');

    put('apps/api/print.mjs', "import { appendFileSync } from 'node:fs';\nappendFileSync('runs.txt', 'run\\n');\nconsole.error('the door list could not be read');\nprocess.exit(3);\n");
    const again = { root: ws, card: null, selected: [] };
    for (const name of ['Contract', 'Doors', 'Module cards']) {
      assert.throws(() => run(name, again), /the door list could not be read/);
    }
    assert.equal(runs(), 2, 'a failed run is also kept on ctx');
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});

test('the commit check still works when a file is named main', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-verify-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  const commit = (subject, files) => {
    for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text);
    git('add', ...Object.keys(files));
    git('commit', '-q', '-m', subject);
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  };
  try {
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    const start = commit('start', { main: 'a file named main' });
    git('checkout', '-q', '-b', 'task/TASK-0100');
    commit('tidy up', { 'notes.txt': 'n' });
    assert.deepEqual(commitProblems(dir, start).map((p) => p.replace(/[0-9a-f]{7,}/, 'H')), ['commit not named for a card: H tidy up']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
