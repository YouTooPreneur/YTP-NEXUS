// TASK-0019 · Rows with no company: the two database changes and their order, the schema file, the error recorder's source, the error handler's and safeErrorMessage's code, the one place that adds errors and Core's module card. Written by the planner; builders never edit this file.
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

test('the two error changes come right after the security-log changes, in order', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((e) => e.tag);
  assert.deepEqual(tags.slice(13, 16), ['0013_audit_security_log_rules', '0014_core_error_events', '0015_core_error_events_rules']);
});

test('drizzle-kit made the table change from the schema file, exactly as expected', () => {
  assert.equal(
    read('apps/api/drizzle/0014_core_error_events.sql'),
    [
      "CREATE TYPE \"core\".\"error_source\" AS ENUM('api', 'worker');--> statement-breakpoint",
      "CREATE TABLE \"core\".\"error_events\" (",
      "\t\"id\" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,",
      "\t\"company_id\" uuid,",
      "\t\"at\" timestamp with time zone DEFAULT now() NOT NULL,",
      "\t\"source\" \"core\".\"error_source\" NOT NULL,",
      "\t\"message\" text NOT NULL,",
      "\t\"request_id\" text,",
      "\t\"external_id\" text,",
      "\t\"resolved_at\" timestamp with time zone,",
      "\t\"resolved_by\" uuid",
      ");",
      "--> statement-breakpoint",
      "ALTER TABLE \"core\".\"error_events\" ADD CONSTRAINT \"error_events_company_id_companies_id_fk\" FOREIGN KEY (\"company_id\") REFERENCES \"core\".\"companies\"(\"id\") ON DELETE restrict ON UPDATE no action;",
    ].join('\n'),
  );
});

test('the rule, rights and functions change is exactly the card’s', () => {
  assert.equal(
    read('apps/api/drizzle/0015_core_error_events_rules.sql'),
    [
      "-- core.error_events is a company table whose system errors have no company (DATA-MODEL 3.4): the company row rule is",
      "-- added while company_id is briefly required (the table is empty), so the rule stays written only in the procedure.",
      "ALTER TABLE core.error_events ALTER COLUMN company_id SET NOT NULL;",
      "--> statement-breakpoint",
      "CALL core.add_company_rules('core.error_events');",
      "--> statement-breakpoint",
      "ALTER TABLE core.error_events ALTER COLUMN company_id DROP NOT NULL;",
      "--> statement-breakpoint",
      "-- The app reads its own company's errors and adds errors only through the function. The system account adds them,",
      "-- makes their IDs, reads the system rows and counts the companies.",
      "GRANT SELECT ON core.error_events TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT SELECT, INSERT ON core.error_events TO nexus_system;",
      "--> statement-breakpoint",
      "GRANT USAGE, CREATE ON SCHEMA core TO nexus_system;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION core.uuid_v7() TO nexus_system;",
      "--> statement-breakpoint",
      "GRANT SELECT ON core.companies TO nexus_system;",
      "--> statement-breakpoint",
      "SET ROLE nexus_system;",
      "--> statement-breakpoint",
      "-- Adds one error under the transaction's company (none: a system error) and returns its ID. The message is the cleaned",
      "-- one (safeErrorMessage), kept to its first 2000 characters.",
      "CREATE FUNCTION core.record_error(p_source text, p_message text, p_request_id text) RETURNS uuid",
      "LANGUAGE sql SECURITY DEFINER",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "  INSERT INTO core.error_events (company_id, source, message, request_id)",
      "  VALUES (NULLIF(current_setting('app.company_id', true), '')::uuid, p_source::core.error_source, left(p_message, 2000),",
      "    p_request_id)",
      "  RETURNING id",
      "$$;",
      "--> statement-breakpoint",
      "-- The newest system errors (no company), at most p_limit of them (1 to 500), for the platform operator's Monitoring",
      "-- door. Refused once Nexus has a second company, until the platform operator is settled (TECH-DESIGN section 12).",
      "CREATE FUNCTION core.system_errors(p_limit integer) RETURNS SETOF core.error_events",
      "LANGUAGE plpgsql STABLE SECURITY DEFINER",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "BEGIN",
      "  IF (SELECT count(*) FROM core.companies) > 1 THEN",
      "    RAISE EXCEPTION 'system rows need the platform operator';",
      "  END IF;",
      "  RETURN QUERY SELECT * FROM core.error_events WHERE company_id IS NULL",
      "    ORDER BY at DESC, id DESC LIMIT least(greatest(p_limit, 1), 500);",
      "END",
      "$$;",
      "--> statement-breakpoint",
      "-- The security log's system chain (no company), newest first: the entries before number p_before_seq (none: from the",
      "-- newest), at most p_limit of them (1 to 500), for the platform operator's Logs door. Refused like core.system_errors.",
      "CREATE FUNCTION core.system_security_entries(p_before_seq bigint, p_limit integer) RETURNS SETOF audit.security_log",
      "LANGUAGE plpgsql STABLE SECURITY DEFINER",
      "SET search_path = pg_catalog, pg_temp",
      "AS $$",
      "BEGIN",
      "  IF (SELECT count(*) FROM core.companies) > 1 THEN",
      "    RAISE EXCEPTION 'system rows need the platform operator';",
      "  END IF;",
      "  RETURN QUERY SELECT * FROM audit.security_log WHERE company_id IS NULL AND (p_before_seq IS NULL OR seq < p_before_seq)",
      "    ORDER BY seq DESC LIMIT least(greatest(p_limit, 1), 500);",
      "END",
      "$$;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION core.record_error(text, text, text) TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION core.system_errors(integer) TO nexus_app;",
      "--> statement-breakpoint",
      "GRANT EXECUTE ON FUNCTION core.system_security_entries(bigint, integer) TO nexus_app;",
      "--> statement-breakpoint",
      "RESET ROLE;",
      "",
    ].join('\n'),
  );
});

