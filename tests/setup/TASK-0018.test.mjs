// TASK-0018 · The security log: the two database changes and their order, the schema file, the writer's and the no-company write's sources, the request context's new fields and Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const imports = (path) =>
  read(path)
    .split('\n')
    .filter((line) => /^import\b/.test(line));

test('the two security-log changes come right after the settings changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(11, 14), ['0011_core_settings_rights', '0012_audit_security_log', '0013_audit_security_log_rules']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0012_audit_security_log.sql'),
    [
      "CREATE TABLE \"audit\".\"security_log\" (",
      "\t\"id\" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name \"audit\".\"security_log_id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),",
      "\t\"company_id\" uuid,",
      "\t\"seq\" bigint NOT NULL,",
      "\t\"at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\t\"event\" text NOT NULL,",
      "\t\"user_id\" uuid,",
      "\t\"target_user_id\" uuid,",
      "\t\"record_type\" text,",
      "\t\"record_id\" uuid,",
      "\t\"ip\" text,",
      "\t\"user_agent\" text,",
      "\t\"details\" jsonb DEFAULT '{}'::jsonb NOT NULL,",
      "\t\"request_id\" text,",
      "\t\"prev_hash\" text NOT NULL,",
      "\t\"hash\" text NOT NULL,",
      "\tCONSTRAINT \"security_log_chain_seq_unique\" UNIQUE NULLS NOT DISTINCT(\"company_id\",\"seq\")",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"audit\".\"security_log\" ADD CONSTRAINT \"security_log_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;",
    ].join('\n'),
  );
});

test('the rule, rights and functions change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0013_audit_security_log_rules.sql'),
    [
      "-- audit.security_log is a company table whose system chain has no company (DATA-MODEL 3.3): the company row rule is",
      "-- added while company_id is briefly required (the table is empty), so the rule stays written only in the procedure.",
      "ALTER TABLE audit.security_log ALTER COLUMN company_id SET NOT NULL;",
      "--> statement-breakpoint",
      "CALL core.add_company_rules('audit.security_log');",
      "--> statement-breakpoint",
      "ALTER TABLE audit.security_log ALTER COLUMN company_id DROP NOT NULL;",
      "--> statement-breakpoint",
      "-- Nobody changes or deletes an entry; only the owner account may empty the table (the tests do, before each run).",
      "CREATE FUNCTION audit.security_log_refuse_change() RETURNS trigger",
      "LANGUAGE plpgsql",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "BEGIN",
      "  IF TG_OP = 'TRUNCATE' AND current_user = 'nexus_owner' THEN",
      "    RETURN NULL;",
      "  END IF;",
      "  RAISE EXCEPTION 'the security log cannot be changed';",
      "END",
      "$$;",
      "--> statement-breakpoint",
      "CREATE TRIGGER security_log_no_change BEFORE UPDATE OR DELETE ON audit.security_log",
      "FOR EACH ROW EXECUTE FUNCTION audit.security_log_refuse_change();",
      "--> statement-breakpoint",
      "CREATE TRIGGER security_log_no_truncate BEFORE TRUNCATE ON audit.security_log",
      "FOR EACH STATEMENT EXECUTE FUNCTION audit.security_log_refuse_change();",
      "--> statement-breakpoint",
      "-- The app reads its own company's entries and adds entries only through the function; the system account adds them.",
      "GRANT SELECT ON audit.security_log TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT ON audit.security_log TO nexus_system;",
      "--> statement-breakpoint",
      "GRANT USAGE, CREATE ON SCHEMA audit TO nexus_system;",
      "--> statement-breakpoint",
      "SET ROLE nexus_system;",
      "--> statement-breakpoint",
      "ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;",
      "--> statement-breakpoint",
      "-- An entry's fingerprint: SHA-256 of the chain's previous fingerprint and the entry's fields, in this fixed order, with",
      "-- the time as UTC text. The nightly chain check (TASK-0061) uses the same function.",
      "CREATE FUNCTION audit.security_log_hash(prev_hash text, company_id uuid, seq bigint, at timestamptz, event text,",
      "  user_id uuid, target_user_id uuid, record_type text, record_id uuid, ip text, user_agent text, details jsonb,",
      "  request_id text) RETURNS text",
      "LANGUAGE sql STABLE",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "  SELECT encode(sha256(convert_to(jsonb_build_array(prev_hash, company_id, seq,",
      "    to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"'), event, user_id, target_user_id, record_type,",
      "    record_id, ip, user_agent, details, request_id)::text, 'UTF8')), 'hex')",
      "$$;",
      "--> statement-breakpoint",
      "-- Adds one entry to the chain of the transaction's company (the system chain when it has none): takes the chain's lock",
      "-- until the transaction ends (waiting at most 5 seconds), reads the chain's last entry and adds the next.",
      "CREATE FUNCTION audit.add_security_entry(p_event text, p_user_id uuid, p_target_user_id uuid, p_record_type text,",
      "  p_record_id uuid, p_ip text, p_user_agent text, p_details jsonb, p_request_id text) RETURNS bigint",
      "LANGUAGE plpgsql SECURITY DEFINER",
      "SET search_path = pg_catalog, pg_temp",
      "SET lock_timeout = '5s'",
      "AS $$",
      "DECLARE",
      "  chain uuid := NULLIF(current_setting('app.company_id', true), '')::uuid;",
      "  last_seq bigint;",
      "  last_hash text;",
      "  new_at timestamptz;",
      "  new_id bigint;",
      "BEGIN",
      "  PERFORM pg_advisory_xact_lock(hashtext('audit.security_log'), hashtext(coalesce(chain::text, 'system')));",
      "  IF chain IS NULL THEN",
      "    SELECT seq, hash INTO last_seq, last_hash FROM audit.security_log",
      "     WHERE company_id IS NULL ORDER BY seq DESC LIMIT 1;",
      "  ELSE",
      "    SELECT seq, hash INTO last_seq, last_hash FROM audit.security_log",
      "     WHERE company_id = chain ORDER BY seq DESC LIMIT 1;",
      "  END IF;",
      "  last_seq := coalesce(last_seq, 0);",
      "  last_hash := coalesce(last_hash, repeat('0', 64));",
      "  new_at := clock_timestamp();",
      "  INSERT INTO audit.security_log (company_id, seq, at, event, user_id, target_user_id, record_type, record_id, ip,",
      "    user_agent, details, request_id, prev_hash, hash)",
      "  VALUES (chain, last_seq + 1, new_at, p_event, p_user_id, p_target_user_id, p_record_type, p_record_id, p_ip,",
      "    p_user_agent, coalesce(p_details, '{}'::jsonb), p_request_id, last_hash,",
      "    audit.security_log_hash(last_hash, chain, last_seq + 1, new_at, p_event, p_user_id, p_target_user_id, p_record_type,",
      "      p_record_id, p_ip, p_user_agent, coalesce(p_details, '{}'::jsonb), p_request_id))",
      "  RETURNING id INTO new_id;",
      "  RETURN new_id;",
      "END",
      "$$;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION audit.add_security_entry(text, uuid, uuid, text, uuid, text, text, jsonb, text) TO nexus_app;",
      "--> statement-breakpoint",
      "RESET ROLE;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s audit schema, an identity key and a chain key that holds the system chain', () => {
  const path = 'apps/api/src/modules/core/schema/security-log.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { audit } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/);
  assert.match(schema, /companyId: uuid\('company_id'\)\.references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\),/);
  assert.match(schema, /generatedAlwaysAsIdentity\(\)/);
  assert.match(schema, /\.nullsNotDistinct\(\)/);
});

