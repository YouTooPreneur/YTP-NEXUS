# Test plan (step 1.8)

**Release 1 (Base and sign-in), written 2 Nov 2026.** How Nexus is tested, who writes the tests, where they live and how a card proves it is done. It follows the frozen tech design (`docs/TECH-DESIGN.md` section 9) and the data model's Release 1 tests (`docs/DATA-MODEL.md` section 6). Each later release adds its own section here when its cards are written.

## 1. The rules

- **The planner writes every test before the code** (AGENTS.md rule 4). Builders never edit them; they make the code pass them.
- **Every requirement's pass test** becomes at least one automated test. Where a pass test needs records from a later release, the card uses the interim test written beside the requirement, and the full test runs again in the release that brings those records (TECH-DESIGN section 9).
- **No proof, no Done:** the final `pnpm verify --card TASK-XXXX` output and any screenshots the card asks for go into `docs/evidence/TASK-XXXX/`.
- **Tests never touch real people or real data:** test companies, test people and test emails only; every email goes to Mailpit or the owner's test inbox (test mode, D-102).

## 2. Kinds of tests and where they live

| Kind | Tool | Where | What it proves |
|---|---|---|---|
| Set-up checks | Node's built-in test runner (`node --test`) | `tests/setup/TASK-XXXX.test.mjs` | The project's files, scripts and tools are set up as the card says (step 2.1) |
| Backend unit and API tests | Vitest, Supertest | `apps/api/test/<area>/*.test.ts` | Rules, windows and API doors behave as the card says, **on a real PostgreSQL test database**, run as the app account with the row rules on |
| Package tests | Vitest | `packages/<name>/test/*.test.ts` | The shared API list and the screen parts |
| Frontend component tests | Vitest, React Testing Library, MSW (a fake API built from the API list) | `apps/web/test/<area>/*.test.tsx` | Each screen shows the right things and sends the right requests |
| End-to-end tests | Playwright, at computer width (1600 × 1000) and phone width (375 × 812) | `tests/e2e/*.spec.ts` | A person can do the whole job through the real screens, API and database |
| Architecture checks | dependency-cruiser and the checks in `tools/verify/` | run by `pnpm verify` | Walls, floors, the frontend wall, the contract, doors, module cards, allowed files, the test lock |
| Restore drill | The backup tools (step 2.3) | `infra/backup/` | Nexus can be put back to a chosen moment within the targets |
| Go-live checks | A written list, run by the owner and Claude | `docs/evidence/TASK-0082/` | Security list, restore drill, phone sign-in (section 7) |

## 3. Which tests run, and the test lock

