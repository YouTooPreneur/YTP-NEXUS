# Screens

Every screen in YTP Nexus, built from the approved `docs/REQUIREMENTS.md`.

**Round 16 applied (1 Oct 2026):** 31 screens updated, 15 added, SCR-092 and SCR-209 retired, and Build steps renumbered (3.8 Portals, Reports, API, AI · 3.9 Integrations · 3.10 Academy). See `docs/review/ROUND-16-CHANGE-LIST.md`. Exact layouts come in step 1.6; this list says **which screens exist, what each one is for, who uses it, and which requirements it serves**.

**Round 32 (1 Oct 2026):** SCR-255 Voice assistant added; SCR-173, SCR-174, SCR-187 and SCR-188 updated (voice, AI limits per feature, WhatsApp providers). AI helpers (✦) appear on every screen where they help (AI-009). 179 active screens.

**Round 34 (1 Oct 2026):** SCR-256 AI settings, SCR-257 AI knowledge, SCR-258 AI quality, SCR-259 Client chatbot settings and SCR-260 Live chat inbox added; Ask Nexus (SCR-173) and AI usage (SCR-174) move to step 3.1; batch 1 screens gain their AI parts. 184 active screens.

**Releases (2 Nov 2026, D-186):** the last column says which of the 18 small releases builds each screen (`docs/RELEASES.md`). The Build column is the step in `docs/PLAN.md`.

## How to read this list

- **ID:** every screen has a permanent ID such as `SCR-032`. Screen specs, task cards and tests refer to it.
- **Pattern:** the reusable layout the screen is built from (below). Using a few shared patterns keeps every screen consistent and makes building faster.
- **Who:** O = Owner · M = Manager · A = Accounts · S = Staff · C = Client contact · St = Student · P = Public (no login). Final access always follows the role builder.
- **Build:** the milestone from `docs/PLAN.md`.

## Screen patterns

| Pattern | What it is | Used for |
|---|---|---|
| **P1 List** | Table with search, filters, saved views, bulk actions, export | Clients, invoices, tasks, assets… |
| **P2 Detail** | Header with key facts and actions, then tabs | Client 360°, project, person, asset… |
| **P3 Form** | Create or edit a record, with validation | Add client, invoice editor, settings |
| **P4 Board** | Cards in columns by stage, drag to move | Pipeline, projects, applicants |
| **P5 Calendar** | Day, week, month and agenda views | Calendar, content calendar, leave |
| **P6 Dashboard** | Attention list, key numbers, short lists | Command Centre, finance overview |
| **P7 Document** | A printable PDF or email layout | Invoice, payslip, certificate, emails |
| **P8 Wizard** | Step-by-step flow | Import, payroll run, handover |
| **P9 Dialog** | Small pop-up for one action | Record payment, vault reveal, quick add |
| **P10 Portal page** | Simplified page for clients and students | Client and student portals |
| **P11 Phone quick screen** | One-thumb screen for daily actions | Check-in, quick add lead, my day |

---

## A. Everywhere (shell and shared screens)

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-001 | Login | Sign in with Google first; or email and password, then the second step | P3 | O M A S | CORE-001, CORE-002, CORE-008 | 2 | 1 |
| SCR-002 | Two-step set-up | Choose authenticator app, email code or WhatsApp code | P8 | O M A S | CORE-002 | 2 | 1 |
| SCR-003 | Forgot / reset password | Reset by email link | P3 | O M A S | CORE-001 | 2 | 1 |
| SCR-004 | App shell | Side menu by module (only what the role allows), top bar with search, colour switch (pill with mini previews of Emerald and Navy), notification bell, quick add, language, profile; on a phone, a bottom menu whose buttons change by role (Leads for the Owner and people who handle leads, Attendance for other staff) (choice 13, 22 Oct) | — | All staff | USR-002, CORE-113 | 2 | 1 |
| SCR-005 | Search results | Results from every module, grouped, within permissions | P1 | O M A S | CORE-100 | 3.1 | 2 |
| SCR-006 | Notification centre | Unread, read, snoozed; missed activities; email and WhatsApp alerts set to "Ask first" waiting for a tap to send (choices 5 and 16, 22 Oct) | P9 | All staff | CORE-066 | 3.1 | 2 |
| SCR-007 | Quick add | One menu to add a lead, task, meeting, reminder, expense or invoice | P9 | O M A S | CRM-006, CORE-040 | 3.1 | 2 |
| SCR-008 | My profile and preferences | Photo, language, colour (Emerald or Navy), time zone, daily summary time, two-step method, notifications (each alert "Straight away" or "Ask first"; the Owner also sets company-wide alerts) (choices 5 and 16, 22 Oct), active devices, log out everywhere; **AI and voice** (my usage, voice language, read aloud, remembered notes, chat history) | P3 | All staff | CORE-005, CORE-110, CC-005 | 2 | 1 |
| SCR-009 | Approval inbox | Everything waiting for approval (certificate cancel requests too, choice 89, 22 Oct), approve or reject with a comment | P1 | O M A | CORE-075, USR-005 | 3.1 | 2 |
| SCR-010 | Record history | Who changed what and when, for any record | P1 | O M | CORE-090 | 2 | 1 |
| SCR-011 | Trash | Deleted records, restore within 30 days | P1 | O | CORE-093 | 2 | 1 |

