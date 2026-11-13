// TASK-0024 · The settings store: the two database changes and their order, the schema file, the service's sources and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the two settings changes come right after the double-click key changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(9, 12), ['0009_core_idempotency_keys_rules', '0010_core_settings', '0011_core_settings_rights']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0010_core_settings.sql'),
    [
      "CREATE TABLE \"core\".\"settings\" (",
      "\t\"company_id\" uuid NOT NULL,",
      "\t\"key\" text NOT NULL,",
      "\t\"module\" text NOT NULL,",
      "\t\"value\" jsonb NOT NULL,",
      "\t\"updated_at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\t\"updated_by\" uuid,",
      "\t\"version\" integer DEFAULT 1 NOT NULL,",
      "\tCONSTRAINT \"settings_company_id_key_pk\" PRIMARY KEY(\"company_id\",\"key\")",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"core\".\"settings\" ADD CONSTRAINT \"settings_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;",
    ].join('\n'),
  );
});

test('the rule and rights change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0011_core_settings_rights.sql'),
    [
      "-- core.settings is a company table (DATA-MODEL 3.1): the company row rule; the app reads, adds and changes values and",
      "-- deletes none (a setting goes back to its default by saving the default).",
      "CALL core.add_company_rules('core.settings');",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT, UPDATE ON core.settings TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s schema, keys each value by company and key, and links it to its company', () => {
  const path = 'apps/api/src/modules/core/schema/settings.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { core } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/, 'use the core schema from schemas.ts, never a second pgSchema');
  assert.match(schema, /references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\)/);
  assert.match(schema, /primaryKey\(\{ columns: \[table\.companyId, table\.key\] \}\)/);
});

test('the settings service works in the request’s transaction, logs through the activity-log writer, and reads no environment', () => {
  const path = 'apps/api/src/modules/core/service/settings.ts';
  const service = read(path);
  assert.ok(imports(path).includes("import { getContext } from '../../../shared/context.js';"));
  assert.ok(imports(path).includes("import { writeActivity } from '../repository/activity-log.js';"));
  assert.ok(imports(path).every((line) => !/db\/database\.js'|settings-file|load-settings/.test(line)), 'never the pools or the settings file');
  assert.doesNotMatch(service, /process\.env|\.transaction\(|withCompany|Pool|connect\(/, 'no environment, and only the transaction on the context');
  assert.match(service, /forCompany\(settings\.companyId, companyId\)/);
});

test('Core’s module card lists the settings table and the rule for settings', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `core.settings`: the values a company changed for its settings, each with its version; a company table the app may read, add and change (DATA-MODEL 3.1, CORE-012)");
  const ruleLine = lines.indexOf("- Each setting is defined once in code with `defineSetting` (`modules/core/service/settings.ts`) by the card that first uses it, with a `<group>.<name>` key, its rule, default and help, and is listed on its module card under `## Rules` in a line that starts with `Setting` and gives its key, what it controls and its default; only changed values are stored in `core.settings`; every save checks the value and the version it was based on (409 `stale_version` when someone saved first) and is written to the activity log in the same transaction; a setting never holds a secret (CORE-012, TECH-DESIGN 6.6)");
  assert.ok(dataLine > data && dataLine < rules, 'the settings line sits under ## Data');
  assert.ok(
    ruleLine > rules && lines.slice(rules + 1, ruleLine).every((line) => line.startsWith('- ')),
    'the settings rule sits under ## Rules',
  );
});
