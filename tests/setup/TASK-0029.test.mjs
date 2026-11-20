// TASK-0029 · The doors table's two changes in order, the rights change exactly and the status type and the person link written with their schema; the schema and writer files' own lines; the one place that writes core.doors (under any name of the table, and in SQL, quoted or not); Core's module card. Written by the planner; builders never edit this file.
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
// The code itself, without its comments: a comment may explain a rule in the card's own words.
const code = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

// A file writes core.doors when it adds or changes its rows: with the table object under any name it is imported by
// (`insert(doors)`, `import { doors as rows }` and then `update(rows)`, `insert(schema.doors)`), or in SQL, quoted or
// spaced (`INSERT INTO "core"."doors"`, `UPDATE core . doors`). Comments count too.
const writesDoors = (text) => {
  if (/\b(INSERT\s+INTO|UPDATE)\s+"?core"?\s*\.\s*"?doors"?(?!\w)/i.test(text)) return true;
  const aliases = [...text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*\bdoors(?:\.js)?['"]/g)]
    .flatMap((match) => match[1].split(','))
    .map((part) => part.trim().match(/^doors\s+as\s+(\w+)$/)?.[1])
    .filter(Boolean);
  return ['doors', '\\w+\\.doors', ...aliases].some((name) => new RegExp(`\\b(insert|update)\\(\\s*${name}\\s*\\)`, 'i').test(text));
};

const RIGHTS = `-- core.doors is a company table (DATA-MODEL 3.4): its company row rule, in its own change.
CALL core.add_company_rules('core.doors');
--> statement-breakpoint
-- The app reads the doors and adds a company's row for a door; it changes only a door's provider, status, settings,
-- last check and who changed it last, never a row's company, door or on/off switch, and it never deletes a row.
GRANT SELECT, INSERT ON core.doors TO nexus_app;
--> statement-breakpoint
GRANT UPDATE (provider, status, settings, last_check_at, last_check_ok, last_error, updated_at, updated_by) ON core.doors TO nexus_app;
`;

const DATA_LINE =
  "- `core.doors`: each company's doors to outside services (Release 1: `email` and `files`), one row per company and door with its provider, status (`not_connected`, `connected` or `error`), on/off switch, non-secret settings and last check (when, whether it passed and the cleaned error); never a key or password (keys stay in the environment file); a company table the app may read and add to, changing only a door's provider, status, settings, last check and who changed it last, never a row's company, door or on/off switch, and never deleting a row (DATA-MODEL 3.4, D-018, CORE-121)";
const RULE_LINE =
  "- Every outside service connects through a door in `modules/core/doors/`, never from a module directly (D-018); each door records the result of its checks and sends with `recordDoorCheck` (`modules/core/doors/doors.ts`), the only code that adds or changes `core.doors` rows, in a security write of its own (`securityWrite`), so the result stays when the caller's transaction is undone: the company's one row for that door gets the provider, the status, the database's time of the check, whether it passed and, for an error, only the cleaned message (`safeErrorMessage(error)` without NUL characters, at most 2000 characters), never a key or password (CORE-121, TECH-DESIGN 6.4 and section 7); a door passes `recordDoorCheck` only an error with its own fixed message, never a library's or driver's error, its cause or a server reply (TECH-DESIGN section 7)";

test('the doors table comes in two changes, the table and then its rights, one right after the other', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((entry) => entry.tag);
  const tables = tags.filter((tag) => /^\d{4}_core_doors$/.test(tag));
  const rights = tags.filter((tag) => /^\d{4}_core_doors_rights$/.test(tag));
  assert.equal(tables.length, 1, 'one core_doors change');
  assert.equal(rights.length, 1, 'one core_doors_rights change');
  assert.equal(tags.indexOf(rights[0]), tags.indexOf(tables[0]) + 1, 'the rights come right after the table');
  assert.equal(read(`apps/api/drizzle/${rights[0]}.sql`), RIGHTS);
  const tableSql = read(`apps/api/drizzle/${tables[0]}.sql`);
  // drizzle-kit 0.31.11 writes a type whose name starts with a built-in type's name (time, text, date...) without its
  // schema, and the change would then fail: door_status starts with none, and both places name its schema.
  assert.match(tableSql, /^CREATE TYPE "core"\."door_status" AS ENUM\('not_connected', 'connected', 'error'\);/m, 'the status type is made in core');
  assert.match(tableSql, /\n\t"status" "core"\."door_status" DEFAULT 'not_connected' NOT NULL,\n/, 'the status column names the type with its schema');
  assert.match(
    tableSql,
    /FOREIGN KEY \("company_id","updated_by"\) REFERENCES "core"\."users"\("company_id","id"\) ON DELETE restrict/,
    'updated_by links to a person of the same company',
  );
  assert.doesNotMatch(tableSql, /secret_enc|bytea/, 'no stored key: keys come from the environment file in Release 1');
});

test('the schema file declares the status type and the table in Core’s schema, linked to a person of the same company', () => {
  const schema = read('apps/api/src/modules/core/schema/doors.ts');
  assert.match(schema, /^export const doorStatus = core\.enum\('door_status', \['not_connected', 'connected', 'error'\]\);$/m);
  assert.match(schema, /^export const doors = core\.table\(/m);
  assert.match(schema, /foreignColumns: \[users\.companyId, users\.id\]/);
  assert.doesNotMatch(schema, /pgSchema\(|customType|bytea/);
});

test('the writer names the doors, providers and statuses word for word, and writes one upsert in a security write of its own', () => {
  const writer = read('apps/api/src/modules/core/doors/doors.ts');
  const lines = writer.split('\n');
  for (const line of [
    "export const DOOR_KEYS = ['email', 'files'] as const;",
    'export type DoorKey = (typeof DOOR_KEYS)[number];',
    "export const DOOR_PROVIDERS = ['gmail', 'smtp', 'r2', 'seaweedfs'] as const;",
    'export type DoorProvider = (typeof DOOR_PROVIDERS)[number];',
    "export type DoorStatus = 'not_connected' | 'connected' | 'error';",
  ]) {
    assert.ok(lines.includes(line), line);
  }
  assert.match(writer, /^export async function recordDoorCheck\(/m);
  const own = code(writer);
  assert.match(own, /securityWrite\(\s*companyId,/, 'a security write of its own, under the company it is given');
  assert.match(own, /\.onConflictDoUpdate\(/, 'one statement: added or updated');
  assert.doesNotMatch(own, /new Pool|getPools|String\([^)]*error|\.stack\b|JSON\.stringify/, 'only the cleaned message, and no pool of its own');
  assert.doesNotMatch(own, /\b(logger|console|pino)\b|createLogger|writeActivity|writeSecurity|\.delete\(/, 'it logs nothing, writes no activity or security entry and deletes nothing');
});

test('the scan for writers of core.doors sees every way of writing the table, and no reader', () => {
  for (const text of [
    'await tx.insert(doors).values(row);',
    "import { sql } from 'drizzle-orm';\nimport { doors as doorRows } from '../schema/doors.js';\nawait tx.update(doorRows).set(row);",
    "import {\n  doors as rows,\n  doorStatus,\n} from '../../modules/core/schema/doors.js';\nawait tx\n  .insert( rows )\n  .values(row);",
    'await tx.insert(schema.doors).values(row);',
    'await tx.execute(sql`INSERT INTO "core"."doors" (company_id, key, provider) VALUES (${id}, ${key}, ${provider})`);',
    'await tx.execute(sql`UPDATE core . doors SET updated_at = now()`);',
    "await client.query('update core.doors set status = $1', [status]);",
  ]) {
    assert.ok(writesDoors(text), text);
  }
  for (const text of [
    "import { doors } from '../schema/doors.js';\nawait tx.select().from(doors);",
    "await client.query('SELECT key FROM core.doors');",
    'await tx.execute(sql`UPDATE core.doors_log SET x = 1`);',
    'await tx.insert(doorsLog).values(row);',
  ]) {
    assert.ok(!writesDoors(text), text);
  }
});

test('only the writer adds or changes rows of core.doors', () => {
  const writers = sources('apps/api/src').filter((file) => writesDoors(read(file)));
  assert.deepEqual(writers, ['apps/api/src/modules/core/doors/doors.ts']);
});

test('Core’s module card lists the doors table after the receipts, and the doors rule after the removal rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rules = lines.indexOf('## Rules');
  const screens = lines.indexOf('## Screens');
  const data = lines.indexOf(DATA_LINE);
  const rule = lines.indexOf(RULE_LINE);
  assert.ok(data > lines.indexOf('## Data') && data < rules, 'the doors line sits under ## Data');
  assert.ok(lines[data - 1].startsWith('- `core.event_receipts`:'), 'right after the receipts line');
  assert.ok(rule > rules && rule < screens, 'the doors rule sits under ## Rules');
  assert.ok(lines[rule - 1].startsWith('- Personal values are removed from the activity log only by'), 'right after the removal rule');
});