## B. Command Centre

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-020 | Founder dashboard | Attention list, the 4 success measures, renewals in 30 days, collections, team workload, today's meetings and follow-ups, risks; revenue trend, tasks by status, missing employee documents, subscription spend | P6 | O | CC-001 to CC-004, CC-008 | 3.4 | 9 |
| SCR-021 | My day (employee dashboard) | Header (employee code, work mode, leave balances), task and to-do counters, priority tasks, meetings, leave, alerts, check-in | P6 / P11 | S | CC-007 | 3.4 | 9 |
| SCR-022 | Manager dashboard | The founder dashboard limited to the manager's area, with bills and amounts owed for the manager's own clients only (choice 48, 22 Oct) | P6 | M | CC-009 | 3.4 | 9 |

## C. CRM

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-030 | Leads and clients | List with stage, source, services, owner, balance; saved views; client status, agreement type and renewal date, list totals | P1 | O M S | CRM-001, CRM-004, CRM-005, CRM-023, CRM-028 | 3.2 | 3 |
| SCR-031 | Quick add lead | Name, phone, service, source in about 10 seconds | P9 / P11 | O M S | CRM-006 | 3.2 | 3 |
| SCR-032 | Client 360° profile | Tabs: overview, contacts, services, websites and accounts, projects, invoices, tasks, meetings, files, timeline, diagnosis, proposals, testimonials; status, agreement-expired banner, Export PDF, outstanding and unbilled amounts; logins shown as password-manager references | P2 | O M A S | CRM-002, CRM-003, CRM-024, CRM-028 | 3.2 | 3 |
| SCR-033 | Add / edit client and contacts | Company, founder, contacts (role, phone, email, WhatsApp, language, portal access, consent) | P3 | O M S | CRM-002 | 3.2 | 3 |
| SCR-034 | Sales pipeline | Deals by stage, drag to move; list view; cards show lead temperature, budget and follow-up date; pipeline counters | P4 | O M S | CRM-011, CRM-027 | 3.2 | 3 |
| SCR-035 | Deal | Value, expected close, services, lead details, overdue follow-up banner, quick call / email / WhatsApp, activity, next follow-up | P2 | O M S | CRM-011, CRM-013, CRM-027 | 3.2 | 3 |
| SCR-036 | Business diagnosis | Questionnaire, notes, recommended services, free or paid | P3 | O M | CRM-012 | 3.2 | 3 |
| SCR-037 | Proposals | List with status, value, validity | P1 | O M | CRM-015 | 3.7 | 11 |
| SCR-038 | Proposal builder | Services and custom prices, discounts, GST, payment stages, revision rounds, change-request handling, validity, terms, live preview | P3 | O M | CRM-015, FIN-023 | 3.7 | 11 |
| SCR-039 | Duplicate merge | Compare two records and merge | P9 | O M | CRM-008 | 3.2 | 3 |
| SCR-040 | Campaigns | Platform, service, budget, leads, cost per lead | P1 / P2 | O M | CRM-020 | 3.7 | 11 |
| SCR-041 | Broadcasts | Compose (segment, channel, template, schedule), consent check, results | P8 | O M | CRM-026 | 3.7 | 11 |
| SCR-042 | Testimonials | Requests, received, approved for use | P1 | O M | CRM-022 | 3.6 | 10 |
| SCR-043 | Lead rules | Scoring and assignment rules; when the person is on leave, each rule either sends leads to a named backup or keeps them with that person and alerts the Owner (choice 27, 22 Oct) | P3 | O | CRM-009, CRM-010 | 3.2 | 3 |

