# Batch 3 · CRM + Team: screen specs

Step 1.6, batch 3 of 9. **31 screens**, built in step 3.2 (CRM + Team), plus one phone page. Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 3 section) and the phone page `phone-team.html`.
- **AI (✦):** helpers where they save time, always beside the manual way, within the AI limits (D-155, D-156). In the preview they explain what they would do.
- **Sample data only.** Nothing saves.
- **Menu:** CRM opens Leads and clients; Team opens People.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Initials circle** | Client and person initials in a soft circle, one colour per record. |
| **Counters strip** | Small numbers across the top (total, active, on probation, missing documents); amber when something needs action. |
| **Today status** | A dot and a word: in (green), working from home (blue), on leave (amber), not checked in (red). |
| **Boards** | The pipeline style is shared: tinted lanes with a coloured top line, cards with initials, source, tags, amount, a ✦ score and the next step. Used for the pipeline and applicants. |

---

## CRM

### SCR-030 · Leads and clients

- **Preview:** `leads.html`
- **Layout:** saved views (Leads, Clients, Past, Lost, Renewing in 30 days, No AMC, Save view, Lead rules link); duplicates banner; filters (status, service, source, owner, tag) and search; table: client with industry and city, status (Active, On hold, Inactive, Completed), services, agreement type, renewal date (red when expired), source, owner, outstanding; **list totals** (agreement value, unbilled, renewing, outstanding).
- **AI:** "Ask about this list".
- **Requirements:** CRM-001, CRM-004, CRM-005, CRM-008, CRM-023, CRM-028, AI-009.

### SCR-031 · Quick add lead

- **Preview:** `lead-quick.html` (computer), `phone-team.html` (phone)
- **Layout:** name or business, phone, interested in (services or "Not sure · needs diagnosis"), source, owner (by rules); save, or save and add details.
- **AI:** fills the form from a pasted message, a visiting-card photo or voice; filled fields are marked "✦ filled"; Undo.
- **Rule:** duplicate check by phone shows the existing record with "Open it instead".
- **Requirements:** CRM-006, CRM-008, CRM-010, AI-009, AI-010.

### SCR-032 · Client 360° profile

- **Preview:** `client-profile.html`
- **Header:** initials, status and tags (industry, referrer, city, language), main contact, client since, assigned team; **outstanding** (invoiced minus paid), **unbilled** (agreement minus invoiced), lifetime value.
- **Actions:** meeting, task, Export PDF, Edit, WhatsApp.
- **Tabs:** overview, contacts, services, websites and accounts, projects, invoices, tasks, meetings, files, timeline, diagnosis, proposals, testimonials.
- **Overview:** services with the renewal callout (sends by itself, Hold), websites and accounts (logins as **Vaultwarden links only**), contacts with portal access, open tasks.
- **AI:** client summary with "Add to upsell ideas" (owner first, nothing reaches the client).
- **Requirements:** CRM-002, CRM-003, CRM-019, CRM-023, CRM-024, CRM-028, INT-020, AI-009.

### SCR-033 · Add / edit client and contacts

- **Preview:** `client-edit.html`
- **Company:** name, industry, city, website, GSTIN, address, founder, status, source, referred by, tags.
- **Contacts:** each with role, phone, WhatsApp, email, language, preferred channel, **portal access per area** (invoices, approvals, requests, files, reports) and **consent** for offers with date and source.
- **AI:** fill from the website, a card or a chat.
- **Requirements:** CRM-002, CRM-004, CRM-026, CORE-111, AI-009.

### SCR-034 · Sales pipeline

- **Preview:** `pipeline.html`
- **Summary band:** open pipeline, likely to close (value × stage chance), won in the last 30 days, win rate; ✦ "deals that need you today".
- **Counters:** all, mine, hot, follow-up today, meeting today, converted, lost; filters and search.
- **Lanes:** New, Contacted, Clarity session, Proposal sent, Won, Lost (stages are a setting), each with count, value, chance and share bar.
- **Cards:** initials, source and age, service tags, amount, ✦ score (red "Hot" from 75), next step coloured by urgency, owner. Drag to move; a dashed drop spot shows where it lands.
- **Requirements:** CRM-009, CRM-011, CRM-021, CRM-027, AI-009.

