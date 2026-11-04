# Tech design (step 1.7)

**Version 0.3, 2 Nov 2026, for Release 1. Approved by the owner on 2 Nov 2026 (Gate 3, D-188); Release 1 is frozen (D-191).** Version 0.3 separates the **frontend (React + TypeScript)** and the **backend (Express + TypeScript)**, the owner's choice (D-187). It was then checked by four independent reviewers, each finding confirmed by a second checker, and the 54 confirmed findings are fixed here and in `docs/DATA-MODEL.md` (round 53). A final check then confirmed 24 more, mostly caused by the first fixes, and a last check 6 more; all are fixed (rounds 54 and 55). It replaces the 21 Oct draft (v0.1, kept in the history).

Since 2 Nov 2026 Nexus is built in **18 small releases** (D-186, `docs/RELEASES.md`), so this version settles everything **Release 1** needs and the parts every later release stands on. Points that belong to a later release are listed in section 12 with the release that settles them. The tables are in `docs/DATA-MODEL.md`.

How to read it:
- **Decided** means a locked decision or requirement (its ID in brackets).
- **Proposed for Gate 3** meant Claude's choice; all of them were approved with this document on 2 Nov 2026.
- **Later** means it is settled when its release starts (section 12).

## 1. In one line

**A React frontend (the screens) and an Express backend (the API, the rules and a background worker), both in TypeScript and in one repository, over one PostgreSQL database split into a section per module, packaged in Docker, online from Release 1 on `nexus.youtoopreneur.com` (the backend at `/api` on the same address), with a continuous encrypted backup kept off the server** (D-010, D-022 as changed by D-187, D-030 as changed by D-186, D-032).

## 2. Architecture (decided)

- **Modular monolith:** one app, one login, one database split into a section per module; not microservices (D-010).
- **7 modules** on a shared **Core**: CRM · Contracts & Renewals · Projects · WebCare · Finance · Team · Academy (D-011, D-012). The Command Centre and Reports only read (D-013).
- **Floors:** a module only *asks* modules below it and *announces* events upward; no loops; Core never calls a module (D-014). Where Core needs something from every module (restoring from the trash, listing permissions), each module **registers** a handler with Core when it starts; Core never imports a module.

```
 Top (read only)  Command Centre · Reports
 Floor 4          Projects
 Floor 3          Contracts & Renewals
 Floor 2          WebCare · Finance
 Floor 1          CRM · Team
 Ground           Core: serves everyone, asks no one
 Academy          above CRM, Team and Finance
```

- **Each module owns its data.** Others refer to it by ID and never copy or write it; issued invoices keep a frozen snapshot (D-015).
- **One safe path:** every action, by a person, an automation, the API, MCP or AI, goes through a module's **window** with the same permission check and logging (D-019). Each window action is one all-or-nothing save: check company and permission → check the input → do the work → write the activity log → post its announcement (NFR-021).
- **Settings, not code** (D-017, CORE-012): every value marked "(setting)" lives in the database and every change is logged.
- **SaaS-ready:** a company ID on every record, separation enforced centrally (D-020, CORE-014; section 5).
- **Every module is built from the same 6 parts**, listed on its one-page module card (`MODULE.md`): data · rules · screens · window · announcements · night checklist. If it is not on the card, the module does not do it. The **screens** live in the frontend; the other five parts live in the backend. Release 1 writes the cards for Core; each module's card is written when its first release starts.

### Two parts: frontend and backend (D-187)

```
 People (computer or phone browser)
        │  https://nexus.youtoopreneur.com
        ▼
 Caddy ── serves the frontend files (React)       → every screen, portal and public page
   │
   └── /api ──► Backend (Express)                 → the API: permission check, input check,
                 ├── Core + the 7 modules            rules, activity log, announcements
                 └── Worker (same code, 2nd start) → jobs, schedules, announcements
                        │
                        ▼
                 PostgreSQL (one database, a section per module) · private file storage
                        │
                 Backup container ──► encrypted copies off the server
```

| | Frontend (`apps/web`) | Backend (`apps/api`) |
|---|---|---|
| Does | Shows screens; sends each click to the API; hides buttons the person cannot use | Every rule, permission check, calculation, database read and write, file, email and job |
| Never does | Touch the database, hold a key or secret, decide access on its own | Draw screens |
| Talks to | Only the backend's API, through a client generated from the API list | PostgreSQL, file storage and the doors |
| Built as | Plain files (HTML, JavaScript, CSS) served by Caddy; no server of its own | One Express app with two start commands: **api** and **worker** |

