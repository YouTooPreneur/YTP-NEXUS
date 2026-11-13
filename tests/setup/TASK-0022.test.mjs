// TASK-0022 · Double-click keys: the two database changes and their order, the schema file, the step's sources, the hooks and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the two double-click key changes come right after the activity-log changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(7, 10), ['0007_audit_activity_log_rules', '0008_core_idempotency_keys', '0009_core_idempotency_keys_rules']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0008_core_idempotency_keys.sql'),
    [
      "CREATE TABLE \"core\".\"idempotency_keys\" (",
      "\t\"company_id\" uuid NOT NULL,",
      "\t\"key\" text NOT NULL,",
      "\t\"user_id\" uuid NOT NULL,",
      "\t\"action\" text NOT NULL,",
      "\t\"result\" jsonb,",
      "\t\"expires_at\" timestamp with time zone DEFAULT now() + interval '24 hours' NOT NULL,",
      "\tCONSTRAINT \"idempotency_keys_company_id_key_pk\" PRIMARY KEY(\"company_id\",\"key\")",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"core\".\"idempotency_keys\" ADD CONSTRAINT \"idempotency_keys_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;",
    ].join('\n'),
  );
});

test('the rule and rights change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0009_core_idempotency_keys_rules.sql'),
    [
      "-- core.idempotency_keys is a company table (DATA-MODEL 3.4): the company row rule; the app reads, adds and updates",
      "-- keys (a key whose 24 hours are over is claimed again) and deletes none.",
      "CALL core.add_company_rules('core.idempotency_keys');",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE ON core.idempotency_keys TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s schema, keys each entry by company and key, and links it to its company', () => {
  const path = 'apps/api/src/modules/core/schema/idempotency-keys.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { core } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/, 'use the core schema from schemas.ts, never a second pgSchema');
  assert.match(schema, /references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\)/);
  assert.match(schema, /primaryKey\(\{ columns: \[table\.companyId, table\.key\] \}\)/);
});

test('the step works in the request’s transaction from the context and opens nothing itself', () => {
  const path = 'apps/api/src/shared/idempotency.ts';
  const step = read(path);
  assert.ok(imports(path).includes("import { getContext } from './context.js';"));
  assert.ok(imports(path).every((line) => !/db\/database\.js'/.test(line)), 'never the pools');
  assert.doesNotMatch(step, /\.transaction\(|withCompany|Pool|connect\(/, 'the step uses the transaction on the context only');
  assert.match(step, /forCompany\(idempotencyKeys\.companyId, companyId\)/);
});

test('the shared hooks use the real double-click step', () => {
  const hooks = read('apps/api/src/shared/hooks.ts');
  assert.ok(imports('apps/api/src/shared/hooks.ts').includes("import { doubleClickKey } from './idempotency.js';"));
  assert.match(hooks, /^ {4}idempotency: async \(info, run\) => doubleClickKey\(info, run\),$/m);
  assert.doesNotMatch(hooks, /notBuilt\('idempotency'\)/);
});

test('Core’s module card lists the double-click keys and the rule for them', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `core.idempotency_keys`: the first answer to a request that changes data, kept 24 hours under the screen's double-click key; a company table the app may read, add and update (DATA-MODEL 3.4, NFR-021)");
  const ruleLine = lines.indexOf("- Every request that changes data carries an `Idempotency-Key` (a UUID the screen makes, one per change, sent again on a retry); a repeat within 24 hours by the same person to the same door gets the first answer without running again (`src/shared/idempotency.ts`, TECH-DESIGN section 2 step 12, NFR-021)");
  assert.ok(dataLine > data && dataLine < rules, 'the double-click keys line sits under ## Data');
  assert.ok(
    ruleLine > rules && lines.slice(rules + 1, ruleLine).every((line) => line.startsWith('- ')),
    'the double-click rule sits under ## Rules',
  );
});
