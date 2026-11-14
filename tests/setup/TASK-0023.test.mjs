// TASK-0023 · The per-address limit: the two database changes and their order, the schema file, the counter's and the limiter's code, where the limiter is mounted, the limit_hit event and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the two counter changes come right after the error changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(15, 18), ['0015_core_error_events_rules', '0016_core_rate_counters', '0017_core_rate_counters_rights']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0016_core_rate_counters.sql'),
    [
      "CREATE TABLE \"core\".\"rate_counters\" (",
      "\t\"bucket\" text NOT NULL,",
      "\t\"window_start\" timestamp with time zone NOT NULL,",
      "\t\"count\" integer NOT NULL,",
      "\tCONSTRAINT \"rate_counters_bucket_window_start_pk\" PRIMARY KEY(\"bucket\",\"window_start\")",
      ");",
      "",
    ].join('\n'),
  );
});

test('the rights change is exactly the card’s: no company rule, no delete', () => {
  assert.equal(
    read('apps/api/drizzle/0017_core_rate_counters_rights.sql'),
    [
      "-- core.rate_counters is a system table with no company (DATA-MODEL section 2): the app counts requests in it, on the",
      "-- security pool. Nothing deletes counters yet: the first card with nightly work clears old windows and adds that right.",
      "GRANT SELECT, INSERT, UPDATE ON core.rate_counters TO nexus_app;",
      "",
    ].join('\n'),
  );
});

test('the schema file is exactly the card’s: a system table with no company and no ID of its own', () => {
  assert.equal(read('apps/api/src/modules/core/schema/rate-counters.ts'), "import { integer, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';\nimport { core } from './schemas.js';\n\n// The request counters of the limits (DATA-MODEL 3.4, NFR-020): one row per bucket (for example\n// signin:ip:203.0.113.7) and fixed time window, with the number of requests counted in it, refused ones included. A\n// system table with no company: the per-address limit counts before anyone is known.\nexport const rateCounters = core.table(\n  'rate_counters',\n  {\n    bucket: text('bucket').notNull(),\n    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),\n    count: integer('count').notNull(),\n  },\n  (table) => [primaryKey({ columns: [table.bucket, table.windowStart] })],\n);\n");
});

test('the counter counts with one statement on the database’s clock, on the security pool with no company', () => {
  const path = 'apps/api/src/modules/core/repository/rate-counters.ts';
  const counter = read(path);
  assert.deepEqual(imports(path), [
    "import { sql } from 'drizzle-orm';",
    "import { securityWriteWithoutCompany } from '../../../db/database.js';",
    "import { writeSecurity } from './security-log.js';",
  ]);
  assert.ok(counter.includes('ON CONFLICT (bucket, window_start) DO UPDATE SET count = counter.count + 1'));
  assert.ok(counter.includes('to_timestamp(floor(extract(epoch FROM clock_timestamp()) / ${seconds}::int) * ${seconds}::int)'));
  assert.ok(counter.includes("    if (count === limit.max + 1) {\n      await writeSecurity({\n        event: 'limit_hit',"));
  assert.doesNotMatch(counter, /inRequestTransaction|withCompany|securityWrite\(|getPools|Date\.now|new Date|FOR UPDATE|SELECT count/);
});

test('the limiter reads its values at each request and counts the address Express trusts', () => {
  const path = 'apps/api/src/shared/address-limit.ts';
  const limiter = read(path);
  assert.deepEqual(imports(path), [
    "import type { RequestHandler } from 'express';",
    "import { AppError } from './errors.js';",
    "import { hitLimit } from '../modules/core/repository/rate-counters.js';",
  ]);
  assert.ok(limiter.includes('    const { max, windowSeconds } = addressLimits()[name];\n    const counted = await hitLimit({ name, key: `ip:${addressOf(req.ip)}`, max, windowSeconds });'));
  assert.ok(limiter.includes("      res.setHeader('Retry-After', String(counted.retryAfterSeconds));\n      throw new AppError(\n        429,\n        'too_many_requests',"));
  assert.doesNotMatch(limiter, /remoteAddress|x-forwarded-for|\.ips\b/i);
});

test('the limiter is mounted on the sign-in and two-step doors only, right after the same-site check and before the body is read', () => {
  const path = 'apps/api/src/app.ts';
  const lines = read(path).split('\n');
  assert.ok(imports(path).includes("import { addressLimit } from './shared/address-limit.js';"));
  const same = lines.indexOf('  app.use(sameSiteCheck());');
  const limiter = lines.indexOf("  app.use(['/api/auth', '/api/core/two-step'], addressLimit('signin'));");
  const body = lines.findIndex((line) => line.startsWith('  app.use(express.json('));
  assert.ok(same > 0 && limiter === same + 1, 'the limiter comes right after the same-site check');
  assert.ok(body > limiter, 'and before the body reader');
  assert.equal(lines.filter((line) => line.includes("addressLimit('signin')")).length, 1, 'the sign-in limit is mounted once');
});

test('the security log knows the limit_hit event', () => {
  const writer = read('apps/api/src/modules/core/repository/security-log.ts');
  assert.match(writer, /\| 'data_erased'\n {2}\| 'limit_hit';\n/);
  assert.match(writer, /'data_erased',\n {2}'limit_hit',\n\]\);/);
});

test('Core’s module card lists the counters table and the rule for the per-address limit', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `core.rate_counters`: the request counters of the limits, one row per bucket (for example `signin:ip:<address>`) and fixed window, refused requests included; a system table with no company that the app may read, add and change (DATA-MODEL 3.4, NFR-020)");
  const ruleLine = lines.indexOf("- The sign-in doors (`/api/auth`) and the two-step doors (`/api/core/two-step`) are under the per-address limit (`src/shared/address-limit.ts`), mounted in `app.ts` right after the same-site check and before the body is read: every request from one address is counted with `hitLimit` (`modules/core/repository/rate-counters.ts`) in the `signin` bucket, refused ones included; past the limit the answer is 429 `too_many_requests` with `Retry-After`, and the first refused request of a window writes one `limit_hit` entry in the security log's system chain; the values come from `ADDRESS_LIMITS` in the environment file (TECH-DESIGN section 2 step 2, NFR-020)");
  assert.ok(dataLine > data && dataLine < rules, 'the counters line sits under ## Data');
  assert.ok(lines[dataLine - 1].startsWith('- `core.error_events`:'), 'right after the errors line');
  assert.ok(ruleLine > rules, 'the rule sits under ## Rules');
  assert.ok(lines[ruleLine - 1].startsWith('- Every server error ('), 'right after the rule for server errors');
});