test('the writer adds entries only through the database function, in the transaction on the request context', () => {
  const path = 'apps/api/src/modules/core/repository/security-log.ts';
  const writer = read(path);
  assert.ok(imports(path).includes("import { getContext } from '../../../shared/context.js';"));
  assert.ok(imports(path).every((line) => !/db\/(database|company)\.js'|schema\//.test(line)), 'never the pools, withCompany or the table itself');
  assert.match(writer, /audit\.add_security_entry\(/);
  assert.doesNotMatch(writer, /\.insert\(|\.transaction\(|withCompany|app\.company_id/);
});

test('the request context keeps where a request came from, and the no-company security write is in database.ts', () => {
  const context = read('apps/api/src/shared/context.ts');
  assert.match(context, /^ {2}ip\?: string;$/m);
  assert.match(context, /^ {2}userAgent\?: string;$/m);
  assert.match(context, /ip: req\.ip, userAgent \}/);
  assert.match(context, /req\.get\('user-agent'\)\?\.slice\(0, 300\)/);
  const database = read('apps/api/src/db/database.ts');
  assert.match(database, /^export async function securityWriteWithoutCompany<T>\(\n {2}work: \(tx: Transaction\) => Promise<T>,\n\): Promise<T> \{$/m);
  assert.equal((database.match(/new Pool\(/g) || []).length, 1, 'still one place that makes a pool: never a third pool');
});

test('Core’s module card lists the security log and the rule for rows with no company', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `audit.security_log`: one entry per security event, in one chain of fingerprints per company plus the system chain (no company); added only through `audit.add_security_entry`, never changed or deleted (DATA-MODEL 3.3, CORE-092)");
  const ruleLine = lines.indexOf("- Rows with no company (the security log's system chain, later the errors before a company is known) are written and read only through `nexus_system`'s database functions, never with `withCompany`; every security event is written with `writeSecurity` (`modules/core/repository/security-log.ts`), and within one request every security write that writes an entry runs before any entry the request's own transaction writes (TECH-DESIGN 5.1, CORE-092)");
  assert.ok(dataLine > data && dataLine < rules, 'the security log line sits under ## Data');
  assert.ok(lines[ruleLine - 1].startsWith('- Every company table gets the company row rule'), 'the rule sits right after the row-rule line');
});