### SCR-035 · Deal

- **Preview:** `deal.html`
- **Layout:** temperature, service and value, source, owner, expected close; **overdue follow-up banner** (log a call, move to tomorrow); stage stepper; quick call, WhatsApp, email, website; lead details (contact, industry, city, budget, timeline, priority, last contacted, interest, requirement); activity; next follow-up.
- **AI:** score with reasons (points from the lead rules, link to them); suggested next step with a drafted WhatsApp message (sent only on Send).
- **Actions:** mark lost (with reason), clarity session, create proposal (batch 7).
- **Requirements:** CRM-009, CRM-011, CRM-013, CRM-018, CRM-027, AI-009.

### SCR-036 · Business diagnosis

- **Preview:** `diagnosis.html`
- **Layout:** free or paid (paid creates a draft invoice in the approval inbox); questions in groups (business today, goals, budget and timeline) with answers, choice chips and notes; session details and next step.
- **AI:** recommended services from the answers, each with its reason (you tick which to use); summary for the client in their language.
- **Requirements:** CRM-012, AI-009.

### SCR-039 · Duplicate merge

- **Preview:** `merge.html`
- **Layout:** why they look the same (same phone, similar name); a table with record A, record B and the **merged result**; pick a value per row; source keeps both (first and latest); history combined. Buttons: Not the same, keep both · Merge.
- **Requirements:** CRM-008.

### SCR-043 · Lead rules

- **Preview:** `lead-rules.html` with tabs `#score`, `#assign`
- **Scoring:** rules with points (plus and minus) and on/off; temperature bands (Hot 75+, Warm 40–74, Cold under 40); **AI adjustment** of at most ±10 points with its reason, using the small model and the AI helpers limit.
- **Assignment:** by service, what happens when the person is on leave, source exceptions; anything else goes to the Owner. Each rule chooses one of two ways for leave: send the lead to a named backup, or keep it with the usual person and alert the Owner (choice 27, 22 Oct). Sample: SEO → backup Owner, social → backup Karthik, video → backup Divya, not sure → backup Karthik; website and AMC stay with Arun and alert the Owner.
- **Requirements:** CRM-009, CRM-010, AI-006, AI-009.

### SCR-252 · Client profile PDF

- **Preview:** `client-pdf.html`
- **Content:** letterhead, client and status, agreement value, invoiced, outstanding, unbilled, contacts, YTP team, services, websites and accounts (logins show only "kept in the password manager"), recent activity.
- **Requirements:** CRM-028.

## Team

### SCR-120 · People

