// TASK-0020 · Announcements: the two database changes and their order, the schema file, the poster's code, the one place that adds announcements and Core's module card. Written by the planner; builders never edit this file.
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

test('the two announcement changes come right after the counter changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(17, 20), ['0017_core_rate_counters_rights', '0018_core_outbox', '0019_core_outbox_rights']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0018_core_outbox.sql'),
    [
      "CREATE TABLE \"core\".\"event_receipts\" (",
      "\t\"listener\" text NOT NULL,",
      "\t\"event_id\" uuid NOT NULL,",
      "\t\"handled_at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\tCONSTRAINT \"event_receipts_listener_event_id_pk\" PRIMARY KEY(\"listener\",\"event_id\")",
      ");",
      "--> statement-breakpoint",
      "CREATE TABLE \"core\".\"outbox\" (",
      "\t\"id\" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,",
      "\t\"company_id\" uuid NOT NULL,",
      "\t\"event\" text NOT NULL,",
      "\t\"event_version\" smallint NOT NULL,",
      "\t\"payload\" jsonb DEFAULT '{}'::jsonb NOT NULL,",
      "\t\"occurred_at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\t\"published_at\" timestamp with time zone,",
      "\t\"attempts\" integer DEFAULT 0 NOT NULL,",
      "\t\"last_error\" text,",
      "\t\"next_attempt_at\" timestamp with time zone DEFAULT now() NOT NULL",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"core\".\"event_receipts\" ADD CONSTRAINT \"event_receipts_event_id_outbox_id_fk\" FOREIGN KEY (\"event_id\") REFERENCES \"core\".\"outbox\"(\"id\") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint",
      "ALTER TABLE \"core\".\"outbox\" ADD CONSTRAINT \"outbox_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint",
      "CREATE INDEX \"outbox_waiting_idx\" ON \"core\".\"outbox\" USING btree (\"company_id\",\"id\") WHERE \"core\".\"outbox\".\"published_at\" IS NULL;",
    ].join('\n'),
  );
});

test('the rule and rights change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0019_core_outbox_rights.sql'),
    [
      "-- core.outbox is a company table (DATA-MODEL 3.3): its company row rule, in its own change.",
      "CALL core.add_company_rules('core.outbox');",
      "--> statement-breakpoint",
      "-- The app posts announcements in a save, and the worker marks each delivered or failed: it may read and add rows, and",
      "-- change only the delivery columns, never an announcement's company, event or payload. Nothing deletes rows yet (the",
      "-- first card with nightly work clears delivered announcements and adds that right).",
      "GRANT SELECT, INSERT ON core.outbox TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT UPDATE (published_at, attempts, last_error, next_attempt_at) ON core.outbox TO nexus_app;",
      "--> statement-breakpoint",
      "-- core.event_receipts is a system table (DATA-MODEL section 2): the worker records what each listener has handled, and",
      "-- a receipt is never changed or deleted.",
      "GRANT SELECT, INSERT ON core.event_receipts TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s schema: the outbox is a company table with its own key, the receipts a system table', () => {
  const path = 'apps/api/src/modules/core/schema/outbox.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { core } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/);
  assert.match(schema, /export const outbox = core\.table\(\n {2}'outbox',/);
  assert.match(schema, /\.default\(sql`core\.uuid_v7\(\)`\)/);
  assert.match(schema, /companyId: uuid\('company_id'\)\n\s+\.notNull\(\)\n\s+\.references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\),/);
  assert.match(schema, /export const eventReceipts = core\.table\(\n {2}'event_receipts',/);
  assert.match(schema, /\.references\(\(\) => outbox\.id, \{ onDelete: 'restrict' \}\),/);
  assert.match(schema, /primaryKey\(\{ columns: \[table\.listener, table\.eventId\] \}\)/);
});

test('the poster adds announcements only in the transaction on the request context, under its company', () => {
  const path = 'apps/api/src/modules/core/repository/outbox.ts';
  const poster = read(path);
  assert.deepEqual(imports(path), [
    "import { allAnnouncements } from '../../../announcements.js';",
    "import { getContext } from '../../../shared/context.js';",
    "import { outbox } from '../schema/outbox.js';",
  ]);
  assert.ok(poster.includes('  const [row] = await context.tx\n    .insert(outbox)\n    .values({\n      companyId: context.companyId,'));
  assert.ok(poster.includes('  if (!allAnnouncements.some((known) => known.name === announcement.event)) {'));
  assert.ok(poster.includes("      if (key !== '' && isSecret(key)) {\n        throw new Error('an announcement never carries a secret');"));
  assert.ok(poster.includes('      eventVersion: version,\n      payload: checked,\n'), 'the checked copy is saved');
  assert.doesNotMatch(poster, /db\/(database|company)\.js|withCompany|\.transaction\(|securityWrite|getPools/);
});

test('only the poster adds announcements', () => {
  const adders = sources('apps/api/src').filter((file) => /insert\(outbox\)|INSERT INTO core\.outbox/i.test(read(file)));
  assert.deepEqual(adders, ['apps/api/src/modules/core/repository/outbox.ts']);
});

test('Core’s module card lists both tables after the counters, and the announcement rule right after the activity-log rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const outboxLine = lines.indexOf("- `core.outbox`: the announcements a save posts, each kept until the worker has delivered it to every listener, with the delivery's attempts, last error and next try; a company table the app may read and add to, changing only those delivery columns (DATA-MODEL 3.3, NFR-003)");
  const receiptsLine = lines.indexOf("- `core.event_receipts`: which listener has handled which announcement, so none handles one twice; a system table the app may read and add to (DATA-MODEL 3.3, NFR-003)");
  const ruleLine = lines.indexOf("- Every announcement is posted with `announce` (`modules/core/repository/outbox.ts`) in the save's own transaction, after its activity-log entry, never inside a security write (whose transaction stays when the save is undone): its event is registered in `allAnnouncements` (`src/announcements.ts`) and listed on its module card under `## Announcements`, it has a version, and its payload holds IDs and the facts needed, never a copy of another module's record and never a secret; the worker delivers it later, once to each listener (D-014, NFR-003)");
  assert.ok(outboxLine > data && outboxLine < rules, 'the outbox line sits under ## Data');
  assert.ok(lines[outboxLine - 1].startsWith('- `core.rate_counters`:'), 'right after the counters line');
  assert.equal(receiptsLine, outboxLine + 1, 'the receipts line follows it');
  assert.ok(ruleLine > rules && lines[ruleLine - 1].startsWith('- Every save writes its activity-log entry with `writeActivity`'), 'the rule follows the activity-log rule');
});