## D. Contracts & Renewals

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-050 | Services sold | Every service per client, type, price, next date, status | P1 | O M A | CON-001 | 3.4 | 8 |
| SCR-051 | Service sold | Billing, renewal, payment stages, revisions used, change requests, client inputs, support terms | P2 | O M A | CON-001, CON-004, CON-011 to CON-014 | 3.4 | 8 |
| SCR-052 | Agreements | List and detail with versions, amendments, signature status; notice deadline with reminders 30, 15 and 7 days before (choice 50, 22 Oct) | P1 / P2 | O M | CON-002 | 3.4 | 8 |
| SCR-053 | Renewals board | Next 60 days; each renewal's steps: alerted, invoiced, paid, renewed at vendor, confirmed with evidence (SCR-098) | P4 | O M A | CON-007, CON-008, AUTO-001, RULE-024 | 3.4 | 8 |
| SCR-054 | AMC and free maintenance | End dates, AMC offers, coverage | P1 | O M | CON-005, CON-006 | 3.4 | 8 |
| SCR-055 | Change requests | Free or chargeable, quote, approval, bill; approved extra work gets its own bill as soon as the client approves, which then waits for the Owner's OK like other one-time work (choice 61, 22 Oct); free small changes up to a limit set per client (choice 62, 22 Oct) | P1 / P2 | O M | CON-012 | 3.6 | 10 |
| SCR-056 | Client inputs | Checklist per client and service; reminders on or off, every 3 days to start or a longer gap set per client (choice 57, 22 Oct) | P2 | O M S | CON-013 | 3.6 | 10 |
| SCR-057 | Subscriptions and products sold | Cycles, autopay, delivery status, licence keys; download links work for 30 days after delivery (choice 54, 22 Oct) | P1 | O M A | CON-010, CORE-024 | 3.4 | 8 |

## E. Projects

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-060 | Projects | Board by stage and list; filters by client, service, owner | P4 / P1 | O M S | PRJ-001 | 3.6 | 5 |
| SCR-061 | Project | Tabs: overview, stages and checklists, milestones timeline, tasks, deliverables, files and client resources, discussion, change requests, client visibility | P2 | O M S | PRJ-002 to PRJ-011 | 3.6 | 5 |
| SCR-062 | Deliverable | Versions, quality sign-off (by the project lead, a manager or the Owner; choice 59, 22 Oct), client approval history, revision count | P2 | O M S | PRJ-005, PRJ-006 | 3.6 | 5 |
| SCR-063 | Content calendar | Posts by client and platform on a month or week view, coloured by status | P5 | O M S | PRJ-012 | 3.6 | 10 |
| SCR-064 | Post editor | Caption, media, platforms, date, approval | P3 | O M S | PRJ-012 | 3.6 | 10 |
| SCR-065 | Support inbox | Requests with reply and fix deadlines counting down | P1 | O M S | PRJ-013, AUTO-027 | 3.6 | 10 |
| SCR-066 | Support request | Conversation, assignee, deadlines, linked project or asset | P2 | O M S | PRJ-013 | 3.6 | 10 |
| SCR-067 | Client results | Results per service and period, entry and charts | P2 | O M S | PRJ-014 | 3.8 | 15 |
| SCR-068 | Client reports | Build, schedule and send reports per client | P8 | O M | PRJ-015 | 3.8 | 15 |
| SCR-069 | Case studies and portfolio | Write, attach, permission check, publish | P1 / P3 | O M | PRJ-016 | 3.6 | 10 |
| SCR-070 | Project handover | Closure checklist, then WebCare handover, free maintenance start, testimonial request | P8 | O M | PRJ-010 | 3.6 | 5 |

## F. Work: tasks, meetings, calendar, files

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-080 | Tasks | My tasks, team, by client or project; list and board; late tasks highlighted; In review and Cancelled columns, several assignees, subtask progress, service tag | P1 / P4 | All staff | CORE-040 to CORE-045 | 3.1 | 2 |
| SCR-081 | Task | Fields, related records, attachments, comments; follow-up fields when it's a follow-up; subtasks, several assignees, duplicate | P2 | All staff | CORE-040 to CORE-042 | 3.1 | 2 |
| SCR-082 | To-do lists and reminders | Own lists (nested, shared, colour), smart views (Today, Important, Assigned to me, Overdue, Completed), Important star; personal reminders, repeat, snooze | P1 | All staff | CORE-043, CORE-047 | 3.1 | 2 |
| SCR-083 | Calendar | Day, week, month, agenda; meetings, deadlines, milestones, renewals, invoice dues, leave, holidays | P5 | All staff | CORE-053 | 3.6 | 5 |
| SCR-084 | Schedule a meeting | Client or internal, provider, link or location, attendees, agenda, reminder, repeat | P3 | All staff | CORE-050, CORE-054, CORE-056 | 3.6 | 5 |
| SCR-085 | Meeting | Details, notes and minutes, decisions, action items; recording kept until someone deletes it (choice 63, 22 Oct) | P2 | All staff | CORE-050, CORE-051 | 3.6 | 5 |
| SCR-086 | Meeting history | Search and filter past meetings, export a summary | P1 | All staff | CORE-052 | 3.6 | 5 |
| SCR-087 | Files and client resources | Folders per client and project, previews, versions, upload, add link | P1 | All staff | CORE-080 to CORE-083 | 3.1 | 2 |
| SCR-088 | Workload | Each person's open and late work, capacity from office hours (choice 34, 22 Oct), leave | P1 | O M | CORE-046, TEAM-024 | 3.2 | 5 |

