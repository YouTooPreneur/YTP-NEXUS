# Lanes: careful or fast (D-196)

Every Release 1 card, in build order, with its lane. **The owner can switch any card, any group or everything, at any time**: Claude changes the lane here, and the change applies to every card that has not started (a card being built finishes in its lane). Builders never edit this file. The tracker shows the lane next to each card.

- **Careful lane:** one card per message to the builder; Claude's full review (three reviewers: the card word for word, a clean rebuild, fit for the next cards; a skeptic per finding); shown running when there is something to see. For sign-in, passwords, permissions, security, database rules, money, backups, going online, and the base set-up.
- **Fast lane:** consecutive fast cards go to the builder together, 2 to 5 per message (a batch), one save per card, in one shared copy; the batch stops at the first card that fails. Claude reviews the batch once (the automatic check on every card, the test lock, one reviewer and a skeptic) and shows it running. A fast card with no fast neighbour runs alone with the same lighter review. A careful card never goes into a batch.
- **Before every start**, Claude names the lane in one line, so the owner can switch it first.

| Card | Title | Lane | Why |
|---|---|---|---|
| TASK-0001 | Workspace root (the owner's practice task) | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0002 | Backend app with a health door | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0003 | Frontend app | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0004 | Design tokens and the first screen parts | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0005 | Shared API list and the generated client | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0006 | Development services: database, files, mail | careful (built) | Built and reviewed on 2 Nov 2026 |
| TASK-0007 | The verify command | careful | The automatic check every card must pass (being built now) |
| TASK-0008 | Code style and architecture checks | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0009 | Allowed-files check and test lock | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0010 | Shared backend steps: request context, logging, errors | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0086 | Shared backend steps: safe logs | careful | Logs must never hold a secret; added after the review of TASK-0010 (CR-010) |
| TASK-0087 | Shared backend steps: safe error messages in logs | careful | Logs must never hold a secret; added after the review of TASK-0086 (CR-011) |
| TASK-0011 | Shared backend steps: the route helper | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0012 | Contract, door and module-card checks; the Core module card | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0013 | Smoke test at computer and phone width; GitHub check run | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0088 | Root files type-checked, lint warnings as errors, every end-to-end test runs | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0089 | Tighter module-card, door and commit checks | careful | The project's base and its automatic checks: everything later relies on them |
| TASK-0090 | Services on this computer only, and reading infra/.env | careful | The development services' exposure and the backend's settings: everything later relies on them |
| TASK-0014 | Database accounts, the test database, and PostgreSQL in GitHub's check run | careful | Database foundations: company separation, logs, data safety |
| TASK-0091 | The core and audit schemas, the first database changes and the migrate command | careful | Database foundations: company separation, logs, data safety |
| TASK-0092 | The companies table and time-ordered IDs | careful | Database foundations: company separation, logs, data safety |
| TASK-0015 | Company context and row rules | careful | Database foundations: company separation, logs, data safety |
| TASK-0016 | Transaction per request and short security writes | careful | Database foundations: company separation, logs, data safety |
| TASK-0084 | Same-site check for data-changing requests | careful | Database foundations: company separation, logs, data safety |
| TASK-0017 | Activity log and its writer | fast | Records who changed what in everyday work; no sign-in or passwords; the security log (TASK-0018) stays careful (moved to fast by the owner, 13 Nov 2026, D-200) |
| TASK-0018 | Security log with chained fingerprints | careful | Database foundations: company separation, logs, data safety |
| TASK-0019 | Rows with no company: system errors and readers | careful | Database foundations: company separation, logs, data safety |
| TASK-0020 | Announcements: outbox and delivery by the worker | careful | Database foundations: company separation, logs, data safety |
| TASK-0021 | Job queue in the worker, with the company per job | careful | Database foundations: company separation, logs, data safety |
| TASK-0022 | Double-click keys | fast | Stops a double-clicked button from saving twice; a mistake shows at once in its tests (moved to fast by the owner, 13 Nov 2026, D-200) |
| TASK-0093 | Activity-log writer: refuse a missing record ID, never store a secret | fast | Two guards in one file, from Codex's extra check of TASK-0017; no database change (D-200, CR-024) |
| TASK-0023 | Rate counters and the per-address limit | careful | Database foundations: company separation, logs, data safety |
| TASK-0024 | Settings storage with change log | fast | Stores settings and their change history; who may change a setting is checked in careful cards (moved to fast by the owner, 13 Nov 2026, D-200) |
| TASK-0025 | Removing personal values on request | careful | Database foundations: company separation, logs, data safety |
| TASK-0026 | PostgreSQL image with continuous WAL-G archiving | careful | Backups and restore |
| TASK-0027 | Backup container: nightly base backup, dump and files copy | careful | Backups and restore |
| TASK-0028 | Timed restore drill | careful | Backups and restore |
| TASK-0029 | Door standard, doors table and the email door | careful | Sends emails: test mode must hold |
| TASK-0030 | Roles, permission list and default grants | careful | Sign-in, sessions, people or permissions |
| TASK-0031 | Permission check, scope and hidden fields | careful | Sign-in, sessions, people or permissions |
| TASK-0032 | Better Auth: Google, password and the open sign-in doors | careful | Sign-in, sessions, people or permissions |
| TASK-0033 | People and preferences tables; the "who is asking" step | careful | Sign-in, sessions, people or permissions |
| TASK-0034 | Session facts, idle timeout and background requests | careful | Sign-in, sessions, people or permissions |
| TASK-0035 | Per-person limit | careful | Sign-in, sessions, people or permissions |
| TASK-0036 | Lock after wrong passwords | careful | Sign-in, sessions, people or permissions |
| TASK-0037 | Two-step gate and the authenticator app | careful | Sign-in, sessions, people or permissions |
| TASK-0038 | Two-step email codes and the failed-codes rule | careful | Sign-in, sessions, people or permissions |
| TASK-0039 | Trust this computer | careful | Sign-in, sessions, people or permissions |
| TASK-0040 | Adding and inviting people (split) | careful | Sign-in, sessions, people or permissions |
| TASK-0041 | Disabling and deleting people; sign-in clean-up | careful | Sign-in, sessions, people or permissions |
| TASK-0042 | Changing a sign-in email | careful | Sign-in, sessions, people or permissions |
| TASK-0043 | My devices and log out everywhere (split) | careful | Sign-in, sessions, people or permissions |
| TASK-0044 | Role builder doors (split) | careful | Sign-in, sessions, people or permissions |
| TASK-0045 | View as role | careful | Sign-in, sessions, people or permissions |
| TASK-0046 | Who am I (`/api/core/me`) | fast | Read-only: tells the screens who is signed in; the permission rules live elsewhere |
| TASK-0047 | First-start setup command | careful | Creates the first owner account |
| TASK-0048 | Owner resets a person's two-step | careful | Sign-in, sessions, people or permissions |
| TASK-0085 | Screens' API client: background and double-click headers | fast | Adds two marks to each request from the screens; the backend makes every check (moved to fast by the owner, 13 Nov 2026, D-200) |
| TASK-0049 | Sign-in screen | careful | Handles passwords on screen |
| TASK-0050 | Two-step entry and set-up screens | careful | Handles two-step codes on screen |
| TASK-0051 | Set or reset password screens | careful | Handles passwords on screen |
| TASK-0052 | App shell: menus, top bar, phone menu, landing page (split) | fast | Menus and top bar only; every rule stays in the backend |
| TASK-0053 | Users and roles: people | fast | A screen; the people doors behind it are careful cards |
| TASK-0054 | Users and roles: role builder | fast | A screen; the role builder doors behind it are careful cards |
| TASK-0055 | View-as-role banner | fast | A banner only |
| TASK-0056 | Settings doors (split) | fast | Settings doors on top of the settings store (TASK-0024, careful) and the route helper |
| TASK-0057 | Feature switches: table, doors, backend and worker check (split) | careful | A switch that refuses doors and jobs (access control) |
| TASK-0058 | Monitoring data: jobs, retry, errors, doors, backups (split) | fast | Read-only monitoring figures |
| TASK-0059 | Logs doors: search and export (split) | careful | Searches and exports the security and activity logs |
| TASK-0060 | Backup and archive watch with owner alerts | fast | Watches the backups and alerts the owner; the backups themselves (TASK-0026 to TASK-0028) stay careful (moved to fast by the owner, 13 Nov 2026, D-200) |
| TASK-0061 | Nightly security-log chain check | careful | Proves the security log was not changed |
| TASK-0062 | Settings home screen | fast | A screen |
| TASK-0063 | Security screen | fast | A screen; the security rules themselves are in careful backend cards |
| TASK-0064 | Feature switches screen | fast | A screen |
| TASK-0065 | Monitoring screen | fast | A screen |
| TASK-0066 | Logs screen | fast | A screen |
| TASK-0067 | Languages: table, doors and message files (split) | fast | Language lists and message files |
| TASK-0068 | Company profile versions and the GST switch | careful | Company identity, GST from its date: legal and money |
| TASK-0069 | Files door and private links | careful | Private files and private links |
| TASK-0070 | Preferences doors and the default colour (split) | fast | Personal preferences (language, colour, time zone) |
| TASK-0071 | Languages screen | fast | A screen |
| TASK-0072 | Company profile screen | fast | A screen; the dated versions and the GST rule are in TASK-0068 (careful) |
| TASK-0073 | My profile screen | fast | A screen |
| TASK-0074 | Colour and language switches; Tamil font (split) | fast | Switches and a font |
| TASK-0075 | Trash: delete, restore handlers, nightly clean-up (split) | careful | Deletes for good after 30 days |
| TASK-0076 | Record history door | fast | Read-only history door |
| TASK-0077 | Trash screen | fast | A screen; deleting and restoring are in TASK-0075 (careful) |
| TASK-0078 | Record history screen | fast | A screen |
| TASK-0079 | Production containers, deploy and database changes | careful | Going online: server, address, security list |
| TASK-0080 | The free cloud machine, address and HTTPS (with the owner) | careful | Going online: server, address, security list |
| TASK-0081 | Test copy, error reporting and uptime alerts | careful | Going online: server, address, security list |
| TASK-0082 | Go-live checks: security list, restore drill, phone sign-in | careful | Going online: server, address, security list |

**Not yet built:** 42 careful, 26 fast (13 Nov 2026, after TASK-0016; the owner moved TASK-0017, TASK-0022, TASK-0024, TASK-0060 and TASK-0085 to fast, D-200). Release 1 is mostly the security base, so most of its cards are careful; later releases (screens, lists, everyday features) will have far more fast cards.

**Fast batches in Release 1, in build order** (cards that sit between careful cards run alone in the fast lane):

| Batch | Cards | What |
|---|---|---|
| Fast, alone, in turn (D-200) | TASK-0017, then TASK-0022, then TASK-0024 | Activity log, double-click keys, settings storage: each adds database changes, so each is built, checked and merged before the next starts (a batch would tie their change files together, CR-022) |
| Fast, alone | TASK-0046 | Who am I |
| Fast, alone (D-200) | TASK-0085 | Screens' API client: background and double-click headers |
| Batch A | TASK-0052 to TASK-0055 | App shell, people screen, role builder screen, view-as-role banner |
| Fast, alone | TASK-0056 | Settings doors |
| Fast, alone | TASK-0058 | Monitoring data |
| Fast, alone (D-200) | TASK-0060 | Backup and archive watch with owner alerts |
| Batch B | TASK-0062 to TASK-0066 | Settings home, security, feature switches, monitoring and logs screens |
| Fast, alone | TASK-0067 | Languages doors |
| Batch C | TASK-0070 to TASK-0074 | Preferences doors, languages, company profile, my profile screens, colour and language switches |
| Batch D | TASK-0076 to TASK-0078 | Record history door, trash and record history screens |

Cards marked (split) in the card list become several small cards when their step is written; they keep this lane.
