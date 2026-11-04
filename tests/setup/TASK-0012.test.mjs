// TASK-0012 · Contract, door and module-card checks. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { compareRoutesToContracts } from '../../tools/verify/checks/contract.mjs';
import { checkDoors } from '../../tools/verify/checks/doors.mjs';
import { checkModuleCards, SECTIONS } from '../../tools/verify/checks/module-cards.mjs';
import { changedFiles, checkAllowedFiles, commitProblems } from '../../tools/verify/checks/allowed-files.mjs';
import { steps } from '../../tools/verify/steps.mjs';

const health = { operationId: 'getHealth', method: 'get', path: '/api/health', module: 'core', public: true, permission: null, feature: null };
const listUsers = {
  operationId: 'listUsers', method: 'get', path: '/api/core/users', module: 'core', public: false,
  permission: { module: 'core.users', action: 'view' }, feature: 'core.users',
};
const openapi = {
  paths: {
    '/api/health': { get: { operationId: 'getHealth' } },
    '/api/core/users': { get: { operationId: 'listUsers' } },
  },
};

test('compareRoutesToContracts finds doors missing on either side', () => {
  assert.deepEqual(compareRoutesToContracts([health, listUsers], openapi), []);
  assert.deepEqual(compareRoutesToContracts([health], openapi), ['contract without route: get /api/core/users listUsers']);
  const extra = { ...listUsers, operationId: 'deleteUser', method: 'delete', path: '/api/core/users/{userId}' };
  assert.deepEqual(compareRoutesToContracts([health, listUsers, extra], openapi), [
    'route without contract: delete /api/core/users/{userId} deleteUser',
  ]);
});

test('checkDoors finds doors without a permission or feature, and checks the sign-in list once it exists', () => {
  const allowed = JSON.parse(readFileSync('tools/verify/auth-routes.json', 'utf8'));
  assert.equal(allowed.length, 7);
  assert.ok(allowed.includes('POST /api/auth/sign-in/email'));
  assert.deepEqual(checkDoors({ routes: [health, listUsers], authRoutes: [], allowedAuthRoutes: allowed }), []);
  const sloppy = { ...listUsers, feature: null };
  assert.deepEqual(checkDoors({ routes: [sloppy], authRoutes: [], allowedAuthRoutes: allowed }), [
    'door without permission or feature: listUsers',
  ]);
  const open = [...allowed.filter((r) => r !== 'POST /api/auth/sign-out'), 'POST /api/auth/update-user'];
  assert.deepEqual(checkDoors({ routes: [], authRoutes: open, allowedAuthRoutes: allowed }), [
    'sign-in door not on the list: POST /api/auth/update-user',
    'sign-in door on the list but missing: POST /api/auth/sign-out',
  ]);
});

test('checkModuleCards wants the six parts, every door and every announcement', () => {
  assert.deepEqual(SECTIONS, ['## Data', '## Rules', '## Screens', '## Window', '## Announcements', '## Night checklist']);
  const good = SECTIONS.map((s) =>
    s === '## Window' ? `${s}\n- \`getHealth\`: GET /api/health\n- \`listUsers\`: GET /api/core/users` :
    s === '## Announcements' ? `${s}\n- \`core.user.disabled\`: when a person is disabled` : `${s}\n- (none yet)`,
  ).join('\n\n');
  const announcements = [{ name: 'core.user.disabled', module: 'core' }];
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: good }], routes: [health, listUsers], announcements }), []);

  const missingDoor = good.replace('- `listUsers`: GET /api/core/users', '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: missingDoor }], routes: [health, listUsers], announcements }), [
    'listUsers is not listed under Window in core/MODULE.md',
  ]);

  const doorUnderWrongSection = good.replace('## Rules\n- (none yet)', '## Rules\n- `listUsers` is mentioned here only').replace('- `listUsers`: GET /api/core/users', '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: doorUnderWrongSection }], routes: [health, listUsers], announcements }), [
    'listUsers is not listed under Window in core/MODULE.md',
  ]);

  const noNight = good.replace(/## Night checklist[\s\S]*$/, '');
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'core', card: noNight }], routes: [], announcements: [] }), [
    'MODULE.md of core is missing the section ## Night checklist',
  ]);
  assert.deepEqual(checkModuleCards({ modules: [{ name: 'crm', card: null }], routes: [], announcements: [] }), [
    'module crm has no MODULE.md',
  ]);
  assert.deepEqual(
    checkModuleCards({ modules: [{ name: 'core', card: good.replace('`core.user.disabled`', 'core.user.disabled') }], routes: [], announcements }),
    ['core.user.disabled is not listed under Announcements in core/MODULE.md'],
  );
  // A door or announcement of a module with no folder is on no card (review of TASK-0011, CR-012).
  assert.deepEqual(
    checkModuleCards({
      modules: [{ name: 'core', card: good }],
      routes: [health, { ...listUsers, module: 'cmr' }],
      announcements: [...announcements, { name: 'crm.lead.won', module: 'crm' }],
    }),
    ['crm.lead.won belongs to module crm, which has no folder', 'listUsers belongs to module cmr, which has no folder'],
  );
});

