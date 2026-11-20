// TASK-0097 · Core's module card has the pg-boss rule (made once, scheduler off, upkeep only in the worker, its errors logged) right after the jobs rule. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

test('Core’s module card has the pg-boss rule right after the jobs rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rule = lines.indexOf(
    "- pg-boss is made once per process with its scheduler off (`schedule: false`), so it makes nothing at run time (a timed job first needs the scheduler's queue made by a database change), and it does its upkeep (`supervise`) only when the worker's `startJobs` made it: the API only sends; its own errors (a lost connection, a failed poll) are logged as `job queue error` and never stop the process (TASK-0097, NFR-003, TECH-DESIGN 5.2)",
  );
  assert.ok(rule > 0 && lines[rule - 1].startsWith('- Background jobs run through pg-boss'), 'right after the jobs rule');
});
