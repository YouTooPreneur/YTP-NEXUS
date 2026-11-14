// TASK-0025 · Removing personal values on request: the database change (found by its name, so its number may change at merge), the remover's code, the one place that calls the function, and Core's module card. Written by the planner; builders never edit this file.
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

test('the removal change exists once, in the journal and as a file, and holds exactly the card’s SQL', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  const mine = tags.filter((tag) => /^\d{4}_core_erasure$/.test(tag));
  assert.equal(mine.length, 1, 'one core_erasure change in the journal');
  const files = readdirSync('apps/api/drizzle').filter((name) => /^\d{4}_core_erasure\.sql$/.test(name));
  assert.deepEqual(files, [`${mine[0]}.sql`]);
  assert.equal(
    read(`apps/api/drizzle/${files[0]}`),
    [
      "-- Removing personal values on request (TASK-0025, DPDP, NFR-010): the system account may read activity entries and change",
      "-- only their changes and record label, and only through core.erase_personal_values, which the app runs from the Owner's",
      "-- deletion-request action. No other account may change an entry.",
      "GRANT SELECT, UPDATE (changes, record_label) ON audit.activity_log TO nexus_system;",
      "--> statement-breakpoint",
      "SET ROLE nexus_system;",
      "--> statement-breakpoint",
      "-- In the transaction's company, every activity entry of one record: its label, and the old and new values of each field",
      "-- named in p_fields (a list of names), become '[removed on request]'. Gives back how many entries changed.",
      "CREATE FUNCTION core.erase_personal_values(p_record_type text, p_record_id uuid, p_fields jsonb) RETURNS integer",
      "LANGUAGE plpgsql SECURITY DEFINER",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "DECLARE",
      "  company uuid := NULLIF(current_setting('app.company_id', true), '')::uuid;",
      "  removed constant jsonb := '{\"old\": \"[removed on request]\", \"new\": \"[removed on request]\"}'::jsonb;",
      "  changed integer;",
      "BEGIN",
      "  IF company IS NULL THEN",
      "    RAISE EXCEPTION 'the removal needs the company';",
      "  END IF;",
      "  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'array' THEN",
      "    RAISE EXCEPTION 'the removal needs a list of field names';",
      "  END IF;",
      "  UPDATE audit.activity_log AS entry",
      "     SET record_label = '[removed on request]',",
      "         changes = (SELECT coalesce(jsonb_object_agg(key, CASE WHEN p_fields ? key THEN removed ELSE value END), '{}'::jsonb)",
      "                      FROM jsonb_each(entry.changes))",
      "   WHERE entry.company_id = company AND entry.record_type = p_record_type AND entry.record_id = p_record_id;",
      "  GET DIAGNOSTICS changed = ROW_COUNT;",
      "  RETURN changed;",
      "END",
      "$$;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION core.erase_personal_values(text, uuid, jsonb) TO nexus_app;",
      "--> statement-breakpoint",
      "RESET ROLE;",
      "",
    ].join('\n'),
  );
});

test('the remover works in the request’s own transaction and writes the data_erased entry through the security-log writer', () => {
  const path = 'apps/api/src/modules/core/repository/erasure.ts';
  const remover = read(path);
  assert.ok(imports(path).includes("import { getContext } from '../../../shared/context.js';"));
  assert.ok(imports(path).includes("import { writeSecurity } from './security-log.js';"));
  assert.ok(imports(path).every((line) => !/db\/(database|company)\.js'|schema\//.test(line)), 'never the pools, withCompany or a table');
  assert.match(remover, /core\.erase_personal_values\(/);
  assert.match(remover, /event: 'data_erased'/);
  assert.doesNotMatch(remover, /\.transaction\(|securityWrite|\.update\(|UPDATE audit/);
});

test('only the remover calls the removal function', () => {
  const callers = sources('apps/api/src').filter((file) => /erase_personal_values/.test(read(file)));
  assert.deepEqual(callers, ['apps/api/src/modules/core/repository/erasure.ts']);
});

test('Core’s module card has the removal rule under Rules', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rules = lines.indexOf('## Rules');
  const screens = lines.indexOf('## Screens');
  const rule = lines.indexOf("- Personal values are removed from the activity log only by `erasePersonalValues` (`modules/core/repository/erasure.ts`), called by the Owner's deletion-request action in the request's own transaction: every entry of the record, in that company only, keeps its fields but its label and the named fields' old and new values become `[removed on request]` (`core.erase_personal_values`, the only way the system account may change an entry), and a `data_erased` security entry is written last; stored double-click answers are not changed (they expire within 24 hours) (DPDP, NFR-010)");
  assert.ok(rule > rules && rule < screens, 'the removal rule sits under ## Rules');
});
