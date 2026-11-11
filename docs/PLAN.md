# The plan: how this project runs

YTP Nexus is YouTooPreneur's own product, so **the owner is the client**. It follows YTP's delivery method (the way of working taken from the owner's Dharsha project, D-175), adapted for an in-house product:

- the **gates are the owner's approvals**, with no payments (D-182);
- YTP Nexus keeps its own **5 phases and step numbers** (D-138), and since 2 Nov 2026 builds them in **18 small releases**, one after another (D-186, `docs/RELEASES.md`);
- the screens are computer pages plus phone pages, as built in step 1.6.

Progress is ticked in `docs/STATUS.md`. Everything shows in the tracker (D-177).

**Round 16 (1 Oct 2026):** Phase 3 ends with 3.8 Portals, Reports, API, AI · 3.9 Integrations · 3.10 Academy. Google sign-in, to-do lists, connection slots, Vaultwarden links, renewal proof and LLP partner money were added inside the steps.

## Gates (the owner's approvals)

Nothing moves to the next stage without the gate before it (D-182).

| Gate | What is approved | Who approves | When |
|---|---|---|---|
| 1 | Requirements (`REQUIREMENTS.md`) | Owner | Done, 1 Oct 2026 |
| 2 | The screens of each release, before its task cards (D-186); all 184 are drawn and checked | Owner, with the senior's review | Before each release · Release 1 approved 2 Nov 2026 |
| 3 | Each release's tech design and data model (its scope is its list in `docs/RELEASES.md`; its hours are counted with its task cards); then that release's **freeze** (D-188) | Owner | Before each release's task cards · Release 1 approved and frozen 2 Nov 2026 (D-191) |
| 4 | Each part of a release, after its two-person check | Owner + a team member (D-152) | During each release |
| 5 | Each release's go-live: used by the team, feedback fixed, then the owner closes it | Owner | End of each release |

## The 18 releases (D-186)

The full list, screen by screen, is in `docs/RELEASES.md`. Every release follows the same cycle: task cards → built by Antigravity, Codex or Claude → checked by the owner and a team member → online → used by the team for 1 to 2 weeks → feedback fixed → closed by the owner → the next release starts. A release may be split further if it turns out big. **Two lanes (D-196):** risky cards are built one at a time with a full review (careful lane); low-risk cards are built 2 to 5 at a time with one review per batch (fast lane). Each card's lane is in `docs/tasks/LANES.md`, and the owner can switch it at any time.

| # | Release | Screens | What it gives |
|---|---|---|---|
| 1 | Base and sign-in | 15 | Sign in, roles, profile, settings, security, history, languages, health checks. Goes online with a daily backup. |
| 2 | Daily tools | 13 | Tasks, to-dos, quick add, alerts, search, files, approvals, lists, import and export. |
| 3 | Clients and leads | 10 | Leads, clients, pipeline, deals, business diagnosis. |
| 4 | Team basics | 11 | People, check-in, attendance, leave, My HR. |
| 5 | Calendar, meetings and projects | 9 | Calendar, meetings, projects, deliverables, workload. |
| 6 | Billing | 15 | Invoices, payments, receipts, collections, pay links, numbering. |
| 7 | Websites and hosting | 9 | Domains, hosting, servers, expiry checks, provider accounts, handovers. |
| 8 | Services sold and renewals | 8 | Services sold, AMC, subscriptions, agreements, the renewals board. |
| 9 | Dashboards, messages and automations | 8 | The morning dashboard, My day, email and WhatsApp, automatic reminders. |
| 10 | Delivery extras | 9 | Support, change requests, client inputs, content calendar, testimonials, case studies. |
| 11 | Sales and growth | 8 | Proposals, campaigns, broadcasts, forms, ad spend. |
| 12 | Complete HR | 9 | Hiring, joining and leaving, letters, policies, assets, goals. |
| 13 | Payroll and spending | 9 | Salary, payslips, advances, payouts, vendors, expenses. |
| 14 | Client portal | 12 | Everything a client sees and does in the portal. |
| 15 | Reports and LLP partners | 10 | Reports, client results and reports, partner money. |
| 16 | AI and integrations | 11 | Ask Nexus, AI settings and limits, voice, chatbot, live chat, automation builder, integrations, API keys. |
| 17 | Academy: running it | 9 | Courses, batches, admissions, students, attendance, assessments, fees. |
| 18 | Academy: students and certificates | 9 | Student portal, certificates and the public certificate check. |

How the phases fit: **Phase 1** prepares (requirements, screens, tech design, data model, task cards); **Phase 2** is Release 1, the base; **Phase 3** runs Releases 2 to 18; **Phase 4** happens at every release's go-live (data for that release imported, checked, the team shown how to use it); **Phase 5** runs once Release 1 is online. Going online (old step 3.5) now happens with Release 1. The CA checks invoice numbering before Release 6 and the payroll rules before Release 13.

## The 5 phases

### Phase 1: Prepare

**Goal:** write the complete plan before any code is written.

| Step | What happens | Who | Output |
|---|---|---|---|
| 1.1 | Project folder, AI rulebook, status file, decisions log | Claude | `AGENTS.md`, `CLAUDE.md`, `docs/STATUS.md`, `docs/DECISIONS.md` |
| 1.2 | Combine the notes, the roadmap image and all owner answers into one **raw requirements** document | Claude → owner checks nothing is missing | `docs/RAW-REQUIREMENTS.md` |
| 1.3 | **Requirements:** every feature with an ID and a pass/fail test, business rules, quality targets | Claude → owner (**Gate 1**) | `docs/REQUIREMENTS.md` |
| 1.4 | **List of every screen** with its pattern, users, requirements and build step | Claude | `docs/SCREENS.md` |
| 1.5 | Style options built as coded screens; the owner **picks a style** | Claude → owner picks | `docs/design/DESIGN-RULES.md`, `docs/design/style/` |
| 1.6 | Design rules, **exact screen specs** and a clickable preview of **all 184 screens** in 9 batches, in build order. Each batch passes the **screen check** with 0 problems (D-181); small decisions go into the **choices list** (D-179); every design version is kept (D-180) | Claude → owner and senior review (**Gate 2**) | `docs/design/mockups/` (preview home, viewer), `docs/design/screens/BATCH-1…9.md`, `docs/CHOICES.md`, `docs/design/versions/`, review copy |
| 1.7 | Architecture, **data model for every module's main records**, module cards, tech stack locked; scope and hours estimate | Claude → owner (**Gate 3**), per release from Release 1 (D-186) | `docs/TECH-DESIGN.md`, `docs/DATA-MODEL.md`, `docs/SCOPE.md`, `docs/ESTIMATE.md` |
| Release 1 freeze | Release 1's tech design and data model approved; its screens, requirements and fields locked (D-188; recorded as D-191 on 2 Nov 2026; each later release has its own freeze) | Owner | Entry in `docs/DECISIONS.md` |
| 1.8 | Build plan, test plan and the first task cards (with tests written before any code). Release 1: the 84-card list, the test plan and the 13 cards of step 2.1 written 2 Nov 2026; each later step's cards are written in full before that step starts | Claude | `docs/tasks/`, `docs/TEST-PLAN.md`, test files, `tests/LOCK` |
| 1.9 | Private GitHub repository; Antigravity and Codex opened on this folder | Owner, with Claude's steps | Repository |

**The review loop (steps 1.2 to 1.7):**

```
Requirements → Screens → Clickable preview → Fields and data model
      ↑                                              ↓
      └────────── owner's feedback ← owner reviews ──┘
                 (repeat until the owner is happy)
                              ↓
                 FREEZE (owner says "approved")
                              ↓
                 1.8 Task cards → building starts
```

- Each round works only on the steps the feedback touches, and is numbered in `docs/STATUS.md` (D-105).
- There is no limit on the number of rounds. Nothing is built before that release's freeze (D-105 as changed by D-186).

**Finished when:** the Release 1 freeze is recorded and the tools are connected.

### Phase 2: Foundation

**Goal:** build the base every module stands on.

| Step | What happens | Who | Output |
|---|---|---|---|
| 2.1 | Set-up: the repository, the React and Express apps (TypeScript), the shared contract, Docker and Caddy, the **verify command** and every check, then the shared backend steps. No application code before verify exists. **Practice task:** the owner runs the first small set-up card with Antigravity | Builder on each card (D-185); the owner for the practice task | Verify is green; first task log |
| 2.2 | Database: schemas, database accounts, row rules and company context, the logs, the outbox | Builder on each card | Database tests green |
| 2.3 | Backup: continuous encrypted backup off the server, with a timed restore | Builder on each card | Restore tested |
| 2.4 | Sign-in (Google or email and password, two-step), roles and the role builder, the first-start command | Builder on each card | Login works |
| 2.5 | Settings, feature switches, announcements delivered by the worker, Monitoring and Logs (the automation engine comes in Release 9) | Builder on each card | Working core |
| 2.6 | Languages, company profile with dated versions, My profile | Builder on each card | Languages and company details |
| 2.7 | One complete **example feature** (Trash and record history), backend and frontend, the pattern executors copy | Builder on each card | Reference feature |
| 2.8 | Online: the server, the address, the test copy, alerts; the team uses Release 1 for 1 to 2 weeks | Builder on each card; the owner closes it | Release 1 online |

The steps match `docs/TECH-DESIGN.md` section 10.

**Finished when:** login works, verify is green, the backup has been restored in a test, the practice task succeeded and the owner has closed Release 1.

### Phase 3: Build modules

**Goal:** build every module, one at a time.

**The same loop for every module:**

1. Claude writes the module's small task cards.
2. The card names its builder: Antigravity, Codex or Claude (Claude only in a separate building session, D-185). The owner gives the card to that builder.
3. The executor builds, verifies and debugs (max 5 tries) and writes its log and proof, or marks the task BLOCKED.
4. A **different** session or model reviews it against the card: PASS or FAIL. Reviewers never fix.
5. Next card, until the module is complete.
6. End of module: **two-person check** (owner + a team member click through it, D-152), then the owner approves (**Gate 4**) and the next module starts.

| Step | Module | Includes |
|---|---|---|
| 3.1 | Core | Tasks and to-do lists, messaging (WhatsApp through AiSensy, in test mode), files, import and export, service catalogue and templates, approvals, settings, a ready slot for every future connection · **AI base:** connection, limits, guardrails, usage, knowledge, quality and the Ask Nexus chat |
| 3.2 | CRM + Team | Clients, leads, pipeline, diagnosis · staff, attendance, leave, hiring, employee self-service (with the Agency OS fields) |
| 3.3 | WebCare + Finance | Websites, password-manager links (Vaultwarden), renewal proof, shared hosting, expiry checks · invoices, payments, UPI QR, Razorpay, LLP partner money |
| 3.4 | Contracts & Renewals + Command Centre | Services, AMC, renewals, automations, dashboard, morning email |
| 3.5 | **Move online** | Choose a server, set up Vaultwarden on it; the team starts using the core |
| 3.6 | Projects + meetings and calendar | Workflows, approvals, content calendar, support requests · meetings, notes, central calendar · WhatsApp leads in automatically |
| 3.7 | Sales + Payroll | Proposals, commissions, salary, payslips, bonuses, payouts |
| 3.8 | Portals, Reports, API, AI | Client portal, reports, API and MCP, voice assistant, client chatbot (WhatsApp and website) and live chat inbox, automation builder |
| 3.9 | Integrations | Each connection built in its ready slot when the account exists; keys added then |
| 3.10 | Academy | Courses, batches, fees, instalments, recordings (Bunny Stream), student portal (last, no rush) |

**If the Academy starts before 3.10:** it runs on simple tools (a Google Form and Sheet, one numbered YTA invoice template, a UPI or Razorpay link, Google Meet, a WhatsApp group), and its data is imported at 3.10 (ACD-014).

**Task size (every card):** one screen, endpoint, component or database change · about 2–4 hours · about 200 changed lines (tests not counted) · 1–3 files (D-091) · 1–3 acceptance criteria. Bigger → split. **Each card is a backend card or a frontend card** (D-187); a feature's backend card (API, rules, tests) comes before its frontend card (screen). Only the **set-up cards** of step 2.1 may cover both parts and more than 3 files; each lists every allowed file. A **backend card** covers one API door inside one module folder (its contract entry, route, handler, service, repository, table and database change, and its module-card line), about 200 changed lines, every file listed (D-091 as changed by D-187). The **shared backend cards** of step 2.2 (services, settings, database accounts and changes, transactions, logs, queues) have no door; each lists every file, may have more than 3, and still stays about 200 changed lines (CR-017). **When a pass test needs records from a later release**, the card uses the interim test written beside the requirement, and the full test is run again, and recorded in STATUS, in the release that brings those records.

**Finished when:** every requirement is marked built and tested.

### Phase 4: Launch

**Goal:** go live safely.

| Step | What happens | Who | Output |
|---|---|---|---|
| 4.1 | Gather scattered data with Claude's Excel templates (for websites, just type the domain names) | Owner | Filled templates |
| 4.2 | Import the data; counts and money totals must match | Claude + owner | Import report |
| 4.3 | Full testing: every automation, speed with 300 clients, security, backup restore | Claude | Test report |
| 4.4 | Check GST invoices and payroll rules with the CA | Owner | CA's written OK |
| 4.5 | Train the team with short guides for each role | Claude (guides) + owner | Guides |
| 4.6 | Go live, and use Nexus alongside WhatsApp for 2–4 weeks | Owner + team | **Gate 5** |
| 4.7 | Handover: every account in YTP's name, keys and logins in Vaultwarden, owner signs off | Owner + Claude | Sign-off |

**Finished when:** the team uses Nexus daily, with no serious problems for 2 weeks.

### Phase 5: After launch

**Goal:** keep it healthy and keep improving.

| How often | What |
|---|---|
| Daily | Backups copied off the server and monitoring run automatically; alerts if something fails |
| Weekly | Look at the list of new ideas and problems |
| Monthly | Test a backup restore, apply security updates (including Vaultwarden, with its restore test), check the 4 success numbers |
| Every 3 months | Review who has access to what |
| Any time | Add keys for new services; create new roles or languages in Settings |

**A new idea:** goes into `docs/CHANGES.md` → Claude sizes it → the owner approves → task cards → build → test → live.

## Rules that apply all the time

1. **Two-person check:** at the end of every step, the owner and a team member click through the result (D-152). Nobody approves their own work, and Claude never approves on the owner's behalf.
2. **Build only the step named on the card.** Never start work from a later step.
3. **Changes never interrupt a task in progress.** Before the freeze, changes go into the review rounds. After it, small tweaks seen at demos (labels, wording, colours, field order) are included and logged; new fields, features or flows go into `docs/CHANGES.md` (CR-001…), sized Small (under 1 day), Medium (1–10 days) or Large (touches the architecture or core flows), and wait for the owner's written approval.
4. **One change updates everything it touches:** requirement, screen, preview and data model together.
5. **Every review round is numbered** in `docs/STATUS.md`: date, what was reviewed, the feedback, what changed.
6. **Decisions are locked** in `docs/DECISIONS.md`. An AI that disagrees writes its question in its task log (the planner copies it into `docs/QUESTIONS.md`) and stops; only the owner unlocks a decision.
7. **Small choices are listed, not hidden:** every small decision Claude makes while building goes into `docs/CHOICES.md`; the owner answers in one line (D-179).
8. **Check before showing:** the screen check passes with 0 problems, then Claude looks at the pictures itself (D-181). Every design version is kept (D-180).
9. **Everything is in the folder and in the tracker:** the conversation saves itself after every reply, every document has a Word copy for WhatsApp (D-176, D-177, D-178).
10. **Safety:** test mode during development (no message ever reaches a real client); Nexus never stores client or tool passwords (Vaultwarden links only); Aadhaar shows the last 4 digits only; builders make one commit per finished task card (D-189); no other git commit unless the owner asks.
11. **Session routine (Claude):** start by reading Resume here and the decisions; end by updating them, rebuilding the tracker and the Word copies (`CLAUDE.md`, `docs/HANDOVER.md` section 7).

## Standard page layouts

Every screen is built from one of the patterns in `docs/SCREENS.md`: list · detail · form · board · calendar · dashboard · document (PDF) · wizard · dialog · portal page · phone quick screen.
