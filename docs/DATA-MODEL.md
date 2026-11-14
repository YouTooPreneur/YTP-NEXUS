# Data model (step 1.7)

**Version 0.3, 2 Nov 2026. Approved by the owner on 2 Nov 2026 (Gate 3), together with `docs/TECH-DESIGN.md` v0.3; Release 1 is frozen (D-191).** It includes the fixes from the independent reviewers (rounds 53 to 55). The database belongs to the **backend**: only the backend reads and writes it; the frontend sees data only through the API (D-187).

This document locks **the main records of every module** before any building starts (D-147), so later releases never force changes to finished ones. **Release 1's tables are given in full detail** (section 3); every later release's tables get their full detail when that release starts, inside the main records listed here (section 4). Adding a field later is normal; changing what a main record *is* needs a new decision.

## 1. How to read it

- Names are in English, written as the code will use them (`core.users`, `display_name`). The first word is the section of the database (D-010).
- "Release" means the release in `docs/RELEASES.md` that first builds the record.
- **Plain links** (an ID without a database link) are used between modules and point **down** the floors (D-014, D-015). Inside a module, and from any module down to Core, real database links are used.
- **Back-references:** a lower module may also keep an ID that a higher module hands it, only to filter and show its own records. It never reads, checks or follows that ID; anything that needs the higher record goes through a handler the higher module registers with Core. The allowed back-references: `audit.activity_log.client_id`; Core's general links to any record (module + type + ID) on tasks, files, trash, approvals and notifications; Core meetings' client and project; the services sold or payment stage an invoice bills; a change request's project.

## 2. Rules for every table

