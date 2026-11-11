// TASK-0091 · Drizzle, Core's schemas, the first database changes and the migrate command. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the backend uses the pinned Drizzle and has the generate and migrate commands', () => {
  const pkg = JSON.parse(read('apps/api/package.json'));
  assert.equal(pkg.dependencies['drizzle-orm'], '0.45.4');
  assert.equal(pkg.devDependencies['drizzle-kit'], '0.31.11');
  assert.equal(pkg.scripts['db:generate'], 'drizzle-kit generate');
  assert.equal(pkg.scripts['db:migrate'], 'tsx scripts/db-migrate.ts');
});

test('drizzle-kit reads the modules’ schema files by path, and its config is type-checked (CR-008, CR-015)', () => {
  // Named as a path, never imported: the auth-schema wall (.dependency-cruiser.cjs) sees direct imports only.
  assert.deepEqual(imports('apps/api/drizzle.config.ts'), ["import { defineConfig } from 'drizzle-kit';"]);
  const config = read('apps/api/drizzle.config.ts');
  assert.match(config, /dialect: 'postgresql'/);
  assert.match(config, /'\.\/src\/modules\/\*\/schema\/\*\.ts'/);
  assert.match(config, /out: '\.\/drizzle'/);
  assert.ok(JSON.parse(read('apps/api/tsconfig.json')).include.includes('drizzle.config.ts'));
});

test('the migrate command reads infra/.env before any other file loads', () => {
  // Every import runs before the importing file's own lines (TECH-DESIGN section 12 point 46).
  assert.equal(imports('apps/api/scripts/db-migrate.ts')[0], "import '../src/load-settings.js';");
});

test('Core’s first two database changes are exactly the card’s', () => {
  assert.equal(read('apps/api/drizzle/0000_core_audit_schemas.sql'), 'CREATE SCHEMA "audit";\n--> statement-breakpoint\nCREATE SCHEMA "core";\n');
  assert.equal(
    read('apps/api/drizzle/0001_core_audit_rights.sql'),
    [
      "-- Only the accounts reach Core's schemas (TECH-DESIGN 5.2). Each table gets its own grants in its own change.",
      'REVOKE ALL ON SCHEMA core, audit FROM PUBLIC;',
      '--> statement-breakpoint',
      'GRANT USAGE ON SCHEMA core, audit TO nexus_app;',
      '--> statement-breakpoint',
      '-- A new function is never runnable by everyone: each change grants EXECUTE only to the account that needs it.',
      'ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;',
      '',
    ].join('\n'),
  );
  const journal = JSON.parse(read('apps/api/drizzle/meta/_journal.json'));
  assert.equal(journal.dialect, 'postgresql');
  assert.deepEqual(
    journal.entries.slice(0, 2).map((e) => e.tag),
    ['0000_core_audit_schemas', '0001_core_audit_rights'],
  );
});

test('the database code never reaches the auth tables (CR-008)', () => {
  for (const path of ['apps/api/src/db/migrate.ts', 'apps/api/src/modules/core/schema/schemas.ts']) {
    assert.doesNotMatch(read(path), /auth-schema/, path);
  }
});
