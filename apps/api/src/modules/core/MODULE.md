# Core module card

**Floor:** ground · **Owns the schema:** `core` (and `audit`) · **First release:** 1

Every module is built from the same 6 parts (TECH-DESIGN section 2). If it is not on this card, the module does not do it. The verify command's module-card check reads this file: every API door's `operationId` must be listed under **Window**, and every announcement under **Announcements**, each as a list item that starts with the name in backticks. From TASK-0089 the reverse is checked too: every such item must be a door or announcement this module already has, so each line is added by the card that builds that door or announcement, never in advance. Entries start with `- ` at the start of the line; other bullet styles are not read.

## Data
- `core.companies`: one company using Nexus; a system table with no company row rule, read-only for the app (DATA-MODEL 3.1)

## Rules
- A table's own `id` key is a time-ordered ID (UUID version 7) made by the database function `core.uuid_v7()`, Better Auth's tables included; a key that is another table's ID, a key of several columns and `audit.security_log`'s chain number keep the form DATA-MODEL section 3 gives them, and drizzle's and pg-boss's own tables keep their tools' keys (DATA-MODEL section 2)
- Every company table gets the company row rule in its own database change, `CALL core.add_company_rules('<schema.table>');`, and every query on it runs inside `withCompany` and filters with `forCompany` (`src/db/company.ts`; TECH-DESIGN 5.1, CORE-014)
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
