// TASK-0015 · Company context and row rules: the exact database change, the helper file's imports and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the row-rule change comes right after the companies changes', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.equal(tags[5], '0005_core_company_rules');
  assert.deepEqual(tags.slice(2, 5), ['0002_core_ids', '0003_core_companies', '0004_core_companies_rights']);
});

test('the row-rule procedure is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0005_core_company_rules.sql'),
    [
      '-- The company row rule (TECH-DESIGN 5.1): a company table shows and takes only the rows of the company set for',
      '-- the transaction (app.company_id), for reading and for writing, and binds even the table\'s owner. Every later',
      '-- change that makes a company table calls this procedure once, so the rule is written in one place only.',
      'CREATE PROCEDURE core.add_company_rules(target regclass)',
      'LANGUAGE plpgsql',
      'SET search_path = pg_catalog, pg_temp',
      'AS $$',
      'BEGIN',
      '  IF NOT EXISTS (',
      '    SELECT FROM pg_attribute',
      "     WHERE attrelid = target AND attname = 'company_id' AND atttypid = 'uuid'::regtype",
      '       AND attnotnull AND NOT attisdropped',
      '  ) THEN',
      "    RAISE EXCEPTION '% has no company_id uuid NOT NULL column', target;",
      '  END IF;',
      "  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);",
      "  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', target);",
      '  EXECUTE format(',
      "    'CREATE POLICY company_rows ON %s FOR ALL'",
      "    ' USING (company_id = NULLIF(current_setting(''app.company_id'', true), '''')::uuid)'",
      "    ' WITH CHECK (company_id = NULLIF(current_setting(''app.company_id'', true), '''')::uuid)',",
      '    target',
      '  );',
      'END',
      '$$;',
      '',
    ].join('\n'),
  );
});

test('the company helpers use only Drizzle, and never reach the auth tables or the request context', () => {
  assert.deepEqual(imports('apps/api/src/db/company.ts'), [
    "import { eq, sql } from 'drizzle-orm';",
    "import type { SQL } from 'drizzle-orm';",
    "import type { NodePgDatabase } from 'drizzle-orm/node-postgres';",
    "import { PgTransaction } from 'drizzle-orm/pg-core';",
    "import type { PgColumn } from 'drizzle-orm/pg-core';",
  ]);
  assert.doesNotMatch(read('apps/api/src/db/company.ts'), /auth-schema|getContext|runWithContext/);
});

test('Core’s module card names the row rule, the company context and the data helper', () => {
  const card = read('apps/api/src/modules/core/MODULE.md');
  const rules = card.split('\n## Rules\n')[1].split('\n## ')[0];
  assert.match(rules, /^- Every company table gets the company row rule .*`CALL core\.add_company_rules\('<schema\.table>'\);`.*`withCompany`.*`forCompany`/m);
});
