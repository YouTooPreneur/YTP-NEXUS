// TASK-0006 · Development services. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

const read = (path) => readFileSync(path, 'utf8');
const compose = () => read('infra/compose.dev.yaml');

const NAMES = [
  'POSTGRES_SUPERUSER_PASSWORD', 'DATABASE_URL_APP', 'DATABASE_URL_OWNER', 'DATABASE_URL_BACKUP', 'APP_URL',
  'BETTER_AUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXUS_MASTER_KEY', 'GMAIL_USER',
  'GMAIL_APP_PASSWORD', 'SMTP_URL', 'FILES_S3_ENDPOINT', 'FILES_S3_BUCKET', 'FILES_S3_KEY', 'FILES_S3_SECRET',
  'BACKUP_S3_ENDPOINT', 'BACKUP_S3_BUCKET', 'BACKUP_S3_KEY', 'BACKUP_S3_SECRET', 'BACKUP_ENCRYPTION_KEY',
  'FILES_BACKUP_S3_KEY', 'FILES_BACKUP_S3_SECRET', 'ADDRESS_LIMITS', 'SENTRY_DSN', 'TEST_MODE',
];

const envNames = (path) =>
  read(path)
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0]);

test('the three services use pinned images, never latest', () => {
  const text = compose();
  assert.match(text, /^name:\s*ytp-nexus-dev\s*$/m);
  assert.match(text, /image:\s*postgres:16\.15-alpine/);
  assert.match(text, /image:\s*chrislusf\/seaweedfs:4\.51/);
  assert.match(text, /image:\s*axllent\/mailpit:v1\.33\.0/);
  assert.doesNotMatch(text, /:latest\b/);
  assert.match(text, /pg_isready -U postgres/);
});

// The first-start folder (infra/postgres/init) and its check left this test with CR-017: from TASK-0014 the accounts
// command makes the databases, and TASK-0014's test checks that the database container needs no folder of the copy.

test('the settings lists name every setting, in the agreed order, with no real secrets', () => {
  assert.deepEqual(envNames('infra/.env.example'), NAMES);
  assert.deepEqual(envNames('infra/.env.test.example'), NAMES);
  const testFile = read('infra/.env.test.example');
  assert.match(testFile, /DATABASE_URL_APP=postgres:\/\/nexus_app:[^@]+@localhost:5432\/nexus_test/);
  assert.doesNotMatch(testFile, /nexus_dev/);
  assert.match(read('infra/.env.example'), /^TEST_MODE=on$/m);
});

test('the example settings files are kept, the real one never is', () => {
  const out = spawnSync('git', ['check-ignore', 'infra/.env', 'infra/.env.example', 'infra/.env.test.example'], {
    encoding: 'utf8',
  }).stdout;
  assert.match(out, /^infra\/\.env$/m);
  assert.doesNotMatch(out, /\.env\.example/);
  assert.doesNotMatch(out, /\.env\.test\.example/);
});

test('the root scripts start and stop the services', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.equal(scripts['services:up'], 'docker compose -f infra/compose.dev.yaml --env-file infra/.env up -d --wait');
  assert.equal(scripts['services:down'], 'docker compose -f infra/compose.dev.yaml --env-file infra/.env down');
});

test('Docker accepts the compose file', () => {
  execSync('docker compose -f infra/compose.dev.yaml --env-file infra/.env.example config --quiet', { stdio: 'pipe' });
});