test('the schema file uses Core’s schema, its own time-ordered key, a company that may be empty and the two sources', () => {
  const path = 'apps/api/src/modules/core/schema/error-events.ts';
  const schema = read(path);
  assert.ok(imports(path).includes("import { core } from './schemas.js';"));
  assert.doesNotMatch(schema, /pgSchema\(/);
  assert.match(schema, /\.default\(sql`core\.uuid_v7\(\)`\)/);
  assert.match(schema, /companyId: uuid\('company_id'\)\.references\(\(\) => companies\.id, \{ onDelete: 'restrict' \}\),/);
  assert.match(schema, /export const errorSource = core\.enum\('error_source', \['api', 'worker'\]\);/);
});

test('the recorder adds errors only through core.record_error, in a security write of its own, with the cleaned message', () => {
  const path = 'apps/api/src/modules/core/repository/error-events.ts';
  const recorder = read(path);
  assert.deepEqual(imports(path), [
    "import { sql } from 'drizzle-orm';",
    "import type { Transaction } from '../../../db/company.js';",
    "import { securityWrite, securityWriteWithoutCompany } from '../../../db/database.js';",
    "import { getContext, type RequestContext } from '../../../shared/context.js';",
    "import { safeErrorMessage } from '../../../shared/logging.js';",
  ]);
  assert.match(recorder, /sql`SELECT core\.record_error\(\$\{source\}, \$\{message\}, \$\{requestId\}\) AS id`/);
  assert.match(recorder, /const message = safeErrorMessage\(error\);/);
  assert.match(recorder, /\? securityWrite\(context\.companyId, add\)\n\s+: securityWriteWithoutCompany\(add\);/);
  assert.doesNotMatch(recorder, /withCompany|getPools|\.insert\(|errorEvents|error\.message|String\(error\)|\.stack/);
});

test('the error handler keeps every server error without waiting, and logs an AppError of 500 or more like one', () => {
  const path = 'apps/api/src/shared/errors.ts';
  const handler = read(path);
  assert.ok(imports(path).includes("import { recordError } from '../modules/core/repository/error-events.js';"));
  assert.ok(handler.includes("// Keeps a server error for Monitoring (TASK-0019) without making the answer wait for it; a failure to keep it is\n// logged as a warning, never thrown.\nfunction keepError(logger: pino.Logger, error: unknown, requestId: string): void {\n  recordError(error, 'api').catch((failure: unknown) => {\n    logger.warn({ err: failure, requestId }, 'error not recorded');\n  });\n}\n"), 'keepError is exactly the card’s');
  assert.ok(handler.includes("      // An AppError of 500 or more (an outside service that is down, for example) is a server error: logged and kept\n      // like an unexpected one, then answered with its own status and format.\n      if (error.status >= 500) {\n        logger.error({ err: error, requestId }, 'server error');\n        keepError(logger, error, requestId);\n      }\n"), 'the AppError of 500 or more is logged and kept');
  assert.equal(handler.split('keepError(logger, error, requestId);').length - 1, 2, 'kept in two places: an AppError of 500 or more and an unexpected error');
  assert.doesNotMatch(handler, /await recordError|recordError\([^)]*\)\.then/);
});

test('safeErrorMessage is built on the log’s own cleaning, which stays private', () => {
  const logging = read('apps/api/src/shared/logging.ts');
  assert.ok(logging.includes("// An error's message for a column kept outside the log (core.error_events now; later the outbox, the doors and failed\n// jobs; TECH-DESIGN section 7): the same cleaned message the log gets, without a failed query's values; an error with\n// no message gives its type, and anything thrown that is not an error gives only what kind of value it is. Never\n// error.message, String(error), the stack or the whole error.\nexport function safeErrorMessage(value: unknown): string {\n  const error = isErrorLike(value) && value.raw instanceof Error ? value.raw : value;\n  if (!isErrorLike(error)) return typeof error;\n  const described = describeError(error);\n  return described.message || described.type;\n}\n"), 'safeErrorMessage is exactly the card’s');
  assert.doesNotMatch(logging, /export function (describeError|isErrorLike)/);
});

test('only the recorder adds errors, and only the recorder and the schema file name the function that adds them', () => {
  const files = sources('apps/api/src');
  assert.deepEqual(
    files.filter((file) => /record_error/.test(read(file))).sort(),
    ['apps/api/src/modules/core/repository/error-events.ts', 'apps/api/src/modules/core/schema/error-events.ts'],
  );
  assert.deepEqual(files.filter((file) => /insert\(errorEvents\)|INSERT INTO core\.error_events/i.test(read(file))), []);
});

test('Core’s module card lists the errors table and the rule for server errors, after the rule for rows with no company', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const data = lines.indexOf('## Data');
  const rules = lines.indexOf('## Rules');
  const dataLine = lines.indexOf("- `core.error_events`: recent server errors for Monitoring, under the company of the request or job that met them or with no company (a system error); added only through `core.record_error`, with the cleaned message only; the app reads its own company's (DATA-MODEL 3.4, CORE-140)");
  const ruleLine = lines.indexOf("- Every server error (an unexpected error, or an `AppError` of 500 or more) is kept for Monitoring by the error handler with `recordError` (`modules/core/repository/error-events.ts`), without making the answer wait, under the request's company or as a system error with none; any column that keeps an error's text outside the log holds only `safeErrorMessage(error)` (`src/shared/logging.ts`); rows with no company are read only through `core.system_errors` and `core.system_security_entries`, which refuse once Nexus has a second company, and only the platform operator's doors call them (while Nexus has one company, its Owner; TECH-DESIGN 5.1 and section 7, CORE-140)");
  assert.ok(dataLine > data && dataLine < rules, 'the errors line sits under ## Data');
  assert.ok(lines[dataLine - 1].startsWith('- `audit.security_log`:'), 'right after the security log line');
  assert.ok(ruleLine > rules && lines[ruleLine - 1].startsWith('- Rows with no company ('), 'the rule sits right after the rule for rows with no company');
});