- **One address, one login:** the screens and the API share `nexus.youtoopreneur.com`, so the sign-in cookie works without extra set-up and no cross-site rules are needed.
- **The API list is the contract.** Every API door is written once in `packages/contracts` (its address, what goes in and what comes out, checked with Zod, and which fields may be hidden). The backend must match it; the frontend's API client is **generated** from it; the verify command fails if the two drift apart. The same list produces the API documentation automatically.
- **A folder per Nexus module, all the same shape:** Core and the 7 modules are 8 module folders in the backend, each with routes (the API doors) → handlers → service (the module's **window**: its rules) → repository (its tables). Another module may use a module only through the window it exports from its `index.ts`, and only from a higher floor; the wall and floor checks enforce this.
- **Task cards are backend cards or frontend cards** (D-187). A feature is built as **a backend card first** (the API door, the rules and their tests), **then a frontend card** (the screen and its tests), which uses only API doors that already exist. Only the **set-up cards** of step 2.1 may cover both parts and more than 3 files; each lists every allowed file. Different builders can work on different features at the same time.

### The shared backend steps (written once in Release 1, `apps/api/src/shared`)

Express gives no structure of its own, so Release 1 writes these once; every route uses them, the example feature (step 2.7) shows the exact pattern, and the checks in section 9 fail any route that skips them. **Every API request passes through them in this order:**

1. **Request ID and logging** (pino-http). Cookies, authorisation headers, `set-cookie` and fields such as password, code, token and secret are **removed from every log line** (section 7).
2. **Limit per address** on the sign-in doors and public pages (express-rate-limit, counts in `core.rate_counters`, values from the environment file because no company is known yet). Express trusts exactly one proxy (Caddy), so each person's own address is counted.
3. **Sign-in doors** at `/api/auth/*` go to Better Auth, with Nexus's hooks. Only the Better Auth routes listed in 6.1 are open; every other one is switched off. Everything below is for all other doors.
4. **Who is asking:** Better Auth reads the session cookie; Nexus reads the person's company and status. A disabled person is refused at once.
5. **Transaction and company:** a database transaction opens as the app account and sets the company for the row rules (section 5.1). Every step below runs inside it, except the security writes below.
6. **Idle timeout:** the time since the session's last activity is compared with the role's **current** timeout; if it has passed, the session ends. Only requests a person makes count as activity: the generated client marks automatic refreshes and retries with the header `X-Nexus-Background: 1`, which are checked but do not keep the session alive. The last-activity time is written only when it is more than 1 minute old.
7. **Two-step gate:** if the role needs two-step, or the person has set up a method themselves, and this session has not passed it, only the two-step doors and sign-out work (section 6.1).
8. **Limit per person** (by person, values from the company's Security screen; NFR-020). A hit limit is logged and alerts the owner (D-124).

**Security writes are kept even when the request is refused.** The session end on timeout, the last-activity time, the per-person counter, two-step attempt counts, a hit limit's log entry and owner alert, and their security-log entries are each written in **their own short transaction** (with the company set), which commits whatever happens to the request. They never hold locks inside the request's transaction, so a person's parallel requests do not wait on each other.
9. **Feature switch:** each route names its feature key; a switched-off feature is refused, and the worker checks the same switch before a job or listener runs (CORE-015).
10. **Permission:** each route names its permission; Core's check answers *allowed or not*, the **scope** (own, team or all) and the **hidden fields** (section 6.2).
11. **Input check** against the contract (Zod).
12. **Double-click key:** a repeated `Idempotency-Key` returns the first answer instead of doing the action again (NFR-021).
13. **The handler** calls the module's window; the activity log and announcements are written in the same transaction.
14. **Answer:** hidden fields are removed from the answer; the transaction commits.
15. **Errors** at any step leave in one format (section 6.7).

## 3. The stack (approved at Gate 3)

Exact version numbers are pinned in the first set-up card (step 2.1); only long-term-support or stable, maintained versions, all free and open source unless marked.

| Area | Choice | Why |
|---|---|---|
| Language | **TypeScript** in strict mode in both parts, on **Node.js LTS** | One language for the frontend, the backend and the contract (D-187) |
| Frontend | **React** with TypeScript, built with **Vite** (a single-page app); **React Router** for pages; **TanStack Query** for calling the API (with retries and a 30-second refresh where a screen needs it); **React Hook Form** with the contract's Zod rules for forms; **TanStack Table** for lists (filter, sort, export) | D-187; plain files, fast to load, no server to run; the staff app, the portals and the public pages are separate sections loaded only when needed |
| Backend | **Express 5** with TypeScript; Node's built-in **AsyncLocalStorage** carries the person and company through each request; **express-rate-limit** with a small PostgreSQL store over `core.rate_counters`; **pino-http** for logs, with redaction; one error handler | D-187: the owner knows Express and can read the backend; the structure is written once (section 2) and enforced by the checks (section 9) |
| API list and client | Zod rules in `packages/contracts`; **zod-to-openapi** produces the **OpenAPI** description from them; **Orval** generates the frontend's typed API client and TanStack Query hooks | One source of truth; the API documentation comes for free (needed for the client portal, outside tools and AI later) |
| Database | **PostgreSQL 16**: one database; one schema per module (`core`, `crm`, `contracts`, `projects`, `webcare`, `finance`, `team`, `academy`), plus `audit` for the logs, `auth` for Better Auth's sign-in tables and `pgboss` for the job queue | D-010, D-022 |
| Database access and changes | **Drizzle ORM** with **drizzle-kit** migrations kept as SQL files in the repository; the row rules, grants and database accounts are **hand-written SQL migrations** next to the generated ones | Plain SQL is easy to review; changes add before they remove (NFR-017; section 5.3) |
| Background work | **pg-boss** (a job queue inside PostgreSQL), run by the **worker** start command | D-022; no extra service; retries, schedules with a time zone, "run once" keys (NFR-003) |
| Sign-in | **Better Auth** in the backend at `/api/auth` (its official Express set-up), with its own tables in the `auth` schema: **Google sign-in, email and password, password reset links and sessions**. Self sign-up is switched off; its own rate limiter and cookie cache are switched off; only the routes Nexus uses are open, and the fields Nexus adds to its user record can never be set by users. Nexus adds the rest in its hooks and shared steps (section 6.1) | Free and self-hosted (D-143) |
| Two-step | **Nexus's own two-step gate** for every sign-in method: authenticator apps through **otplib** (TOTP), and 6-digit email codes | Better Auth's two-step only covers password sign-in, and Google sign-in must ask too (CORE-002) |
| Input checks | **Zod**, written once in `packages/contracts` | The same rules check a form in the frontend and the request in the backend; the backend's check is the one that counts |
| Screens | **Tailwind CSS** using the design tokens of `docs/design/mockups/mockup.css` (colours, fonts, spacing), with **Radix UI** parts for menus, dialogs and tabs | The screens must match the approved preview (D-136, D-137); Radix gives keyboard and screen-reader support (NFR-009) |
| Languages | **i18next** (react-i18next in the frontend; the same files in the backend for emails), one message file per language (`en`, `ta`, `hi`, `ml`, `te`); adding a language = adding a file (CORE-110, CORE-111) | No code to add a language |
| Dates and money on screen | The browser's own `Intl` formatting with `en-IN` (₹1,00,000) and each person's time zone; **date-fns** for date sums | CORE-112 |
| Fonts | Sora and DM Sans (D-137); **Noto Sans Tamil** for Tamil text | DESIGN-RULES |
| Tests | **Vitest** for both parts; backend **API tests with Supertest on a real PostgreSQL test database**, run as the app account with the row rules on; frontend **component tests** with React Testing Library and **MSW** (a fake API built from the contract); **Playwright** end-to-end tests at computer and phone width (375 px); **Mailpit** catches every email in development and tests | NFR-009, CORE-113 |
| Code checks | **ESLint**, **Prettier**, **dependency-cruiser** (the wall, floor and frontend checks) | Section 9 |
| Repository | **pnpm** workspaces in one private GitHub repository (step 1.9) | One place, one verify command |
| Running it | **Docker Compose**: `api`, `worker`, `postgres` (with WAL-G inside), `backup`, and in development only `seaweedfs` (files) and `mailpit` (email); **Caddy** in front: HTTPS, serves the frontend files, passes `/api` to the backend; a one-off `migrate` service at each deploy | The same set-up on the computer and the server (NFR-015) |
| Files | **S3-compatible private storage**: **SeaweedFS** in development; **Cloudflare R2** online (free tier) | Files separate from the database (CORE-083, D-068); MinIO was turned down because its free edition is no longer maintained |
| Email | **Nodemailer through the email door**: Gmail now (app password), the YTP domain later (D-080, D-102) | Release 1 sends only sign-in emails to the team (section 6.1) |
| Backups | **WAL-G** (continuous change log plus a nightly base backup), a nightly **pg_dump** and a copy of the files, encrypted with **age**, copied with **rclone**, all into a separate R2 bucket | Section 6.5 |
| Errors and uptime | **Sentry** free tier (or self-hosted GlitchTip), with personal data off and cookies filtered out; **UptimeRobot** free for uptime | NFR-006, NFR-012 |
| Passwords of clients and tools | **Never in Nexus.** Self-hosted Vaultwarden, links only (D-140, RULE-025) | Set up before Release 7 (websites); a free Bitwarden account until then |

**Turned down:** one Next.js app for screens and server together (D-022's first proposal; changed by D-187 because screen code and server code mix too easily with three builders); NestJS (a good built-in structure, but the owner knows Express; Express with the structure written once and checked automatically gives the same safety, D-187); two separate repositories (harder to keep both parts matching); microservices (D-010); a separate Redis just for the queue; paid sign-in services (Auth0, Clerk) because of per-user fees; storing files inside the database (CORE-083); MinIO for development files (no longer maintained).

## 4. Repository layout (approved at Gate 3)

```
YTP-SAAS/                    this folder is the repository root
├── apps/web                 FRONTEND (React + Vite + TypeScript)
│   └── src/
│       ├── shell            side menu, top bar, phone menu, colour and language switches
│       ├── areas            staff app · client portal · student portal · public pages
│       ├── modules          core · crm · contracts · projects · webcare · finance · team · academy
│       │                    each: its screens and their parts
│       │                    (their component tests live in apps/web/test/<area>/)
│       └── api              the generated API client: made at every start, build and verify,
│                            never edited by hand and not kept in the repository
├── apps/api                 BACKEND (Express + TypeScript)
│   ├── src/main.ts          start command 1: the API
│   ├── src/worker.ts        start command 2: the worker (jobs, schedules, announcements)
│   ├── src/setup.ts         the one-time first-start command (section 6.8)
│   ├── src/shared           the shared steps of section 2, written once in Release 1
│   ├── src/modules          core · crm · contracts · projects · webcare · finance · team · academy
│   │                        each: MODULE.md · routes (API doors) · handlers · service (window,
│   │                        rules) · repository (database) · schema (tables) · events · jobs
│   │                        (their API tests live in apps/api/test/<area>/)
│   └── drizzle              database changes (SQL), in order, generated and hand-written
├── packages/contracts       the API list and field rules (Zod), shared by both parts
├── packages/ui              shared screen parts built from the mockup tokens
├── infra                    docker-compose files, Caddy, the PostgreSQL image with WAL-G,
│                            the backup container, database account set-up, .env.example
├── tests                    end-to-end (Playwright), load and security tests, and LOCK (section 9)
└── docs, tools, history, share, assets   the planning folders that are already here
```

Release 1 creates the code folders with Core only, beside the planning folders already in this YTP-SAAS folder; each module's folders (one in `apps/web`, one in `apps/api`) appear with its first release. `history/` is private (HANDOVER section 8); whether `share/` goes to GitHub is the owner's choice at step 1.9.

## 5. Rules built into the data (decided unless marked)

Full detail per table is in `docs/DATA-MODEL.md`.

| Rule | How |
|---|---|
| Company separation (CORE-014, NFR-014) | Every table has `company_id`, except the **system tables** listed in DATA-MODEL section 2. **Two locks:** (1) every query goes through one data helper that adds the company; (2) **PostgreSQL row rules** on every company table, which the app account cannot bypass (section 5.1). Automated tests prove both |
| Who touches the database | **Only the backend**, through the accounts in section 5.2. The frontend has no database address, account or key (D-187) |
| Record IDs | A time-ordered unique ID (UUID v7) as the key, Better Auth's tables included; plus a readable code per module where people see it (for example `CL-0042`), counted per company |
| Who and when | Every main record has `created_at`, `created_by`, `updated_at`, `updated_by` and a `version` number; a save with an old version is refused with "this was just changed, please review" (NFR-021) |
| Times | Stored as UTC (`timestamptz`), shown in each person's time zone, India by default; 12-hour times by default, 24-hour as a personal choice (CORE-112, choice 4). Schedules are written in **Asia/Kolkata** time |
| Money | Whole paise (`bigint`) plus a currency code; Indian number format on screen (D-021, CORE-112) |
| Deleting | Main records are never removed at once: `deleted_at` and `deleted_by` put them in the 30-day trash; restore puts back every link (CORE-093) |
| Changes are logged | Every save writes the **activity log** in the same transaction: who (person, automation, API, MCP, AI), what, old and new values (CORE-090). Personal values can be removed from it only through the logged "delete on request" path (DPDP, NFR-010; DATA-MODEL 3.3) |
| The security log cannot be altered | Rows are added only through one database function; the app cannot change or delete them; each company has its own chain of fingerprints, written one at a time, so any change is detected (CORE-092; DATA-MODEL 3.3) |
| Announcements are never lost or doubled | Written to an outbox table in the same save; the worker delivers each one once; every listener records what it has handled (NFR-003) |
| Passwords | People's own sign-in passwords only, stored scrambled by Better Auth (NFR-001); **no field for client or tool passwords anywhere** (RULE-025) |
| Sensitive fields | Bank and statutory details encrypted in the database with the master key from the server's environment (section 6.6), never in code (NFR-001; used from Release 4) |

### 5.1 Company context (decided)

- **How the company is set:** the first statement of every request transaction is `set_config('app.company_id', <company>, true)`. Every company table has the row rule `company_id = NULLIF(current_setting('app.company_id', true), '')::uuid`, for reading and for writing, with `FORCE ROW LEVEL SECURITY`. So even a mistake in code returns nothing from another company, and a query on a reused connection with no company set returns no rows (and no error).
- **Before the company is known (sign-in):** Better Auth's tables live in their own `auth` schema, without row rules. Only Core's sign-in and users code may touch them; the wall check stops any other code. A session is read there first; its person's company is then set for the transaction, and everything after runs under the row rules.
- **One account, one save:** the api and worker use one database account (5.2), so an Owner action that touches both the sign-in tables and Core's tables (adding a person, disabling, changing a sign-in email) is **one all-or-nothing save**. A Better Auth hook that needs Core data (the lock values, the owner alert, the last sign-in time) first reads the person's company from `auth.user`, then sets it.
- **One login, one company:** a sign-in email is unique across Nexus.
- **Rows with no company** (the security log's system chain, errors that happen before a company is known) are written and read **only through database functions** owned by the system role (5.2), which the row rules do not bind. The readers return rows only to the **platform operator**: while Nexus has one company, that company's Owner; before a second company is added, a platform-operator flag outside the company roles is defined (point 43).
- **The worker:** every job and every announcement carries its `company_id`, and the worker sets it for each one. Nightly work (trash clean-up, rate-counter clean-up, checks) loops over the companies and sets each in turn.
- **Monitoring** reads the job queue only through a Core database function that returns the asking company's jobs.
- **Writing company rows outside a request** (the first-start command, a data change in a migration) also sets the company first.
- **Tests:** sign-in, a session lookup and a nightly job work with the row rules on and the app account not owning the tables; a query on a reused connection with no company set returns zero rows; a second test company can never see the first company's data, jobs or logs, and its Owner sees no system rows.

### 5.2 Database accounts (decided)

| Account | Used by | Allowed |
|---|---|---|
| `nexus_owner` | The one-off `migrate` service and the first-start command only | Owns every schema and runs database changes; the row rules still apply to it, so it sets the company when it writes company rows |
| `nexus_app` | The api and worker (Better Auth included) | Module tables under the row rules; the `auth` schema (Core's sign-in code only, by the wall check); only **adds and reads** in `audit`; runs the system functions; reads archive status (`pg_monitor`) to watch the backups |
| `nexus_system` | Nobody signs in with it | Bypasses the row rules; owns the functions that add security-log rows, write and read rows with no company, check the chains and remove personal values on request. `nexus_app` may only run these functions |
| `nexus_backup` | The backup container only | Bypasses the row rules and reads everything (`pg_read_all_data`); replication and the base-backup functions; its only write is `core.backup_runs` |

The accounts are created by a set-up script in `infra` that can be run more than once (as the database administrator); the passwords of the ones that sign in come from the environment file (6.6). It does not rely on the database's first-start folder, which runs only when the database is first made (CR-006).

### 5.3 Database changes and rollback (decided)

- Database changes are SQL files: generated by drizzle-kit for tables, hand-written for row rules, grants, functions and anything drizzle-kit cannot express.
- **Deploying a release:** take a backup → the one-off `migrate` service applies the changes as `nexus_owner` → the api and worker restart on the new image.
- **Rollback:** changes only add (NFR-017), so rolling back means starting the previous image again; if data was damaged, restore the backup taken just before the release (6.5).

## 6. Release 1 in detail

Release 1 = **Base and sign-in**: Phase 2 (steps 2.1 to 2.8) plus its 15 screens (SCR-001 to SCR-004, SCR-008, SCR-010, SCR-011, SCR-180 to SCR-182, SCR-190, SCR-192 to SCR-195). Requirements: the **29 marked "1"** in `docs/REQUIREMENTS.md`, plus four that are **partly built** in Release 1 and marked "1 (part)" there (the Gmail sign-in emails of INT-001, private file links of CORE-082 for the logo and photos, test mode of CORE-065 for team emails, and the door standard of CORE-121 for the email and files doors); `docs/DATA-MODEL.md` section 6 checks each one and gives its Release 1 test.

### 6.1 Sign-in and sessions

**Better Auth provides** Google sign-in, email and password, password reset links and sessions. **Nexus adds**, in Better Auth's hooks and the shared steps: who may sign in, the lock after wrong passwords, the two-step gate for every method, trusted computers, the idle timeout per role, instant cut-off on disabling, and the security log entries.

| What | How | Requirement, choice |
|---|---|---|
| Two ways in | Google sign-in, or email and password | CORE-001 |
| Who may sign in | Only **people the Owner has added** in Users and roles. Self sign-up is off, so an unknown Google account is refused. Allowing a whole domain comes later, once YTP uses Google Workspace (point 42) | CORE-008, D-143 |
| Adding a person | The Owner enters name, email, role and sign-in methods (Google, password or both). The person is **Invited**. With Google, their first Google sign-in with that email links to them and makes them **Active**. With a password, they get an email (no secret inside) asking them to use **"Set or reset password"**. A person without the password method cannot create a password that way | USR-001, SCR-182 |
| Sign-in doors | The only Better Auth routes left open: email sign-in, Google sign-in and its return address, sign-out, get-session, request-password-reset and reset-password. Every other route (update-user, change-email, change-password, delete-user, link and unlink accounts, list accounts, Google tokens…) is switched off. My devices, log out everywhere and profile changes go through Nexus's own doors, behind every shared step. The fields Nexus adds to Better Auth's user record (company, status, lock) can never be set by users | CORE-002, CORE-006, CORE-014 |
| Changing a sign-in email | One Owner action that: changes the email, removes the old Google link, ends every session and trusted computer, writes the security log and tells both addresses. The next Google sign-in with the new email links to the **same person**, so all history stays; the old address no longer works | CORE-008 |
| Two-step | **Nexus's own gate after every sign-in, Google included,** for roles that need it (a setting per role; by default Owner, LLP partner, Accounts, HR and Manager, as on the approved Security screen) **and for anyone who has set up a method themselves** (optional for Staff and Trainer). Methods: **authenticator app** and **email code** (6 digits, 10 minutes); **WhatsApp code** when WhatsApp sending exists (Release 9). Until it is passed, only the two-step doors and sign-out work. **5 wrong codes in a session** (email or authenticator) end that session (reason "two-step failed") and are written to the security log; the two-step doors also fall under the per-address limit | CORE-002 |
| Setting up two-step | The **first** method needs proof: a code sent to the sign-in email, or a Google sign-in within the last 5 minutes. Adding or changing a method later needs an existing method first. A person who loses their phone is **reset by the Owner**: their methods are deleted, every session and trusted computer ends, and they get an email. Every set-up and reset is in the security log | CORE-002, SCR-002 |
| Trust this computer | Unticked by default; skips the code on that computer for 30 days; ended by "log out everywhere" | choice 3 |
| Wrong passwords | After 5 wrong tries the account locks for 15 minutes, the owner is alerted and the security log records it (Better Auth hooks on password sign-in) | CORE-004, NFR-020, choice 2 |
| Signing out after no activity | Owner, LLP partner, Accounts and HR after 30 minutes; everyone else after 8 hours; a setting per role, checked on every request against the role's current value, so a change applies at once | CORE-003, choice 1 |
| My devices | Each person sees their active sessions and can log out everywhere | CORE-005 |
| Disabling a person | Ends every session and trusted computer at once; every request checks the person's status, and Better Auth's cookie cache is off. API keys (Release 16) and open tasks (Release 2) are handled when those exist. **Deleting** a person = disabling plus the trash: their email stays reserved until the 30-day clean-up, and only the Owner can restore them | CORE-006 |
| Forgot password | A reset link by email, valid 1 hour, used once; only for people with the password method | SCR-003 |
| Limits | Per address on the sign-in doors, the two-step doors and public pages (values in the environment file); per person on everything else (the Security screen's values). Refused requests count too. Better Auth's own limiter is off | NFR-020 |
| Security log | Sign-in, failure, lock, two-step set-up and reset, email change, session ended, all written from the hooks; failures for unknown emails go into the system chain | CORE-092 |

**Emails in Release 1:** only sign-in emails to the team (two-step codes, reset links, the lock alert to the owner), through the email door with Gmail. Nothing goes to clients in Release 1. **Test mode** (RULE-021, D-102) is on in development and in the test copy: every email goes to Mailpit on the builder's computer, or to the owner's test inbox on the test copy. Until Gmail is connected, emails wait in the queue and Monitoring shows the email door as not connected. When client emails start is open point 41 (section 12).

### 6.2 Roles and permissions

- **Nine default roles**, all editable: Owner, LLP partner, Manager, HR, Accounts, Staff, Trainer, Client contact, Student (USR-006). Every person has one role. Their starting values (two-step, timeout, phone menu, Release 1 permissions) are listed in DATA-MODEL 3.2.
- **Role builder** (USR-002, USR-003): per module the actions view, create, edit, delete, approve and export; record scope own, team or all; hidden fields (for example money).
- **New permissions appear by themselves:** each module registers its permissions **with default grants for the nine roles** (for example Staff: CRM view, create and edit their own records, no delete, money hidden; USR-006, choice 9). They are given to the default roles once, when the module first arrives, and never overwrite what the Owner has changed.
- **One permission check** in Core, in the backend (step 10 in section 2), used by every API door and by every window for automations, the API and AI (D-019). The frontend only hides what the backend would refuse anyway; it never decides access (D-187).
- **Scope:** Core's check returns the scope; each module's repository turns it into a filter on its own data. *Own* = assigned to or created by the person. *Team* is defined on each module's card (for example project members in Projects; for CRM and Team, the person's reports). The reporting line is kept on the Core user (`manager_user_id`) by the Team module from Release 4, so no module has to ask Team.
- **Hidden fields:** the contract marks which fields can be hidden; one shared step removes the caller's hidden fields from every API answer and from the old and new values shown in the activity log.
- **View as role** (USR-004): the Owner sees exactly what a role sees; read-only while previewing; logged.
- **Approval delegation and limits** (USR-005, D-071) come in Release 2 with the approval inbox; the Users and roles screen shows that part from then.
- **People with or without a login** (USR-001): a login is a Core user; the Team module's person (Release 4) and the CRM contact (Release 14) point down to it by ID.

### 6.3 The base screens

| Screen | What Release 1 builds |
|---|---|
| App shell (SCR-004) | Grouped side menu, top bar, search box, colour switch (Emerald and Navy, D-134), language picker, profile. **Menu items whose release is not built yet stay hidden** by feature switches. On phones, the bottom menu by role (CORE-113, choice 13) |
| My profile (SCR-008) | Name, photo, language, colour, time zone, date and time format, daily summary time (stored now; the summary is sent from Release 9), devices and sign-in methods |
| Record history (SCR-010) | The activity log of any record, with old and new values |
| Trash (SCR-011) | Deleted records for 30 days, restore with links |
| Settings home (SCR-180) | Every setting, grouped; tiles of later releases appear when those releases switch on |
| Company profile (SCR-181) | Legal name, type, PAN, GSTIN, address, state, logo, in **dated versions**; the GST switch "registered from [date]" (CORE-010, CORE-011); the company's default colour (a setting, shown here) |
| Users and roles (SCR-182) | People who can sign in (add, invite, change email, disable), the role builder, view as role (approval limits from Release 2, USR-005) |
| Security (SCR-190) | Two-step per role, session timeouts, lock rules, rate limits (the domain rule comes later, point 42) |
| Languages (SCR-192) | The five languages; each opens to people only after a native speaker's check is marked done (CORE-110, choice 11) |
| Feature switches (SCR-193) | Turn any feature or released area on or off (CORE-015) |
| Monitoring (SCR-194) | Background jobs, failed jobs with Retry, recent errors, the doors' status, the last backups and restore tests (CORE-140) |
| Logs (SCR-195) | The activity log and the security log, searchable; the security log cannot be edited (CORE-090, CORE-092) |
| Sign-in, two-step, reset (SCR-001 to 003) | As in 6.1 |

**Landing page in Release 1:** the Owner lands on Settings home, everyone else on My profile. The phone menu shows Home (that landing page) and More; the other buttons of each role's phone menu appear with their releases.

**Parts of a later release stay hidden.** Some approved Release 1 screens also show parts that belong to later releases (for example AI and voice, notifications, approval delegation, messages on Monitoring). Release 1 builds the screen without them; each part appears, behind its feature switch, when its release is built.

**Groundwork for later releases:** the activity log has a client link on every entry, so the client timeline (CORE-091, Release 3) needs no change later; the daily summary time is stored now and the summary is sent from Release 9 (CC-005).

### 6.4 Doors and files in Release 1

Every outside service goes through a door in Core (D-018). Release 1 builds the **door standard** that every later door follows (CORE-121, its Release 1 part: connect, health check, sending through the queue with retries, errors), and only these doors on it:

| Door | Service | Used for |
|---|---|---|
| Email (INT-001, sign-in part) | Gmail by app password; Mailpit in development | Two-step codes, reset links, the lock alert |
| Files | SeaweedFS in development, Cloudflare R2 online | The company logo and profile photos |

The backup is not a module door: it runs in its own container (6.5).

- **Keys in Release 1** come from the server's environment file (6.6), with a copy in the password manager. `core.doors` keeps each door's status, on/off and non-secret settings. Pasting keys inside Nexus arrives with the Integrations page in Release 16 (CORE-120). No key in code, logs or messages.
- **Files:** an upload goes through the backend, which checks the permission, the type and the size (25 MB, a setting) and stores it privately; opening a file asks the backend for a link valid 5 minutes, after a permission check, and the download is logged (CORE-082, Release 1 part).

### 6.5 Going online and backups (D-030 as changed by D-186)

- **Address:** `nexus.youtoopreneur.com` (D-095), HTTPS by Caddy with free certificates.
- **Server (D-190):** a **free cloud machine now** (proposed: Oracle Cloud's Always Free machine in Mumbai or Hyderabad; Claude gives the steps at step 2.8), and a **small paid Indian VPS later** (roughly ₹500 to ₹1,500 a month), when the owner decides. Both run the same Docker set-up, so the move is one documented step (NFR-015).
- **Three places:** the builder's computer (test data only); a **test copy online** on the same server (test data only); the **live system** (real data from Release 3's import).
- **Monitoring:** UptimeRobot checks the site every 5 minutes; errors go to Sentry; both alert the owner by email.

**Backups (decided; NFR-007, NFR-008, AUTO-037, INT-022):**

| What | How |
|---|---|
| Continuous | PostgreSQL hands its change log to **WAL-G** (installed in the PostgreSQL image) at least every 15 minutes, into a separate, encrypted Cloudflare R2 bucket. WAL-G is set never to overwrite (`WALG_PREVENT_WAL_OVERWRITE=true`), so handing over the same piece twice succeeds even with the bucket lock |
| Nightly, 2:00 am Asia/Kolkata (choice 14) | The `backup` container, with the database's data folder mounted read-only, takes WAL-G's full base backup; pg_dump makes a logical copy as the backup account; the files bucket is copied with a **read-only** files key; the extra copies are encrypted with age |
| Result | Nexus can be put back to **any moment** of the last 30 days, losing **at most 15 minutes** (target: 1 hour) |
| Kept and locked | 30 days. The backup bucket has a **30-day lock**, so no copy can be deleted or changed early, not even with the server's key; old copies are removed only by the bucket's own clean-up rule (NFR-008, locked backups). A second copy of the nightly dump may go to Google Drive (optional; Drive cannot hold the continuous log) |
| Who runs it | The `backup` container, with its own database account and keys, which the api and worker never see. It records every run in `core.backup_runs` |
| Alerts | The worker watches: if handing over the change log fails (any new failure) or stops for more than 20 minutes, if the server's free disk space runs low, or if the last good nightly run is older than 26 hours, the owner gets an email |
| Proof | Every month and before each release goes live: a **timed restore to a chosen moment** on a spare copy; its start, finish and the moment restored are recorded, against the targets of 4 hours to restore and 1 hour lost. The spare copy runs with change-log archiving off and read-only backup keys, so it never writes into the live backups |
| Versions | WAL-G and pg_dump are pinned to the same PostgreSQL major version as the server |

### 6.6 Environment and secrets (decided)

Each place (the builder's computer, the test copy, the live system) has its own `.env` file, never in the repository; `infra/.env.example` lists the names only. The real values are also kept in the password manager.

| Setting | Read by | What it is |
|---|---|---|
| `POSTGRES_SUPERUSER_PASSWORD` | postgres (development only) | The development database's administrator password; never used by Nexus itself |
| `DATABASE_URL_APP` | api, worker | The app database account |
| `DATABASE_URL_OWNER` | migrate, setup | The owner account, for database changes only |
| `DATABASE_URL_BACKUP` | backup | The backup account |
| `APP_URL` | api | `https://nexus.youtoopreneur.com` (or the local address) |
| `BETTER_AUTH_SECRET` | api | Signs session cookies |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | api | Google sign-in |
| `NEXUS_MASTER_KEY` | api, worker | Encrypts sensitive fields and stored keys |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | worker | The email door (Release 1) |
| `SMTP_URL` | worker | Development and tests: the email catcher (Mailpit, `smtp://localhost:1025`); TASK-0029 says how the email door chooses between it and Gmail |
| `FILES_S3_ENDPOINT`, `FILES_S3_BUCKET`, `FILES_S3_KEY`, `FILES_S3_SECRET` | api | The files door |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_KEY`, `BACKUP_S3_SECRET`, `BACKUP_ENCRYPTION_KEY` | backup, postgres | The backup bucket and its encryption (the key can add copies but not delete them early: the bucket lock) |
| `FILES_BACKUP_S3_KEY`, `FILES_BACKUP_S3_SECRET` | backup | A **read-only** key to the files bucket, for the nightly copy |
| `ADDRESS_LIMITS` | api | The per-address limits for the sign-in doors and public pages |
| `SENTRY_DSN` | api, worker, frontend build | Error reporting (not secret) |
| `TEST_MODE` | worker | `on` in development and the test copy |

Two optional settings are read by the API but are not in the `.env` files (so `infra/.env.example` and its test keep the list above): `PORT` (default 3000; an empty or non-numeric value also gives 3000) and `LOG_LEVEL` (one of `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`; default `info`; from TASK-0086 a blank value also gives `info`, while an unknown value stops the API on purpose) (CR-010).

### 6.7 API conventions (for every card)

- **Addresses:** `/api/<module>/<resource>`, JSON in and out. The internal API has no version number because the frontend ships with it; the public API with keys (Release 16) will use `/api/v1`.
- **Errors:** always `{ "error": { "code", "message", "fields", "requestId" } }`. Status 400 wrong input · 401 not signed in · 403 not allowed, two-step needed (`two_step_required`) or feature off (`feature_off`) · 404 not found · 409 changed by someone else (`stale_version`) or duplicate · 429 too many requests · 500 our fault (logged with its request ID). `AppError` is only for the expected answers above (4xx); a failure on our side (a database or door problem) is thrown as a plain `Error`, so it always answers 500 `server_error` and is logged at level error with its request ID (CR-010).
- **Saving:** every change carries the record's `version`; an old version gets 409 "This was just changed, please review".
- **Double clicks:** every request that changes data carries an `Idempotency-Key` header made by the screen; a repeat within 24 hours gets the first answer.
- **Lists:** `?page=1&pageSize=25&sort=field:asc&q=text&filter[field]=value`; the answer is `{ items, page, pageSize, total }`; at most 100 per page. Exports have their own door, need the export permission and are logged.
- **Who am I:** `GET /api/core/me` returns the person, role, permissions with scope and hidden fields, feature switches, preferences and open languages; the frontend builds the menu from it, and the backend still checks every request.
- **Values:** times in ISO 8601 UTC; money as whole paise with a currency code.

### 6.8 First start (decided)

A fresh system has no company and no Owner, and nobody can sign in. A **one-time setup command** (`pnpm --filter api setup --company "YouTooPreneur" --owner-email <email> --owner-methods google,password`), run by the builder at step 2.4 and again on the server at step 2.8, does it all in one transaction as the owner account, sets the new company for the transaction right after creating it, and refuses to run if anyone already has the Owner role:
- the company, and its first company profile version (placeholders until the owner fills it in)
- the nine roles with their starting values and Release 1 permissions (DATA-MODEL 3.2)
- the five languages (English open and the default; the others closed until checked)
- the feature switches (every later release off)
- the Owner: a person with the Owner role, Invited, with the given email and sign-in methods

Things that come from code, such as the permission list, setting definitions and feature-switch keys, are registered on every start, without changing anything the owner has set.

## 7. Security (decided)

- HTTPS everywhere; checked against OWASP ASVS before each go-live (NFR-001).
- One permission check for everything (6.2); company separation with two locks (section 5).
- **Sign-in cookie:** the session lives only in a cookie the page's scripts cannot read (HttpOnly, Secure, SameSite); no sign-in token is kept in the browser's storage. The backend refuses data-changing requests that do not come from Nexus's own address.
- **Security headers** from Caddy on every page: HTTPS only (HSTS) and a strict content security policy, so the frontend loads scripts only from Nexus itself.
- **The frontend holds no secrets:** nothing in its files is a key, password or private address.
- **Logs never hold secrets:** the logging step removes cookies, authorisation headers, `set-cookie` and password, code, token and secret fields; Sentry has personal data off and filters cookies and headers. A test proves a request with a session cookie and a password leaves neither in the log. From TASK-0086 (CR-010): secret fields are removed at the top level and up to three levels deep (an array index counts as a level); the Referer, a redirect's `location` and every address query are never logged (a reset or invite address carries its token there); an unexpected error is logged with its type, its message without a failed query's values, its code, its stack frames and one level of cause, and nothing else (no `params`, `input`, `detail`, `body` or `config`), and a line logged without a message gets the cleaned message when the error's message is text (TASK-0087; a thrown object whose `message` is not text still has it copied whole, one more reason for the `{ err }`-with-a-message rule below). The cleaner reaches only two things: anything thrown (an error or not) under the key `err`, and an error under another key at the top level of a log call's object, the request logger (`req.log`) included. It does not reach a child logger's bindings, a plain object or string passed as the first argument or under another key, an error inside another object, or an error in a message (`%o`, `%j`). So Nexus code logs anything it catches only as `{ err }` with a message, `logger.error({ err }, '...')`; it never writes `logger.error(e, ...)` (a thrown plain object or string passed first is written whole), and never puts an error into `logger.child(...)`, inside another object or into a message; child loggers get only ids and plain values; a refused body still gets its request line. Nexus code never puts a secret or a personal value into an error message, and never lets a library's message carry one: `JSON.parse` (and so `response.json()`) quotes about 10 characters on each side of the fault, and a PostgreSQL type error repeats the value, so every value is checked before it reaches the database (the route helper's input check, a Zod check for job data and outside replies, exact contract types for ids, numbers, dates and choices), and a door reads an outside reply as text and throws its own fixed message when it cannot be read. A one-time token or secret-link code never goes in an API address path, because the request logger keeps the path: it travels in the body, or in the query, which is never logged. Records that hold secrets (Better Auth's account, session and verification rows, two-step set-ups, API keys) are never logged whole: code logs their id only, Better Auth's logger writes only its message and a cleaned error, and the secret field names grow with the cards that bring such fields (TASK-0032, TASK-0037, the Release 16 API keys).
- Security log of sign-ins, permission changes, exports, sensitive-field views and API calls; cannot be altered (CORE-092).
- Rate limits as settings: sign-in tries, requests per person, public pages (D-124, NFR-020).
- No secrets in code, logs or messages (AGENTS.md rule 10); secrets live in the environment file (6.6) and the password manager.
- Nexus never stores client or tool passwords (RULE-025); Aadhaar last 4 digits only (RULE-017).

## 8. Storage, retention and monitoring

| What | Where | Backed up |
|---|---|---|
| Records, settings, logs | PostgreSQL | Continuously and nightly (6.5) |
| Logo, photos, later all attachments | Private file storage (R2) | Nightly copy (6.5) |
| Client and tool passwords | Vaultwarden only, never Nexus | Vaultwarden's own backup |
| Code and documents | Private GitHub repository (step 1.9) | Yes |
| Secrets | The server's environment file | A copy in the password manager |

Retention is a setting per record type, with no automatic deletion until the owner sets a period (CORE-094, D-130). Suggested (choice 19, kept): the activity log 3 years then archived; the security log and invoices 8 years (the CA confirms). A person's deletion request removes their personal values from the activity log through its logged path (DATA-MODEL 3.3).

## 9. Checks and building (decided)

- **The verify command comes first** (step 2.1): no application code before it exists.
- **`pnpm verify`** runs: type check, ESLint and Prettier, all Vitest tests (backend API tests and frontend component tests), the Playwright smoke tests, and these checks:
  - the **wall check**: no module reaches into another module's data or inner code; only Core's sign-in and users code touches the `auth` schema
  - the **floor check**: no asking upward, no loops
  - the **frontend check**: the frontend never imports backend code and never reaches the database
  - the **contract check**: the backend's routes match the API list in `packages/contracts`, and the frontend's client is generated from that list (it is never kept in the repository, so a backend card never touches frontend files)
  - the **door check**: every API door declares its permission and its feature key, or is marked public on purpose (sign-in, public pages); the open Better Auth routes are exactly the list in 6.1
  - the **card check**: every window action and announcement is on its module card
  - the **allowed-files check**: compared with the card's start point (the commit recorded in its log), the card's own changes touch only the card's files plus the builder's own files (its log, its evidence folder, its lines in STATUS and INDEX). Machine-written paths are ignored: `history/`, `share/` and `tracker.html`. From TASK-0012, a moved file's old path is checked too, and every commit after the start point that is not yet on `main` must be named for a card (CR-009)
  - the **test lock**: `tests/LOCK` lists every planner test file with its card ID and fingerprint, and the fingerprints still match
- **Which tests run:** plain `pnpm verify` leaves out the tests of cards that are not yet Done in `docs/tasks/INDEX.md`, so it is green at the start check. At the start check the builder also runs `pnpm verify --card TASK-XXXX` once and records that the card's own tests fail (proof they test something). Building, debugging and the final proof use `pnpm verify --card TASK-XXXX`, which adds the card's tests and must be fully green.
- **Each builder works in its own copy:** a git worktree on a branch cut from the start point, so other builders' work, the planner's edits and the conversation auto-save never appear in it. The card's one commit adds only the card's files by name, never everything.
- **Task loop** for every card: start check → build → verify → debug (max 5 tries) → green with proof, or BLOCKED (AGENTS.md section 3).
- **Builders:** Antigravity, Codex or Claude, named on each card; Claude only in a separate building session; nobody reviews their own card (D-185).
- **Backend, frontend and set-up cards** (D-187): each card names its part. A feature's backend card comes first; its frontend card starts only when the backend card is Done. Set-up cards exist only in step 2.1. Different builders may work on different features at the same time, never on the same files.
- **Card size:** a **backend card** covers one API door inside one module folder: its contract entry, route, handler, service, repository, table and database change, and its line on the module card, about 200 changed lines, every file listed (D-091 as changed by D-187). A **frontend card** covers one screen or screen part, 1 to 3 files (D-091).
- **When a pass test needs later records:** the card uses the interim test written beside the requirement (DATA-MODEL section 6 for Release 1), and the full test is run again, and recorded in STATUS, in the release that brings those records.
- **Each release:** the owner and a team member check each part (D-152); a backup and a rehearsal before it goes live; rollback ready (5.3); then the team uses it 1 to 2 weeks and the feedback is fixed before the owner closes it (D-186).
- **GitHub** runs `pnpm verify` on every change once the repository exists; the main branch accepts only reviewed, green changes.
- **Commits (D-189, decided 2 Nov 2026):** each builder makes exactly one commit per finished card, with only that card's files, named `TASK-XXXX: <Title> [<builder>]`; no other commits without the owner's OK.

## 10. Release 1 build order (for the task cards)

This numbering is the one `docs/PLAN.md` and `docs/STATUS.md` use. Inside a step, backend cards come before frontend cards (D-187).

| Step | Backend cards | Frontend cards |
|---|---|---|
| **2.1** Set-up | Set-up cards: the repository and workspace; Docker Compose and Caddy; the verify command and every check in section 9; `packages/contracts`; then the shared backend steps of section 2 (2 or 3 cards, each with its tests). **The owner's practice task:** the owner runs the first small set-up card with Antigravity, start to finish | The empty React app with the mockup tokens, `packages/ui` base parts, an empty page that passes the checks |
| **2.2** Database | Schemas, the database accounts, row rules and the company context (5.1, 5.2), the activity and security logs, the outbox, double-click keys, `migrate` | — |
| **2.3** Backup | The PostgreSQL image with WAL-G, the backup container, a timed restore to a chosen moment | — |
| **2.4** Sign-in and roles | One card each: Better Auth with Google and password, and the open sign-in doors; adding and inviting people; deleting a person and the 30-day clean-up of their sign-in; the lock after wrong passwords; the two-step gate and its two methods; trusted computers; the idle timeout; disabling; changing a sign-in email; roles, permissions and default grants; view as role; the first-start command | Sign-in, two-step set-up, reset password; the app shell (menu, top bar, phone menu); Users and roles; Security |
| **2.5** Settings and health | Settings with change log, feature switches, announcements delivered by the worker, Monitoring and Logs data (the automation engine comes in Release 9) | Settings home, Feature switches, Monitoring, Logs |
| **2.6** Company and people | Languages (open after check), company profile with dated versions and the GST switch, preferences | Languages, Company profile, My profile; colour and language switches working |
| **2.7** The example feature | Trash and record history: the backend pattern later cards copy | Trash and Record history: the frontend pattern later cards copy |
| **2.8** Online | The server, `nexus.youtoopreneur.com`, the environment file, the test copy, uptime and error alerts, the first-start command on the server | The owner and a team member sign in from their phones; then 1 to 2 weeks of use and feedback |

## 11. Decided now (from the 40 open points of v0.1)

| # | Point | Decided at Gate 3 |
|---|---|---|
| 1 | Stack | Section 3: a React frontend and an Express backend, both TypeScript (D-187) |
| 2 | Job queue | pg-boss |
| 3 | Web and worker | The frontend is plain files served by Caddy; the backend is one codebase with two start commands, the API and the worker |
| 4 | Sign-in library | Better Auth for sign-in and sessions; Nexus's own two-step gate and sign-in rules (6.1) |
| 5 | Database access and migrations | Drizzle ORM and drizzle-kit, with hand-written SQL for row rules, grants and functions (5.3) |
| 6 | Module sections | One PostgreSQL schema per module, plus `audit`, `auth` and `pgboss`; the wall check |
| 7 | Company separation | The company filter plus row rules, with the company context of 5.1 and tests |
| 11 | Announcements | Outbox in the same save, delivered once by the worker |
| 13 | File storage | SeaweedFS in development, Cloudflare R2 online (virus check and image compression with Release 2 files) |
| 16 | Translations | i18next, one file per language, shared by the frontend and the backend |
| 21 | Live updates | TanStack Query refreshes every 30 seconds where a screen needs it; a live connection only if a later release proves it necessary |
| 23 | Backup destination | A separate encrypted Cloudflare R2 bucket; Google Drive only as an optional second copy of the nightly dump |
| 24 | Backup time | 2:00 am Asia/Kolkata (choice 14); the server is always on |
| 25 | At most 1 hour lost | WAL-G with the change log handed over at least every 15 minutes (6.5) |
| 26 | Test copy online | Yes, test data only |
| 29 | Docker on Windows | Docker Desktop on the builder's computer, checked in step 2.1 |
| 30 | Encryption keys | In the server's environment file (6.6), never in code, with a copy in the password manager |
| 31 | Error and uptime tools | Sentry free tier (or GlitchTip), UptimeRobot free |
| 32 | Verify command | Section 9 |
| 33 | GitHub checks | `pnpm verify` on every change |
| 34 | Readable IDs | Yes, a code per module (`CL-0042`) next to the internal ID |
| 36 | Session times, lock, trust device | Choices 1 to 3, kept: 30 minutes for Owner, LLP partner, Accounts and HR, 8 hours for others; a 15-minute lock; 30 days |
| 37 | Retention | Choice 19, kept; the CA confirms invoices |

## 12. Settled when their release starts (later)

| # | Point | Release |
|---|---|---|
| 8, 9 | Same-floor asking (for example CRM's lead assignment and Team's leave); the Academy's floor | Release 3 (CRM module card; confirmed on the Team card in Release 4) and Release 17 (Academy) |
| 10 | Who owns payouts | Release 13 |
| 12 | Where report schedules live | Release 15 |
| 14 | Email service for the YTP domain | Before the first release that emails clients (point 41) |
| 15 | PDF tool (₹ sign, Tamil) | Release 3 (client profile PDF) |
| 17 | Search across records; AI search by meaning | Release 2 (search); Release 16 (AI) |
| 18, 19 | AI provider door with fallback; speech service | Release 16 |
| 20 | Browser push | Release 16 (INT-004) |
| 22 | Domain and SSL expiry source; uptime of client sites | Release 7 |
| 27 | Server location and type | **Decided (D-190):** a free cloud machine now, a small paid VPS later; the free machine is set up at step 2.8 |
| 28 | When test mode is switched off | Before the first release that sends to clients (point 41) |
| 35 | The public API with keys, and MCP tools | Release 16 (the API description itself is produced automatically from Release 1, D-187) |
| 38 | Academy recordings backup | Release 18 |
| 39, 40 | Phone speed test method; load test for 100 people at once | Before Release 3 goes live (first real data) |
| 41 | **When client emails start.** Release 6 (Billing) emails invoices and receipts (FIN-004, FIN-007), but email sending to clients, templates, test mode and the Messaging screen are placed in Release 9. Either the email part moves to Release 6, or invoices are shared by link and one tap until Release 9 | **Owner, before Release 6's task cards** |
| 42 | **Allowing a whole email domain** to sign in (CORE-008): a person from the domain who signs in for the first time is created with the rule's default role, and the Owner is alerted | When YTP uses Google Workspace |
| 43 | **The platform operator:** who sees rows that belong to no company once Nexus has a second company | Before a second company is added |
| 44 | **Meeting links and calendar sync** (CORE-054, CORE-055, CORE-057) need the Google Calendar and booking doors (INT-010, INT-011), placed in Release 16: either those doors move to Release 5, or meetings start with pasted links until Release 16 | Owner, before Release 5's task cards |
| 45 | **How the API and the worker start in production.** `node dist/main.js` (TASK-0002) stops working once the API imports `@ytp/contracts` (TASK-0011), because that package is TypeScript source. Choose one: run with tsx, give `@ytp/contracts` its own build, or bundle the API; and add a production start for the worker. The screens' production build also needs the root `package.json`, `pnpm-workspace.yaml`, `packages/contracts` and the screens' development packages, because `build` makes the API client first (CR-003). Whatever is chosen must keep `apps/api/test/setup/main.test.ts` passing (it starts `src/main.ts` with the test run's own settings), and any card that edits `main.ts` keeps the `api listening` and `api could not start` messages and exit code 1. (CR-002) | Release 1, when TASK-0079's card is written (step 2.8) |
| 46 | **How the API and the worker read `infra/.env`** on the builder's computer (nothing loads it yet), for example Node's `--env-file` in the start scripts or a small loader. Whatever is chosen must keep `apps/api/test/setup/main.test.ts` passing (it starts `src/main.ts` with the test run's own settings), and any card that edits `main.ts` keeps the `api listening` and `api could not start` messages and exit code 1. (CR-002) | Release 1, when TASK-0014's card is written (step 2.2) |
| 47 | **The development services for the database cards** (found in the review of TASK-0006, CR-006): the services listen only on this computer (`127.0.0.1:5432:5432` and so on, not every network address); the database health check goes over the network (`pg_isready -h 127.0.0.1 ...`), so "healthy" means the first-start script has finished; which file the database tests read and that its passwords match `infra/.env`; every new builder copy needs its own `infra/.env`; all copies share one database server and one `nexus_test` | Release 1, when TASK-0014's card is written (step 2.2) |
| 48 | **Private files in development** (CR-006): SeaweedFS as set up checks no keys, so give it an identity file (a full key for `nexus-files` and the read-only backup key), create the `nexus-files` bucket, check buckets with HeadBucket (its ListBuckets stays empty), give it a health check, and switch off its usage reports (`-telemetry=false`) | Release 1, when TASK-0069 (files door) and TASK-0027 (backup) are written |
| 49 | **The check command with many test files** (CR-007): on Windows one command line holds about 8,000 characters, so `pnpm verify` listing every test file of a package fails at about 200 files; change its test step (run the whole package when every file is selected, list the left-out files instead, or run in groups) and make the file selection exact | Before `apps/api` has about 150 test files (around Release 3) |
| 50 | **Floor rules as allow-lists** (CR-008): today each `floor-rules-<module>` rule lists the modules it may not ask, so a module folder that is in no rule (a new module, or a misspelt folder) can be asked by anyone, and a module can reach a higher floor through it. Write each rule as an allow-list (`to.path` `^apps/api/src/modules/[^/]+/`, `to.pathNot` `^apps/api/src/modules/(<own>|<allowed below>|core)/`; allowed below: crm and team none; webcare and finance: crm, team; contracts: crm, team, webcare, finance; projects: crm, team, webcare, finance, contracts; academy: crm, team, finance) and add a rule that forbids any folder not on a floor, each with a fixture | The next card that edits the floor table or adds a folder under `apps/api/src/modules/` (Release 3 at the latest) |
| 51 | **Lint warnings** (CR-008): `pnpm lint` passes when there are only warnings, so a missing React hook dependency (`react-hooks/exhaustive-deps`) or an unused `eslint-disable` comment does not stop `pnpm verify`. Make both errors in `eslint.config.mjs` (`'react-hooks/exhaustive-deps': 'error'` for the screens and `linterOptions.reportUnusedDisableDirectives: 'error'`), keep the `lint` script as it is, and add a planner test that plants each. Decide at the same time whether `.cjs` and `.js` files get the recommended rules (today only Prettier and the Architecture step check `.dependency-cruiser.cjs`) | Before the first screen card that uses React hooks |
| 52 | **Root TypeScript files are not type-checked** (CR-009): the Type check runs `tsc` only in `apps/*` and `packages/*`, and typescript-eslint switches `no-undef` off for `.ts` files, so a misspelt name or option in `playwright.config.ts` or `tests/e2e/*.spec.ts` (TASK-0013) passes Type check and Lint; Playwright crashes on a misspelt name but quietly ignores a misspelt option. `apps/web/orval.config.ts` is in the same position. Fix in one tools card: TypeScript and Node's types at the root, a root `tsconfig.json` for the root config files and `tests/e2e`, the Type check also running there, `orval.config.ts` in the `include` of `apps/web/tsconfig.json`, and a planner test that plants a misspelt name and a misspelt option | The first tools card after TASK-0013 (Release 1) |
| 53 | **The real address behind Caddy** (CR-010): Express trusts exactly one proxy (`trust proxy 1`), so `req.ip` is the last address in X-Forwarded-For, the one Caddy saw, and the per-address limits and audit addresses depend on it. TASK-0079's production Compose file never publishes the `api` or `worker` port (only Caddy's 80 and 443), so nothing can reach the API without passing Caddy, and Caddy replaces any X-Forwarded-For a person sends; a check after going online confirms a made-up X-Forwarded-For does not change the address the API sees | When TASK-0079, TASK-0080 and TASK-0081 are written (step 2.8) |

## 13. Approved, and the owner's next steps

**Approved by the owner on 2 Nov 2026:** this tech design and `docs/DATA-MODEL.md` (Gate 3 for Release 1, with Gate 3 now per release, D-188); Release 1 is frozen (D-191); one commit per finished task card by its builder (D-189); a free cloud machine now and a small paid one later (D-190).

Still to come, each with Claude's steps:
1. **Step 1.9:** the private GitHub repository on the owner's account (youtoopreneur@gmail.com), and this folder opened in Antigravity and Codex.
2. **Before Release 1 goes online (step 2.8):** the free cloud machine; a Google Cloud project for Google sign-in and a Gmail app password for the sign-in emails; a Cloudflare account (free) with two R2 buckets, one for files and one for backups (with the 30-day lock).