## G. WebCare

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-090 | Digital assets | All asset types; filter by type, client, YTP or client account, expiring soon | P1 | O M S | WEB-001, WEB-002 | 3.3 | 7 |
| SCR-091 | Asset | Changes by type: website technical info; domain/hosting ownership and expiry; social or ad account; maintenance log, backups, issues, logins as password-manager references, provider account, placement history, handover | P2 | O M S | WEB-001 to WEB-008, WEB-011 | 3.3 | 7 |
| SCR-092 | ~~Reveal login~~ | *Retired in round 16 (C3): nothing is revealed in Nexus* | — | — | — | — | — (retired) |
| SCR-093 | Servers | Hosting accounts and servers with dated placements; one renewal and one alert per account, listing affected sites; a shared bill split across its sites by disk used (choice 40, 22 Oct) | P1 / P2 | O M S | WEB-010 | 3.3 | 7 |
| SCR-094 | Expiry monitor | Domains, SSL and uptime at a glance | P6 | O M S | WEB-004, WEB-005, AUTO-029 | 3.3 | 7 |
| SCR-095 | Asset handover | Checklist, transfer, handover document | P8 | O M | WEB-012 | 3.3 | 7 |
| SCR-096 | Technical dossiers | Internal notes per client or site; password-manager references only | P2 | O M S | WEB-013 | 3.3 | 7 |
| SCR-097 | Provider accounts | Hosting and domain provider accounts: owner, recovery email, MFA status, vault reference, assets in each | P1 / P2 | O M S | WEB-016 | 3.3 | 7 |
| SCR-098 | Confirm renewal | Upload or check the proof and confirm (Owner, Manager, Accounts); the expiry date moves | P9 | O M A | CON-008, WEB-014, RULE-024 | 3.4 | 8 |
| SCR-099 | Correct expiry date | Fix a wrong date with a reason and evidence; no renewal recorded | P9 | O M | WEB-017 | 3.3 | 7 |

## H. Finance

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-100 | Finance overview | To collect, overdue, collected this month, waiting for approval, ageing | P6 | O A | FIN-009 | 3.3 | 6 |
| SCR-101 | Invoices | List by status, series, client; ageing | P1 | O A | FIN-001, FIN-009 | 3.3 | 6 |
| SCR-102 | Invoice editor | Draft lines, GST, round off, bank/UPI, send or submit for approval; agreement value / invoiced / remaining panel; live preview | P3 | O A | FIN-001 to FIN-006 | 3.3 | 6 |
| SCR-103 | Invoice | Issued invoice with status, payments, reminders sent, credit notes | P2 | O A | FIN-001, FIN-003 | 3.3 | 6 |
| SCR-104 | Record payment | Mode, reference, amount (partial allowed), TDS | P9 | O A | FIN-007, FIN-011 | 3.3 | 6 |
| SCR-105 | Credit note | Create and view | P3 / P2 | O A | FIN-003 | 3.3 | 6 |
| SCR-106 | Client statement | Invoices, payments and balance for a period | P2 | O A | FIN-010 | 3.3 | 6 |
| SCR-107 | Payments and receipts | All payments received | P1 | O A | FIN-007 | 3.3 | 6 |
| SCR-108 | Collections | Who to chase, reminders sent, escalations | P1 | O A | FIN-009, AUTO-004, AUTO-005 | 3.3 | 6 |
| SCR-109 | Vendors | List and detail | P1 / P2 | O A | FIN-012 | 3.3 | 13 |
| SCR-110 | Vendor bills and payments | Bills, the Owner's approval for every bill, card bills too (choice 41, 22 Oct), paid; original currency and INR actual (provisional); duplicate check | P1 | O A | FIN-013 | 3.3 | 13 |
| SCR-111 | Expenses and claims | Submit with receipt; the Owner approves every claim; paid back by bank transfer within a set number of days (choices 7 and 42, 22 Oct) | P1 / P3 | All staff | FIN-014 | 3.3 | 13 |
| SCR-112 | YTP's own subscriptions | Tools YTP pays for, renewal dates; card and calendar views; spend analytics; password-manager references (no passwords) | P1 | O A | FIN-015 | 3.3 | 13 |
| SCR-113 | Ad spend rebilling | Spend per client per month, fee, bill | P1 | O A | FIN-017, CON-015 | 3.4 | 11 |
| SCR-114 | Payouts | Commissions, freelancer and partner payouts | P1 | O A | FIN-019, TEAM-017 | 3.7 | 13 |
| SCR-115 | LLP partners and shares | Partners, contribution % and profit-sharing % by date (provisional until the LLP agreement) | P2 | O, LLP partner | FIN-025, FIN-026 | 3.3 | 15 |
| SCR-116 | Partner money | Investments, withdrawals and distributions, with proof and both partners' approval | P1 | O, LLP partner | FIN-027, FIN-028 | 3.3 | 15 |
| SCR-117 | Partner statement | Opening balance, investments, profit share, withdrawals, distributions, closing balance for any period | P2 | O, LLP partner | FIN-029 | 3.3 | 15 |
| SCR-118 | Partner financial dashboard | Revenue, expenses, profit (quarterly and yearly), balances, receivables, payables, each partner's capital | P6 | O, LLP partner | FIN-030, FIN-031 | 3.3 | 15 |

