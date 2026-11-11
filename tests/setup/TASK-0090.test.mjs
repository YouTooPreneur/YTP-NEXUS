// TASK-0090 · Services on this computer only, and reading infra/.env. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const read = (path) => readFileSync(path, 'utf8');
// Every setting name of the example file, so a check can run as if none were set (GitHub's check run has no infra/.env).
const NAMES = read('infra/.env.example')
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('=')[0]);
const withoutSettings = () => {
  const env = { ...process.env };
  for (const name of NAMES) delete env[name];
  return env;
};

test('the development services listen on this computer only, and the database check goes over the network', () => {
  const out = spawnSync(
    'docker',
    ['compose', '-f', 'infra/compose.dev.yaml', '--env-file', 'infra/.env.example', 'config', '--format', 'json'],
    { encoding: 'utf8' },
  );
  assert.equal(out.status, 0, out.stderr);
  const services = JSON.parse(out.stdout).services;
  const published = Object.entries(services).flatMap(([name, s]) => (s.ports ?? []).map((p) => [name, p]));
  assert.equal(published.length, 4, JSON.stringify(published));
  for (const [name, port] of published) assert.equal(port.host_ip, '127.0.0.1', `${name} port ${port.published} listens on every address`);
  assert.deepEqual(services.postgres.healthcheck.test, ['CMD-SHELL', 'pg_isready -U postgres -h 127.0.0.1']);
});

test('the API and the worker read infra/.env first', () => {
  const main = read('apps/api/src/main.ts');
  const worker = read('apps/api/src/worker.ts');
  for (const [name, text] of [['main.ts', main], ['worker.ts', worker]]) {
    assert.match(text, /^import \{ loadSettingsFile \} from '\.\/settings-file\.js';$/m, name);
    assert.match(text, /^loadSettingsFile\(\);$/m, name);
  }
  assert.ok(main.indexOf('loadSettingsFile();') < main.indexOf('createLogger()'), 'main.ts reads the settings before it makes the logger');
  assert.ok(worker.indexOf('loadSettingsFile();') < worker.indexOf("console.log('worker started')"), 'worker.ts reads the settings first');
});

test('the settings file is infra/.env at the top of the project', () => {
  const script = "import('./src/settings-file.ts').then((m) => console.log(require('node:url').fileURLToPath(m.SETTINGS_FILE)))";
  const out = spawnSync(process.execPath, ['--import', 'tsx', '-e', script], { cwd: 'apps/api', encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), resolve('infra/.env'));
});

test('routes:list needs no settings and loads none (CR-012)', () => {
  const env = withoutSettings();
  const list = spawnSync('pnpm', ['--filter', '@ytp/api', '--silent', 'routes:list'], { encoding: 'utf8', shell: true, env });
  assert.equal(list.status, 0, list.stderr);
  assert.ok(JSON.parse(list.stdout).routes.length > 0, 'routes:list prints one JSON object');
  // Loading everything list-routes.ts loads sets none of the settings, even where this copy has an infra/.env.
  const names = JSON.stringify(NAMES);
  const script = `Promise.all([import('./src/routes.ts'), import('./src/announcements.ts')]).then(() => console.log(JSON.stringify(${names}.filter((n) => n in process.env))))`;
  const loaded = spawnSync(process.execPath, ['--import', 'tsx', '-e', script], { cwd: 'apps/api', encoding: 'utf8', env });
  assert.equal(loaded.status, 0, loaded.stderr);
  assert.deepEqual(JSON.parse(loaded.stdout.trim().split(/\r?\n/).at(-1)), []);
});
