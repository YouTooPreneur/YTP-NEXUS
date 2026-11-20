// TASK-0098 · Core's module card has the get-session and sign-in answers rule right after the Better Auth rule. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

test('Core’s module card has the get-session and sign-in answers rule right after the Better Auth rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rule = lines.indexOf(
    "- No answer of the sign-in doors carries the session token (the cookie alone holds it, where the page's scripts cannot read it), and none shows a person's `failedSignins` or `lockedUntil` (`returned: false`); `GET /api/auth/get-session`, which guesses no password, is counted in the `public` bucket of the per-address limit, never in the `signin` bucket that everyone behind one office address shares (TASK-0098, TECH-DESIGN 6.1, NFR-020)",
  );
  assert.ok(rule > 0 && lines[rule - 1].startsWith('- Sign-in runs through Better Auth'), 'right after the Better Auth rule');
});