## I. Team (HR)

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-120 | People | Employees, freelancers, partners, influencers; counters (active, probation, notice, missing documents), missing-documents banner, work-mode filter | P1 | O M | TEAM-001, TEAM-026 | 3.2 | 4 |
| SCR-121 | Person | Tabs: overview, personal, job, bank & statutory (restricted), documents checklist, agreements, access, assets, attendance, leave, salary (restricted), goals, training, recognition, letters, exit; status with reason | P2 | O M | TEAM-002 to TEAM-008, TEAM-018 to TEAM-020, TEAM-026, TEAM-028, TEAM-029 | 3.2 | 4 |
| SCR-122 | Org chart | Who reports to whom | — | All staff | TEAM-003 | 3.2 | 4 |
| SCR-123 | Check in / check out | One button, daily work note, Saturday allowance left; work-from-home option | P11 | S | TEAM-009, TEAM-010 | 3.2 | 4 |
| SCR-124 | Attendance register | Team by day or month, live board, late and overtime minutes, half days, WFH, Saturday use | P1 | O M | TEAM-009, TEAM-010, TEAM-027 | 3.2 | 4 |
| SCR-125 | Leave | Apply, balances, team leave calendar; half day AM / PM, Emergency type, balance shown at approval, bulk approve, balance adjustment; unused leave carries forward, up to 90 days in all (choice 33, 22 Oct) | P3 / P5 | All staff | TEAM-011 | 3.2 | 4 |
| SCR-126 | Comp-off and overtime | Earned, used, expiring | P1 | O M S | TEAM-012 | 3.2 | 4 |
| SCR-127 | Payroll run | Calculate → review → approve → payslips → bank payment list; year-to-date per employee; pay on the 1st, or the next working day after it when the 1st is a Sunday or holiday (choice 69, 22 Oct) | P8 | O A | TEAM-013 | 3.7 | 13 |
| SCR-128 | Salary structures and revisions | Components, revision history, next review on the joining anniversary (choice 73, 22 Oct) | P2 | O A | TEAM-013, TEAM-014 | 3.7 | 13 |
| SCR-129 | Advances, bonuses and incentives | Amounts and recovery | P1 | O A | TEAM-015, TEAM-016 | 3.7 | 13 |
| SCR-130 | Hiring openings | Open roles | P1 | O M | TEAM-021 | 3.2 | 12 |
| SCR-131 | Applicants | Board by stage | P4 | O M | TEAM-021 | 3.2 | 12 |
| SCR-132 | Applicant | Resume, interviews, offer | P2 | O M | TEAM-021 | 3.2 | 12 |
| SCR-133 | Joining and leaving | Checklists per person | P2 | O M | TEAM-004 | 3.2 | 12 |
| SCR-134 | Letters | Generate offer, appointment, experience, relieving letters | P8 | O M | TEAM-005 | 3.2 | 12 |
| SCR-135 | Policies | Policies and who acknowledged | P1 | All staff | TEAM-007 | 3.2 | 12 |
| SCR-136 | Company assets | Issued and returned | P1 | O M | TEAM-008 | 3.2 | 12 |
| SCR-137 | Goals and performance | Goals, OKRs, reviews once a year on the joining anniversary (choice 36, 22 Oct) | P2 | O M S | TEAM-018 | 3.2 | 12 |
| SCR-138 | My HR (self-service) | My profile (header with code, work mode, leave balances), My Documents upload, My Requests, leave, regularisation and WFH requests, payslips with filters, policies, assets, attendance | P2 / P11 | S | TEAM-022, TEAM-027, TEAM-028 | 3.2 | 4 |
| SCR-139 | Employee documents check | Uploaded documents waiting for HR, verified, missing | P1 | O, HR | TEAM-028 | 3.2 | 4 |
| SCR-140 | Attendance and WFH requests | Regularisation and work-from-home requests to approve | P1 | O M, HR | TEAM-027 | 3.2 | 4 |

