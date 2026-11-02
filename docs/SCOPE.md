# Scope

**Since 2 Nov 2026 Nexus is built in 18 small releases (D-186, `docs/RELEASES.md`).** This draft is reorganised release by release at step 1.7.

**Draft, 21 Oct 2026 (step 1.7).** Under D-188, each release's **Gate 3** approves its tech design and data model; its scope is its list in `docs/RELEASES.md`, its hours are counted with its task cards, and then that release is frozen. This document stays as the whole-project view. Until the freeze, changes come through numbered review rounds. After it, they go into `docs/CHANGES.md` (D-105).

## 1. Summary

YTP Nexus is YouTooPreneur's own app, built fresh (D-001) and with no deadline (D-002).
- **Shape:** one app with one login and one database, split into **7 modules** (CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy). They sit on a shared **Core**, with the Command Centre, Reports and AI on top (D-010 to D-013, `AGENTS.md`).
- **Who uses it:** YTP's 16+ staff, 100–300 clients and their 100–300 websites (RAW-REQUIREMENTS section 8), plus 50–200 Academy students. Nexus must handle 100 people at the same time (D-125).
- **Size:** 359 requirements with a build step (2 of them quality targets) and 184 screens. On top of these, 28 business rules and 23 more quality targets apply everywhere.
- **Everything is in scope.** The owner said "don't put anything later" (D-003): the build steps only set the order. There is no "phase 2" bucket.

The rules below hold everywhere:
- **Test mode during development:** no message ever reaches a real client (RULE-021, CORE-065, D-102).
- **No client or tool passwords in Nexus:** Vaultwarden links only (RULE-025, D-140).
- **Aadhaar:** last 4 digits only (RULE-017).
- **Doors:** every outside service connects through a door in Core, and each one has a ready slot (D-018, CORE-123).
- **Settings, not code:** everything the owner might change is a setting (D-017, NFR-018).
- **Free as much as possible:** paid only for the video platform and anything the owner approves (D-032, NFR-016).

The tech stack is only proposed (D-022), and the data model is only a starting list in the tech design draft; both are **to decide in step 1.7** (D-106, D-147). **Since 2 Nov 2026** both are written for Release 1 and wait for Gate 3: the tech design v0.3 (a React frontend and an Express backend, both TypeScript, D-187) and `docs/DATA-MODEL.md` v0.2. Under D-188 each release's scope is its list in `docs/RELEASES.md`. **Both were approved on 2 Nov 2026 and Release 1 is frozen (D-191).**

## 2. In scope, by build step

Order and contents follow `docs/PLAN.md`. Requirement IDs are in brackets so task cards can trace them.

