// TASK-0021 · The job queue: the pinned package, the schema change (found by name) ending with the exact rights, pg-boss used only in the jobs folder with one place that registers handlers, the worker starting the jobs, and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const sources = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name).replace(/\\/g, '/');
    return entry.isDirectory() ? sources(path) : /\.ts$/.test(entry.name) ? [path] : [];
  });

test('pg-boss is pinned to exactly 12.38.0', () => {
  assert.equal(JSON.parse(read('apps/api/package.json')).dependencies['pg-boss'], '12.38.0');
});

test('one database change installs the pgboss schema as the owner and ends with exactly the app’s rights', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  const mine = tags.filter((tag) => tag.replace(/^\d{4}_/, '') === 'pgboss_schema');
  assert.equal(mine.length, 1);
  const sql = read(`apps/api/drizzle/${mine[0]}.sql`);
  assert.match(sql, /CREATE SCHEMA (IF NOT EXISTS )?"?pgboss"?/i);
  assert.ok(sql.endsWith([
      "GRANT USAGE ON SCHEMA pgboss TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgboss TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pgboss TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO nexus_app;",
      "--> statement-breakpoint",
      "ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA pgboss GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_app;",
      "--> statement-breakpoint",
      "ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA pgboss GRANT USAGE, SELECT ON SEQUENCES TO nexus_app;",
      "--> statement-breakpoint",
      "ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA pgboss GRANT EXECUTE ON FUNCTIONS TO nexus_app;",
  ].join('\n') + '\n'), 'the change ends with exactly the card’s rights');
});

test('only the jobs folder uses pg-boss, and handlers are registered in one place', () => {
  const files = sources('apps/api/src');
  const users = files.filter((file) => /from 'pg-boss'/.test(read(file)));
  assert.ok(users.length > 0 && users.every((file) => file.startsWith('apps/api/src/jobs/')), 'pg-boss only in src/jobs/');
  const workers = files.filter((file) => /\.work\(/.test(read(file)));
  assert.deepEqual(workers, ['apps/api/src/jobs/jobs.ts']);
  assert.doesNotMatch(read('apps/api/src/jobs/jobs.ts'), /migrate:\s*true|createQueue\(/);
});

test('the worker keeps its first import and starts the jobs after the delivery', () => {
  const worker = read('apps/api/src/worker.ts');
  assert.ok(worker.startsWith("import './load-settings.js';\n"));
  assert.match(worker, /startJobs\(\{ jobs: \[\], logger \}\)/);
  assert.ok(worker.indexOf('startDelivery(') < worker.indexOf('startJobs('), 'the delivery starts first');
});

test('Core’s module card has the jobs rule right after the delivery rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rule = lines.indexOf("- Background jobs run through pg-boss (pinned 12.38.0) in the worker only: each job is defined with `defineJob` (`src/jobs/jobs.ts`), sent with `sendJob` with the company of the request, and run once by `startJobs` in a fresh background context and a transaction of that company (`inCompanyTransaction`); a failure is logged as `job failed` with its ID, kept with `recordError(error, 'worker')`, and handed back to pg-boss as its cleaned message only; the `pgboss` schema and every queue are made by database changes as `nexus_owner` (`queueSql`), never by the app (NFR-003, TECH-DESIGN 5.2)");
  assert.ok(rule > 0 && lines[rule - 1].startsWith('- Announcements are delivered by the worker'), 'right after the delivery rule');
});