- **`tests/LOCK`** lists every planner test file: one line per file, `TASK-XXXX  <path>  <sha256>`. The test lock check fails if any listed file changes.
- **Plain `pnpm verify`** runs the tests of every card that is **Done** in `docs/tasks/INDEX.md` and leaves out the rest, so it is green at a card's start check.
- **`pnpm verify --card TASK-XXXX`** also runs that card's own tests. At the start check they must fail (proof they test something); at the end they must all pass.
- **Before the verify command exists** (cards 0001 to 0006), each card names its own test command (`node --test tests/setup/TASK-XXXX.test.mjs`, or the app's own `pnpm --filter … test`).
- **Run `pnpm verify` with `LOG_LEVEL` unset** (CR-011): the log tests read `info` lines, so a `LOG_LEVEL=warn` left in the builder's shell makes locked tests fail for no real reason.
- **Builders write no tests of their own** unless their card lists the test file under ALLOWED FILES (the allowed-files check refuses any other changed file, CR-009). A listed builder test is not locked and still runs, and the planner's tests always win.
- **The allowed-files check after the card's commit:** once a card has its own commits (subject starting `TASK-XXXX:`), the check reads only the files those commits changed. Uncommitted edits and untracked files in the builder's copy are no longer listed, but they are never merged either; the Test lock still reads the files on disk. So the reviewer also runs `git status --porcelain` and `git log --format='%h %s' <start point>..HEAD` in the builder's copy: anything uncommitted outside `history/`, `share/` and `tracker.html`, and any commit not named for the card, is a question for the builder (from TASK-0012 the check itself fails on such a commit). To plant a mistake on a committed card in a throwaway clone, commit it with the card's ID in the subject.
- **End-to-end tests and `@smoke` (CR-014):** until TASK-0088, `pnpm verify`'s `End-to-end smoke` step runs only the end-to-end tests whose title contains `@smoke`; a test without it never runs in verify (it would still pass under `pnpm e2e`). So any planner end-to-end test written before TASK-0088 is Done carries `@smoke` in its title. From TASK-0088 the step runs every test in the selected `tests/e2e` files.
- **Leftover probe folders (CR-014):** TASK-0088's test writes throwaway folders `tests/e2e/probe-0088-*` and `apps/web/probe-0088-*` and removes them itself. If a verify run is stopped half-way, delete any that are left before running verify again (the Allowed files check would list them).
- **A card's planner test covers every rule the card states** (CR-012): the review of TASK-0011 found four of its rules (a public door's input check, every `{name}` in a path, `undefined` for parts a contract does not declare, the keys of form errors) that a wrong build would pass; their checks are now in its test. While writing a test, plant one mistake per rule in a prototype and check that a test fails.
- **Every backend card's API test checks each success answer against its door's contract** with `expect(contract.response.parse(res.body)).toEqual(res.body)`, never `safeParse(...).success`, which lets extra fields through. A failure on a `z.date()`, a coerce or a transform means the contract does not describe the JSON sent (TECH-DESIGN 6.7 Values), not that the test is wrong (CR-012).
- **Every check that `pnpm verify` runs has a planner test that plants a mistake and expects it caught** (CR-008: a config helper had quietly switched off a lint rule for `.mjs` files while lint stayed green; only a planted misspelt name showed it). A check that only ever passes proves nothing.
- **Rules that keep `pnpm verify` exact** (found in the review of TASK-0007, CR-007): no test file's path within its package may be contained in another's, ignoring case (for example `x.test.ts` beside `x.test.tsx`), because vitest matches the paths it is given as parts of a path; test files never go in a folder named `fixtures`, except `tests/setup/fixtures/`; every package's `tsconfig.json` has an `include` list; every card stays in the first table of `docs/tasks/INDEX.md`; `tsconfig.json` files are plain JSON (no comments).

## 4. Test data and the test database

- **Development services** (card 0006) run PostgreSQL 16, SeaweedFS (files) and Mailpit (email) in Docker on the builder's computer.
- **The test database** `nexus_test` is created next to the development database. From step 2.2, the backend's test setup applies every database change to it, and each test file starts from an empty company set.
- **Two test companies** ("Test Company A" and "Test Company B") are made by the test helpers, never by hand, so the company-separation tests (CORE-014, NFR-014) always run.
- **Emails** are read back from Mailpit's own API in tests (two-step codes, reset links, alerts).
- **Time** is controlled with fake timers for timeouts, locks and the 30-day clean-up.
- **No real secrets in tests:** test keys live in `infra/.env.test.example`, which holds only made-up values.

## 5. Release 1: requirement → tests

Each Release 1 requirement's tests are written with the card that builds it (`docs/tasks/INDEX.md`, "Covers"). The Release 1 test is the one in `docs/DATA-MODEL.md` section 6.

