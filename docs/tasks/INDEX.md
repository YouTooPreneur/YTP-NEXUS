# TASK INDEX

Every task card, in build order. **Release 1 (Base and sign-in): 84 cards** (step 1.8, written 2 Nov 2026; the build plan of `docs/TECH-DESIGN.md` section 10, frozen with Release 1, D-191).

**How to pick a card:** do the first card whose status is **To do**, whose "Depends on" cards are all **Done**, and whose builder is you. Different builders may work on different cards at the same time, never on the same files (TECH-DESIGN section 9). **Step 2.1's 13 cards run strictly one after another**, because each edits files the next one needs.

**Full cards are written one step at a time.** Step 2.1's cards are written in full now (`docs/tasks/TASK-0001.md` to `TASK-0013.md`, with their tests). Each later step's cards, and their tests, are written in full by the planner before that step starts, from this list and the frozen design; a card that is not yet written in full cannot be started.

Status values: To do · In progress · Done · BLOCKED. "Part": Set-up (step 2.1 only), Backend or Frontend (D-187). Reviewer: never the builder (D-185).

| Task | Title | Step | Part | Builder | Reviewer | Depends on | Covers | Status | Done by |
|---|---|---|---|---|---|---|---|---|---|
| TASK-0001 | Workspace root (the owner's practice task) | 2.1 | Set-up | Antigravity, run by the owner | Claude | Step 1.9 | NFR-015 | Done | antigravity |
| TASK-0002 | Backend app with a health door | 2.1 | Set-up | Codex | Claude | 0001 | NFR-015 | Done | codex |
| TASK-0003 | Frontend app | 2.1 | Set-up | Antigravity | Claude | 0002 | NFR-009 | Done | antigravity |
| TASK-0004 | Design tokens and the first screen parts | 2.1 | Set-up | Antigravity | Claude | 0003 | CORE-114 | To do | — |
| TASK-0005 | Shared API list and the generated client | 2.1 | Set-up | Claude | Codex | 0004 | D-187 | To do | — |
| TASK-0006 | Development services: database, files, mail | 2.1 | Set-up | Codex | Claude | 0005 | NFR-015 | To do | — |
| TASK-0007 | The verify command | 2.1 | Set-up | Claude | Codex | 0006 | NFR-011 | To do | — |
| TASK-0008 | Code style and architecture checks | 2.1 | Set-up | Claude | Codex | 0007 | NFR-011, D-014 | To do | — |
| TASK-0009 | Allowed-files check and test lock | 2.1 | Set-up | Codex | Claude | 0008 | NFR-011 | To do | — |
| TASK-0010 | Shared backend steps: request context, logging, errors | 2.1 | Set-up | Codex | Claude | 0009 | NFR-001, NFR-012 | To do | — |
| TASK-0011 | Shared backend steps: the route helper | 2.1 | Set-up | Claude | Codex | 0010 | D-019 | To do | — |
| TASK-0012 | Contract, door and module-card checks; the Core module card | 2.1 | Set-up | Claude | Codex | 0011 | NFR-011 | To do | — |
| TASK-0013 | Smoke test at computer and phone width; GitHub check run | 2.1 | Set-up | Antigravity | Claude | 0012 | NFR-009, CORE-113 | To do | — |
| TASK-0014 | Database accounts, schemas, the migrate service, and PostgreSQL in the GitHub check run | 2.2 | Backend | Claude | Codex | 0006, 0012 | CORE-014 | To do | — |
| TASK-0015 | Company context and row rules | 2.2 | Backend | Claude | Codex | 0014 | CORE-014, NFR-014 | To do | — |
| TASK-0016 | Transaction per request and short security writes | 2.2 | Backend | Claude | Codex | 0015 | NFR-021 | To do | — |
| TASK-0084 | Same-site check for data-changing requests | 2.2 | Backend | Claude | Codex | 0016 | NFR-001 | To do | — |
| TASK-0017 | Activity log and its writer | 2.2 | Backend | Codex | Claude | 0016 | CORE-090 | To do | — |
| TASK-0018 | Security log with chained fingerprints | 2.2 | Backend | Claude | Codex | 0016 | CORE-092 | To do | — |
| TASK-0019 | Rows with no company: system errors and readers | 2.2 | Backend | Codex | Claude | 0018 | CORE-140, NFR-014 | To do | — |
| TASK-0020 | Announcements: outbox and delivery by the worker | 2.2 | Backend | Codex | Claude | 0017 | NFR-003 | To do | — |
| TASK-0021 | Job queue in the worker, with the company per job | 2.2 | Backend | Codex | Claude | 0020 | NFR-003 | To do | — |
| TASK-0022 | Double-click keys | 2.2 | Backend | Codex | Claude | 0016 | NFR-021 | To do | — |
| TASK-0023 | Rate counters and the per-address limit | 2.2 | Backend | Codex | Claude | 0016 | NFR-020 | To do | — |
| TASK-0024 | Settings storage with change log | 2.2 | Backend | Codex | Claude | 0017 | CORE-012 | To do | — |
| TASK-0025 | Removing personal values on request | 2.2 | Backend | Codex | Claude | 0017, 0018 | NFR-010 | To do | — |
| TASK-0026 | PostgreSQL image with continuous WAL-G archiving | 2.3 | Backend | Claude | Codex | 0014 | NFR-007, NFR-008 | To do | — |
| TASK-0027 | Backup container: nightly base backup, dump and files copy | 2.3 | Backend | Claude | Codex | 0026 | AUTO-037, INT-022 | To do | — |
| TASK-0028 | Timed restore drill | 2.3 | Backend | Claude | Codex | 0027 | NFR-007, AUTO-037 | To do | — |
| TASK-0029 | Door standard, doors table and the email door | 2.4 | Backend | Codex | Claude | 0021 | CORE-121 (part), INT-001 (part), CORE-065 (part) | To do | — |
| TASK-0030 | Roles, permission list and default grants | 2.4 | Backend | Codex | Claude | 0017 | USR-002, USR-003, USR-006 | To do | — |
| TASK-0031 | Permission check, scope and hidden fields | 2.4 | Backend | Claude | Codex | 0030 | USR-002 | To do | — |
| TASK-0032 | Better Auth: Google, password and the open sign-in doors | 2.4 | Backend | Claude | Codex | 0015 | CORE-001 | To do | — |
| TASK-0033 | People and preferences tables; the "who is asking" step | 2.4 | Backend | Claude | Codex | 0032 | USR-001, CORE-112 | To do | — |
| TASK-0034 | Session facts, idle timeout and background requests | 2.4 | Backend | Codex | Claude | 0033 | CORE-003 | To do | — |
| TASK-0035 | Per-person limit | 2.4 | Backend | Codex | Claude | 0033, 0023 | NFR-020 | To do | — |
| TASK-0036 | Lock after wrong passwords | 2.4 | Backend | Codex | Claude | 0032, 0029, 0024 | CORE-004 | To do | — |
| TASK-0037 | Two-step gate and the authenticator app | 2.4 | Backend | Claude | Codex | 0034 | CORE-002 | To do | — |
| TASK-0038 | Two-step email codes and the failed-codes rule | 2.4 | Backend | Codex | Claude | 0037, 0029 | CORE-002 | To do | — |
| TASK-0039 | Trust this computer | 2.4 | Backend | Codex | Claude | 0037 | CORE-002 | To do | — |
| TASK-0040 | Adding and inviting people (split) | 2.4 | Backend | Codex | Claude | 0033, 0029, 0031 | USR-001, CORE-008 | To do | — |
| TASK-0041 | Disabling and deleting people; sign-in clean-up | 2.4 | Backend | Claude | Codex | 0040, 0020 | CORE-006 | To do | — |
| TASK-0042 | Changing a sign-in email | 2.4 | Backend | Codex | Claude | 0040 | CORE-008 | To do | — |
| TASK-0043 | My devices and log out everywhere (split) | 2.4 | Backend | Codex | Claude | 0034 | CORE-005 | To do | — |
| TASK-0044 | Role builder doors (split) | 2.4 | Backend | Codex | Claude | 0031 | USR-002, USR-003 | To do | — |
| TASK-0045 | View as role | 2.4 | Backend | Codex | Claude | 0031 | USR-004 | To do | — |
| TASK-0046 | Who am I (`/api/core/me`) | 2.4 | Backend | Codex | Claude | 0031, 0034 | CORE-015, CORE-113 | To do | — |
| TASK-0047 | First-start setup command | 2.4 | Backend | Claude | Codex | 0040, 0030 | USR-006 | To do | — |
| TASK-0048 | Owner resets a person's two-step | 2.4 | Backend | Codex | Claude | 0037 | CORE-002 | To do | — |
| TASK-0085 | Screens' API client: background and double-click headers | 2.4 | Frontend | Antigravity | Claude | 0013 | CORE-003, NFR-021 | To do | — |
| TASK-0049 | Sign-in screen | 2.4 | Frontend | Antigravity | Claude | 0032, 0085, 0004 | CORE-001 | To do | — |
| TASK-0050 | Two-step entry and set-up screens | 2.4 | Frontend | Antigravity | Claude | 0038, 0039, 0049 | CORE-002 | To do | — |
| TASK-0051 | Set or reset password screens | 2.4 | Frontend | Antigravity | Claude | 0032, 0049 | CORE-001 | To do | — |
| TASK-0052 | App shell: menus, top bar, phone menu, landing page (split) | 2.4 | Frontend | Antigravity | Claude | 0046 | CORE-113, CORE-114 | To do | — |
| TASK-0053 | Users and roles: people | 2.4 | Frontend | Antigravity | Claude | 0040, 0041, 0042, 0048, 0052 | USR-001, CORE-006, CORE-008 | To do | — |
| TASK-0054 | Users and roles: role builder | 2.4 | Frontend | Antigravity | Claude | 0044, 0052 | USR-002, USR-003 | To do | — |
| TASK-0055 | View-as-role banner | 2.4 | Frontend | Antigravity | Claude | 0045, 0052 | USR-004 | To do | — |
| TASK-0056 | Settings doors (split) | 2.5 | Backend | Codex | Claude | 0024, 0031 | CORE-012 | To do | — |
| TASK-0057 | Feature switches: table, doors, backend and worker check (split) | 2.5 | Backend | Codex | Claude | 0056 | CORE-015 | To do | — |
| TASK-0058 | Monitoring data: jobs, retry, errors, doors, backups (split) | 2.5 | Backend | Codex | Claude | 0021, 0019, 0029 | CORE-140 | To do | — |
| TASK-0059 | Logs doors: search and export (split) | 2.5 | Backend | Codex | Claude | 0017, 0018, 0031 | CORE-090, CORE-092 | To do | — |
| TASK-0060 | Backup and archive watch with owner alerts | 2.5 | Backend | Codex | Claude | 0058, 0027 | NFR-007, AUTO-037 | To do | — |
| TASK-0061 | Nightly security-log chain check | 2.5 | Backend | Codex | Claude | 0018, 0021 | CORE-092 | To do | — |
| TASK-0062 | Settings home screen | 2.5 | Frontend | Antigravity | Claude | 0056, 0052 | CORE-012 | To do | — |
| TASK-0063 | Security screen | 2.5 | Frontend | Antigravity | Claude | 0056, 0044, 0062 | CORE-002, CORE-003, CORE-004, NFR-020 | To do | — |
| TASK-0064 | Feature switches screen | 2.5 | Frontend | Antigravity | Claude | 0057, 0062 | CORE-015 | To do | — |
| TASK-0065 | Monitoring screen | 2.5 | Frontend | Antigravity | Claude | 0058, 0062 | CORE-140 | To do | — |
| TASK-0066 | Logs screen | 2.5 | Frontend | Antigravity | Claude | 0059, 0062 | CORE-090, CORE-092 | To do | — |
| TASK-0067 | Languages: table, doors and message files (split) | 2.6 | Backend | Codex | Claude | 0056 | CORE-110 | To do | — |
| TASK-0068 | Company profile versions and the GST switch | 2.6 | Backend | Codex | Claude | 0024 | CORE-010, CORE-011 | To do | — |
| TASK-0069 | Files door and private links | 2.6 | Backend | Codex | Claude | 0029 | CORE-082 (part) | To do | — |
| TASK-0070 | Preferences doors and the default colour (split) | 2.6 | Backend | Codex | Claude | 0067, 0033 | CORE-112, CORE-114 | To do | — |
| TASK-0071 | Languages screen | 2.6 | Frontend | Antigravity | Claude | 0067, 0062 | CORE-110 | To do | — |
| TASK-0072 | Company profile screen | 2.6 | Frontend | Antigravity | Claude | 0068, 0069, 0062 | CORE-010, CORE-011 | To do | — |
| TASK-0073 | My profile screen | 2.6 | Frontend | Antigravity | Claude | 0070, 0043, 0050, 0069 | CORE-005, CORE-112, CORE-114 | To do | — |
| TASK-0074 | Colour and language switches; Tamil font (split) | 2.6 | Frontend | Antigravity | Claude | 0070, 0052 | CORE-110, CORE-114 | To do | — |
| TASK-0075 | Trash: delete, restore handlers, nightly clean-up (split) | 2.7 | Backend | Claude | Codex | 0017, 0041 | CORE-093 | To do | — |
| TASK-0076 | Record history door | 2.7 | Backend | Codex | Claude | 0017, 0031 | CORE-090 | To do | — |
| TASK-0077 | Trash screen | 2.7 | Frontend | Antigravity | Claude | 0075, 0052 | CORE-093 | To do | — |
| TASK-0078 | Record history screen | 2.7 | Frontend | Antigravity | Claude | 0076, 0052 | CORE-090 | To do | — |
| TASK-0079 | Production containers, deploy and database changes | 2.8 | Backend | Claude | Codex | 0028, 0078 | NFR-015, NFR-017 | To do | — |
| TASK-0080 | The free cloud machine, address and HTTPS (with the owner) | 2.8 | Backend | Claude, with the owner | Codex | 0079 | NFR-001, NFR-006 | To do | — |
| TASK-0081 | Test copy, error reporting and uptime alerts | 2.8 | Backend | Claude | Codex | 0080 | NFR-006, NFR-012 | To do | — |
| TASK-0082 | Go-live checks: security list, restore drill, phone sign-in | 2.8 | Backend | Claude, with the owner and a team member | Codex | 0081 | NFR-001, NFR-007 | To do | — |

**Notes**
- **Card IDs are not always in build order:** TASK-0084 and TASK-0085 were added after the first list and sit where they are built. The table order is the build order.
- **Cards marked (split)** hold several API doors or screen parts. When their step's full cards are written, each is split into one card per API door (backend) or per screen part of 1 to 3 files (frontend), with new IDs, before anything is built (D-091 as changed by D-187). Release 1 will then have about 100 to 110 cards; the work and the hours stay the same.
- **Moves within Release 1's build order** (TECH-DESIGN section 10, recorded as CR-001 in `docs/CHANGES.md`): Caddy is set up with the production containers (TASK-0079), not in step 2.1, because development uses Vite's `/api` passing; the worker's delivery of announcements (TASK-0020) is built in step 2.2 with the outbox; the Security screen (TASK-0063) is in step 2.5 because it needs the Settings doors; the screens' API client headers (TASK-0085) come before the first screen; PostgreSQL joins the GitHub check run with the database (TASK-0014).
- **The Owner's two-step reset** (TASK-0048) is an action on the People screen (TASK-0053).
- **Settle when writing these cards** (found in the review of TASK-0002, TECH-DESIGN section 12 points 45 and 46, CR-002): **TASK-0014** says how the API and the worker read `infra/.env` (nothing loads it yet), and lists the file that does it; **TASK-0079** says how the API and the worker start in production: `node dist/main.js` stops working once the API uses `@ytp/contracts` (TASK-0011), because that package is TypeScript source. Choose one way (run with tsx, build `@ytp/contracts`, or bundle the API), add a production start for the worker, and add a planner test that builds, starts and calls `GET /api/health`. For both cards: Whatever is chosen must keep `apps/api/test/setup/main.test.ts` passing (it starts `src/main.ts` with the test run's own settings), and any card that edits `main.ts` keeps the `api listening` and `api could not start` messages and exit code 1.
- **If `pnpm install` ever changes `pnpm-workspace.yaml`**, the builder stops and marks the card BLOCKED (only the planner changes that file).
- **Settings storage (0024) is in step 2.2**, one step earlier than the tech design's table, because the sign-in rules of step 2.4 read their values from it; the Settings screens stay in step 2.5.
- **The owner's practice task (0001):** the owner runs it with Antigravity, start to finish, to learn the task loop (PLAN step 2.1).
- **Cards 0001 to 0006 come before the verify command exists:** their tests run with `node --test` (or the app's own test command), as each card says. From 0007 on, every card uses `pnpm verify`.
- **Builders, by default:** Antigravity builds the screens, Codex most backend cards, Claude (in a separate building session) the set-up, database, security and online cards. The owner can change any builder.
