# Core module card

**Floor:** ground · **Owns the schema:** `core` (and `audit`) · **First release:** 1

Every module is built from the same 6 parts (TECH-DESIGN section 2). If it is not on this card, the module does not do it. The verify command's module-card check reads this file: every API door's `operationId` must be listed under **Window**, and every announcement under **Announcements**, each in backticks.

## Data
- (tables come with step 2.2)

## Rules
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