## J. Academy

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-150 | Courses | List and editor: mode, syllabus, duration, fee, trainers | P1 / P3 | O M | ACD-001, ACD-004 | 3.10 | 17 |
| SCR-151 | Batches | Schedule, sessions, students, attendance | P1 / P2 | O M S | ACD-002 | 3.10 | 17 |
| SCR-152 | Admissions | Enquiry → admission form | P8 | O M | ACD-003, ACD-012 | 3.10 | 17 |
| SCR-153 | Students | List and student detail: fees, attendance, results, certificates | P1 / P2 | O M | ACD-003 | 3.10 | 17 |
| SCR-154 | Session attendance | Mark attendance for a session | P11 | S | ACD-006 | 3.10 | 17 |
| SCR-155 | Assessments | Enter results | P3 | O M S | ACD-007 | 3.10 | 17 |
| SCR-156 | Certificates | Issue and list; cancelling needs a written reason and the Owner's approval (choice 89, 22 Oct) | P1 | O M | ACD-008 | 3.10 | 18 |
| SCR-157 | Fees and instalments | Plans and dues | P1 | O A | ACD-005, FIN-024 | 3.10 | 17 |
| SCR-158 | Academy dashboard | Admissions, seats filled and free per batch, fees due and collected, attendance | P6 | O M | ACD-013 | 3.10 | 17 |

## K. Reports

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-160 | Reports home | Every report by area; revenue and profit for the Owner and LLP partners only, billing and collections for Accounts too (choice 81, 22 Oct) | P1 | O M A | RPT-001 to RPT-012 | 3.8 | 15 |
| SCR-161 | Report | Filters, period comparison, chart, table, export, schedule. One layout for: company, sales, revenue and profit (Owner and LLP partners only; choice 81, 22 Oct), billing and collections (Accounts too), renewals, projects, support, infrastructure, HR, Academy | P6 | O M A | RPT-001 to RPT-011 | 3.8 | 15 |

## L. Automations and AI

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-170 | Automations | Every rule, on/off, last run | P1 | O | CORE-070 to CORE-072 | 3.4 | 9 |
| SCR-171 | Automation builder | When → If → Do | P8 | O | CORE-071 | 3.8 | 16 |
| SCR-172 | Run history | Each run, what it did, errors | P1 | O | CORE-070 | 3.4 | 9 |
| SCR-173 | Ask Nexus | Full chat page and a side panel on every screen: new chat, chat history (search, pin, rename, delete), answers streaming with sources, attach a record, actions shown with Confirm, voice, thumbs up/down, usage meter | P9 | All staff | AI-001 to AI-004, AI-012 to AI-015, AI-017, AI-018, NFR-024 | 3.1 | 16 |
| SCR-174 | AI usage and limits | Monthly amount the Owner types (no fixed levels) and a Top up button (choice 20, 22 Oct); limits per role, person and feature, including voice minutes; usage per person, feature and provider; savings | P6 | O | AI-005, AI-006, AI-011 | 3.1 | 16 |
| SCR-256 | AI settings | Providers and the model for each job, guardrails, actions AI may take, memory and how long chats are kept | P3 | O | AI-004, AI-005, AI-013, AI-015, AI-017 | 3.1 | 16 |
| SCR-257 | AI knowledge | What AI may read (company profile, services, FAQs, brand voice, documents), for the team, the client chatbot or both | P1 | O | AI-016 | 3.1 | 16 |
| SCR-258 | AI quality | Question set results, pass rate per release, thumbs-down answers to review | P6 | O | AI-008, AI-018 | 3.1 | 16 |
| SCR-255 | Voice assistant | Listening view on computer and phone: press-to-talk, the words heard, the action Nexus will take, Confirm / Change / Cancel | P9 | All staff | AI-010, INT-024 | 3.8 | 16 |
| SCR-259 | Client chatbot settings | Channels (WhatsApp, website), greeting, what it may answer, lead questions, hand-over rules, office hours, limits | P3 | O | AI-019, AI-020 | 3.8 | 16 |
| SCR-260 | Live chat inbox | Chatbot conversations live; take over, hand back; AI or person on each message; links to the lead or client | P1 | O M S | AI-019, CRM-030 | 3.8 | 16 |