| Requirement | Card(s) | Tested by |
|---|---|---|
| USR-001 | 0033, 0040, 0053 | API tests; people screen tests |
| USR-002, USR-003 | 0030, 0031, 0044, 0054 | API tests (a new role with Core view-only cannot open Settings; a test module's permission appears without changing Core); role builder screen tests |
| USR-004 | 0045, 0055 | API tests (viewing as Staff shows no Settings, Users and roles, Security or Logs; every door read-only) |
| USR-006 | 0030, 0047 | API tests (the nine roles and their starting values) |
| CORE-001 | 0032, 0049, 0051 | API tests for both ways in; end-to-end sign-in |
| CORE-002 | 0037, 0038, 0039, 0048, 0050 | API tests (Google and password both stopped until the second step; opt-in for Staff; 5 wrong codes end the session); end-to-end two-step |
| CORE-003 | 0034, 0085 | API tests with fake time (timeout per role; background refreshes do not extend it; "timed out" in My devices and the security log); the screens mark their automatic refreshes (0085) |
| CORE-004 | 0036 | API tests (5 wrong passwords lock for 15 minutes, the owner alert email, the security log) |
| CORE-005 | 0043, 0073 | API tests; My profile screen tests |
| CORE-006 | 0041, 0053 | API tests (sessions stop at once) |
| CORE-008 | 0040, 0042 | API tests (unknown Google account refused; after an email change the old account is refused and the same person signs in) |
| CORE-010, CORE-011 | 0068, 0072 | API tests (the right version for a date; GST only from its date) |
| CORE-012 | 0024, 0056, 0062 | API tests (every change logged with old and new value) |
| CORE-014 | 0015, 0016 | API tests (a second company sees nothing; a reused connection with no company returns no rows) |
| CORE-015 | 0057, 0064 | API tests (a switched-off feature's door is refused; the worker skips its jobs) |
| CORE-090 | 0017, 0059, 0076, 0078 | API tests (a role change shows old and new values in Record history) |
| CORE-092 | 0018, 0059, 0061 | API tests (role change, view-as-role and failed sign-ins logged; the chain whole under parallel writes) |
| CORE-093 | 0075, 0077 | API tests (a deleted role restored; a deleted person cleaned up while their records and name remain) |
| CORE-110 | 0067, 0071, 0074 | API and screen tests (a language opens only after its check) |
| CORE-112 | 0033, 0070 | API tests (10:00 IST shows 08:30 for Dubai; ₹1,00,000) |
| CORE-113 | 0013, 0052 | End-to-end at 375 px; phone menu per role |
| CORE-114 | 0004, 0052, 0074 | Screen tests (Emerald and Navy tokens match the approved design); both colours pass WCAG AA contrast, checked with axe in the end-to-end tests (0074) |
| CORE-140 | 0058, 0065 | API tests (failed job with a working Retry) |
| NFR-020 | 0023, 0035, 0037, 0038 | API tests (one person's flood slowed, others not; refused requests count; a hit limit logged with one alert) |
| NFR-007, AUTO-037, INT-022 | 0026, 0027, 0028, 0060 | Restore drill (timed restore to a chosen moment); watch alerts |
| NFR-021 | 0016, 0022, 0085 | API tests (a repeated `Idempotency-Key` gets the first answer; an old version gets 409); the screens send the key with every change (0085) |
| NFR-001 (same-site check) | 0084 | API tests (a data-changing request from another address is refused) |
| INT-001, CORE-065, CORE-121 (Release 1 parts) | 0029 | API tests (sign-in emails reach Mailpit in test mode; the email door's health check and retries) |
| CORE-082 (Release 1 part) | 0069 | API tests (5-minute private links, refused without permission, every download logged) |

## 6. The two-person check (D-152)

At the end of each Release 1 step, the owner and a team member click through what the step built, using a short checklist the planner writes into that step's last card. Problems found go into the feedback list for Release 1; nothing is changed by hand.

## 7. Going live (step 2.8)

Before Release 1 goes live (card 0082):
1. **Security list:** the OWASP ASVS level 1 items that apply to Release 1 (sign-in, sessions, access control, input checks, errors and logging, data protection, HTTP security headers), each marked pass with its proof.
2. **Restore drill:** a timed restore to a chosen moment on a spare copy, within 4 hours, losing at most 1 hour.
3. **Phone sign-in:** the owner and a team member sign in from their own phones, with two-step, on `nexus.youtoopreneur.com`.
4. **Uptime and error alerts** reach the owner's email.

Then the team uses Release 1 for 1 to 2 weeks; the feedback is fixed before the owner closes the release (D-186).

## 8. Not tested in Release 1

- Speed with 100 people at once (NFR-005): load test before Release 3 goes live (point 40).
- Phone speed (point 39): before Release 3.
- Anything from a later release, even when its screen part is visible behind a feature switch.