test('the screens cannot borrow backend code even for its types (review of TASK-0011, CR-012)', () => {
  const out = spawnSync(
    'pnpm',
    ['exec', 'depcruise', 'apps', '--config', join(process.cwd(), '.dependency-cruiser.cjs'), '--output-type', 'json'],
    { cwd: join('tests', 'setup', 'fixtures', 'arch'), encoding: 'utf8', shell: true, maxBuffer: 50 * 1024 * 1024 },
  );
  assert.ok(out.stdout, `depcruise printed nothing: ${out.stderr}`);
  const violations = JSON.parse(out.stdout).summary.violations;
  for (const file of ['apps/web/src/bad-type-import.ts', 'apps/web/src/bad-inline-type-import.ts']) {
    assert.ok(
      violations.some((v) => v.rule.name === 'frontend-never-imports-backend' && v.from === file),
      `${file} was not reported`,
    );
  }
});

test('the real backend lists the health door as public, and the Core card lists it', () => {
  const out = spawnSync('pnpm', ['--filter', '@ytp/api', '--silent', 'routes:list'], { encoding: 'utf8', shell: true });
  const listed = JSON.parse(out.stdout);
  assert.ok(Array.isArray(listed.authRoutes));
  assert.ok(Array.isArray(listed.announcements));
  const h = listed.routes.find((r) => r.operationId === 'getHealth');
  assert.deepEqual(h, health);
  const card = readFileSync('apps/api/src/modules/core/MODULE.md', 'utf8');
  for (const section of SECTIONS) assert.ok(card.includes(section), `Core card is missing ${section}`);
  assert.match(card, /## Window[\s\S]*`getHealth`/);
});

test('verify runs the three checks after Architecture, and Allowed files stays last', () => {
  const out = spawnSync(process.execPath, ['tools/verify/verify.mjs', '--list'], { encoding: 'utf8' });
  const names = out.stdout.split(/\r?\n/).filter(Boolean);
  const order = ['Architecture', 'Contract', 'Doors', 'Module cards'].map((n) => names.indexOf(n));
  assert.ok(order.every((i) => i >= 0), `missing a step in: ${names.join(', ')}`);
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
  assert.equal(names.at(-1), 'Allowed files');
});

// A throwaway git folder for the allowed-files checks (CR-009).
function gitFolder(branch) {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-verify-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  const head = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  const commit = (subject, files) => {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(join(dir, file, '..'), { recursive: true });
      writeFileSync(join(dir, file), text);
    }
    git('add', ...Object.keys(files));
    git('commit', '-q', '-m', subject);
    return head();
  };
  git('init', '-q', '-b', branch);
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('config', 'diff.renames', 'true');
  return { dir, git, head, commit };
}

test('changedFiles lists both paths of a moved file, before the card is committed and in the fallback', () => {
  const { dir, git, commit } = gitFolder('main');
  try {
    const start = commit('start', { 'docs/DECISIONS.md': 'one\ntwo\nthree\nfour\n' });
    git('mv', 'docs/DECISIONS.md', 'allowed.md');
    const changed = changedFiles(dir, start, 'TASK-0100');
    assert.deepEqual(changed, ['allowed.md', 'docs/DECISIONS.md']);
    assert.deepEqual(checkAllowedFiles({ changed, allowed: ['allowed.md'], card: 'TASK-0100' }), ['docs/DECISIONS.md']);
    git('commit', '-q', '-m', 'Moved without the card name');
    assert.deepEqual(changedFiles(dir, start, 'TASK-0100'), ['allowed.md', 'docs/DECISIONS.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('commitProblems names every commit after the start point that is not named for a card and not yet on main', () => {
  const { dir, git, commit } = gitFolder('main');
  try {
    const start = commit('start', { 'base.txt': '1' });
    commit('Planning: an answer on main', { 'docs/QUESTIONS.md': 'answered' });
    git('checkout', '-q', '-b', 'task/TASK-0100');
    commit('TASK-0100: First card [antigravity]', { 'allowed.ts': 'a' });
    assert.deepEqual(commitProblems(dir, start), []);
    commit('tidy up', { 'docs/DECISIONS.md': 'x' });
    commit('TASK-0100: Fix after review [antigravity]', { 'allowed.ts': 'b' });
    const problems = commitProblems(dir, start);
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^commit not named for a card: [0-9a-f]{7,} tidy up$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const other = gitFolder('trunk');
  try {
    const start = other.commit('start', { 'base.txt': '1' });
    other.commit('Planning: no main branch here', { 'notes.md': 'n' });
    const problems = commitProblems(other.dir, start);
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^commit not named for a card: [0-9a-f]{7,} Planning: no main branch here$/);
  } finally {
    rmSync(other.dir, { recursive: true, force: true });
  }
});

test('the Allowed files step reports a commit not named for a card', () => {
  const { dir, git, commit } = gitFolder('main');
  const allowedStep = steps.find((s) => s.name === 'Allowed files');
  try {
    const start = commit('start', {
      'docs/tasks/TASK-0100.md': '# TASK-0100\n\n## ALLOWED FILES (touch nothing else)\n| File | Action |\n|---|---|\n| `allowed.ts` | create |\n\n## STEPS\n',
    });
    git('checkout', '-q', '-b', 'task/TASK-0100');
    commit('TASK-0100: First card [antigravity]', {
      'allowed.ts': 'a',
      'docs/logs/TASK-0100.md': `# LOG\n\n## Start check\n- Start point (commit): ${start}\n`,
    });
    assert.deepEqual(allowedStep.run({ root: dir, card: 'TASK-0100' }), { ok: true });
    commit('tidy up', { 'docs/DECISIONS.md': 'x' });
    const result = allowedStep.run({ root: dir, card: 'TASK-0100' });
    assert.equal(result.ok, false);
    assert.match(result.note, /^commit not named for a card: [0-9a-f]{7,} tidy up$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
