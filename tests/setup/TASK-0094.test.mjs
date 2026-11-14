// TASK-0094 · Announcements delivered by the worker: the worker's start and stop, the two new helpers of database.ts, the delivery's code, the one place that adds receipts and marks announcements, and Core's module card. Written by the planner; builders never edit this file.
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

test('the worker reads the settings first, starts the delivery with no listener, and on a signal stops it before the pools', () => {
  const path = 'apps/api/src/worker.ts';
  assert.deepEqual(imports(path), [
    "import './load-settings.js';",
    "import { closePools } from './db/database.js';",
    "import { startDelivery } from './modules/core/events/delivery.js';",
    "import { createLogger } from './shared/logging.js';",
  ]);
  const worker = read(path);
  assert.ok(worker.includes('const delivery = startDelivery({ listeners: [], logger, everyMs: 5_000 });\n'));
  assert.ok(worker.includes("\nconsole.log('worker started');\n"));
  assert.ok(worker.includes('async function stop(): Promise<void> {\n  await delivery.stop();\n  await closePools();\n  process.exit(0);\n}\n'));
  assert.ok(worker.includes("process.on('SIGTERM', stop);\nprocess.on('SIGINT', stop);\n"));
  assert.doesNotMatch(worker, /setInterval|deliverPending/);
});

test('database.ts gains the company transaction on the request pool and the company list, and still makes one pool', () => {
  const database = read('apps/api/src/db/database.ts');
  assert.equal((database.match(/new Pool\(/g) || []).length, 1, 'never a third pool');
  assert.match(database, /^export async function inCompanyTransaction<T>\(\n {2}companyId: string,\n {2}work: \(tx: Transaction\) => Promise<T>,\n\): Promise<T> \{$/m);
  assert.ok(database.includes("  if (!context) throw new Error('a company transaction needs its own context');\n  if (context.tx) throw new Error('a company transaction cannot run inside another transaction');\n"));
  assert.ok(database.includes('  return onConnection(getPools().request, companyId, (tx) =>\n    runWithContext({ ...context, companyId, tx }, () => work(tx)),\n  );\n'));
  assert.match(database, /^export async function listCompanyIds\(\): Promise<string\[\]> \{$/m);
  assert.ok(database.includes("  if (currentContext()?.tx) throw new Error('the companies are not read inside a transaction');\n"));
  assert.ok(database.includes("'SELECT id FROM core.companies ORDER BY id'"));
});

test('the delivery takes each announcement under a skip lock, names its company in the claim and in every update, and hands each listener its savepoint', () => {
  // Only what the database tests cannot show: the row rule hides another company's rows anyway, a short claim lock
  // looks the same as a skip lock, and the listener's queries run on the same connection either way.
  const path = 'apps/api/src/modules/core/events/delivery.ts';
  assert.deepEqual(imports(path), [
    "import { randomUUID } from 'node:crypto';",
    "import { and, asc, eq, isNull, lt, lte, sql } from 'drizzle-orm';",
    "import type { pino } from 'pino';",
    "import { allAnnouncements } from '../../../announcements.js';",
    "import { forCompany } from '../../../db/company.js';",
    "import { inCompanyTransaction, listCompanyIds } from '../../../db/database.js';",
    "import { getContext, runWithContext } from '../../../shared/context.js';",
    "import { safeErrorMessage } from '../../../shared/logging.js';",
    "import { recordError } from '../repository/error-events.js';",
    "import { eventReceipts, outbox } from '../schema/outbox.js';",
  ]);
  const delivery = read(path);
  for (const line of [
    '        and(\n          forCompany(outbox.companyId, companyId),\n          isNull(outbox.publishedAt),\n',
    "      .orderBy(asc(outbox.id))\n      .limit(1)\n      .for('update', { skipLocked: true });\n",
    '  const thisOne = (id: string) => and(forCompany(outbox.companyId, companyId), eq(outbox.id, id));\n',
    "      .where(and(thisOne(row.id), isNull(outbox.publishedAt)))\n      .for('update');\n",
    '            await runWithContext({ ...getContext(), tx: savepoint }, () =>\n              listener.handle(announcement),\n',
  ]) {
    assert.ok(delivery.includes(line), `delivery.ts holds the card's lines: ${line.split('\n')[0].trim()}`);
  }
  const updates = delivery.split('.update(outbox)').slice(1);
  assert.equal(updates.length, 3, 'the claim, and the delivery marked delivered or failed');
  for (const update of updates) {
    assert.match(update, /^[^;]*\.where\(thisOne\((oldest|row)\.id\)\);/, 'every update names the announcement with its company');
  }
  assert.doesNotMatch(delivery, /setInterval|inRequestTransaction|securityWrite|getPools|new Pool|error\.message|String\(error\)|\.stack\b|console\./);
});

test('only the delivery adds receipts and marks announcements delivered or failed', () => {
  const writers = sources('apps/api/src').filter((file) => /insert\(eventReceipts\)|INSERT INTO core\.event_receipts|update\(outbox\)|UPDATE core\.outbox/i.test(read(file)));
  assert.deepEqual(writers, ['apps/api/src/modules/core/events/delivery.ts']);
});

test('Core’s module card has the delivery rule right after the announcement rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rules = lines.indexOf('## Rules');
  const ruleLine = lines.indexOf("- Announcements are delivered by the worker with `deliverPending` (`modules/core/events/delivery.ts`), company by company, each in a context of its own and one transaction with its company set (`inCompanyTransaction`, `src/db/database.ts`): every listener has a permanent `name`, its event and the versions it reads, and runs in a savepoint of its own after its receipt is added, so it handles an announcement at most once and what it writes is kept only with its receipt; the announcement is marked delivered once every listener has its receipt, and otherwise tried again after 1, 5, 15 and 60 minutes, at most 5 times, each failure logged and kept with `recordError` under its company (D-014, NFR-003)");
  assert.ok(ruleLine > rules, 'the rule sits under ## Rules');
  assert.ok(lines[ruleLine - 1].startsWith('- Every announcement is posted with `announce`'), 'right after the announcement rule');
});