## M. Settings

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-180 | Settings home | Every settings area, including AI and voice | P1 | O | CORE-012 | 2 | 1 |
| SCR-181 | Company profile | Versions by effective date, GST switch, default colour (Emerald or Navy) | P3 | O | CORE-010, CORE-011 | 2 | 1 |
| SCR-182 | Users and roles | Role builder, view as role, approval delegation; nine default roles; AI and voice permissions and an AI limit per role; phone buttons per role (choice 13, 22 Oct) | P3 | O | USR-001 to USR-006, CORE-113 | 2 | 1 |
| SCR-183 | Services and templates | Catalogue and template editor: stages, checklists, approvals, client inputs, fields, recurring work, results, aftercare | P3 | O | CORE-020 to CORE-027 | 3.1 | 2 |
| SCR-184 | Custom fields | Add fields to any record | P3 | O | CORE-030 | 3.1 | 2 |
| SCR-185 | Lists | Lead sources, pipeline stages, lost reasons, expense categories, asset types, leave types, holidays and more | P3 | O | NFR-018 | 3.1 | 2 |
| SCR-186 | Numbering and document templates | Number series; invoice, letter and agreement templates | P3 | O | CORE-013, RULE-003 | 2 | 6 |
| SCR-187 | Messaging | Channels, sender identities (WhatsApp numbers and their providers), routing, templates per language, test mode | P3 | O | CORE-060 to CORE-065 | 3.1 | 9 |
| SCR-188 | Integrations | Card per service: connect, test, on/off; WhatsApp providers (AiSensy first, others ready); a ready slot for every planned service | P1 | O | CORE-120, CORE-121, CORE-123, INT-003 | 3.1 | 16 |
| SCR-189 | API keys and MCP | Create, limit, revoke keys | P1 / P9 | O | CORE-130 to CORE-132 | 3.8 | 16 |
| SCR-190 | Security | Two-step rules, session timeout, rate limits, AI guardrails | P3 | O | CORE-002 to CORE-004, NFR-020 | 2 | 1 |
| SCR-191 | Data | Import wizard, exports, full export, retention, backup status | P8 | O | CORE-094, CORE-102, CORE-103, NFR-007 | 3.1 | 2 |
| SCR-192 | Languages | Languages on/off, translations, voice per language; native-speaker check status, and the on switch unlocks only after the check (choice 11, 22 Oct) | P3 | O | CORE-110 | 2 | 1 |
| SCR-193 | Feature switches | Turn features on or off, each AI feature separately | P3 | O | CORE-015 | 2 | 1 |
| SCR-194 | Monitoring | Jobs, messages, integrations, AI health and spend, errors, retry | P6 | O | CORE-140 | 2 | 1 |
| SCR-195 | Logs | Activity log and security log viewers, with an AI actions filter | P1 | O | CORE-090, CORE-092 | 2 | 1 |
| SCR-196 | Storage | Space used, largest files | P6 | O | CORE-083 | 3.1 | 2 |
| SCR-197 | HR settings | Work schedule, Saturday rules, leave quotas, payroll rules, pay day, late rules, probation length by role (choice 30, 22 Oct) | P3 | O | RULE-013 to RULE-016, TEAM-006 | 3.2 | 4 |
| SCR-198 | Finance settings | Bank/UPI accounts, payment terms, reminders, sending rule, send time for automatic bills and reminders (choices 38 and 47, 22 Oct), round off, GST rates, days to pay back staff claims (choice 42, 22 Oct) | P3 | O | RULE-002 to RULE-009 | 3.3 | 6 |

## N. Client portal

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-200 | Portal login | One-time code by email or WhatsApp | P10 | C | CORE-007, POR-001 | 3.8 | 14 |
| SCR-201 | Portal home | What needs the client: approvals, invoices due, inputs pending, support updates; KPI cards and agreement card | P10 | C | POR-001, POR-011 | 3.8 | 14 |
| SCR-202 | Invoices and payments | View, download, pay by UPI QR or gateway, statement | P10 | C | POR-002 | 3.8 | 14 |
| SCR-203 | Services and renewals | What they have, when it renews, maintenance coverage dates; for items the client renews, reminders 30, 15, 7 and 1 day before (choice 78, 22 Oct) | P10 | C | POR-003 | 3.8 | 14 |
| SCR-204 | Projects and approvals | Progress (as allowed), approve deliverables with comments | P10 | C | POR-004 | 3.8 | 14 |
| SCR-205 | Content approvals | Approve or comment on social posts | P10 | C | POR-008 | 3.8 | 14 |
| SCR-206 | Support | Raise, track and reply to requests; reopen one that closed by itself 3 days after the fix (choice 80, 22 Oct) | P10 | C | POR-005 | 3.8 | 14 |
| SCR-207 | Inputs and uploads | Checklist items and file uploads (25 MB, links for bigger); the client's reminder schedule, every 3 days or the gap set for them (choice 79, 22 Oct) | P10 | C | POR-006 | 3.8 | 14 |
| SCR-208 | Proposals | View, accept or sign | P10 | C | POR-007 | 3.8 | 14 |
| SCR-209 | ~~My logins~~ | *Retired in round 16 (C3): POR-010 retired* | — | — | — | — | — (retired) |
| SCR-210 | Contact settings | Language, notifications, consent | P10 | C | POR-009, CRM-026 | 3.8 | 14 |
| SCR-211 | Documents from YTP | Agreements, handover documents, reports, meeting summaries shared with the client | P10 | C | POR-012 | 3.8 | 14 |
| SCR-212 | Company profile | Contact, address, GST, agreement period, services; "request a change" | P10 | C | POR-013 | 3.8 | 14 |