| Step | Modules | Main things it delivers | Requirements | Screens |
|---|---|---|---|---|
| **Phase 2** Foundation (2.1–2.8) | Core base | **Setup:** project skeleton, verify command and architecture guards; one example feature for executors to copy; the owner's practice task with Antigravity. **Data:** database, plus a daily backup copied off the computer with a monthly restore test (AUTO-037, INT-022). **Login:** Google sign-in or email, two-step login for money roles, auto logout, lockout (CORE-001 to CORE-006, CORE-008); role builder, default roles, view as role and approval limits (USR-001 to USR-006). **Company and settings:** company profile, GST switch, number series, company ID on every record, feature switches and settings (CORE-010 to CORE-015). **Engine and logs:** automation engine (CORE-070, CORE-072); activity log, security log and 30-day trash (CORE-090 to CORE-093). **Screens:** 5 languages, Indian time and number formats, phone browser, the mixed style in Emerald and Navy (CORE-110, CORE-112 to CORE-114). **Monitoring screen** (CORE-140) | 32 | 16 |
| **3.1** Core | Core + AI base | **Services:** service catalogue and templates (CORE-020 to CORE-027); custom fields (CORE-030). **Tasks:** tasks, follow-ups, reminders, to-do lists and workload (CORE-040 to CORE-047). **Messages:** in-app, email and WhatsApp through AiSensy in test mode, each client in their own language (CORE-060 to CORE-066, CORE-068, CORE-111, INT-001, INT-003); late task reminders (AUTO-011). **Approvals:** approval inbox (CORE-075). **Files and data:** files in private storage (CORE-080 to CORE-083); search, import with undo, export (CORE-100 to CORE-103). **Connections:** integrations page, door standard and a **ready slot for every connection** (CORE-120, CORE-121, CORE-123). **AI base:** providers with fallback, limits, guardrails, knowledge, safety, quality and the Ask Nexus chat (AI-001 to AI-009, AI-011 to AI-018, INT-019, NFR-024, NFR-025) | 61 | 22 |
| **3.2** CRM + Team | M1, M6 | **CRM:** one record for leads and clients, contacts, client 360° profile, sources, quick add, duplicates and merge, scoring, assignment, pipeline, business diagnosis, lost reasons, client status (CRM-001 to CRM-013 except CRM-007; CRM-018, CRM-023, CRM-027, CRM-028). **Team:** people and profiles (Aadhaar last 4 only, restricted bank details), org chart, joining and leaving, letters, probation, policies, assets, attendance (check-in plus a one-line note), work schedule, leave and comp-off, hiring, goals, training, recognition, self-service, documents (TEAM-001 to TEAM-012, TEAM-018 to TEAM-029). **Alerts:** lead and HR alerts (AUTO-014, AUTO-015, AUTO-033) | 43 | 31 |
| **3.3** WebCare + Finance | M4, M5 | **WebCare:** all client digital assets, ownership, daily domain and SSL expiry checks, Vaultwarden links, shared hosting, provider accounts, handover, technical dossiers, renewal proof and expiry correction (WEB-001 to WEB-017 except WEB-005 and WEB-015; INT-013, INT-020, CORE-104). **Finance:** invoices (plain now, GST later), consecutive numbers, credit notes, recurring invoices, payments, UPI QR, Razorpay, collections and reminders, TDS, vendors and bills, expenses, YTP's own subscriptions, multi-currency (FIN-001 to FIN-022 except FIN-006, FIN-017, FIN-019 and FIN-021; INT-005, CRM-024). **LLP partner money:** shares, investments, withdrawals approved by both partners, statements, quarterly profit (FIN-025 to FIN-031). **Automations:** payment reminders, escalation, receipts, vendor renewal tasks, expiry checks (AUTO-004 to AUTO-008, AUTO-029, AUTO-034) | 52 | 32 |
| **3.4** Contracts & Renewals + Command Centre | M2, Command Centre | **Contracts:** services sold, agreements, retainers, payment stages, free maintenance, AMC, client-side renewals with evidence before an expiry date moves, subscriptions and products, ad spend terms (CON-001 to CON-010, CON-015, CON-016, FIN-006, FIN-017, WEB-015). **Command Centre:** founder dashboard with the 4 success measures, risks, daily summary for everyone, My day, dashboards by role (CC-001 to CC-005, CC-007 to CC-009). **Automations:** renewal and billing (AUTO-001 to AUTO-003, AUTO-009, AUTO-010, AUTO-012, AUTO-021, AUTO-028) | 31 | 14 |
| **3.5** Move online | (no module) | Choose a server and set up Vaultwarden on it; the team starts using the core (D-030, D-031, D-140). The move itself must take one documented step (NFR-015). From here the online targets apply: uptime, the 1-hour / 4-hour backup limits and point-in-time restore (NFR-006, NFR-007, NFR-008) | 0 | 0 |
| **3.6** Projects + meetings and calendar | M3, Core meetings | **Projects:** projects from won deals, workflows from service templates, milestones, deliverables with client approval, quality check, monthly services as ongoing projects, content calendar, support requests, case studies (PRJ-001 to PRJ-013, PRJ-016). **Per-client terms:** revisions, change requests, client inputs, support terms (CON-011 to CON-014). **Meetings:** meetings, AI minutes from notes or from a recording everyone agreed to, central calendar, meeting links for Google Meet, Zoom or Teams (made automatically once a person connects their account, or pasted by hand), who may schedule and assign (CORE-050 to CORE-054, CORE-056, CRM-014, INT-011). **Leads and testimonials:** WhatsApp leads in automatically (CRM-030, CRM-007); testimonials (CRM-022). **Automations:** AUTO-017 to AUTO-020, AUTO-022, AUTO-026, AUTO-027, AUTO-035 | 37 | 17 |
| **3.7** Sales + Payroll | M1, M6, M5 | **Sales:** proposals drafted by AI and priced by a person, acceptance by button, e-signature or manual mark, deal-won set-up, upsell ideas shown to the owner first (nothing reaches the client until the owner confirms), campaigns, forecast, commissions, relationship health and NPS, onboarding checklist, broadcasts only to people who agreed and only after the owner's OK (CRM-015 to CRM-017, CRM-019 to CRM-021, CRM-025, CRM-026, CRM-029, FIN-019, FIN-023). **Payroll:** salary structures, payslips with the salary breakdown, PF, ESI and professional tax ready but switched off, revisions, advances, bonuses, freelancer payouts (TEAM-013 to TEAM-017). **Automations:** AUTO-016, AUTO-023, AUTO-036, AUTO-040 | 20 | 11 |
| **3.8** Portals, Reports, API, AI | Client portal, Reports, Core | **Client portal:** one-time code login, each contact sees only their own company: invoices and paying, services and renewals, projects and approvals, support, uploads, proposals, content approvals, documents from YTP, company profile (POR-001 to POR-009, POR-011 to POR-013, CORE-007). **Reports:** every report, the weekly and monthly business reports, client results, and client reports, which a person always checks before they go out (D-170) (RPT-001 to RPT-012, CC-006, PRJ-014, PRJ-015, PRJ-017, AUTO-024, AUTO-025). **API and connections:** public API, API keys, MCP server, webhooks (CORE-122, CORE-130 to CORE-132, INT-021). **Automation builder** (CORE-071). **Data retention** (CORE-094, AUTO-039). **Voice and chat:** voice assistant (AI-010, INT-024); client chatbot on WhatsApp and the website, with a live chat inbox and strict limits (AI-019, AI-020) | 43 | 22 |
| **3.9** Integrations | Core doors | Each connection is built in its ready slot when its account exists (section 3): email receiving, browser push, website forms, Meta, Google Ads, LinkedIn, YouTube, Google Business Profile, Calendly, Google Calendar sync, Google Drive, Tally and Zoho Books export, Search Console and Analytics, e-signature, job portals, Google Chat alerts, uptime monitoring, new leads from these doors, key and connection health checks (INT-002, INT-004, INT-006 to INT-010, INT-012, INT-014 to INT-016, INT-018, INT-023, CORE-055, CORE-057, CORE-067, CORE-084, WEB-005, FIN-021, AUTO-013, AUTO-038) | 21 | 1 |
| **3.10** Academy | M7 | Courses, batches, admissions, trainers, fee plans per course (full or instalments, no late fees), attendance, assessments, certificates with a QR code and a public check page (cancelling needs a reason and the Owner's approval, choice 89, 22 Oct), recordings on Bunny Stream of online classes and classroom workshops (open 12 months after the course ends, set per course; choice 91, 22 Oct), student portal, YTA fee invoices, Academy data import (ACD-001 to ACD-014, FIN-024, AUTO-030 to AUTO-032, INT-017). If the Academy starts earlier, it runs on simple tools until this step (D-149, ACD-014) | 19 | 18 |
| **Total** | | | **359** | **184** |

**Requirements split over two steps.** Each one is counted once, under the first step named, and finished in the later step:

| Requirement | Starts | Finished in |
|---|---|---|
| AI-002, AI-003, AI-009 (AI helpers) | 3.1 | Each module's own step |
| AI-007 (lead scoring suggestions) | 3.1 | 3.2 |
| CRM-007 (other lead sources) | 3.6 | 3.9 |
| INT-003 (other WhatsApp providers), INT-005 (other gateways), INT-011 (Google Calendar sync, CORE-057), INT-013 (uptime) | 3.1, 3.3 or 3.6 | 3.9 |
| NFR-025 (AI with many people at once) | 3.1 | 3.8 |
| CORE-007 (one-time code login for students) | 3.8 | 3.10 |

**How the counts were made** (21 Oct 2026):
- **Requirements:** every row in the requirement tables of `docs/REQUIREMENTS.md` (sections 1–17), sorted by its Build column. NFR-024 and NFR-025 are counted too, because they are the only quality targets with a build step.
- **Not counted:**
  - the 28 business rules and the other 23 quality targets, because they apply to every step;
  - POR-010, which is retired.
- **Screens:** the Build column of `docs/SCREENS.md`, giving 184 active screens. The retired SCR-092 and SCR-209 are left out. Step 3.9's one screen is SCR-234 (website enquiry and careers forms); it was built in batch 8.

**After the build:**
- **Phase 4** (launch) is part of the project: gather and import the data, full testing, the CA check, training guides, go-live alongside WhatsApp, and the handover.
- **Phase 5** is the ongoing upkeep after launch: backups, monitoring, security updates and access reviews. A new idea goes into `docs/CHANGES.md`, is sized, and waits for the owner's approval before it is built (`docs/PLAN.md`).

## 3. Waiting on an account or person

**Connections.** Every planned connection has a ready slot from step 3.1 (CORE-123, D-018). The slot is a card marked "Planned", a short spec and the standard door. The door is built when the account exists (or right before it is needed), then switched on by pasting keys and pressing Test. Nexus keeps working when any connection is down (REQUIREMENTS section 17).

**Accounts needed before step 3.9:**

| Connection | Waiting on | When | IDs |
|---|---|---|---|
| Google sign-in | A one-time Google project set-up (free) | 2.4 | CORE-008, D-143 |
| Backup storage | A free cloud storage or Google Drive account | 2.3 | INT-022, AUTO-037, D-032 |
| AI providers | Provider keys and a monthly AI amount the Owner types (no fixed levels; top up any time, choice 20, 22 Oct); AI stays off until an amount is entered | 3.1 | INT-019, AI-006, RULE-020 |
| WhatsApp through AiSensy | The AiSensy account (in use today) and approved templates | 3.1, in test mode | INT-003, CORE-064, D-154 |
| Email | Gmail now; the youtoopreneur.com mailbox once it is active | 3.1 | INT-001, D-080, D-095, D-102 |
| Razorpay | A Razorpay account and keys (YTP has no gateway yet) | 3.3 (clients), 3.10 (Academy) | FIN-008, INT-005, D-045 |
| Server | The owner chooses one: free cloud, paid server or existing hosting | Before 3.5 | D-030, D-031 |
| Vaultwarden | The server; a free Bitwarden cloud account can hold passwords until then | 3.5 | D-140, RULE-025, INT-020 |
| Meeting accounts | Each staff member connects their own Google Meet, Zoom or Teams account; links can also be pasted by hand | 3.6 | CORE-054, INT-011 |
| Speech services | A speech provider account (for example Google, OpenAI or Sarvam AI) | 3.8 | INT-024 |
| Bunny Stream | A paid account (the agreed exception to "free first") | 3.10 | INT-017, D-118 |

**Connections built in step 3.9** (each when its account exists):

| Connection | IDs |
|---|---|
| Email receiving (Gmail or IMAP) | INT-002, CORE-067 |
| Browser push (added when needed, CORE-060) | INT-004 |
| Website enquiry and careers forms on the YTP site | INT-006 |
| Meta: lead ads, Instagram, Facebook | INT-007 |
| Google Ads | INT-008 |
| LinkedIn, YouTube, Google Business Profile | INT-009 |
| Calendly and similar booking tools | INT-010, CORE-055 |
| Google Calendar sync (meeting links already work from step 3.6, CORE-054) | INT-011, CORE-057 |
| Google Drive copies | INT-012, CORE-084 |
| Uptime monitoring | INT-013, WEB-005 |
| Tally or Zoho Books export | INT-014, FIN-021 |
| Google Search Console and Analytics | INT-015 |
| E-signature service | INT-016 |
| Job portals: Naukri, LinkedIn, Indeed | INT-018 |
| Google Chat alerts (may need company Google Workspace accounts) | INT-023 |
| More WhatsApp providers: Meta Cloud API, Interakt, Wati, Gupshup | INT-003 |
| More payment gateways: Stripe, Instamojo, Cashfree, PayU | INT-005 |

**People:**

| Waiting on | For what | When |
|---|---|---|
| **CA** | Invoice number format (RULE-003, D-042); GST for foreign clients (RULE-002); the salary split (D-164); PF, ESI and professional tax, which stay switched off until then (RULE-016, D-165); LLP profit, which stays provisional (FIN-031); the overtime rate (Choices #71); how long invoices are kept (Choices #19) | Step 4.4, before go-live |
| **LLP details** | The second partner's name, the agreed shares and the agreement date. The screens use "Partner 2" with a 60/40 split as a placeholder | Entered in Nexus at step 3.3 (FIN-025, FIN-026, RULE-026, D-145) |
| **GST registration** | The registration date, so GST invoices start from it; until then invoices are plain | Any time (CORE-011, D-041) |
| **Tamil speaker** | Check the Tamil screens and templates. Hindi, Malayalam and Telugu are also drafts waiting for a native speaker. Each language opens to users only after its check (choice 11, 22 Oct) | Before go-live (Tamil); the others before they are opened |
| **Senior** | Review comments on the 184 screens (the Excel comment sheet) | Gate 2 |
| **Owner** | One approval of all 184 screens (D-153); one-line answers to the choices list (`docs/CHOICES.md`, D-179) | Step 1.6 |
| **Trainer** | The real trainer's name (the sample is "Nandhini K") | When known; needed by step 3.10 |
| **Team member** | The two-person check at the end of each step (D-152) | End of 2.8 and of each step 3.1–3.10 |

## 4. Not in scope

Only what the documents explicitly leave out:

| Not built | Instead | Where decided |
|---|---|---|
| Native phone apps | Every screen works in the phone browser | D-033, CORE-113, REQUIREMENTS Appendix C |
| Time tracking | Attendance check-in plus a one-line work note | D-075, D-072, RAW-REQUIREMENTS section 8 |
| Internal chat | Google Chat, plus comments with @mentions on tasks and projects; Google Chat alerts come through INT-023 | RULE-028, D-144 |
| Touching, deploying, checking or reusing Agency OS | Its screenshots are used only as a feature list; no checks or changes on the old system. Data is gathered with the Excel templates at step 4.1; if any Agency OS data is ever imported, RULE-027 applies | D-148, D-001, D-144, ROUND-16-CHANGE-LIST sections 1 and 11 |
| Agency OS "Workspaces" and its end-of-day handoff note | Not needed, because Agency OS is closing; the one-line check-in note stays | ROUND-16-CHANGE-LIST sections 9 and 11, REQUIREMENTS Appendix C |
| Storing or revealing client or tool passwords; clients revealing logins in the portal | Vaultwarden links only; clients get logins through the vault's secure share | RULE-025, D-140; D-067, D-131, POR-010, SCR-092, SCR-209 retired |
| Importing passwords or full Aadhaar numbers | Aadhaar last 4 digits only; document copies masked | RULE-027, RULE-017 |
| White-label and SaaS billing (selling Nexus to other agencies) | Nexus is only made ready: a company ID on every record, with companies kept apart centrally | REQUIREMENTS Appendix C, D-020, CORE-014, NFR-014 |
| A phone-call voice agent | The voice assistant inside Nexus (press to talk) | D-155 |
| Unofficial WhatsApp automation tools | Official providers (AiSensy first) or one-tap sending | D-081, CORE-064 |
| Late fees (client invoices and Academy fees) | Reminders only | RULE-008, D-112, D-173 |
| Pausing a client's service automatically for non-payment | Nexus alerts the owner, who decides | D-046 |
| A separate LLP compliance module | LLP partner money inside Finance | D-145, FIN-031 |
| Automatic publishing of case studies to the YTP website | A public link plus ready-to-paste text and pictures; automatic publishing can be added later as a door | D-163 |
| A full dark theme | One mixed style in Emerald or Navy | D-134 |

## 5. Quality targets

These apply to every step. Each is done only when its "pass when" test passes (REQUIREMENTS section 19).

| Area | Target | Pass when | ID |
|---|---|---|---|
| Users at once | 100 people at the same time (staff, clients, students); 5,000 clients, 50,000 invoices, 200 students; grows by adding server power | A load test with 100 people keeps pages and search under 1 second | NFR-005, D-125 |
| Feels fast | Every click reacts within 0.1 seconds; long jobs run in the background with a progress bar | Main screens open in under 2 seconds on a mid-range phone on 4G; a 1,000-row import shows progress while the person keeps working | NFR-023 |
| Many people, no mix-ups | No double actions, no silent overwrites, numbers never repeat | 20 people issuing invoices in the same second get 20 unique numbers in order; a double-clicked payment is recorded once | NFR-021 |
| AI speed | Answers stream; first words in about 2 seconds | The first words of an Ask Nexus answer appear within 2 seconds in the speed test | NFR-024 |
| AI with many people | At most 2 AI jobs at once per person | 30 staff chats and 20 chatbot chats at once do not slow normal screens | NFR-025 |
| Uptime | 99.5% once online (from step 3.5) | A month of uptime monitoring shows at least 99.5% | NFR-006 |
| Monitoring | Errors raise alerts automatically | A forced error raises an alert | NFR-012 |
| Backups | Daily, copied off the computer, kept 30 days; once online, at most 1 hour of data lost and back within 4 hours; restore tested every month | A timed restore drill succeeds within 4 hours | NFR-007, AUTO-037 |
| Undo and recovery | 30-day trash, import undo, point-in-time restore once online, locked backups | A deleted record and a bad import are both undone in a test | NFR-008 |
| Data protection (India's DPDP Act) | Consent, purpose, deletion on request, breach response; CERT-In incident report within 6 hours; retention periods set in Settings, with a review before any clean-up | A deletion request is carried out and logged | NFR-010, CORE-094, D-130 |
| Portal privacy | Clients and students see only their own records | Tests as two clients and two students prove none can see another's records; portal totals equal the invoices | NFR-022, D-146 |
| Ready for other companies | Companies are kept apart centrally | A second test company can never see the first one's data | NFR-014 |
| Security | HTTPS, scrambled passwords, two-step login for money roles, access by role, auto logout, sensitive fields encrypted, no client or tool passwords, secret links, checked against OWASP ASVS | A security scan finds no high-risk issues before go-live | NFR-001 |
| Everything logged | Activity and security logs | Every test action appears in the right log | NFR-002 |
| Rate limits | All limits are settings. Login locks after 5 wrong tries; per-person, per-key and public-page limits (for example 5 portal login codes an hour per contact); messages slowed to each provider's limit; heavy jobs at most 2 at a time per person; a clear "try again in N seconds" | 100 requests a second from one person are slowed with a clear message, and other people are not affected | NFR-020, D-124 |
| AI limits | AI is off until the Owner types a monthly amount; a Top up button adds more any time in the month (choice 20, 22 Oct). Limits per role, per person and per feature (voice minutes too); alerts at 50%, 80% and 100%; at the limit only AI pauses, until a top-up or the 1st, and everything works by hand. The client chatbot has its own daily budget and a cap of 20 messages per chat (default) | At 100% of the budget, AI and voice pause and everything else works; the 21st chatbot message goes to a person | AI-006, AI-020, RULE-020, D-156 |
| No double sends | Failed jobs retried, then listed; catch-up after downtime | Running the engine twice and restarting it mid-run sends nothing twice | NFR-003 |
| Money accuracy | Money exact, GST correct, numbers never skip | 1,000 test invoices have correct totals and no number gaps | NFR-004 |
| Easy to use | Phone browser, plain language, every list searchable, filterable and exportable, WCAG 2.1 AA | An accessibility check passes on the main screens | NFR-009 |
| Enclosed modules | Floor rules, automatic guards, tests for every flow | The architecture guards pass on every change | NFR-011 |
| Take your data out | Full export at any time | A full export opens correctly in a spreadsheet | NFR-013 |
| Same setup everywhere | Runs the same on the local computer and on a server | Moving to a test server takes one documented step | NFR-015 |
| Low cost | Free first; paid only for the video platform and what the owner approves | The running-cost list shows only approved paid services | NFR-016 |
| Safe changes | Database changes add before they remove; tested on an anonymised copy; a backup before every release; rollback ready | A release rehearsal on a data copy passes | NFR-017 |
| Settings, not code | Every value marked (setting) changes in Settings | Each setting can be changed without a release | NFR-018 |
| Room to grow | New services, roles, lead sources, senders, languages and connections need no module change | Adding a lead source needs no release | NFR-019 |

**The owner's 4 success measures** show live on the dashboard (CC-008):
- zero missed renewals;
- invoices paid within 15 days;
- leads contacted within 24 hours;
- a 5-minute morning check.

## 6. What the owner provides

| What | Status or detail | When |
|---|---|---|
| Logo and brand files | **Done:** in `assets/brand/` (D-094) | — |
| GitHub account | **Done** (the account exists, round 27); the private repository is **not created yet** and is set up with Claude's steps | Step 1.9 |
| Antigravity and Codex opened on this folder | To do | Step 1.9 |
| Approvals | The 5 gates; Claude never approves for the owner (D-182, D-152) | At each gate |
| Company details | Legal name, type, PAN, address and logo for the company profile; the GSTIN and its date once GST is registered; the LLP details from their effective date (CORE-010, CORE-011, RULE-022) | Step 2.6, then when they change |
| Settings values | For example leave quotas, the holiday list, pay day, approval limits, the AI budget and data retention periods (D-017, D-074, D-120, D-130, RULE-020) | Later, in Settings (no code) |
| Academy course 1 details | Name, duration, fee, instalments, start date, trainer (the real name; the screens use the sample "Nandhini K"), whether it is graded and whether a certificate is given | Before step 3.10, no rush (ROUND-16-CHANGE-LIST section 11) |
| Data | Today it is spread across documents, hosting accounts, memory and WhatsApp. The owner fills Claude's Excel templates (for websites, just the domain names, CORE-104); the import must match counts and money totals | Steps 4.1 and 4.2 |
| Accounts | The accounts listed in section 3, all in YTP's name, with keys and logins kept in Vaultwarden | When each step needs them; checked at step 4.7 |
| CA | A written OK on GST invoices and payroll rules | Step 4.4 |
| People | The senior reviewer, a team member for the two-person checks, a Tamil speaker, and the team for training | Gate 2, each step's end, before go-live, step 4.5 |
| Paid services | Approves any paid service before it is used (NFR-016); Bunny Stream is already agreed (D-118) | When proposed |