| Rule | What every table gets |
|---|---|
| Key | `id`: a time-ordered unique ID (UUID v7) made by the database function `core.uuid_v7()`, Better Auth's tables included. Section 3 gives three kinds of exception, and they keep their keys: a key that is another table's ID (`core.users.id` is `auth.user.id`; `core.user_preferences.user_id`; `core.session_state.session_id`), a key of several columns (for example the company and a name: settings, switches, languages, counters, doors, double-click keys; the permission catalogue and its grants, receipts, rate counters), and `audit.security_log`'s `bigint` (chain order). The `drizzle` schema (drizzle's own list of applied changes) and the `pgboss` schema keep their tools' own keys |
| Company | `company_id`, required, linked to `core.companies`, protected by the company filter and the **row rules** (TECH-DESIGN 5.1). Only the **system tables** below have no company row rule |
| Unique keys | Every unique key on a company table other than its own `id` includes `company_id` (PostgreSQL checks unique keys without the row rules, so a key without the company would reveal another company's value); the catalogue check in `apps/api/test/db/company-rules.test.ts` reports any that does not (TASK-0022, CR-023) |
| Who and when | `created_at`, `created_by`, `updated_at`, `updated_by` (a person, or empty for automatic work; the activity log says which automation, API key or AI did it) |
| Two people editing | `version`, a number that goes up by one on every save; a save that carries an old number is refused (NFR-021) |
| Deleting | `deleted_at`, `deleted_by` on every main record: the record goes to the 30-day trash and is hidden everywhere (CORE-093). Every database link is `ON DELETE RESTRICT`, never `CASCADE` |
| Times | `timestamptz`, stored in UTC (CORE-112); plain dates (`date`) where only the day matters, such as an effective date |
| Money | Whole paise (`bigint`, `_paise` at the end of the name) plus a `currency` code, `INR` by default (D-021) |
| Choices from a list | Fixed choices the code depends on (a status, for example) are database enums; choices the owner may change (sources, lost reasons, asset types…) are **list items in Settings** (D-017), stored by their ID |
| Readable code | Main records people talk about get a `code`, such as `CL-0042`, counted per company (`core.code_counters`); not used for invoice numbers, which follow the GST series rules (FIN-002) |
| Secrets | Sensitive fields (bank, statutory) are stored **encrypted** (`_enc`) with the master key from the environment file; **no table ever has a field for a client's or a tool's password** (RULE-025) |
| Personal fields | Each module card marks which fields are personal, so a deletion request can clear them from the activity log (3.3) |
| Search | Text fields people search on get a search index; every list can be filtered and exported (NFR-009) |

**System tables** (no company row rule): `core.companies` (the companies themselves), `core.permission_catalogue` (registered from code), `core.event_receipts`, `core.rate_counters`, `core.backup_runs`, the whole `auth` schema (Better Auth's sign-in tables, touched only by Core's sign-in and users code), the `pgboss` schema (the job queue, read only through a Core function that filters by company) and the `drizzle` schema (drizzle's list of applied database changes).

**Rows with no company** in `audit.security_log` (the system chain) and `core.error_events` are written and read only through database functions owned by the system role, which the row rules do not bind (TECH-DESIGN 5.1, 5.2). They are shown only to the platform operator: while Nexus has one company, its Owner.

**Every save** writes, in the same all-or-nothing step: the record, a row in `audit.activity_log`, and any announcement in `core.outbox` (TECH-DESIGN section 2).

## 3. Release 1 tables in full detail

Release 1 builds only Core: **32 tables in four groups, 4 of them Better Auth's own.** "PK" = key, "→" = database link.

### 3.1 Company, settings and switches

**`core.companies`** (system) — the companies using Nexus (one today: YTP; SaaS-ready, D-020)

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | Short name, e.g. "YouTooPreneur" |
| slug | text unique | Used in addresses later, e.g. `ytp` |
| status | enum active, paused | |
| created_at | timestamptz | Created only by the first-start command (TECH-DESIGN 6.8) |

**`core.company_profile_versions`** — the company profile in dated versions (CORE-010, CORE-011, SCR-181)

| Field | Type | Notes |
|---|---|---|
| id, company_id | uuid | |
| effective_from | date | The version applies from this date until the next version starts; unique per company |
| legal_name, trade_name | text | |
| business_type | enum proprietorship, partnership, llp, private_limited, other | Proprietorship now, LLP soon |
| pan | text | Checked format (10 characters) |
| gst_registered | boolean | The GST switch: from `effective_from` of the first version where it is true, invoices are GST tax invoices |
| gstin | text, empty until registered | Required when `gst_registered` is true; checked format, its state code must match `state_code` |
| address_line1, address_line2, city, pincode | text | |
| state_code | text | GST state code, `33` for Tamil Nadu |
| country | text | `IN` |
| email, phone, website | text | |
| logo_file_id | uuid → core.files | |
| note | text | Why this version was made |
| + who-and-when, version | | Versions are never edited once a document has used them; a correction is a new version |

The company's default colour (Emerald or Navy, CORE-114) is **not** part of these dated versions: it is the setting `appearance.default_colour`, shown on the same screen.

**`core.settings`** — the value of every setting (CORE-012, D-017)

| Field | Type | Notes |
|---|---|---|
| company_id + key | PK | Key such as `security.lock_after_tries` |
| module | text | Which module owns it (Core in Release 1) |
| value | jsonb | Checked against the setting's definition |
| updated_at, updated_by, version | | Every change also goes into the activity log with old and new value |

What settings exist, their type, default and help text, are defined in each module's code and listed on its module card; only the **values** live in the table. A setting with no row uses its default. As built (TASK-0024): `value` jsonb (never empty), `updated_at` `now()`, `updated_by` uuid (no link: the person table comes with TASK-0033), `version` integer starting at 1, linked to `core.companies` (`ON DELETE RESTRICT`), the company row rule; the app may read, add and change values, never delete them (a setting goes back to its default by saving the default). `defineSetting`, `getSetting` and `setSetting` are in `apps/api/src/modules/core/service/settings.ts`; a key is `<group>.<name>` in lower case and never looks like a secret; each change is in the activity log with `record_type` `setting`, `record_id` the company's ID and the key as the changed field.

**`core.feature_switches`** (CORE-015, SCR-193)

| Field | Type | Notes |
|---|---|---|
| company_id + key | PK | Key such as `module.crm`, `crm.broadcasts`, `ai.ask_nexus` |
| is_on | boolean | Checked by the backend's switch step and by the worker before a job or listener runs |
| release | smallint | The release that brings it; a switch cannot be turned on before its release is built |
| updated_at, updated_by | | Logged |

**`core.languages`** (CORE-110, SCR-192, choice 11)

| Field | Type | Notes |
|---|---|---|
| company_id + code | PK | `en`, `ta`, `hi`, `ml`, `te`; more by adding a message file |
| name, native_name | text | "Tamil", "தமிழ்" |
| checked | boolean | A native speaker's check is marked done |
| checked_by_name, checked_at | text, timestamptz | Who checked it (may be someone outside Nexus) |
| is_open | boolean | People can choose it; **can only be true when `checked` is true** (a database check) |
| is_default | boolean | English |

**`core.code_counters`** — readable codes such as `CL-0042`

| Field | Type | Notes |
|---|---|---|
| company_id + prefix | PK | `CL`, `PR`, `TK`… |
| next_value | integer | Taken inside the same save, so two people never get the same code |

### 3.2 People, sign-in and roles

**Better Auth's own tables (the `auth` schema).** Their exact columns are the ones Better Auth's command-line tool generates for the pinned version (step 2.4), with IDs set to UUID v7. They are system tables with no row rules, because they are read **before** the company is known; only Core's sign-in and users code may touch them (the wall check), using the same app account, so an Owner action on a person is one save across both schemas (TECH-DESIGN 5.1). Better Auth's settings: email and password on, sign-up off; Google on, with sign-up off and linking to an already-added person by their verified email; reset links valid 1 hour; its cookie cache and its own rate limiter off; **only the routes listed in TECH-DESIGN 6.1 open**, every other route switched off; Nexus's added fields marked so users can never set them (`input: false`).

**`auth.user`** — one row per person who can sign in

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | The same ID as `core.users.id` |
| email | text, unique (lower case) | The sign-in email; unique across Nexus (one login, one company) |
| email_verified, name, image, created_at, updated_at | | Better Auth's own fields |
| company_id | uuid | Nexus field (Better Auth "additional field", never settable by users): which company the person belongs to |
| status | enum invited, active, disabled | Nexus field, never settable by users. Invited until the first sign-in. Disabled ends everything at once (CORE-006) |
| failed_signins | smallint | Nexus field, never settable by users; reset after a good sign-in |
| locked_until | timestamptz | Nexus field, never settable by users; set after 5 wrong passwords (CORE-004) |

**`auth.account`** — how a person signs in (CORE-001)

| Field | Type | Notes |
|---|---|---|
| id, user_id | uuid | |
| provider_id | text | `google` or `credential` (email and password) |
| account_id | text | Google's ID for the person |
| password | text | Only for `credential`; scrambled by Better Auth (NFR-001). The person's own sign-in password only |
| Google's tokens | text | Stored by Better Auth; Nexus asks Google only for the email and profile and never uses them |
| created_at, updated_at | | |

**`auth.session`** — signed-in sessions

| Field | Type | Notes |
|---|---|---|
| id, user_id | uuid | |
| token | text unique | Kept as Better Auth needs it; only Core's sign-in code reads this table, and it never leaves the backend |
| expires_at, ip_address, user_agent, created_at, updated_at | | |

**`auth.verification`** — password reset links

| Field | Type | Notes |
|---|---|---|
| id, identifier, value, expires_at | | Valid 1 hour; deleted when used |

**Nexus's own tables (the `core` schema, row rules on):**

**`core.users`** — everyone who can sign in (USR-001)

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | The same ID as `auth.user.id` |
| company_id | uuid | |
| display_name | text | Also copied to Better Auth's `name` |
| photo_file_id | uuid → core.files | |
| role_id | uuid → core.roles | One role per person. The Owner is whoever has the role with key `owner`; at least one active person must always have it |
| signin_methods | text[] | `google`, `password` or both, set by the Owner; a person without `password` cannot create one through "Set or reset password" |
| manager_user_id | uuid → core.users | Reporting manager, from Release 4; written only by the Team module through Core's window; used for the "team" scope |
| switch_email_by | date | Optional: the date by which a person on a personal Gmail should move to a company address; the screen shows **Switch email** until then (CORE-008) |
| last_signin_at | timestamptz | |
| + who-and-when, version, deleted | | "Invited", "Active" and "Disabled" come from `auth.user.status`; "On leave" comes from the Team module from Release 4 and is not stored here. Deleting a person also disables them; their email stays reserved until the 30-day clean-up; only the Owner can restore them. **People are never removed**: the clean-up deletes their sign-in rows (accounts, sessions, two-step methods and codes, trusted computers) and replaces their sign-in email with `deleted+<id>@invalid`, which frees the address; this row stays, marked purged, so every who-and-when link and the activity log still name them |

**`core.user_preferences`** (SCR-008, CORE-112)

| Field | Type | Notes |
|---|---|---|
| user_id | uuid PK → core.users | |
| company_id | uuid | |
| language_code | text | Only an open language |
| colour | enum emerald, navy, or empty | Empty = the company default |
| time_zone | text | `Asia/Kolkata` by default |
| time_format | enum h12, h24 | `h12` by default (choice 4) |
| date_format | text | `DD MMM YYYY` by default |
| daily_summary_time | time | Stored now; the summary is sent from Release 9 (CC-005) |
| updated_at | | |

**`core.session_state`** — Nexus's facts about each session (CORE-003, CORE-005, CORE-002)

| Field | Type | Notes |
|---|---|---|
| session_id | uuid PK | Plain link to `auth.session.id` |
| company_id, user_id | uuid | |
| device_label | text | "Chrome on Windows", from the browser |
| last_active_at | timestamptz | Updated only by requests a person makes (automatic refreshes are checked but do not count); compared with the role's current timeout |
| two_step_passed_at | timestamptz | Empty until the second step is passed, when the role needs it or the person has set up a method |
| trusted_device_id | uuid → core.trusted_devices | When "trust this computer" skipped the code |
| two_step_failed_attempts | smallint | Wrong codes in this session (email or authenticator); at 5 the session ends |
| ended_at, end_reason | | signed out, timed out, log out everywhere, user disabled, email changed, two-step failed |

**`core.trusted_devices`** — "Trust this computer" (choice 3)

| Field | Type | Notes |
|---|---|---|
| id, company_id, user_id | uuid | |
| device_token_hash | text | The device's own token is only in its cookie |
| label | text | |
| created_at, expires_at | timestamptz | 30 days (setting) |
| revoked_at | timestamptz | Also set by "log out everywhere", disabling and an email change |

**`core.two_step_methods`** (CORE-002, SCR-002)

| Field | Type | Notes |
|---|---|---|
| id, company_id, user_id | uuid | One row per person and method |
| method | enum totp, email, whatsapp | WhatsApp only once WhatsApp sending exists (Release 9) |
| totp_secret_enc | bytea | Encrypted with the master key; only for `totp` |
| is_preferred | boolean | |
| enabled_at, last_used_at | timestamptz | |

The **first** method needs proof: a code sent to the sign-in email, or a Google sign-in within the last 5 minutes. Adding or changing a method later needs an existing method first. If a person loses their phone, the Owner resets them: their methods are deleted, every session and trusted computer ends, and they get an email. Every set-up and reset is in the security log.

**`core.two_step_codes`** — the 6-digit email codes

| Field | Type | Notes |
|---|---|---|
| id, company_id, user_id, session_id | uuid | |
| code_hash | text | Never stored in plain form |
| expires_at | timestamptz | 10 minutes |
| attempts | smallint | Counted per session in `core.session_state.two_step_failed_attempts`; at 5 the session ends |
| used_at | timestamptz | Used once |

**Who may sign in:** only people the Owner has added (`auth.user` with status invited or active). Allowing a whole email domain comes later, when YTP uses Google Workspace (TECH-DESIGN point 42), with its own table then.

**`core.roles`** (USR-002, USR-006, SCR-182)

| Field | Type | Notes |
|---|---|---|
| id, company_id | uuid | |
| key, name, description | text | Nine defaults (table below). All editable; the Owner role cannot lose its rights |
| is_default | boolean | |
| two_step_required | boolean | A setting per role (CORE-002) |
| idle_timeout_minutes | integer | A setting per role (CORE-003, choice 1) |
| phone_menu | jsonb | The phone's bottom menu buttons (CORE-113, choice 13) |
| + who-and-when, version, deleted | | A role in use cannot be deleted. Changing a role's security values applies to open sessions at once |

**Starting values of the nine roles** (made by the first-start command; all editable):

| Role | Two-step | Signed out after | Phone menu | Release 1 permissions |
|---|---|---|---|---|
| Owner | Yes | 30 minutes | Home, Tasks, Calendar, Leads, More | Every Core permission, scope all |
| LLP partner | Yes | 30 minutes | Home, Tasks, Calendar, Leads, More | Own profile only |
| Manager | Yes | 8 hours | Home, Tasks, Calendar, Leads, More | Record history: view (records they can open) |
| HR | Yes | 30 minutes | Home, Tasks, Calendar, Attendance, More | Own profile only |
| Accounts | Yes | 30 minutes | Home, Tasks, Calendar, Attendance, More | Own profile only |
| Staff | No | 8 hours | Home, Tasks, Calendar, Attendance, More | Own profile only |
| Trainer | No | 8 hours | Home, Tasks, Calendar, Attendance, More | Own profile only |
| Client contact | No | 60 minutes (reviewed in Release 14) | — (client portal) | None in Release 1 |
| Student | No | 60 minutes (reviewed in Release 18) | — (student portal) | None in Release 1 |

Everyone signed in can always open their own profile, devices and sign-out; these need no permission. Menu buttons for releases not built yet stay hidden: in Release 1 the phone menu shows Home and More, and Home is the landing page (Settings home for the Owner, My profile for everyone else).

**`core.permission_catalogue`** (system) — every action a module offers, registered by the module itself on every start, so new permissions appear without code (USR-003)

| Field | Type | Notes |
|---|---|---|
| module + action | PK | e.g. `core.trash` + `edit` |
| label | text | |
| hideable_fields | jsonb | Fields a role may hide, e.g. money fields |
| default_grants | jsonb | For each default role: the scope and hidden fields it starts with (USR-006, from the module card) |
| grants_version | smallint | Raised when the module card changes its defaults |
| release | smallint | Hidden in the role builder until its release is built |

**Release 1 permissions** (actions from view, create, edit, delete, approve, export; Owner only unless the table above says otherwise): `core.users` (view, create, edit, delete) · `core.roles` (view, create, edit, delete) · `core.security` (view, edit) · `core.settings` (view, edit) · `core.company` (view, edit) · `core.feature_switches` (view, edit) · `core.languages` (view, edit) · `core.monitoring` (view; edit = retry a job) · `core.record_history` (view) · `core.logs` (view, export) · `core.security_log` (view, export) · `core.trash` (view; edit = restore).

**`core.role_permissions`** (USR-002)

| Field | Type | Notes |
|---|---|---|
| id, company_id, role_id | uuid | |
| module, action | text | |
| scope | enum own, team, all | Which records; each module turns it into a filter on its own data (TECH-DESIGN 6.2) |
| updated_at, updated_by | | Every change is in the security log (CORE-092) |

**`core.default_grants_applied`** — so a module's default grants are given once and never undo the Owner's changes

| Field | Type | Notes |
|---|---|---|
| company_id + module + action | PK | |
| grants_version | smallint | The version already applied |
| applied_at | timestamptz | |

**`core.role_hidden_fields`** (USR-002)

| Field | Type | Notes |
|---|---|---|
| company_id, role_id, module, field | PK | e.g. Staff hides `finance.invoice.total` |

One shared backend step removes a caller's hidden fields from every API answer and from the old and new values shown in the activity log. "View as role" (USR-004) needs no table: it builds the same permission set for the chosen role, read-only, and the security log records who previewed which role.

### 3.3 Logs, trash and announcements

**`audit.activity_log`** — every change and every automatic action (CORE-090, SCR-010)

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid | |
| at | timestamptz | |
| actor_type | enum person, automation, api, mcp, ai, system | |
| actor_user_id | uuid | The person, or the person who owns the key or approved the AI action |
| actor_label | text | e.g. "Renewal check (nightly)" |
| module, record_type, record_id | text, text, uuid | |
| record_label | text | e.g. "CL-0042 Kaveri Hospitals", so the log reads well even after deletion |
| action | text | create, update, delete, restore, and module actions such as `mark_paid` |
| changes | jsonb | `{field: {old, new}}`; hidden fields stay hidden for roles that cannot see them |
| client_id | uuid, plain link | Filled when the record belongs to a client: **this builds the client timeline** (CORE-091, Release 3) without any change later |
| request_id | text | Ties together everything one click did |

Every field is required except `actor_user_id`, `actor_label`, `client_id` and `request_id`; `company_id` links to `core.companies` (`ON DELETE RESTRICT`), `at` defaults to the transaction's time and `changes` to `{}` (TASK-0017). A change to a record with no ID of its own (a setting, a feature switch, a language) is logged against the record that holds it: for a company's settings, `record_id` is the company's ID and the setting's key is the field in `changes`. Entries are written only by `writeActivity` (`apps/api/src/modules/core/repository/activity-log.ts`), in the save's own transaction. One table with indexes by record, by client, by person and by time; kept 3 years, then archived (choice 19). (Splitting it by month is not needed at YTP's size; it can be added later without changing the fields.) The app account may only **add and read** rows. **Delete on request (DPDP, NFR-010):** one database function, run only from the Owner's "deletion request" action, replaces a person's or record's personal values in `changes` and `record_label` with "[removed on request]" and writes a `data_erased` security-log entry.

**`audit.security_log`** — cannot be altered (CORE-092, SCR-195)

| Field | Type | Notes |
|---|---|---|
| id | bigint PK | |
| company_id | uuid, may be empty | Empty for events with no known company (for example a failed sign-in for an unknown email): the **system chain** |
| seq | bigint | Position in its chain (one chain per company, plus the system chain) |
| at | timestamptz | |
| event | text | signin_ok, signin_failed, account_locked, two_step_changed, two_step_reset, signin_email_changed, session_ended, permission_changed, role_viewed_as, export, sensitive_field_viewed, vault_reference_opened, api_call, setting_changed (security settings), data_erased, limit_hit (the first refused request of a limit's window, TASK-0023) |
| user_id, target_user_id | uuid | |
| record_type, record_id | text, uuid | |
| ip, user_agent | text | |
| details | jsonb | Never a password, code or key |
| prev_hash, hash | text | `hash` = SHA-256 of `prev_hash` plus the row's fields in a fixed order |

Rows are added **only** through one database function, owned by the system role: it takes a lock on the chain, reads the chain's last `hash` and `seq`, and adds the next row, so two sign-ins at the same moment never fork the chain. Nobody can change or delete rows. A nightly job checks every chain in `seq` order and shows any break on Monitoring; each chain's last hash is also written into the nightly backup record, kept off the server. Kept 8 years (choice 19).

As built (TASK-0018): `id` is an identity key and `seq` a number per chain, with one unique key on (`company_id`, `seq`) that treats the system chain as one chain; a `request_id` text column ties an entry to the activity entries of the same click; `details` defaults to `{}` and never holds a password, code, key or token (the writer hides them); the first entry's `prev_hash` is 64 zeros; `at` is the time the entry was added (`clock_timestamp()`, after the lock). The fingerprint is `audit.security_log_hash(...)`: SHA-256 of a JSON list of `prev_hash`, `company_id`, `seq`, `at` as UTC text, `event`, the people, the record, `ip`, `user_agent`, `details` and `request_id`, in that order. `audit.add_security_entry(...)` (owned by `nexus_system`, run by the app) takes the transaction's company (none: the system chain), a lock per chain held until the transaction ends (at most 5 seconds' wait), and adds the next entry; a trigger refuses every change or delete, even by the owner (only the owner account may empty the table, as the tests do). The app reads its own company's entries; the system chain is read only through the system functions (TASK-0019). The writer is `writeSecurity` (`apps/api/src/modules/core/repository/security-log.ts`); `securityWriteWithoutCompany` (`apps/api/src/db/database.ts`) writes into the system chain. A place worked out from the address ("Chennai · Chrome" on the Logs screen) is worked out when read, never stored.

**`core.trash_items`** — the Trash screen across all modules (CORE-093, SCR-011)

| Field | Type | Notes |
|---|---|---|
| id, company_id | uuid | |
| module, record_type, record_id, record_label | | |
| deleted_at, deleted_by | | |
| purge_after | timestamptz | deleted_at + 30 days |
| restored_at, restored_by | | Restore calls the **restore handler the owning module registered** with Core; Core never imports a module |
| purged_at | timestamptz | A nightly job, company by company, removes records past 30 days **only when nothing still links to them**; otherwise the record stays hidden, `purged_at` is set and Monitoring lists it. People follow the rule under `core.users`. The activity log keeps every history |

**`core.outbox`** — announcements, never lost or doubled (D-014, NFR-003)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| company_id | uuid | The worker sets this company before delivering |
| event | text | e.g. `core.user.disabled`, later `crm.deal.won` |
| event_version | smallint | |
| payload | jsonb | IDs and the facts needed, never a copy of another module's record |
| occurred_at | timestamptz | |
| published_at | timestamptz | Set by the worker once handed to listeners |
| attempts, last_error | | |
| next_attempt_at | timestamptz | When the worker may try a failed delivery again (TASK-0020) |

**`core.event_receipts`** (system) — what each listener has handled

| Field | Type | Notes |
|---|---|---|
| listener + event_id | PK | A listener never handles the same announcement twice |
| handled_at | timestamptz | |

As built (TASK-0020): `core.outbox` has `id` from `core.uuid_v7()`, `company_id` required and linked to `core.companies` (`ON DELETE RESTRICT`), `event` text, `event_version` smallint, `payload` jsonb (default `{}`), `occurred_at` and `next_attempt_at` (both default the time of the save), `published_at` (empty until delivered), `attempts` integer (default 0) and `last_error` text; an index on (`company_id`, `id`) of the rows not yet delivered; the company row rule. The app may read and add announcements and change only `published_at`, `attempts`, `last_error` and `next_attempt_at`, never what an announcement says, and deletes nothing (the first card with nightly work clears delivered rows). `core.event_receipts` has `listener` text, `event_id` uuid linked to the announcement (`ON DELETE RESTRICT`) and `handled_at` (default the time of the write), keyed by (`listener`, `event_id`); the app may only read and add receipts. Announcements are posted only by `announce` (`apps/api/src/modules/core/repository/outbox.ts`) in the save's own transaction, under the save's company; only a registered announcement, a version from 1 to 32767 and a payload object with no secret field are accepted. The worker's delivery comes with TASK-0094.

### 3.4 Files, doors, monitoring and safety

**`core.files`** — every stored file (CORE-083; Release 1 uses it for the logo and photos)

| Field | Type | Notes |
|---|---|---|
| id, company_id | uuid | |
| storage_key | text | Where it is in private storage; never shown to people |
| original_name, mime_type | text | Allowed types only (CORE-082) |
| size_bytes | bigint | 25 MB limit (setting) |
| checksum_sha256 | text | |
| purpose | enum logo, photo, attachment, import, export | |
| owner_module, owner_record_type, owner_record_id | | The record it belongs to |
| + who-and-when, deleted | | Opened only through a link valid 5 minutes, after a permission check; each download is logged |

**`core.doors`** — each outside service's connection (D-018; Release 1: email and files)

| Field | Type | Notes |
|---|---|---|
| company_id + key | PK | `email`, `files` |
| provider | text | `gmail`, `r2`, `seaweedfs` |
| status | enum not_connected, connected, error | |
| is_on | boolean | |
| settings | jsonb | Not secret: sender name, bucket name… |
| secret_enc | bytea | **Unused in Release 1:** keys come from the environment file (TECH-DESIGN 6.6). Used from Release 16, when keys are pasted on the Integrations page (CORE-120) |
| last_check_at, last_check_ok, last_error | | Shown on Monitoring |
| updated_at, updated_by | | Logged |

**`core.error_events`** — recent errors for Monitoring (CORE-140, NFR-012)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| company_id | uuid, may be empty | Errors with no company are written and read only through the system functions (section 2) |
| at | timestamptz | |
| source | enum api, worker | Frontend errors go straight to Sentry |
| message, request_id | text | No personal data or secrets |
| external_id | text | The same error in Sentry |
| resolved_at, resolved_by | | |

As built (TASK-0019): `id` defaults to `core.uuid_v7()`; `source` is the database type `core.error_source` (`api`, `worker`); `at` defaults to the time of the write. A row is added only by `core.record_error(source, message, request_id)` (owned by `nexus_system`, run by the app), under the transaction's company or with none, with the message cut to its first 2000 characters; the app may only read its own company's rows, and the system account adds and reads them. The API's error handler keeps every server error (an unexpected error, or an `AppError` of 500 or more) with `recordError` (`apps/api/src/modules/core/repository/error-events.ts`) in a short security write of its own, without making the answer wait; answers under 500 are never kept. The message is always `safeErrorMessage(error)` (`apps/api/src/shared/logging.ts`), the log's own cleaned message. The rows with no company are read only through `core.system_errors(limit)`, and the security log's system chain through `core.system_security_entries(before_seq, limit)`, both newest first, at least 1 and at most 500 rows, and both refused while Nexus has more than one company (TECH-DESIGN section 12 point 43). Marking an error resolved (TASK-0058) and the Sentry ID (TASK-0081) add their own rights; no clean-up yet.

**`core.backup_runs`** (system; NFR-007, NFR-008, AUTO-037) — written only by the backup container through its own account; the worker reads it to alert the owner

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| kind | enum nightly, before_release, manual, restore_test | |
| started_at, finished_at | timestamptz | |
| status | enum running, ok, failed | A failure alerts the owner |
| size_bytes, checksum | | |
| location | text | Where the encrypted copy is, off the server |
| security_log_heads | jsonb | Each security-log chain's last hash at backup time (3.3) |
| restore_point | timestamptz | For a restore test: the moment it restored to |
| restore_started_at, restore_finished_at | timestamptz | Proves the targets: back within 4 hours, at most 1 hour lost |
| note | text | |

**`core.idempotency_keys`** — a double click never does a thing twice (NFR-021)

| Field | Type | Notes |
|---|---|---|
| company_id + key | PK | The screen's `Idempotency-Key` |
| user_id, action | | |
| result | jsonb | The first result is returned again for a repeat |
| expires_at | timestamptz | 24 hours |

As built (TASK-0022): `key` text (the code accepts only a UUID and stores it in lower case), `user_id` uuid (no link: the person table comes with TASK-0033), `action` text (the door's `operationId`), `result` jsonb holding `{ answer }` (so an answer of `null` is kept too), `expires_at` `now() + 24 hours`, all required except `result`; linked to `core.companies` (`ON DELETE RESTRICT`); the company row rule; the app may read, add and update keys, never delete them (a nightly clean-up card gets that right).

**`core.rate_counters`** (system; NFR-020, D-124)

| Field | Type | Notes |
|---|---|---|
| bucket + window_start | PK | e.g. `signin:ip:1.2.3.4` |
| count | integer | Old windows are cleared every hour |

As built (TASK-0023): `bucket` text, `window_start` timestamptz and `count` integer, all required, keyed by (`bucket`, `window_start`); no company, no row rule and no ID of its own. The app may read, add and change counters, never delete them (the first card with nightly or hourly work adds that right and clears old windows). `hitLimit` (`apps/api/src/modules/core/repository/rate-counters.ts`) counts a request with one statement (insert, or add 1 on conflict) in a short security write with no company; the window is fixed and worked out by the database's clock; the first refused request of a window writes one `limit_hit` entry in the security log's system chain. The per-address limit (`apps/api/src/shared/address-limit.ts`) uses the bucket `signin:ip:<address>` for the sign-in and two-step doors, with the values of `ADDRESS_LIMITS`.

**Background jobs** live in pg-boss's own section of the database (`pgboss`); every job carries its `company_id`, and Monitoring reads jobs only through a Core function that filters by it (CORE-140).

## 4. The main records of every module (locked now, detailed in their release)

Each module lists its main records, what links them to other modules (always by ID, always pointing down the floors), and the release that builds each. Field lists are complete in the requirements named; the full tables are written with each release's task cards.

### 4.1 Core (later releases)

| Record | What it holds | Links | Release |
|---|---|---|---|
| Lists and list items | Every editable list: sources, lost reasons, asset types, expense categories… (D-017) | — | 2 |
| Tasks | One task list for all modules: title, assignees, priority, due, status, service tag, type (task, follow-up), recurring rule (CORE-040 to CORE-045) | Any record by module + type + ID (CORE-041) | 2 |
| Personal reminders | Category, repeat, snooze (CORE-043) | Core user | 2 |
| To-do lists and items | Nested, shared, progress (CORE-047) | Core users | 2 |
| Files: folders and versions | Client resources folders, earlier versions, previews, optional Drive copy (CORE-080 to CORE-084) | Any record | 2 |
| Notifications | Bell items, read/snoozed, preferences per person (CORE-066) | Any record | 2 |
| Approval requests | Type, amount, requester, steps, decision; delegation and limits per role or person (CORE-075, USR-005) | The record being approved | 2 |
| Search index and saved views | (CORE-100, CORE-101) | — | 2 |
| Imports and exports | Import jobs with rows, errors, dry run and undo; export jobs (CORE-102 to CORE-104) | — | 2 |
| Custom fields | Definitions and values (CORE-030) | Any module's records | 2 |
| Retention rules | Period per record type (CORE-094) | — | 2 |
| Services and templates | Capabilities, services, types, templates with stages and checklists, bundles, products, GST rate and SAC (CORE-020 to CORE-027) | — | 2 |
| Calendar accounts and booking tools | Each person's Google Calendar link and sync settings, booking links (CORE-055, CORE-057) | Core user | 16 (open point 44) |
| Webhooks | Incoming and outgoing (CORE-122) | — | 2 |
| Meetings and calendar blocks | Client and internal meetings, attendees, notes and minutes, action items, provider link (CORE-050 to CORE-056); busy blocks other modules add through Core's window (for example approved leave) | Client, project, people; action items become tasks | 5 |
| Number series | Invoice, credit note, Academy series per financial year, gap-free (CORE-013) | — | 6 |
| Messages | Sender identities and the delivery log (CORE-061, CORE-068); routing rules, templates per language, sending, test mode, replies (CORE-060, CORE-062 to CORE-065, CORE-067) | Client, contact, any record | 2 (senders, delivery log), 9 (the rest); emails to clients for invoices: open point 41 (TECH-DESIGN 12) |
| Automations | Scheduled checks and rules, every run, exactly once (CORE-070, CORE-072); the builder (CORE-071) | Any module | 9 and 16 |
| Integrations | Each door's release, as listed; where an earlier requirement's pass test needs a later door, an interim test is written beside that requirement (CORE-084, CRM-007, CORE-064, CORE-067): backup storage (INT-022) and Gmail sign-in emails (INT-001 part) 1; payment gateways (INT-005) 6; domain, SSL and uptime checks (INT-013) 7; website forms (INT-006) 11; all others 16. The door standard (CORE-121) starts in Release 1; the Integrations page and slots (CORE-120, CORE-123) come in 16 | — | 1 to 16 as listed |
| API and MCP keys | Keys with limits (CORE-130 to CORE-132) | Core user | 16 |
| AI | Providers, budgets and usage, knowledge sources, AI actions waiting for a person's OK (AI-001 onwards) | Any record | 16 |

### 4.2 CRM (floor 1)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Client** (one record for leads and clients) | Stage Lead → Client → Past, or Lost; status, company and founder details, temperature, industry, city, budget, requirement, health, NPS, tags, assigned team (CRM-001, CRM-027 to CRM-029) | — | 3 |
| Contacts | Several per client: role, phone, email, WhatsApp, language, portal access, consent (CRM-002, CRM-026) | Client; `user_id` (plain link down to the Core user) for the portal sign-in from Release 14 | 3 |
| Sources | First and last source, sub-source, campaign, referrer (CRM-004) | Client; referrer = a client or a Team person (same floor: open point 8) | 3 |
| Services of interest | (CRM-005) | Client, Core service | 3 |
| Deals | Pipeline stage, value, expected close, won/lost with reason (CRM-011, CRM-017, CRM-018); a won deal announces `crm.deal.won` | Client, services | 3 |
| Diagnoses | Questionnaire answers, notes, recommended services, free or paid (CRM-012); a paid one announces `crm.diagnosis.paid`, and Finance makes its invoice (from Release 6) | Client | 3 |
| Notes and segments | Relationship notes, tags, saved segments (CRM-023) | Client | 3 |
| Onboarding checklist | (CRM-029) | Client | 3 |
| Commissions | Per deal, case by case (CRM-025) | Deal, Team person (same floor: open point 8); paid through Finance | 3 |
| Proposals | Lines with custom prices, discounts, GST, payment stages, revision rounds, versions, acceptance (CRM-015, CRM-016) | Client, deal, Core services | 11 |
| Testimonials | Request, collect, approve (CRM-022) | Client; requested when Projects asks (PRJ-010) | 10 |
| Campaigns | Platform, service, budget, dates, cost per lead (CRM-020) | Leads | 11 |
| Broadcasts | Offers and newsletters, only to people who gave consent (CRM-026) | Contacts | 11 |

### 4.3 Team (floor 1)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Person** | Employee, freelancer, referral partner, influencer, trainer; with or without a login; status with history; code (TEAM-001, TEAM-026) | `user_id`, a plain link down to the Core user (if they sign in); keeps `core.users.manager_user_id` up to date through Core's window | 4 |
| Profile | Personal, job, bank (encrypted) and statutory details; **Aadhaar last 4 digits only** (TEAM-002, RULE-017) | Person | 4 |
| Reporting lines | Manager per person, org chart (TEAM-003) | Person | 4 |
| Probation | (TEAM-006) | Person | 4 |
| Work schedule and holidays | Office hours, Saturday allowance and choices, Tamil Nadu holidays (TEAM-010) | Person | 4 |
| Attendance days | Check in and out, work note, half day, late and overtime minutes, regularisation and WFH requests (TEAM-009, TEAM-027) | Person | 4 |
| Leave | Types, quotas, balances, requests with approval chain, comp-off (TEAM-011, TEAM-012); approved leave is added to the calendar by asking Core's window | Person; approvals through Core | 4 |
| Documents and checklists | Employee documents (restricted), document and agreement checklists (TEAM-025, TEAM-028, TEAM-029) | Person, Core files | 4 |
| Self-service change requests | (TEAM-022) | Person | 4 |
| Training and recognition | (TEAM-019, TEAM-020), on the Person screen | Person | 4 |
| Birthdays and anniversaries | From the profile (TEAM-023) | Person | 4 |
| Company assets | Laptops and so on, issued and returned (TEAM-008) | Person | 12 |
| Goals and reviews | Goals, OKRs, yearly reviews (TEAM-018) | Person | 12 |
| Joining and leaving checklists, letters, policies and acknowledgements | (TEAM-004, TEAM-005, TEAM-007) | Person | 12 |
| Hiring | Openings, applicants, stages, interviews (TEAM-021); the careers form goes live with it | Becomes a Person when hired | 12 |
| Payroll | Salary structures, monthly runs, payslips, revisions, advances, bonuses and incentives, freelancer and partner payouts (TEAM-013 to TEAM-017) | Person, attendance, leave; Finance asks Team's window for approved runs to record the payments | 13 |

### 4.4 WebCare (floor 2)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Asset** | Website, domain, hosting account, server, SSL, licence, social page, ad account…; type from a list; ownership (YTP or client account), vendor, **vendor expiry** and **vendor cost** (original currency and INR) (WEB-001, WEB-002); announces `webcare.expiry.changed` whenever the vendor expiry changes (WEB-015) | Client; provider account | 7 |
| Provider accounts | Provider, owner, recovery email, MFA status, password-manager reference (WEB-016) | Assets | 7 |
| Placements | Which site is on which hosting account, from and to dates (WEB-010) | Assets | 7 |
| Website details | Platform, DNS, versions, plugins (WEB-003) | Asset | 7 |
| Checks | Daily domain and SSL expiry checks, uptime checks (WEB-004, WEB-005) | Asset | 7 |
| Maintenance, backups, issues | Logs per website (WEB-006 to WEB-008) | Asset | 7 |
| **Password-manager references** | A link to the Vaultwarden item, its owner, last verified date. **Never a password** (WEB-009, RULE-025) | Asset, provider account, client | 7 |
| Expiry corrections | Reason and evidence; no renewal recorded (WEB-017) | Asset | 7 |
| Handovers | Checklist and handover document (WEB-012); started when Projects asks (PRJ-010) | Asset, client | 7 |
| Ad accounts | Budgets (WEB-011) | Asset, client | 7 |
| Vendor renewals | "Renew at vendor" work, created when Contracts asks after the client pays; only the vendor's confirmation moves the expiry date (WEB-014) | Asset; a Core task | 8 |

### 4.5 Finance (floor 2)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Invoice** | Plain or GST tax invoice, lines with SAC, CGST/SGST or IGST, number given only when issued, **frozen snapshot** of client and company details, status (FIN-001 to FIN-006, D-015); a paid invoice announces `finance.invoice.paid` | Client, contact, company profile version; the services sold or payment stage it bills (plain links from the module that asked) | 6 |
| Credit notes | Own series (FIN-003) | Invoice | 6 |
| Payments | Mode, reference, partial payments, advances and credits, allocations to invoices, receipts (FIN-007) | Client, invoices | 6 |
| Gateway payments | Razorpay first (FIN-008) | Payment | 6 |
| TDS records | Amount and certificate (FIN-011) | Payment, client | 6 |
| Bank accounts and UPI IDs | (FIN-020) | — | 6 |
| Exchange rates | Rate on the invoice date (FIN-018) | — | 6 |
| Accounting exports | Tally or Zoho Books (FIN-021) | — | 6 |
| Infrastructure costs | Vendor costs per asset, shared costs rebilled by placement (FIN-016) | WebCare asset and placements (same floor: open point 8) | 7 |
| Ad spend rebilling | (FIN-017) | Client, ad account | 11 |
| Vendors, vendor bills and vendor payments | Original currency and INR, split payments, approval (FIN-012, FIN-013) | WebCare asset (optional) | 13 |
| Expenses and expense claims | Category, receipt, approval (FIN-014) | Team person | 13 |
| Internal subscriptions | YTP's own tools, with a password-manager reference (FIN-015) | — | 13 |
| Commission and partner payouts | (FIN-019) | CRM commission, Team person | 13 |
| LLP partners, shares, investments, withdrawals, profit periods | Effective-dated shares, both partners approve withdrawals (FIN-025 to FIN-031) | Core user (LLP partner role) | 15 |
| Academy fee invoices | `YTA` series, instalments (FIN-024); made when the Academy asks | — | 17 |

### 4.6 Contracts & Renewals (floor 3)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Service sold** | Type, price, start date, status; from a quote or by hand (CON-001); made when a deal is won (listens to `crm.deal.won`) | Client, Core service, proposal | 8 |
| Agreements | Terms, documents, signed status, amendments and versions; or the accepted proposal is the agreement (CON-002) | Client, services sold | 8 |
| Payment stages | Any number, % or amount, tied to a stage, a date or marked by hand (CON-004) | Agreement; asks Finance's window for the invoice | 8 |
| Retainers and subscriptions | Billing timing per client, cycle (CON-003, CON-010) | Service sold | 8 |
| Free maintenance and AMC | Length, coverage, schedule, support targets (CON-005, CON-006); free maintenance starts when Projects asks (PRJ-010) | Service sold | 8 |
| **Renewals (client side)** | What the client pays and when: date, price, who pays, confirmation steps with evidence, history (CON-007 to CON-009) | Service sold, WebCare asset (listens to `webcare.expiry.changed`); asks Finance's window for the renewal invoice; listens to `finance.invoice.paid`, then asks WebCare for the "renew at vendor" work | 8 |
| Support terms | Reply and fix times (CON-014) | Client | 8 |
| Auto-renewing agreements | Notice deadline and reminders (CON-016) | Agreement | 8 |
| Revision rounds | Allowed and used (CON-011) | Agreement | 8 |
| Change requests and client input checklists | (CON-012, CON-013) | Agreement; a project (plain link from Projects) | 10 |
| Ad spend terms | (CON-015) | Client | 11 |

### 4.7 Projects (floor 4)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Project** | One-off or ongoing monthly (D-162); status, lead, members, client visibility (PRJ-001, PRJ-008, PRJ-011); made when a deal is won (listens to `crm.deal.won`) or by hand | Client, services sold, agreement | 5 |
| Stages, checklists, milestones | From the service template, editable (PRJ-002, PRJ-003) | Project, Core template | 5 |
| Deliverables | Files or links, versions, status, quality review, client approval, revision count (PRJ-005, PRJ-006) | Project, Core files | 5 |
| Discussion | Comments, internal or visible to the client (PRJ-009) | Project | 5 |
| Closure | Handover checklist; on completion it **asks** WebCare (handover), Contracts (free maintenance starts) and CRM (testimonial request) through their windows, and announces `projects.project.completed` for the Command Centre and Reports (PRJ-010) | Project | 5 |
| Content calendar posts | Platform, caption, media, date, status (PRJ-012) | Project, client | 10 |
| Support requests | Priority, assignee, deadlines from the client's terms, updates (PRJ-013) | Client, asset, project | 10 |
| Case studies | With client permission (PRJ-016) | Project | 10 |
| Client results and client reports | Figures per service; reports checked by a person (PRJ-014, PRJ-015) | Project, client | 15 |

### 4.8 Academy (above CRM, Team and Finance)

| Record | What it holds | Links | Release |
|---|---|---|---|
| **Course** | Mode, syllabus, duration, fee, fee plans, certificate rule (ACD-001, ACD-005, ACD-008) | Trainers (Team persons) | 17 |
| Batches and sessions | Schedule, capacity, meeting links (ACD-002) | Course, trainer | 17 |
| **Student** and admissions | From an Academy lead; documents (ACD-003, ACD-012) | CRM client (the lead), Core files | 17 |
| Fee instalments | (ACD-005); asks Finance's window for the `YTA` invoices | Admission | 17 |
| Session attendance, assessments and results | (ACD-006, ACD-007) | Student, session | 17 |
| Certificates | PDF with QR code and a public check page (ACD-008) | Student, course | 18 |
| Recordings | Bunny Stream video IDs, who may watch and until when (ACD-009) | Batch, session | 18 |

### 4.9 Command Centre, Reports and portals

- **Command Centre and Reports own no business data** (D-013). They read through each module's window and keep only: saved report definitions, schedules, dashboard layouts and cached figures, which can always be rebuilt (Releases 9 and 15).
- **Client portal:** a contact's portal access is on the CRM contact; the sign-in is a Core user with the Client contact role and a one-time code (CORE-007, Release 14).
- **Student portal:** the same, with the Student role (Release 18).

## 5. Main announcements between modules

Every row follows the floors (D-014): **announcements go up** (to a higher floor, or to the read-only Command Centre and Reports); **everything downward is an ask** through the lower module's window. Listeners on the same floor wait for open point 8 (Release 3). This table is the plan; each announcement is added to its module card by the card that builds it (CR-014).

| Announcement | From | Who listens | Release |
|---|---|---|---|
| `core.user.disabled` | Core | Core's own tasks (Release 2) and API keys (Release 16) | 1 |
| `crm.deal.won` | CRM (floor 1) | Finance (advance invoice draft), Contracts (services sold), Projects (project) (CRM-017) | 3, used from 5, 6 and 8 |
| `crm.diagnosis.paid` | CRM (floor 1) | Finance (the diagnosis invoice) (CRM-012) | 3, used from 6 |
| `team.leave.approved` | Team (floor 1) | Command Centre; CRM's lead assignment when the usual person is on leave (CRM-010; same floor, open point 8). The calendar block is an ask: Team asks Core's calendar window | 4 |
| `finance.invoice.paid` | Finance (floor 2) | Contracts (renewal paid; it then asks WebCare for the "renew at vendor" work) | 6, used from 8 |
| `webcare.expiry.changed` | WebCare (floor 2) | Contracts (moves the billing date) (WEB-015) | 7, used from 8 |
| `contracts.renewal.due` | Contracts (floor 3) | Command Centre (alerts). The renewal invoice is an ask: Contracts asks Finance's window | 8 |
| `projects.project.completed` | Projects (floor 4) | Command Centre and Reports only. The follow-ups (handover, free maintenance, testimonial) are asks downward (PRJ-010) | 5 |

## 6. Check: the 29 Release 1 requirements

Each requirement's pass test closes it. Where the full test needs records from a later release, Release 1 runs the **Release 1 test** below, and the full test runs again in the release that brings those records.

| Requirement | Covered by | Release 1 test (when the full test needs later records) |
|---|---|---|
| USR-001 user types, with or without login | `core.users`, `auth.user`; the Team person points down to the Core user (Release 4) | A person with a login is added and signs in; a person without a login is tested in Release 4 |
| USR-002 role builder | `core.roles`, `core.role_permissions`, `core.role_hidden_fields` | A new role with Core view-only cannot open Settings; the CRM example runs in Release 3 |
| USR-003 new permissions without code | `core.permission_catalogue`, registered by each module | A test module's permission appears in the role builder with no change to Core |
| USR-004 view as role | The permission set built for a role, read-only; logged | Viewing as Staff shows no Settings, Users and roles, Security or Logs, and every door is read-only; the invoices and salaries example runs in Releases 6 and 13 |
| USR-006 default roles | Nine roles with their starting values; default grants with `core.default_grants_applied` | The nine roles and their Release 1 values; the Staff CRM rights in Release 3 |
| CORE-001 Google or email and password | `auth.account` (`google`, `credential`) | — |
| CORE-002 two-step for money roles | `core.roles.two_step_required`, `core.two_step_methods`, `core.two_step_codes`, `core.session_state.two_step_passed_at` | An Accounts user signing in with Google, and with a password, is refused on data doors until the second step; a Staff person who set up an authenticator is asked too, one who did not is not; after 5 wrong codes (email or authenticator) the session ends and even the right code is refused |
| CORE-003 automatic logout | `core.roles.idle_timeout_minutes`, `core.session_state.last_active_at` | A timed-out session shows "timed out" in My devices and in the security log; a session making only automatic refreshes still times out |
| CORE-004 lock after wrong passwords | `auth.user.failed_signins`, `locked_until`, `core.rate_counters`, security log | — |
| CORE-005 devices, log out everywhere | `core.session_state`, `core.trusted_devices` | — |
| CORE-006 disabling a user | `auth.user.status`, sessions ended, `core.user.disabled` announced | Sessions stop at once; API keys tested in Release 16 |
| CORE-008 Google sign-in, who may sign in, change sign-in email | People added by the Owner, `core.users.signin_methods`, `core.users.switch_email_by` (the domain rule: point 42) | After an email change, the old Google account is refused, the new one signs in as the same person, and the history is kept |
| CORE-010 company profile versions | `core.company_profile_versions` | The right version is found for a date; old invoices keeping their version is tested in Release 6 |
| CORE-011 GST switch | `gst_registered`, `gstin`, `effective_from` on the versions | GST counts only from its date; invoices in Release 6 |
| CORE-012 settings with change log | `core.settings` and the activity log | — |
| CORE-014 company separation | `company_id` and row rules (section 2; TECH-DESIGN 5.1) | A second test company sees nothing of the first |
| CORE-015 feature switches | `core.feature_switches`; the switch step in the backend and the worker | A switched-off feature's door is refused |
| CORE-090 activity log | `audit.activity_log` | Changing a person's name or role shows the old and new values in Record history; the client example in Release 3 |
| CORE-092 security log | `audit.security_log`, added only through its function, one chain per company | Role changes, view-as-role and failed sign-ins are logged; the chain stays whole under parallel writes; the bank-details example in Release 4 |
| CORE-093 trash | `deleted_at` on records, `core.trash_items`, registered restore handlers | A deleted role is restored; a person who changed a setting is deleted and cleaned up, and the setting, its history and the person's name remain while their email can be added again; the client example in Release 3 |
| CORE-110 five languages, open after check | `core.languages`, one message file each | — |
| CORE-112 UTC, IST, Indian format, currency | Section 2 rules, `core.user_preferences` | A security-log entry at 10:00 IST shows 08:30 for a person set to Dubai time, and money shows as ₹1,00,000; the meeting example in Release 5 |
| CORE-113 phone, bottom menu by role | `core.roles.phone_menu` | Every Release 1 screen works at 375 px; each role's phone menu is stored and unbuilt buttons stay hidden; the Leads and Attendance example in Releases 3 and 4 |
| CORE-114 Emerald and Navy | `core.user_preferences.colour`; the setting `appearance.default_colour` | — |
| CORE-140 monitoring | Jobs through the Core function, `core.error_events`, `core.doors`, `core.backup_runs` | — |
| NFR-020 rate limits | `core.rate_counters`, settings | Its own pass test (one person's flood is slowed while others are not), plus: refused requests count too, a hit limit is logged once per window (TASK-0023) with one owner alert (the notifications card), two people on the same address are counted separately, and two parallel requests from one person do not wait on each other |
| NFR-007 backups, at most 1 hour lost, back within 4 hours | WAL-G and the backup container (TECH-DESIGN 6.5), `core.backup_runs` | A timed restore to a chosen moment |
| AUTO-037 daily backup, monthly restore test | `core.backup_runs` (nightly, restore_test) | — |
| INT-022 backup storage | The separate backup bucket | — |

**All 29 are covered.**

**Partly built in Release 1** (marked "1 (part)" in REQUIREMENTS; the rest comes later): INT-001 (only the Gmail sign-in emails), CORE-082 (private 5-minute links and the download log for the logo and photos; the virus check comes with Release 2 files), CORE-065 (test mode for team emails in development and the test copy; client messages: open point 41), CORE-121 (the door standard, used by the email and files doors).

**Groundwork laid in Release 1** (the requirement itself belongs to a later release): CC-005 (the daily summary time is stored; the summary is sent from Release 9) and CORE-091 (the client link on every activity-log entry; the timeline shows from Release 3, where a note, task or deal change appearing on it is the interim test, and the payment test runs again in Release 6).

Rules that apply to every release and start in Release 1: company separation (NFR-014), logging (NFR-002), never twice (NFR-003: `core.outbox`, `core.event_receipts`, `core.idempotency_keys`), many people at once (NFR-021: `version`), no stored client or tool passwords (RULE-025).
