// TASK-0032 · Sign-in with Better Auth: the pinned package, the schema list, the order of the shared steps, the open doors list, the routes listing, the secret names in the log, the wall around the auth tables, the two database changes (found by name) and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));
const sources = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name).replace(/\\/g, '/');
    return entry.isDirectory() ? sources(path) : /\.ts$/.test(entry.name) ? [path] : [];
  });
const change = (name) => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  const mine = tags.filter((tag) => tag.replace(/^\d{4}_/, '') === name);
  assert.equal(mine.length, 1, `one ${name} change in the journal`);
  assert.ok(readdirSync('apps/api/drizzle').includes(`${mine[0]}.sql`), `${mine[0]}.sql exists`);
  return { tag: mine[0], index: tags.indexOf(mine[0]) };
};

test('Better Auth is pinned to exactly 1.7.14 and the schema list adds its tables to the modules’ schema files', () => {
  assert.equal(JSON.parse(read('apps/api/package.json')).dependencies['better-auth'], '1.7.14');
  assert.match(read('apps/api/drizzle.config.ts'), /^ {2}schema: \['\.\/src\/modules\/\*\/schema\/\*\.ts', '\.\/src\/db\/auth-schema\.ts'\],$/m);
});

test('the sign-in doors sit after the per-address limit and before the body reader, closed except for the open list', () => {
  const lines = read('apps/api/src/app.ts').split('\n');
  const first = lines.indexOf("  app.use(['/api/auth', '/api/core/two-step'], addressLimit('signin'));");
  assert.ok(first > 0, 'the per-address limit is mounted');
  assert.deepEqual(lines.slice(first, first + 4), ["  app.use(['/api/auth', '/api/core/two-step'], addressLimit('signin'));", "  app.use('/api/auth', openAuthRoutesOnly());", "  app.all('/api/auth/*splat', authHandler());", "  app.use(express.json({ limit: '1mb' }));"]);
});

test('the open doors are plain data that import nothing, the same seven as the agreed list, and the routes listing reads them', () => {
  const path = 'apps/api/src/modules/core/signin/open-routes.ts';
  assert.deepEqual(imports(path), []);
  const listed = [...read(path).matchAll(/'((?:GET|POST) \/api\/auth\/[^']+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(listed, JSON.parse(read('tools/verify/auth-routes.json')).sort());
  const lister = read('apps/api/scripts/list-routes.ts');
  assert.ok(imports('apps/api/scripts/list-routes.ts').includes("import { OPEN_AUTH_ROUTES } from '../src/modules/core/signin/open-routes.js';"));
  assert.match(lister, /authRoutes: \[\.\.\.OPEN_AUTH_ROUTES\],/);
  assert.doesNotMatch(lister, /app\.js|signin\/auth\.js|better-auth/);
});

test('the log removes the sign-in tokens too, and only the sign-in, users and database code touch the auth tables', () => {
  const logging = read('apps/api/src/shared/logging.ts');
  const keys = logging.match(/^const SECRET_KEYS = \[(.*)\];$/m);
  assert.ok(keys, 'SECRET_KEYS is one line');
  for (const name of ['password', 'code', 'token', 'secret', 'newPassword', 'currentPassword', 'accessToken', 'refreshToken', 'idToken']) {
    assert.ok(keys[1].includes(`'${name}'`), `SECRET_KEYS has ${name}`);
  }
  const allowed = /^apps\/api\/src\/(db\/|modules\/core\/signin\/|modules\/core\/users\/)/;
  const touching = sources('apps/api/src').filter((file) => /auth-schema(\.js)?'/.test(read(file)) || /\bauth\."?user"?\b|\bauth\.(session|account|verification)\b/.test(read(file)));
  assert.deepEqual(touching.filter((file) => !allowed.test(file)), []);
  assert.equal((read('apps/api/src/db/database.ts').match(/new Pool\(/g) || []).length, 1, 'still one place that makes a pool');
});

test('the table change and the rights change come one after the other; the second is exactly the card’s', () => {
  const tables = change('auth_tables');
  const rights = change('auth_rights');
  assert.equal(rights.index, tables.index + 1);
  assert.equal(
    read(`apps/api/drizzle/${rights.tag}.sql`),
    [
      "-- Better Auth's tables (DATA-MODEL 3.2) are system tables with no row rule: they are read before the company is known.",
      "-- Only Core's sign-in and users code touches them (the wall check); the app reads, adds, changes and removes their rows.",
      "GRANT USAGE ON SCHEMA auth TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON auth.\"user\", auth.session, auth.account, auth.verification TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('Core’s module card lists the sign-in tables after the companies, and the sign-in rule after the per-address limit rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf("- `auth.user`, `auth.session`, `auth.account`, `auth.verification`: Better Auth's sign-in tables (people who may sign in, with Nexus's company, status, failed sign-ins and lock; sessions; Google and password accounts; reset links); system tables with no row rule, touched only by `modules/core/signin/`, `modules/core/users/` and `src/db/` (DATA-MODEL 3.2, CORE-001)");
  assert.ok(data > 0 && lines[data - 1].startsWith('- `core.companies`:'), 'right after the companies line');
  const rule = lines.indexOf("- Sign-in runs through Better Auth (`modules/core/signin/auth.ts`, pinned 1.7.14) at `/api/auth`, after the per-address limit: only the seven doors of `modules/core/signin/open-routes.ts` (the list in `tools/verify/auth-routes.json`) are open and every other `/api/auth/` door answers 404; self sign-up, Better Auth's own limiter, cookie cache and telemetry are off; only people added with `createSigninUser` and not disabled may sign in; every sign-in writes `signin_ok` or `signin_failed` (a fixed reason, in the system chain when the email is unknown); the reset email links to the reset screen at `APP_URL`, never to a sign-in door; Better Auth's own errors keep its `{ code, message }` shape, the one exception to TECH-DESIGN 6.7 (TECH-DESIGN 6.1, CORE-001)");
  assert.ok(rule > 0 && lines[rule - 1].startsWith('- The sign-in doors (`/api/auth`) and the two-step doors'), 'right after the per-address limit rule');
});
