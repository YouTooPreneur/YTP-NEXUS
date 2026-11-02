# Round 16 change list (for the owner's approval)

**Status: approved by the owner and applied on 1 Oct 2026 (review round 24).** Every existing ID was kept, and every changed decision records its history. D-139 was not used (the Core split is covered by the plan).

**Sources:** audit `YTP-NEX-AUD-02 v1.1` (1 Oct 2026); `EMPLOYEES DASHBOARD.docx` (60 Agency OS screenshots, cited as AOS-DOC 1–60); the owner's round 16 brief; the owner's answers of 1 Oct 2026.

## At a glance

- **Kept:** one app, 7 modules on a shared Core, floor rules, data ownership, every approved business rule, and the chosen style (D-134, D-137).
- **Changed:**
  - **your 5 phases kept**, with the Academy moved to the end of Phase 3 (owner's choice, no rush)
  - **external password manager** instead of a vault
  - **renewals need proof**
  - **shared-hosting rules**
  - **LLP partner finance**
  - **Google sign-in** from the start
  - **Agency OS features** added (from its screenshots only; the old system is never touched)
  - **portal isolation** stated explicitly
- **Size:** 41 requirements reworded, 24 new (plus 5 new business rules), 1 retired · 31 screens changed, 15 new, 2 retired · 8 decisions changed or retired, 13 new.

---

## 1. The owner's answers in this round

| Question | Answer | Effect on the plan |
|---|---|---|
| When is the Academy built? | **Last, no rush** (owner, 1 Oct) | The Academy is the last step of Phase 3 (**3.10**). The audit's "Academy fast track" (C7) is not taken. |
| How is the first course delivered? | **Mixed (live + recorded)** | When the Academy is built, it includes recorded videos (ACD-009, INT-017) and the student portal (ACD-010). |
| When does cohort 1 start? | Not fixed; not a priority now | If the Academy starts before step 3.10, it runs on simple tools (forms, sheets, a numbered invoice template) and its data is imported later (ACD-014). |
| Video platform? | **Bunny Stream** | ACD-009, INT-017 and D-118 name Bunny Stream (private videos, enrolled students only), set up at step 3.10. |
| First payment gateway? | **Razorpay** | FIN-008, INT-005 and D-045: Razorpay first, for client payments at step 3.3 (and Academy fees at 3.10); others later through the same door. |
| Where do passwords live? | **Self-hosted Vaultwarden** (free Bitwarden-compatible software on YTP's own server) | Nexus stores only links to vault items (WEB-009). YTP runs the vault: HTTPS, invite-only, 2-step login for everyone, daily encrypted backup off the server, monthly updates. Until our server exists, a free Bitwarden cloud account can hold passwords; they move into Vaultwarden later (same format, export and import). |
| Must-have 17 change? | **Yes, with a ready slot for every future connection** | Each planned outside service gets a reserved, documented slot at step 3.1 (new CORE-123), so any AI or person knows exactly where and how to build it later. |
| Screen languages in the first release? | **All 5 from the start** | CORE-110 stays at step 2.6 unchanged. Every screen, message and PDF is translated into Tamil, Hindi, Malayalam and Telugu before it goes live. |
| Which Google accounts sign in? | **Mixed** (personal Gmail and company accounts) | CORE-008: an allow-list of email addresses in Settings, plus a whole company domain once YTP uses Google Workspace. |
| Keep the LLP partner section? | **Yes** | FIN-025 to FIN-031 stay. |
| Who approves partner withdrawals? | **Both partners** | FIN-028: a withdrawal or distribution needs both LLP partners' approval in Nexus. |
| Who enters LLP money entries? | **The partners now; an accounts person later** | FIN-027, FIN-028: LLP partners enter and approve; when YTP hires an accounts person, the Accounts role is given "enter" permission in the role builder (no code). |
| How often is profit shared? | Claude's choice: **quarterly, plus a yearly total** | FIN-031: profit and each partner's share are calculated per quarter and per year, and for any period on request. |
| Who confirms a renewal? | **Owner, Manager, Accounts** | CON-008, WEB-014: anyone can upload the proof; only these roles confirm, which moves the expiry date. |
| Agency OS? | **Being closed, not in use; do not touch it** | Only its screenshots are used, as a list of useful features. No checks, changes or imports on the old system. |

---

## 2. Plan: your 5 phases stay (owner, 1 Oct)

The audit grouped the steps under its own names (R0 to R4). They described the same steps and were confusing, so **they are not used**. The 5-phase plan and its step numbers stay. Round 16 adds features **inside** the steps, plus five small edits:

1. **2.4 Login:** add Google sign-in.
2. **3.1 Core:** add to-do lists, and a ready slot for every future connection.
3. **3.3 WebCare + Finance:** Vaultwarden links instead of a vault; add renewal proof, shared-hosting rules and LLP partner money.
4. **Academy moves to the end of Phase 3:** 3.8 Portals, Reports, API and AI (was 3.9) · 3.9 Integrations, each built in its slot when the account exists (was 3.10) · **3.10 Academy** (was 3.8).
5. **4.7 Handover:** keys and logins in Vaultwarden. Phase 5 adds a monthly Vaultwarden update and restore test.

| Step | Today | After round 16 |
|---|---|---|
| 3.1 | Core: tasks, messaging, files… | Same, plus to-do lists and ready slots for future connections |
| 3.2 | CRM + Team | Same, plus Agency OS fields (lead details, employee details…) |
| 3.3 | WebCare + Finance (with vault) | Same, with Vaultwarden links instead of a vault, plus renewal proof, shared hosting and LLP money |
| 3.4 | Contracts & Renewals + dashboard | Same |
| 3.5 | Move online | Same |
| 3.6 | Projects + meetings | Same |
| 3.7 | Sales + Payroll | Same |
| 3.8 | Academy | **Portals, Reports, API, AI** (was 3.9) |
| 3.9 | Portals, Reports, API, AI | **Integrations, each built in its slot** (was 3.10) |
| 3.10 | Integrations | **Academy** (was 3.8) |

**Build column renumbering** (requirements and screens): Academy items 3.8 → 3.10; portals, reports, API, AI and the automation builder 3.9 → 3.8; integrations 3.10 → 3.9. Everything else keeps its number. Razorpay (FIN-008, INT-005) is built at 3.3 for client payments.

**Audit corrections C1 and C2** (release-based scope, Core split) are **already covered by the plan**: it builds step by step, Nexus goes online at 3.5, and the heavier Core parts (automation builder, API, MCP) are already near the end.

---

## 3. Requirement changes (`REQUIREMENTS.md`)

### 3.1 Reworded (same ID)

| ID | Becomes | Why |
|---|---|---|
| USR-001 | User types add **LLP partner**, **HR** and **trainer**; team members (employees, freelancers, referral partners, influencers) can exist with or without a login. | C6, C9 |
| USR-006 | Default roles: Owner, **LLP partner**, Manager, **HR**, Accounts, Staff, **Trainer**, Client contact, Student (all editable). Pass: a fresh install has these 9 roles. | C6, C9 (Agency OS had HR) |
| CORE-001 | One login for every module: **Google sign-in** or email and password. | C8 |
| CORE-007 | Unchanged text; built at 3.8 for clients (portal) and 3.10 for students. | Renumbering |
| CORE-008 | **Google sign-in for staff from Foundation (step 2.4)**; who may sign in is a setting: an allow-list of email addresses (personal Gmail or company accounts), plus a whole company domain once YTP uses Google Workspace. Free (a one-time Google project set-up). | C8, owner (mixed accounts) |
| CORE-040 | Statuses Pending, In progress, **In review**, Blocked, Completed, **Cancelled**; **one or several assignees**; **subtasks with progress**; **service tag**; **duplicate a task**. Pass: a task with 3 subtasks and 2 assignees shows 1/3 for both; a duplicate copies its subtasks. | C9 (AOS-PDF p.4–5) |
| CORE-060 | Channels: in-app, email and WhatsApp one-tap at 3.1; browser push when needed (3.9). | Owner (connections when needed) |
| CORE-092 | Security log: logins, permission changes, exports, **views of sensitive fields** (salary, bank, statutory), **password-manager reference opens**, API calls. Pass: opening an employee's bank details adds an entry that cannot be edited. | C3 |
| CRM-004 | Referrer: client, **referral partner** or influencer. | "Partner" ≠ LLP partner |
| CRM-007 | Website forms and ad/social lead forms at 3.9, each built in its slot when that account is connected. | Owner (connections when needed) |
| CRM-019 | Upsell and cross-sell suggestions from rules, **shown to the owner first; nothing reaches the client until the owner confirms**. | O4 |
| CRM-024 | Commercial overview shows **agreement value, invoiced, paid, outstanding (invoiced − paid) and unbilled (agreement − invoiced) separately**, plus lifetime value and recurring revenue. Pass: ₹1,00,000 agreement, ₹60,000 invoiced, ₹40,000 paid → outstanding ₹20,000, unbilled ₹40,000. | C9 (AOS-DOC 56) |
| CRM-025 | **Referral partner** and influencer commissions. | Naming |
| CON-005 | Free maintenance **coverage ends on the date in the agreement** (rule B6), shown to the client; AMC offer before it ends. | C9 (WS2) |
| CON-008 | Renewal steps: invoiced, paid, renewed at vendor, **confirmed with evidence** (provider invoice, portal screenshot or client proof) or by the automatic expiry check. Anyone can upload the proof; **Owner, Manager and Accounts confirm**. Pass: a renewal cannot be confirmed without evidence or a check result, or by any other role. | C4, owner |
| WEB-002 | Adds the **provider account** each asset belongs to (WEB-016) and the vendor cost in original currency and INR. | C5 |
| WEB-009 | **Password manager references** for client and YTP logins: item link, owner, last verified date. **No passwords are stored in or revealed by Nexus.** Pass: no password field exists anywhere in Nexus. | C3 |
| WEB-010 | Shared and dedicated servers and hosting accounts with **dated placements**; **one renewal and one alert per account, listing every affected site**; **vendor cost recorded once**; each client billed per their own agreement; clients never see shared logins or other clients on the same account. | C5 |
| WEB-013 | Technical dossiers use **password-manager references only**. | C3 |
| WEB-014 | After the client pays a YTP-billed renewal, a "renew at vendor" task is created. **Paying or completing the task never moves the expiry date**; only evidence or the automatic check does. | C4 |
| AUTO-008 | Expiry update **only** on confirmation with evidence or the automatic check. Pass: confirming without evidence is refused. | C4 |
| AUTO-023 | Upsell suggestions go to the owner first (as CRM-019). | O4 |
| FIN-008 | **Razorpay first** (client payments at 3.3, Academy fees at 3.10); other gateways added through new doors when needed; generic payment link; autopay once available. | O3, C1 |
| FIN-013 | Vendor bills and payments with approval; **original currency and INR actual (provisional until the bank or card statement)**; **split payments allowed; duplicate transactions blocked**. | C4 |
| FIN-015 | Internal subscriptions: price, cycle, status, autopay, tier, category, used for (internal or clients), link, dates, remarks, **password-manager reference instead of a password**; card and calendar views; **spend analytics** (monthly and yearly spend, expiring in 7 days, by category, by cycle, top 5). | C9 (AOS-DOC 39–40) |
| FIN-016 | Shared-account costs **recorded once and rebilled by placement history** where agreed. | C5, C9 |
| TEAM-001 | People: employees, freelancers, **referral partners**, influencers, **trainers**; with or without login. LLP partners live in Finance (FIN-025). | C6 |
| TEAM-002 | Full field lists. **Personal:** date of birth, gender, marital status, blood group, nationality, personal email, phone, WhatsApp, education, college, emergency contact, address, photo. **Job:** employee code, type, **work mode (office, remote, hybrid)**, work location, department, designation, reporting manager, joining date, probation end, **confirmation date**, shift. **Bank & statutory (encrypted; Owner, HR and Accounts only):** bank, account holder, account number, IFSC, PAN, UAN, ESIC. Aadhaar: last 4 digits only. | C9 (AOS-DOC 19–23) |
| TEAM-009 | Adds **half-day attendance**, **work hours**, **late and overtime in minutes**, a **live board** (in office / not checked in) and a month calendar per person. | C9 (AOS-DOC 32–33) |
| TEAM-011 | Adds **half-day AM / PM**, **Emergency** leave type, **balance shown when approving**, **bulk approve**, **manual balance adjustment with a reason** (logged). | C9 (AOS-DOC 34–37) |
| TEAM-013 | Adds a **year-to-date summary** per employee (net paid, last net, pending). | C9 (AOS-DOC 26) |
| TEAM-022 | Self-service adds: header with employee code, work mode and leave balances; **My Documents upload** (TEAM-028); **My Requests** history of profile change requests; regularisation and WFH requests (TEAM-027); payslip filters (year, month, status); profile photo. | C9 (AOS-DOC 1–6) |
| ACD-005 | Fees: full or instalments; YTA series (plain invoices until GST registration); receipts; **UPI QR and Razorpay**. | Academy (3.10) |
| ACD-010 | Student portal: schedule, materials, **recordings**, fees and invoices with payment, attendance, results, certificates; one-time-code login; **a student only ever sees their own batches, fees and records** (NFR-022). | Mixed delivery, C10 |
| ACD-013 | **Academy dashboard:** admissions, seats filled and free per batch, fees due and collected, attendance; plus Academy reports. | Brief §3 |
| CC-001 | Founder dashboard adds a **6-month revenue trend**, **tasks by status**, **missing employee documents** and **subscription spend**. | C9 (AOS-PDF p.1) |
| CC-007 | My day: header (employee code, work mode, leave balances); **task counters** (today, completed today, in progress, assigned, overdue, completed this month); **to-do counters** (today, important, assigned, overdue, completed); priority tasks; meetings; alerts; check-in. | C9 (AOS-DOC 1) |
| POR-001 | Adds: the portal only ever shows the logged-in contact's own company (NFR-022). | C10 |
| POR-003 | Adds **maintenance coverage dates** and a maintenance summary. | Audit §2.3 |
| POR-004 | Adds: clients see the **names of the YTP staff** handling their tasks and requests. | Owner's choice (1 Oct) |
| NFR-001 | Removes "the vault"; adds: **no client or tool passwords stored; password-manager references only**. | C3 |

### 3.2 New requirements

| ID | Requirement | Build | Why |
|---|---|---|---|
| CORE-123 | **Integration slots:** every planned outside service (INT-001 to INT-022, and any new one) has a reserved slot from step 3.1: a card on the Integrations page marked "Planned"; a folder with a short spec (what it is for, which module uses it, events in and out, data fields, settings and keys needed, how to test it); and the standard door interface (CORE-121) already in place. Building an integration later means filling its slot, with no change to any module. Pass: the Integrations page lists every planned service as "Planned", and each has its spec in its folder. | 3.1 | Owner (1 Oct): leave room for future connections |
| CORE-047 | **To-do lists:** own lists with colour, nested sub-lists, **shared with colleagues**, progress %, board or list per list; items with priority, due date, reminder, assignees, subtasks, notes, attachments and an **Important** star; smart views Today, Important, Assigned to me, Overdue, Completed. | 3.1 | C9 (AOS-DOC 10–11, 41–44) |
| CRM-027 | **Lead details:** temperature (Hot, Warm, Cold), industry, country, city, budget range, timeline, requirement, priority, last contacted; an **overdue follow-up banner**; quick call, email, WhatsApp and website buttons; pipeline counters (total, converted, lost, follow-up today, meeting today). | 3.2 | C9 (AOS-PDF p.2, AOS-DOC 59) |
| CRM-028 | **Client status** Active, On hold, Inactive, Completed (plus Past); **agreement-expired banner**; **client profile PDF**; list columns agreement type and renewal date, with list totals. | 3.2 | C9 (AOS-PDF p.3, AOS-DOC 50–57) |
| CRM-029 | **Relationship health** history and NPS; **assigned team** per client; **client onboarding checklist**. | 3.7 | C9 (Client OS) |
| CON-016 | **Auto-renewing agreements** with a notice deadline and a reminder before it. | 3.4 | C9 (WS2) |
| WEB-016 | **Provider accounts:** provider, account owner, recovery email, **MFA status**, password-manager reference; the assets in each account. | 3.3 | C5 |
| WEB-017 | **Expiry correction without a renewal:** fix a wrong expiry date with a reason and evidence; no renewal or payment is recorded. | 3.3 | C4 (WS1) |
| FIN-025 | **LLP partners:** each partner linked to a user with the **LLP partner** role (distinct from referral partners). | 3.3 | C6 |
| FIN-026 | **Agreed contribution % and profit-sharing %**, effective-dated, marked **provisional until the LLP agreement** is signed. | 3.3 | C6 |
| FIN-027 | **Partner investments** (capital contributions): date, amount, mode, proof; entered by the LLP partners now, and by Accounts once that role is given permission. | 3.3 | C6, owner |
| FIN-028 | **Withdrawals and distributions** per partner, with proof; **each needs both LLP partners' approval** in Nexus. Pass: a withdrawal approved by one partner stays pending until the other approves. | 3.3 | C6, owner |
| FIN-029 | **Partner account statement** for any period: opening balance, investments, share of profit, withdrawals, distributions, closing balance. | 3.3 | C6 |
| FIN-030 | **Partner financial dashboard, visible to both partners:** revenue, expenses, profit, bank and cash balances, receivables, payables, and each partner's capital and current account. | 3.3 | C6 |
| FIN-031 | **Profit for a period** from Nexus records, shared by the agreed %, **calculated quarterly with a yearly total** (and any period on request), marked provisional until the CA confirms. No separate LLP compliance module. | 3.3 | C6 |
| TEAM-026 | **Employee status:** Active, Probation, Notice period, Resigned, Terminated; changed with a reason and date; history kept; directory counters (total, active, on probation, on notice, missing documents). | 3.2 | C9 (AOS-DOC 18, 31) |
| TEAM-027 | **Attendance regularisation and work-from-home requests**, with approval; WFH counted separately. | 3.2 | C9 (AOS-DOC 32–33) |
| TEAM-028 | **Employee document checklist:** required and optional lists in Settings (default: Aadhaar, PAN, bank passbook/cheque, education certificate, resume; optional: passport, experience certificate, last 3 payslips, relieving letter, skill certificates); upload by the employee or HR; HR verifies; **missing documents tracked** (counters, banner, dashboard); Aadhaar copies stored masked. | 3.2 | C9 (AOS-DOC 5, 27), C12 |
| TEAM-029 | **Agreements checklist** per employee (offer, appointment, NDA, employment agreement, leave policy, IT policy, code of conduct) with signed status. | 3.2 | C9 (AOS-DOC 28) |
| ACD-014 | **Academy data import:** if the Academy starts before step 3.10, its admissions, students, fee plans and issued YTA invoices (kept in simple tools) are imported; the YTA series continues from the last number used. Pass: the next YTA invoice after import is the last number + 1. | 3.10 | Academy last |
| POR-011 | **Portal home cards:** active requests and tasks, completed, pending invoices, total paid (matching invoice records); **agreement card** (type, monthly fee, start, end, expiry warning). | 3.8 | C9 (AOS-DOC 13) |
| POR-012 | **Documents shared by YTP:** agreements, client-safe handover documents, reports, meeting summaries. | 3.8 | Audit §2.3 |
| POR-013 | **Company profile view** (contact, email, phone, address, GST, agreement period, services) with "request a change". | 3.8 | C9 (AOS-DOC 17) |
| NFR-022 | **Portal isolation:** the client and student portals only ever return the logged-in person's own company or student records; every portal action has an automated isolation test; portal totals equal the invoice records. | 3.8 / 3.10 | C10 |

### 3.3 Retired (ID kept, marked "retired in round 16")

| ID | Why |
|---|---|
| POR-010 (clients reveal their own logins) | C3: no passwords in Nexus. YTP shares a client's own logins through the password manager's secure share. |

### 3.4 Other text changes

- **"How to read" section:** the Build column keeps step numbers, renumbered as in section 2 (3.8 Portals, Reports, API, AI · 3.9 Integrations · 3.10 Academy).
- **Section 17 intro:** "Every integration is built and tested before keys are bought" becomes "The door standard (CORE-120, CORE-121) and a **reserved slot for every planned integration** (CORE-123: Integrations-page card, spec folder, door interface) are ready from step 3.1; each integration is built in its slot when its account exists or right before it is needed, then switched on by pasting keys and pressing Test." Approved by the owner (1 Oct).
- **Integration rows:** the Build column uses the new step numbers (3.9, Razorpay 3.3, Bunny Stream 3.10); INT-020 becomes "Password manager references to Vaultwarden items (no API needed)".
- **Appendix A:** "Credential references WEB-009" stays (now password-manager references).
- **Appendix B:** must-have 7 points to WEB-009 (references), TEAM-002 and NFR-001; must-have 17 points to CORE-120, CORE-121, CORE-123 and the new section 17 rule.
- **New Appendix C:** the Agency OS checklist (section 9 below).

### 3.5 New business rules

| ID | Rule |
|---|---|
| RULE-024 | **Renewal evidence:** paying a renewal or completing a vendor task never moves an expiry date; only a confirmation with evidence or the automatic expiry check does. |
| RULE-025 | **No passwords in Nexus:** client and tool logins live in the external password manager; Nexus stores references only. |
| RULE-026 | **LLP partner shares** are effective-dated and provisional until the LLP agreement; "LLP partner" never means a referral partner. |
| RULE-027 | **Migration from Agency OS:** Aadhaar last 4 digits only; no password is ever imported; Aadhaar document copies masked. |
| RULE-028 | **Internal chat is not built:** the team uses Google Chat, plus comments on tasks and projects. |

---

## 4. Screen changes (`SCREENS.md`)

Screens keep their Build step numbers, renumbered like the requirements (section 2). The phone layout and the chosen style apply to every screen.

### 4.1 Changed screens

| ID | Change |
|---|---|
| SCR-001 Login | "Sign in with Google" button first, then email and password |
| SCR-008 My profile | Profile photo |
| SCR-020 Founder dashboard | Revenue trend, tasks by status, missing documents, subscription spend |
| SCR-021 My day | Header (code, work mode, leave balances), task and to-do counters, priority tasks |
| SCR-030 Leads and clients | Client status, agreement type and renewal columns, list totals |
| SCR-032 Client 360° | Status, agreement-expired banner, Export PDF, outstanding and unbilled; "Websites and accounts" shows password-manager references |
| SCR-034 Sales pipeline | Lead temperature, budget, follow-up date on cards; counters |
| SCR-035 Deal | Lead details (CRM-027), overdue banner, quick contact buttons |
| SCR-053 Renewals board | Final step "Confirmed with evidence"; confirm opens SCR-098 |
| SCR-080 Tasks | In review and Cancelled columns, several assignees, subtask progress, service tag |
| SCR-081 Task | Subtasks, assignees, duplicate |
| SCR-082 Reminders | Becomes **To-do lists and reminders** (CORE-047) |
| SCR-091 Asset | Logins as password-manager references; provider account; placement history |
| SCR-093 Servers | Hosting accounts with dated placements, one renewal, affected sites |
| SCR-096 Technical dossiers | References only |
| SCR-102 Invoice editor | Agreement value / invoiced / remaining panel; live preview |
| SCR-110 Vendor bills and payments | Original currency, INR actual (provisional), duplicate check |
| SCR-112 YTP's own subscriptions | Card and calendar views, analytics, category and usage; no passwords |
| SCR-120 People | Counters (active, probation, notice, missing documents), banner, work-mode filter |
| SCR-121 Person | Tabs Personal, Job, Bank & statutory (restricted), Documents checklist, Agreements, Access, Exit; status with reason |
| SCR-123 Check in / check out | WFH option |
| SCR-124 Attendance register | Live board, WFH, half days, late and overtime minutes |
| SCR-125 Leave | Half day AM/PM, Emergency type, balance at approval, bulk approve, balance adjustment |
| SCR-127 Payroll run | Year-to-date per employee |
| SCR-138 My HR | My Documents upload, My Requests, regularisation and WFH requests, payslip filters |
| SCR-182 Users and roles | 9 default roles |
| SCR-201 Portal home | KPI cards and agreement card |
| SCR-203 Services and renewals | Maintenance coverage dates and summary |
| SCR-221 Student home | Next class, dues, announcements, latest recordings |
| SCR-222 My courses | Recordings from the video platform |
| SCR-223 Fees | Pay by UPI QR or the gateway |

### 4.2 New screens

| ID | Screen | Pattern | Who | Requirements | Build |
|---|---|---|---|---|---|
| SCR-097 | Provider accounts | P1 / P2 | O M S | WEB-016 | 3.3 |
| SCR-098 | Confirm renewal (with evidence) | P9 | O M A | CON-008, WEB-014 | 3.4 |
| SCR-099 | Correct expiry date | P9 | O M | WEB-017 | 3.3 |
| SCR-115 | LLP partners and shares | P2 | O, LLP partner | FIN-025, FIN-026 | 3.3 |
| SCR-116 | Partner investments, withdrawals and distributions | P1 | O, LLP partner, A | FIN-027, FIN-028 | 3.3 |
| SCR-117 | Partner statement | P2 | O, LLP partner | FIN-029 | 3.3 |
| SCR-118 | Partner financial dashboard | P6 | O, LLP partner | FIN-030, FIN-031 | 3.3 |
| SCR-139 | Employee documents check (HR verifies, missing list) | P1 | O, HR | TEAM-028 | 3.2 |
| SCR-140 | Regularisation and WFH requests | P1 | O M, HR | TEAM-027 | 3.2 |
| SCR-158 | Academy dashboard | P6 | O M | ACD-013 | 3.10 |
| SCR-211 | Documents from YTP (portal) | P10 | C | POR-012 | 3.8 |
| SCR-212 | Company profile (portal) | P10 | C | POR-013 | 3.8 |
| SCR-252 | Client profile PDF | P7 | — | CRM-028 | 3.2 |
| SCR-253 | Partner statement PDF | P7 | — | FIN-029 | 3.3 |
| SCR-254 | Academy fee receipt and invoice PDF (YTA, 5 languages) | P7 | — | ACD-005 | 3.10 |

### 4.3 Retired screens

| ID | Why |
|---|---|
| SCR-092 Reveal login | C3: nothing is revealed in Nexus |
| SCR-209 My logins (portal) | C3: POR-010 retired |

**Screen count:** 165 → 178 (15 new, 2 retired).

---

## 5. Decision changes (`DECISIONS.md`)

Every changed decision keeps its old wording in a "History" note with the date and the reason.

### 5.1 Changed or retired

| ID | Now | Becomes |
|---|---|---|
| D-001 | Build fresh; old work "not useful" | Build **fresh code**; Agency OS **functions, fields and workflows are preserved as requirements** (round 16). Screenshots are not proof that the old software worked. |
| D-002 | No deadline | Unchanged: no deadline. The Academy is built last, with no rush (owner, 1 Oct). |
| D-003 | Everything in scope | **Unchanged** (the 5 phases already set the build order). |
| D-004 | 5 phases | **Unchanged** (owner, 1 Oct); only Phase 3's last three steps are renumbered (section 2). |
| D-012 | Core list | **Unchanged** (Core is already built in two parts: Foundation and step 3.1). |
| D-018 | Doors built ahead | The **door standard and a reserved, documented slot for every planned integration are ready from step 3.1** (CORE-123); each door is built in its slot when its account exists. (Approved by the owner, 1 Oct.) |
| D-045 | Any gateway | Any gateway stays possible; **Razorpay first**, for client payments at step 3.3 (and Academy fees at 3.10). *(Corrected 21 Oct 2026 to match FIN-008.)* |
| D-067 | Vault inside Nexus | **Retired.** Replaced by D-140 (external password manager). |
| D-070 | Team includes partners | "Partners" are **referral partners**; LLP partners are in Finance (D-145). |
| D-105 | Review loop, no limit | **Unchanged.** |
| D-106 | Tech locked in 1.7 | Unchanged; the data model for **all modules' main records** is locked at 1.7 too (C11). |
| D-118 | Video platform "not chosen" | **Bunny Stream**, set up with the Academy (step 3.10, mixed delivery). |
| D-131 | Clients see their logins | **Retired** (C3). |
| D-134 | Mixed style, no dark theme, two colours (Emerald, Navy) | Unchanged by round 16: newer than the audit (which still lists light / dark) and stays. |
| D-083 | 5 languages | Unchanged: the owner confirmed all 5 from the start (round 16). |
| D-044 | Automatic sending rule | Unchanged: newer than the old WS1 "notices need approval" rule and governs. |

### 5.2 New decisions

| ID | Decision |
|---|---|
| D-138 | **Build order:** the 5 phases stay; Phase 3 ends with 3.8 Portals, Reports, API and AI · 3.9 Integrations · **3.10 Academy** (owner's choice; the audit's fast track, C7, and its R0–R4 labels are not used). |
| D-139 | *(Not used: the Core split, C2, is already covered by the 5-phase plan.)* |
| D-140 | **Password manager outside Nexus: self-hosted Vaultwarden** (owner's choice, 1 Oct). Nexus stores references (item link, owner, last verified); nothing revealed in Nexus; the portal "reveal" is replaced by the vault's secure share (C3). Vault rules: HTTPS, invite-only sign-up, 2-step login for all users, admin page locked, daily encrypted backup off the server, monthly updates and a restore test. Interim: a free Bitwarden cloud account until our server is ready, then export and import into Vaultwarden. |
| D-141 | **Renewal evidence rule** (C4, RULE-024). |
| D-142 | **Shared hosting and provider accounts** rules (C5). |
| D-143 | **Google sign-in from Foundation (step 2.4)** (C8). |
| D-144 | **Agency OS preservation:** its fields and workflows become requirements (Appendix C); internal chat deferred, so use Google Chat and comments (C9, RULE-028). |
| D-145 | **LLP partner finance** inside Finance, simple, visible to both partners; no compliance module (C6). |
| D-146 | **Portal isolation** for client and student portals (C10, NFR-022). |
| D-147 | **Data model for all modules locked at 1.7** before Phase 2 starts (C11). |
| D-148 | **Agency OS is never touched:** the owner is closing it. Only its screenshots are used, as a feature list. If any of its data is ever imported, RULE-027 applies (C12). |
| D-149 | **Academy:** built last (step 3.10); mixed delivery (live + recorded) with Bunny Stream; launch date not fixed. |
| D-150 | **Default roles** add LLP partner, HR and Trainer. |
| D-151 | **Upsell suggestions** are owner-confirmed before reaching a client (O4). |

---

## 6. Plan changes (`PLAN.md`)

- **Phase 1:**
  - 1.5 closes with the chosen style.
  - 1.6 specifies the exact screens and preview, Foundation and steps 3.1–3.5 first.
  - 1.7 locks the tech stack and the **data model for every module's main records**.
  - The **freeze** works as before.
- **Phase 2 (Foundation):** same steps 2.1–2.8; Google sign-in is added to 2.4.
- **Phase 3:** same steps, with the last three renumbered: 3.8 Portals, Reports, API and AI · 3.9 Integrations (each built in its slot when the account exists) · 3.10 Academy.
- **If the Academy starts before step 3.10:** it runs on simple tools (a Google Form and Sheet, one numbered YTA invoice template, a UPI or Razorpay link, Google Meet, a WhatsApp group); its data is imported at step 3.10 (ACD-014).
- **Password vault set-up (owner, with Claude's steps):**
  - **until our server is ready (optional):** a free Bitwarden cloud account
  - **when our server is ready:** Vaultwarden on it (for example `vault.youtoopreneur.com`), then import
- **Phase 4:** step 4.7 "keys in the vault" becomes "**keys and logins in Vaultwarden**". Launch steps work as before.
- **Phase 5:** adds a monthly Vaultwarden update and a vault restore test.
- **Phase 3.3 text** "Websites, password vault" becomes "Websites, password-manager references".

---

## 7. Other files

- **`STATUS.md`:**
  - a round 16 row
  - Phase 3 steps renumbered (Academy last)
  - new owner to-dos: password manager set-up, LLP partner details (course-1 details later, before step 3.10)
  - step 1.5 closed if the owner approves the style
- **`RAW-REQUIREMENTS.md`:** a new section "Round 16 additions" recording the audit, the Agency OS screenshots, the brief and the answers.
- **`AGENTS.md` section 7:** adds "Nexus never stores client or tool passwords; use password-manager references" and "Build only the step named on the card".
- **`docs/sources/`:** copies of the audit and the screenshot document, so every AI can check the sources.
- **Tracker:** this change list stays under Requirements as history.

---

## 8. C1–C12 checklist

| # | Correction | Covered by | Status after approval |
|---|---|---|---|
| C1 | Release-based scope | Already covered by the 5-phase plan (step by step, online at 3.5); D-138 | Covered |
| C2 | Core-Essential / Extended | Already covered: Core is built in two parts (Foundation and 3.1); the heavier parts are at 3.8 | Covered |
| C3 | External password manager | WEB-009, WEB-013, FIN-015, CORE-092, NFR-001, RULE-025, D-140; POR-010, SCR-092, SCR-209 retired; D-067, D-131 retired | Applied |
| C4 | Renewal evidence, expiry correction, currency, split/duplicate | WEB-014, AUTO-008, CON-008, FIN-013, WEB-017, RULE-024, SCR-098, SCR-099, D-141 | Applied |
| C5 | Shared hosting and provider accounts | WEB-002, WEB-010, WEB-016, FIN-016, SCR-093, SCR-097, D-142 | Applied |
| C6 | LLP partner finance | FIN-025 to FIN-031, USR-006, RULE-026, SCR-115 to SCR-118, SCR-253, D-145 | Applied |
| C7 | Academy fast track | **Not taken:** the owner keeps the Academy last (step 3.10); ACD changes and ACD-014 still apply | Changed by the owner |
| C8 | Google sign-in in Foundation | CORE-001, CORE-008, SCR-001, D-143 | Applied |
| C9 | Agency OS and earlier details | Section 9 (Appendix C) | Applied, with listed deferrals |
| C10 | Portal isolation | NFR-022, POR-001, ACD-010, D-146 | Applied |
| C11 | Data model locked first | D-106, D-147, PLAN 1.7 | Applied |
| C12 | Safe migration | RULE-027, TEAM-028, D-148 (only if Agency OS data is ever imported) | Applied |

---

## 9. Agency OS checklist (becomes Appendix C)

**Employee portal (AOS-DOC 1–12)**

| Agency OS function | Nexus | Status |
|---|---|---|
| Header: code, joined, work mode, designation, leave balances | CC-007, TEAM-022, SCR-021, SCR-138 | Added |
| Task and to-do counters, priority tasks | CC-007 | Added |
| Personal details view, change requests | TEAM-022 | Kept + history added |
| Payslips with filters, PDF | TEAM-013, TEAM-022 | Added (3.7, after CA check) |
| Clock in, today's status, history | TEAM-009, SCR-123 | Kept + regularisation/WFH (TEAM-027) |
| Leave balances, apply, history, half days | TEAM-011 | Added |
| My Documents upload (5 + 5) | TEAM-028 | Added |
| My Requests history | TEAM-022 | Added |
| Chat | — | **Deferred:** Google Chat + comments (RULE-028) |
| Tasks board with subtasks, comments, files | CORE-040 | Added |
| To-do lists, smart views, sharing | CORE-047 | Added |
| My Account: photo, ID, role, password, two-step | SCR-008, CORE-002 | Added (photo) |

**Client portal (AOS-DOC 13–17)**

| Agency OS function | Nexus | Status |
|---|---|---|
| Login per client | CORE-007, POR-001 | Kept (better: per contact) |
| KPI cards | POR-011 | Added |
| Task status and recent activity | POR-004, PRJ-011 | Kept (visibility per client); staff names shown (owner's choice) |
| Contract card with expiry warning | POR-011 | Added |
| Client creates a task | POR-005, CON-012 | Kept as support and change requests |
| Invoices: totals, list, download | POR-002 | Kept + pay and statement |
| My Profile | POR-013 | Added |
| (new) Documents from YTP, maintenance coverage | POR-012, POR-003 | Added |

**Admin screens (AOS-DOC 18–60, AOS-PDF)**

| Area | Nexus | Status |
|---|---|---|
| Founder dashboard widgets | CC-001 | Added |
| Users, roles, activity logs, notifications | USR, CORE-090, CORE-066 | Kept |
| Employee directory counters, banner, work mode | TEAM-026, TEAM-002, SCR-120 | Added |
| Employee profile tabs and fields | TEAM-002, SCR-121 | Added (Aadhaar last 4 only) |
| Bank & tax, statutory | TEAM-002 | Added (restricted, encrypted) |
| Documents and agreements checklists | TEAM-028, TEAM-029 | Added |
| Employee status with reason | TEAM-026 | Added |
| Attendance live board, minutes, regularise, WFH | TEAM-009, TEAM-027 | Added |
| Leave: half day, Emergency, bulk, adjustment, comp-off | TEAM-011, TEAM-012 | Added |
| Payroll calendar, statuses, YTD | TEAM-013 | Kept + YTD |
| Subscription tracker with analytics | FIN-015 | Added (no passwords) |
| To-do lists | CORE-047 | Added |
| Tasks board and detail | CORE-040 | Added |
| Invoices list, form with contract panel and preview | FIN-001–003, SCR-102 | Added (delete → credit note) |
| Client list and detail (statuses, banner, PDF, payments) | CRM-024, CRM-028 | Added |
| Client credentials tab | WEB-009 | **Replaced** by password-manager references |
| Lead pipeline and lead detail fields | CRM-027 | Added |
| Change Requests (admin) | TEAM-022, SCR-138 | Kept |
| Chat (admin) | — | **Deferred:** Google Chat |
| "Workspaces" | — | **Not needed:** Agency OS is closing |
| Earlier specs (Client OS, WebCare, HostCore, WS1, WS2) | CRM-029, CON-005, CON-016, WEB-010, WEB-016, WEB-017, FIN-013, FIN-016 | Added |
| Planned only (EOD, handoff note) | TEAM-009 work note | One-line note kept (owner's choice); handoff note not added (minor) |
| White-label, mobile app, SaaS billing | D-020, D-033 | Deferred (unchanged) |

---

## 10. Conflicts with earlier decisions

| Earlier decision | New input | Proposal | Needs |
|---|---|---|---|
| D-002, D-003 "everything at once, nothing later" (owner, round 3) | Releases (audit C1, brief) | **Kept as they are:** the 5 phases already build step by step | Owner (1 Oct) |
| Must-have 17 "integrations ready before keys" | Build each door when its account exists (audit O2, brief) | The door standard and a documented slot for every planned integration are ready from step 3.1 (CORE-123); doors are built in their slots when needed | **Approved by the owner (1 Oct)** |
| D-067 vault, D-131 portal reveal | Password manager (audit C3, brief) | Retire both | Approved in the brief |
| D-001 "old work not useful" | Preserve Agency OS functions (brief) | Reword | Approved in the brief |
| D-134 mixed style, no dark theme (1 Oct, newer) | Audit roadmap lists "light / dark" | **Keep D-134** | None |
| D-083 5 languages | Audit O1: English + Tamil first | **Keep D-083** (owner chose all 5) | None |
| Audit C7: Academy right after Foundation | Owner: Academy last, no rush | Academy is step 3.10 | Owner's decision |
| Audit's Academy MVP without student portal | Owner chose mixed delivery | Student portal and video are part of the Academy step | None |
| D-105 unlimited review rounds | Audit W11, brief "no large planning exercise" | Round 16 is the last full round | **Owner's OK** |
| D-044 automatic sending | Old WS1 "notices need approval" | Keep D-044 (newer) | None |

---

## 11. Open questions for the owner

**All questions for the plan are closed** (1 Oct). Only data remains, entered later inside Nexus (LLP partner details at step 3.3, course 1 details before 3.10), plus the style approval after round 16.

1. ~~Password manager~~ **Answered: self-hosted Vaultwarden** (interim: free Bitwarden cloud until our server is ready).
2. ~~Video platform~~ **Answered: Bunny Stream.**
3. ~~Payment gateway~~ **Answered: Razorpay first.**
4. **Course 1 details** (only before step 3.10, no rush): name, duration, fee, instalments, start date, trainer, whether it is graded, and whether a certificate is given.
5. ~~LLP partners~~ **Answered:** keep the section; both partners approve withdrawals. Names, shares and the registration date are entered in Nexus at step 3.3, so they are not needed for the plan.
6. ~~Agency OS security check~~ **Not needed:** the owner is closing Agency OS, and Claude never touches it.
7. ~~Staff names in the client portal~~ **Answered: yes, show names** (POR-004).
8. ~~End-of-day note~~ **Answered: keep the one-line note** (TEAM-009 unchanged).
9. ~~Agency OS "Workspaces"~~ **Not needed:** Agency OS is closing.
10. **Style:** approve the chosen style (Emerald Luxe, mixed) to close step 1.5?

---

## 12. Agency OS

- Agency OS is **not deployed**, stays under the owner's control and will be closed. **Claude never touches it.**
- Only its screenshots are used, as a list of useful features (section 9).