- **Preview:** `people.html`
- **Layout:** counters (total, active, probation, notice, missing documents, in today); missing-documents banner; views by type (employees, freelancers, referral partners, influencers, trainers); work-mode and status filters; table: person and role, code, type, work mode, status, today, documents done, reports to.
- **AI:** "Ask about the team" (never shows salary or bank details to people who can't see them).
- **Requirements:** TEAM-001, TEAM-026, TEAM-028, AI-009.

### SCR-121 · Person

- **Preview:** `person.html`
- **Header:** initials, status, role, code, team, work mode, manager, joining date; WhatsApp, Letter, Change status (with reason and date), Edit.
- **Tabs:** overview, personal, job, bank and statutory (locked), documents, agreements, access, assets, attendance, leave, salary (locked), goals, training, recognition, letters, exit.
- **Overview:** probation progress with the reminder (new joiners only; length set per role, changeable per person, or none; Priya: 3 months from her role; choice 30, 22 Oct); status history; access and assets; documents checklist (Aadhaar **last 4 digits only**); agreements; bank and statutory masked, "Show full details (logged)" for Owner, HR and Accounts only; this month's attendance, leave and Saturdays.
- **AI:** joining check (what is still missing) with a drafted reminder.
- **Requirements:** TEAM-002 to TEAM-008, TEAM-018 to TEAM-020, TEAM-025, TEAM-026, TEAM-028, TEAM-029, AI-009.

### SCR-122 · Org chart

- **Preview:** `org-chart.html`
- **Layout:** Owner at the top; managers, staff and who they report to; freelancers, partners and influencers dashed; status tags (probation, on leave); Everyone or Employees only; Export.
- **Requirements:** TEAM-003.

### SCR-123 · Check in / check out (phone)

- **Preview:** `phone-team.html`
- **Layout:** office or work from home (WFH must be approved), one-line work note, big Check in button with the time, Saturdays left, office hours.
- **Opened from:** the **Attendance** button in the phone's bottom menu, which staff get instead of Leads (choice 13, 22 Oct).
- **Requirements:** TEAM-009, TEAM-010, TEAM-027.

### SCR-124 · Attendance register

- **Preview:** `attendance.html` with tabs `#live`, `#month`, `#requests`
- **Live board:** in office, WFH, not checked in, on leave; table with check-in time, late minutes, where, today's note, check-out, Saturdays left.
- **Month:** a grid per person and day (present, late, half day, WFH, leave, Saturday off, Sunday or holiday) with totals.
- **AI:** summarise the month for the Owner.
- **Rule:** late and overtime are counted in minutes; no penalty unless late rules are added in HR settings.
- **Requirements:** TEAM-009, TEAM-010.

### SCR-140 · Attendance and WFH requests

- **Preview:** `attendance.html#requests`
- **Layout:** person, request (work from home or regularise), day, reason, WFH days this month, Approve or Reject. An approved regularisation corrects that day; WFH is counted separately.
- **Requirements:** TEAM-027.

### SCR-125 · Leave

- **Preview:** `leave.html` with tabs `#requests`, `#calendar`, `#balances`
- **Requests:** select several, type (casual, sick, earned, emergency, half day morning or afternoon), days, **balance after** (loss of pay shown in red), reason, Approve; bulk approve; why it came to you (leave over 3 days goes to the Owner).
- **Team calendar:** two weeks by person (approved, waiting, holiday, Sunday).
- **Balances:** per person and type, loss of pay this year, **Adjust** (needs a reason, logged); unused casual, sick and earned days carry forward, up to 90 days in all (choice 33, 22 Oct).
- **AI:** "Before you approve": work due while the person is away and who is free.
- **Requirements:** TEAM-011, RULE-014, AI-009.

### SCR-126 · Comp-off and overtime

- **Preview:** `leave.html#compoff`
- **Layout:** who worked on a leave day or holiday, why, comp-off or overtime pay (chosen per case), expiry (30 days), status.
- **Requirements:** TEAM-012, RULE-015.

### SCR-088 · Workload

- **Preview:** `workload.html`
- **Layout:** this week or next week; per person: load against capacity (dashed line; amber near full, red over), open and late tasks, the week's days (leave and Saturdays shown). Only approved leave and Saturdays off lower capacity; leave still waiting for approval is shown striped and not counted (AUTO-026).
- **Capacity (choice 34, 22 Oct):** worked out from the office hours in HR settings (10:00 am to 7:00 pm, Monday to Saturday: 9 h a day, 54 h a full week), less Saturdays off, half days (a half Saturday is 4 h) and approved leave; a freelancer's weekly hours are set per person (Sanjay 20 h). Sample next week: Karthik 58 of 54 h (107%), Arun 50 (93%), Divya 31 (57%), Rahul 22 (41%; 18 h capacity if his leave is approved), Priya 14 (26%).
- **AI:** suggested rebalance (move tasks, use a freelancer during leave).
- **Requirements:** CORE-046, TEAM-024, AI-009.

### SCR-130 · Hiring openings

- **Preview:** `hiring.html#openings`
- **Layout:** opening, team, where it is posted, applicant funnel, status (open or filled).
- **Requirements:** TEAM-021.

### SCR-131 · Applicants

- **Preview:** `hiring.html`
- **Board:** Applied, Screening, Interview, Offer, Hired (drop here creates the joining checklist), Rejected. Cards: initials, source, experience and skill tags, area, ✦ skills match, next step.
- **Rule:** the AI match compares skills with the job description only; **people decide, AI never rejects anyone.**
- **Requirements:** TEAM-021, AI-009.

### SCR-132 · Applicant

- **Preview:** `applicant.html`
- **Layout:** resume; interviews with ratings and notes; offer (amount, joining date, validity, reply status); Reject, Offer letter, Mark hired.
- **AI:** resume summary and match per skill (never uses age, gender, religion, caste or photos); drafted follow-up on the offer.
- **Requirements:** TEAM-021, TEAM-005, AI-009.

### SCR-133 · Joining and leaving

- **Preview:** `joining.html`
- **Layout:** joiners and leavers with progress; checklist groups: documents, accounts and access (Nexus sign-in, company email within 10 days, vault collection, tools through the vault), equipment, agreements and policies; the leaving template (return items, remove access the same day, hand over tasks, letters, final settlement).
- **Requirements:** TEAM-004, TEAM-008, TEAM-028, TEAM-029, CORE-008.

### SCR-134 · Letters and SCR-246 · HR letters PDF

- **Preview:** `letters.html`
- **Layout:** letter type (offer, appointment, experience, relieving), person, details (designation, joining date, salary, probation), signed by, language; live preview on the letterhead in force on the letter's date; Make PDF; e-sign (with the integrations, step 3.9).
- **Requirements:** TEAM-005, CORE-010.

### SCR-135 · Policies

- **Preview:** `policies.html`
- **Layout:** policy, version and date, acknowledged (bar and count), who has not, Remind or Open.
- **AI:** staff can ask questions answered only from the policies, with the policy named.
- **Requirements:** TEAM-007, AI-016.

### SCR-136 · Company assets

- **Preview:** `assets.html`
- **Layout:** counters (items, issued, in store, needs repair); views by kind; table: item, serial or tag, with whom, issued date, condition, status, Return or Issue.
- **Requirements:** TEAM-008.

### SCR-137 · Goals and performance

- **Preview:** `goals.html`
- **Layout:** quarter; company goals and personal goals with key results, progress bars and owners; reviews due (once a year, on each person's joining anniversary, the same date as the salary review; sample: Karthik due 12 Oct, Divya done 14 Aug, Arun done 3 Jun; choice 36, 22 Oct); training and recognition.
- **AI:** drafts a review from goals, finished tasks and feedback (the manager writes the final one).
- **Requirements:** TEAM-018 to TEAM-020, AI-009.

### SCR-138 · My HR (self-service)

- **Preview:** `my-hr.html` (shown "as Arun"), `phone-team.html` (phone)
- **Header:** code, role, work mode, manager, leave balances, Saturdays left.
- **Tabs:** overview (my requests with status, this month, ask about my HR), leave (apply with half day and balance after, holidays), my documents (upload, status; Aadhaar masked), payslips (filters; from payroll in step 3.7), policies and assets.
- **Requirements:** TEAM-022, TEAM-027, TEAM-028, AI-009.

### SCR-139 · Employee documents check

- **Preview:** `doc-check.html`
- **Layout:** counters (waiting for HR, verified, missing); table of documents; a viewer with a watermark naming who opened it (every opening logged); checks (name matches, readable); Verify or Ask for a new copy; remind people with missing documents.
- **Requirements:** TEAM-025, TEAM-028.

### SCR-197 · HR settings

- **Preview:** `hr-settings.html` with tabs `#work`, `#leave`, `#docs`, `#pay`
- **Work schedule:** working days, start and end (these hours also set workload capacity: 9 h a day; choice 34, 22 Oct), location at check-in (off), late rules (none until added), probation for new joiners set per role (Junior developer 3 months; changeable per person, or none; choice 30, 22 Oct); Saturdays (1 off and 1 half day a month, 2 off in five-Saturday months, each person chooses, a third is warned).
- **Leave:** types with days a year, carry forward (unused casual, sick and earned days all carry forward, up to 90 days in all; choice 33, 22 Oct), half days; approval chains; Tamil Nadu holidays (editable).
- **Documents:** required and optional lists, who uploads, how stored (Aadhaar masked).
- **Payroll rules:** pay day (the 1st; on a Sunday or holiday, the next working day after it; choice 69, 22 Oct); PF, ESI, professional tax and overtime marked **CA to check** before payroll goes live.
- **Requirements:** RULE-013 to RULE-016, TEAM-009 to TEAM-012, TEAM-028.

---

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