## O. Student portal

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-220 | Student login | One-time code | P10 | St | CORE-007 | 3.10 | 18 |
| SCR-221 | Student home | Next class, dues, announcements, latest recordings | P10 | St | ACD-010 | 3.10 | 18 |
| SCR-222 | My courses | Schedule, materials, recordings (Bunny Stream) of online classes and Saturday classroom workshops (choice 91, 22 Oct) | P10 | St | ACD-009, ACD-010 | 3.10 | 18 |
| SCR-223 | Fees | Instalments, invoices, pay by UPI QR or Razorpay | P10 | St | ACD-005 | 3.10 | 18 |
| SCR-224 | Attendance and results | Own attendance and results | P10 | St | ACD-006, ACD-007 | 3.10 | 18 |
| SCR-225 | Certificates | Download own certificates | P10 | St | ACD-008 | 3.10 | 18 |

## P. Public pages (no login)

| ID | Screen | What it's for | Pattern | Who | Requirements | Build | Release |
|---|---|---|---|---|---|---|---|
| SCR-230 | Secret-link document | View and pay an invoice, or view and accept a proposal (the proposal part from Release 11); an expired proposal shows "Expired" with a button to ask for a new one (choice 65, 22 Oct) | P10 | P | FIN-001, CRM-016 | 3.3 | 6 |
| SCR-231 | Certificate check | Shows whether a certificate is genuine | P10 | P | ACD-008 | 3.10 | 18 |
| SCR-232 | Unsubscribe and preferences | Stop broadcasts, choose channels | P10 | P | CRM-026 | 3.7 | 11 |
| SCR-233 | Testimonial form | Client writes a testimonial | P10 | P | CRM-022 | 3.6 | 10 |
| SCR-234 | Enquiry and careers forms | Forms to place on the YTP website (per service; careers, from Release 12) | P10 | P | INT-006, TEAM-021 | 3.9 | 11 |

## Q. Documents and messages

| ID | Document | Pattern | Requirements | Build | Release |
|---|---|---|---|---|---|
| SCR-240 | Invoice / tax invoice PDF (with UPI QR) | P7 | FIN-001 | 3.3 | 6 |
| SCR-241 | Credit note PDF | P7 | FIN-003 | 3.3 | 6 |
| SCR-242 | Payment receipt PDF | P7 | FIN-007 | 3.3 | 6 |
| SCR-243 | Proposal PDF | P7 | CRM-015 | 3.7 | 11 |
| SCR-244 | Agreement PDF | P7 | CON-002 | 3.4 | 8 |
| SCR-245 | Payslip PDF | P7 | TEAM-013 | 3.7 | 13 |
| SCR-246 | HR letters PDF | P7 | TEAM-005 | 3.2 | 12 |
| SCR-247 | Certificate PDF with QR | P7 | ACD-008 | 3.10 | 18 |
| SCR-248 | Handover document PDF | P7 | WEB-012 | 3.3 | 7 |
| SCR-249 | Client report PDF | P7 | PRJ-015 | 3.8 | 15 |
| SCR-250 | Email layout and templates (invoice, reminder, renewal notice, daily summary, login code, broadcast) | P7 | CORE-063 | 3.1 | 9 |
| SCR-251 | WhatsApp message templates | P7 | CORE-063, CORE-064 | 3.1 | 9 |
| SCR-252 | Client profile PDF | P7 | CRM-028 | 3.2 | 3 |
| SCR-253 | Partner statement PDF | P7 | FIN-029 | 3.3 | 15 |
| SCR-254 | Academy fee invoice and receipt PDF (YTA, 5 languages) | P7 | ACD-005 | 3.10 | 17 |

---

## Key screens for the style decision (step 1.5)

The style is chosen on four representative screens; every other screen follows the same design rules.

1. **SCR-020 Founder dashboard**: the busiest screen; sets the overall look
2. **SCR-032 Client 360° profile**: sets how detail pages and tabs look
3. **SCR-034 Sales pipeline**: sets how boards and cards look
4. **SCR-021 / SCR-123 My day and check-in on a phone**: sets the phone look

The chosen style (D-137) is built as coded screens in `docs/design/mockups/`; the earlier ChatGPT prompts are kept in `docs/design/` as history.
