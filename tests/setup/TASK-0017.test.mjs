// TASK-0017 · The activity log and its writer: the two database changes and their order, the schema file, the writer's sources and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the two activity-log changes come right after the company rule change, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(5, 8), ['0005_core_company_rules', '0006_audit_activity_log', '0007_audit_activity_log_rules']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0006_audit_activity_log.sql'),
    [
      "CREATE TYPE \"audit\".\"actor_type\" AS ENUM('person', 'automation', 'api', 'mcp', 'ai', 'system');--> statement-breakpoint",
      "CREATE TABLE \"audit\".\"activity_log\" (",
      "\t\"id\" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,",
      "\t\"company_id\" uuid NOT NULL,",
      "\t\"at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\t\"actor_type\" \"audit\".\"actor_type\" NOT NULL,",
      "\t\"actor_user_id\" uuid,",
      "\t\"actor_label\" text,",
      "\t\"module\" text NOT NULL,",
      "\t\"record_type\" text NOT NULL,",
      "\t\"record_id\" uuid NOT NULL,",
      "\t\"record_label\" text NOT NULL,",
      "\t\"action\" text NOT NULL,",
      "\t\"changes\" jsonb DEFAULT '{}'::jsonb NOT NULL,",
      "\t\"client_id\" uuid,",
      "\t\"request_id\" text",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"audit\".\"activity_log\" ADD CONSTRAINT \"activity_log_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint",
      "CREATE INDEX \"activity_log_record_idx\" ON \"audit\".\"activity_log\" USING btree (\"company_id\",\"module\",\"record_type\",\"record_id\",\"at\");--> statement-breakpoint",
      "CREATE INDEX \"activity_log_client_idx\" ON \"audit\".\"activity_log\" USING btree (\"company_id\",\"client_id\",\"at\");--> statement-breakpoint",
      "CREATE INDEX \"activity_log_actor_idx\" ON \"audit\".\"activity_log\" USING btree (\"company_id\",\"actor_user_id\",\"at\");--> statement-breakpoint",
      "CREATE INDEX \"activity_log_at_idx\" ON \"audit\".\"activity_log\" USING btree (\"company_id\",\"at\");",
    ].join('\n'),
  );
});

test('the rule and rights change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0007_audit_activity_log_rules.sql'),
    [
      "-- audit.activity_log is a company table (DATA-MODEL 3.3): the company row rule, and the app may only add and read",
      "-- entries; no account may change or delete one except through the delete-on-request path (TASK-0025).",
      "CALL core.add_company_rules('audit.activity_log');",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT ON audit.activity_log TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s audit schema and links each entry to its company', () => {
  const path = 'apps/api/src/modules/core/schema/activity-log.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { audit } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/, 'use the audit schema from schemas.ts, never a second pgSchema');
  assert.match(schema, /references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\)/);
});

test('the writer takes the transaction and the company from the request context and opens nothing itself', () => {
  const path = 'apps/api/src/modules/core/repository/activity-log.ts';
  const writer = read(path);
  assert.ok(imports(path).includes("import { getContext } from '../../../shared/context.js';"));
  assert.ok(imports(path).every((line) => !/db\/(database|company)\.js'/.test(line)), 'never the pools or withCompany');
  assert.doesNotMatch(writer, /\.transaction\(|withCompany|Pool|connect\(/, 'the writer uses the transaction on the context only');
  assert.match(writer, /context\.tx/);
  assert.match(writer, /companyId: context\.companyId/);
  assert.match(writer, /requestId: context\.requestId/);
});

test('Core’s module card lists the activity log and the rule for writing it', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `audit.activity_log`: one entry per change or automatic action (who, what, when, old and new values); a company table the app may only add to and read (DATA-MODEL 3.3, CORE-090)");
  const ruleLine = lines.indexOf("- Every save writes its activity-log entry with `writeActivity` (`modules/core/repository/activity-log.ts`) in the save's own transaction, after the work and before any announcement; `changes` holds only the changed fields as `{ field: { old, new } }`, named as in the record's API contract (a new record: `old` is null; a delete or restore: `{}`), and never a password, code, token or key; a change to a record with no ID of its own (a setting, a switch) is logged against the record that holds it, for a company's settings the company (TECH-DESIGN section 2 step 13, CORE-090)");
  assert.ok(dataLine > data && dataLine < rules, 'the activity log line sits under ## Data');
  assert.ok(
    ruleLine > rules && lines.slice(rules + 1, ruleLine).every((line) => line.startsWith('- ')),
    'the writer rule sits under ## Rules',
  );
});
