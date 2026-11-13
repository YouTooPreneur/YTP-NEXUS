# Core module card

**Floor:** ground · **Owns the schema:** `core` (and `audit`) · **First release:** 1

Every module is built from the same 6 parts (TECH-DESIGN section 2). If it is not on this card, the module does not do it. The verify command's module-card check reads this file: every API door's `operationId` must be listed under **Window**, and every announcement under **Announcements**, each as a list item that starts with the name in backticks. From TASK-0089 the reverse is checked too: every such item must be a door or announcement this module already has, so each line is added by the card that builds that door or announcement, never in advance. Entries start with `- ` at the start of the line; other bullet styles are not read.

## Data
- `core.companies`: one company using Nexus; a system table with no company row rule, read-only for the app (DATA-MODEL 3.1)
- `audit.activity_log`: one entry per change or automatic action (who, what, when, old and new values); a company table the app may only add to and read (DATA-MODEL 3.3, CORE-090)
- `core.idempotency_keys`: the first answer to a request that changes data, kept 24 hours under the screen's double-click key; a company table the app may read, add and update (DATA-MODEL 3.4, NFR-021)
- `core.settings`: the values a company changed for its settings, each with its version; a company table the app may read, add and change (DATA-MODEL 3.1, CORE-012)

## Rules
- A table's own `id` key is a time-ordered ID (UUID version 7) made by the database function `core.uuid_v7()`, Better Auth's tables included; a key that is another table's ID, a key of several columns and `audit.security_log`'s chain number keep the form DATA-MODEL section 3 gives them, and drizzle's and pg-boss's own tables keep their tools' keys (DATA-MODEL section 2)
- Every company table gets the company row rule in its own database change, `CALL core.add_company_rules('<schema.table>');`, and every query on it runs inside `withCompany` and filters with `forCompany` (`src/db/company.ts`; TECH-DESIGN 5.1, CORE-014)
- Every save writes its activity-log entry with `writeActivity` (`modules/core/repository/activity-log.ts`) in the save's own transaction, after the work and before any announcement; `changes` holds only the changed fields as `{ field: { old, new } }`, named as in the record's API contract (a new record: `old` is null; a delete or restore: `{}`), and never a password, code, token or key; a change to a record with no ID of its own (a setting, a switch) is logged against the record that holds it, for a company's settings the company (TECH-DESIGN section 2 step 13, CORE-090)
- Every request that changes data carries an `Idempotency-Key` (a UUID the screen makes, one per change, sent again on a retry); a repeat within 24 hours by the same person to the same door gets the first answer without running again (`src/shared/idempotency.ts`, TECH-DESIGN section 2 step 12, NFR-021)
- Each setting is defined once in code with `defineSetting` (`modules/core/service/settings.ts`) by the card that first uses it, with a `<group>.<name>` key, its rule, default and help, and is listed on its module card under `## Rules` in a line that starts with `Setting` and gives its key, what it controls and its default; only changed values are stored in `core.settings`; every save checks the value and the version it was based on (409 `stale_version` when someone saved first) and is written to the activity log in the same transaction; a setting never holds a secret (CORE-012, TECH-DESIGN 6.6)
- Core serves everyone and asks no module (D-014)
- Core's sign-in code lives in `modules/core/signin/` and its users code in `modules/core/users/`; only these two folders and `src/db/` may touch the `auth` schema (the auth-schema wall, TECH-DESIGN 5.1)

## Screens
- (Release 1 screens come with steps 2.4 to 2.7)

## Window
- `getHealth`: GET /api/health, public, no feature key

## Announcements
- (none yet)

## Night checklist
- (none yet)
