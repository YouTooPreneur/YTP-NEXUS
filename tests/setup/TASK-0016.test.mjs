// TASK-0016 · The request transaction and short security writes: the app mounts the shared hooks, the request context's transaction type, the company setting in one file. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const files = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(folder, entry.name)) : [join(folder, entry.name).replace(/\\/g, '/')],
  );

test('the app mounts its doors with the shared hooks unless a test passes its own', () => {
  const app = read('apps/api/src/app.ts');
  assert.match(app, /^import \{ createHooks \} from '\.\/shared\/hooks\.js';$/m);
  assert.match(app, /^ {2}mountRoutes\(app, allRoutes, options\.hooks \?\? createHooks\(\)\);$/m);
  assert.equal((app.match(/\bmountRoutes\(app, allRoutes\b/g) || []).length, 1, 'mount allRoutes once: the old line is replaced, never kept beside the new one');
});

test('the request context holds the transaction, its type imported for types only and from no file that loads the context', () => {
  const context = read('apps/api/src/shared/context.ts');
  assert.match(context, /^import type \{ Transaction \} from '\.\.\/db\/company\.js';$/m);
  assert.match(context, /^ {2}tx\?: Transaction;$/m);
  const lines = context.split('\n').filter((line) => /^import\b/.test(line));
  assert.ok(lines.every((line) => !/^import \{[^}]*\btype\b/.test(line)), 'never import { type … }: it still loads the file');
  assert.ok(lines.every((line) => !/(route|errors|logging|hooks|database)\.js'/.test(line)), 'no import from a file that loads the context');
});

test('only the company helper sets the company for the row rules', () => {
  const naming = files('apps/api/src').filter((path) => read(path).includes('app.company_id'));
  assert.deepEqual(naming, ['apps/api/src/db/company.ts']);
});
