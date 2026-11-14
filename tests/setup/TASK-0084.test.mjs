// TASK-0084 · The same-site check is mounted once, directly after the logging step and before the body is read. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

test('the app mounts the same-site check once, directly after the logging step and before the body is read', () => {
  const app = read('apps/api/src/app.ts');
  assert.match(app, /^import \{ sameSiteCheck \} from '\.\/shared\/same-site\.js';$/m);
  assert.match(app, /^ {2}app\.use\(httpLogger\(logger\)\);\n {2}app\.use\(sameSiteCheck\(\)\);$/m);
  // Since TASK-0023 the per-address limit sits between the check and the body reader (CR-029).
  assert.ok(
    app.indexOf('  app.use(sameSiteCheck());') < app.indexOf("  app.use(express.json({ limit: '1mb' }));"),
    'before the body is read',
  );
  assert.equal((app.match(/sameSiteCheck\(\)/g) || []).length, 1, 'mount the check once');
});

test('the check reads Nexus’s address from APP_URL and changes nothing else in the request', () => {
  const check = read('apps/api/src/shared/same-site.ts');
  assert.match(check, /process\.env\.APP_URL/);
  assert.doesNotMatch(check, /res\.(set|setHeader|header|cookie|status|json|send)\(/, 'the check only lets a request through or refuses it with an AppError');
});
