// TASK-0092 · The companies table and time-ordered IDs: the exact database changes, their order, the schema file and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the three database changes come after Core’s first two, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(0, 5), [
    '0000_core_audit_schemas',
    '0001_core_audit_rights',
    '0002_core_ids',
    '0003_core_companies',
    '0004_core_companies_rights',
  ]);
});

test('the ID function and the companies rights are exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0002_core_ids.sql'),
    [
      '-- Time-ordered unique IDs (UUID version 7) for every table\'s key (DATA-MODEL section 2): the first 48 bits are',
      '-- the time in milliseconds, then the version (7), then random bits.',
      'CREATE FUNCTION core.uuid_v7() RETURNS uuid',
      'LANGUAGE sql VOLATILE PARALLEL SAFE',
      'SET search_path = pg_catalog, pg_temp',
      'AS $$',
      '  SELECT encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid())',
      '    PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)',
      "    FROM 1 FOR 6), 52, 1), 53, 1), 'hex')::uuid",
      '$$;',
      '--> statement-breakpoint',
      'GRANT EXECUTE ON FUNCTION core.uuid_v7() TO nexus_app;',
      '',
    ].join('\n'),
  );
  assert.equal(
    read('apps/api/drizzle/0004_core_companies_rights.sql'),
    [
      '-- core.companies is a system table (no company row rule): the app may only read it; the first-start command',
      '-- (nexus_owner) makes its rows.',
      'GRANT SELECT ON core.companies TO nexus_app;',
      '',
    ].join('\n'),
  );
});

test('drizzle-kit made the companies table from the schema file, with the time-ordered key', () => {
  assert.equal(
    read('apps/api/drizzle/0003_core_companies.sql'),
    [
      'CREATE TYPE "core"."company_status" AS ENUM(\'active\', \'paused\');--> statement-breakpoint',
      'CREATE TABLE "core"."companies" (',
      '\t"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,',
      '\t"name" text NOT NULL,',
      '\t"slug" text NOT NULL,',
      '\t"status" "core"."company_status" DEFAULT \'active\' NOT NULL,',
      '\t"created_at" timestamp with time zone DEFAULT now() NOT NULL,',
      '\tCONSTRAINT "companies_slug_unique" UNIQUE("slug")',
      ');',
      '',
    ].join('\n'),
  );
  assert.deepEqual(imports('apps/api/src/modules/core/schema/companies.ts'), [
    "import { sql } from 'drizzle-orm';",
    "import { text, timestamp, uuid } from 'drizzle-orm/pg-core';",
    "import { core } from './schemas.js';",
  ]);
});

test('Core’s module card lists the companies table and the ID rule, under the template’s intro', () => {
  const card = read('apps/api/src/modules/core/MODULE.md');
  const intro = read('docs/templates/MODULE-CARD.md')
    .split('\n')
    .find((line) => line.startsWith('Every module is built from the same 6 parts'));
  assert.ok(card.split('\n').includes(intro), 'the intro sentence is the template’s');
  const section = (name) => card.split(`\n## ${name}\n`)[1].split('\n## ')[0];
  assert.match(section('Data'), /^- `core\.companies`: /m);
  assert.doesNotMatch(section('Data'), /tables come with step 2\.2/);
  assert.match(section('Rules'), /`core\.uuid_v7\(\)`/);
});
