// TASK-0033 · The people tables' two changes in order and the rights change exactly; the schema and who-is-asking files' shape; the session line in hooks.ts and the session's ID on the request context; Core's module card. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const RIGHTS = `-- People and their preferences (DATA-MODEL 3.2): each table gets the company row rule in its own change.
CALL core.add_company_rules('core.users');
--> statement-breakpoint
CALL core.add_company_rules('core.user_preferences');
--> statement-breakpoint
-- A person signs in with Google, a password or both: always at least one, and nothing else.
ALTER TABLE core.users ADD CONSTRAINT users_signin_methods_check CHECK (cardinality(signin_methods) > 0 AND signin_methods <@ ARRAY['google', 'password']::text[]);
--> statement-breakpoint
-- The app reads, adds and changes people and their preferences, and never deletes them: people are never removed.
GRANT SELECT, INSERT, UPDATE ON core.users TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.user_preferences TO nexus_app;
`;

const USERS_LINE =
  "- `core.users`: everyone who can sign in, one row per person under the same ID as their sign-in record (no database link to it), with their company, name, one role (linked to the role of the same company), sign-in methods (Google, a password or both) and manager; a company table the app may read, add and change, never delete: people are never removed (DATA-MODEL 3.2, USR-001)";
const PREFERENCES_LINE =
  "- `core.user_preferences`: each person's language, colour, time zone, time and date format and daily summary time, keyed by company and person, India's time and 12-hour times by default; a company table the app may read, add and change, never delete (CORE-112)";
const RULE_LINE =
  "- Every non-public door first learns who is asking with `whoIsAsking` (`modules/core/signin/session.ts`), before its transaction opens: it asks Better Auth for the session without refreshing it (only the open sign-in doors refresh a session) and puts the person's ID, their company and the session's ID on the request's own context, never the session token; no session, a tampered or ended one, or a person who is not active answers 401 `not_signed_in` (TECH-DESIGN section 2, step 4; CORE-006)";

test('the people tables come in two changes, the tables and then their rights, one right after the other', () => {
  const tags = JSON.parse(read('apps/api/drizzle/meta/_journal.json')).entries.map((entry) => entry.tag);
  const tables = tags.filter((tag) => /^\d{4}_core_users$/.test(tag));
  const rights = tags.filter((tag) => /^\d{4}_core_users_rights$/.test(tag));
  assert.equal(tables.length, 1, 'one core_users change');
  assert.equal(rights.length, 1, 'one core_users_rights change');
  assert.equal(tags.indexOf(rights[0]), tags.indexOf(tables[0]) + 1, 'the rights come right after the tables');
  assert.equal(read(`apps/api/drizzle/${rights[0]}.sql`), RIGHTS);
  const tablesSql = read(`apps/api/drizzle/${tables[0]}.sql`);
  assert.doesNotMatch(tablesSql, /"auth"\./, 'the tables change links to no sign-in table');
  // drizzle-kit 0.31.11 writes an enum whose name starts with a built-in type's name (time, text, date...) without its
  // schema, so the change would fail: the type is named clock_format, and must be written with its schema.
  assert.match(tablesSql, /"time_format" "core"\."clock_format" DEFAULT 'h12' NOT NULL/, 'the clock format type is written with its schema');
});

test('the people tables are declared in their own schema file, linked by company, and the file never names the sign-in tables', () => {
  const schema = read('apps/api/src/modules/core/schema/users.ts');
  for (const name of ['users', 'userPreferences', 'themeColour', 'timeFormat']) {
    assert.match(schema, new RegExp(`^export const ${name} = `, 'm'), `${name} is exported`);
  }
  assert.match(schema, /foreignColumns: \[roles\.companyId, roles\.id\]/);
  assert.doesNotMatch(schema, /pgSchema\(|auth-schema/);
});

test('the who-is-asking step asks Better Auth without a refresh and puts only IDs on the request’s own context', () => {
  const step = read('apps/api/src/modules/core/signin/session.ts');
  assert.match(step, /^export async function whoIsAsking\(req: Request\): Promise<void> \{$/m);
  assert.match(step, /fromNodeHeaders\(req\.headers\)/);
  assert.match(step, /disableRefresh: true/);
  assert.match(step, /disableCookieCache: true/);
  assert.match(step, /new AppError\(401, 'not_signed_in', 'Please sign in\.'\)/);
  for (const field of ['userId', 'companyId', 'sessionId']) {
    assert.match(step, new RegExp(`\\.${field} = `), `it sets ${field} on the context`);
  }
  // The code itself, without its comments: a comment may explain the rule in the card's own words.
  const code = step.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  assert.doesNotMatch(code, /runWithContext|returnHeaders|asResponse|\.token\b|logger|console\./);
  assert.doesNotMatch(
    code,
    /from '[^']*(logging|database|company|auth-schema)\.js'|from '[^']*\/(schema|repository)\/[^']*'|from '(pino|pg)'|from 'drizzle-orm/,
    'it logs nothing and reads or writes no table itself: only Better Auth reads the session',
  );
});

// Only the session line: the later step cards (TASK-0031, 0034, 0035, 0037) each replace their own line in hooks.ts.
test('the hooks run the real who-is-asking step', () => {
  const hooks = read('apps/api/src/shared/hooks.ts');
  assert.match(hooks, /^import \{ whoIsAsking \} from '\.\.\/modules\/core\/signin\/session\.js';$/m);
  assert.match(hooks, /^ {4}session: async \(info\) => whoIsAsking\(info\.req\),$/m);
  assert.doesNotMatch(hooks, /notBuilt\('session'\)/);
});

test('the request context gains the session’s ID as a plain string', () => {
  assert.match(read('apps/api/src/shared/context.ts'), /^ {2}sessionId\?: string;$/m);
});

test('Core’s module card lists the two tables and the who-is-asking rule', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const rules = lines.indexOf('## Rules');
  const users = lines.indexOf(USERS_LINE);
  const rule = lines.indexOf(RULE_LINE);
  assert.ok(users > 0 && users < rules && lines[users - 1].startsWith('- `core.default_grants_applied`:'), 'right after the default grants line');
  assert.equal(lines[users + 1], PREFERENCES_LINE, 'the preferences line comes next');
  assert.ok(rule > rules && lines[rule - 1].startsWith('- Permissions are registered with'), 'right after the permissions rule');
});
