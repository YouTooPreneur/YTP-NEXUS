# Batch 5 · Contracts + Command Centre: screen specs

Step 1.6, batch 5 of 9. **14 screens**, built in step 3.4 (Contracts + Command Centre), plus the phone version of My day. Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 5 section). The side menu's **Contracts & Renewals** now opens the renewals board.
- **AI (✦):** helpers where they save time, always beside the manual way, within the AI limits (D-155, D-156). AI never moves money, never confirms a renewal and never sees passwords.
- **Sample data only.** Nothing saves. Today is Thursday 1 October 2026; tomorrow (2 Oct) is Gandhi Jayanti, a holiday.

## Sample renewals, kept the same on every screen

| Renews | What | Client | Who renews | Where it is now |
|---|---|---|---|---|
| 8 Oct | greenleaforganics.com | Greenleaf Organics | YTP bills (₹1,416) | Invoiced 22 Sep, unpaid, **at risk** |
| 13 Oct | velocitymotors.in SSL | Velocity Motors | Client | Reminded 13 and 28 Sep; confirm task on the date |
| 14 Oct | Hosting | Kaveri Hospitals | Client | Proof received 30 Sep; **waiting for confirmation** |
| 18 Oct | Notice deadline · social media retainer | Meridian Logistics | Agreement auto-renews 18 Nov | Reminders to the owner on 18 Sep, 3 Oct and 11 Oct (30, 15 and 7 days before; choice 50, 22 Oct) |
| 21 Oct | Annual maintenance | Velocity Motors | YTP bills (₹12,000) | Paid 30 Sep; our own service, no vendor step |
| 29 Oct | sharmadental.in domain + hosting | Sharma Dental Care | YTP bills (₹8,850) | Invoice sends itself 2 Oct, 9:00 am (the Owner's send time; holidays included, choices 38 and 47, 22 Oct) |
| 30 Oct | royalcaterers.in SSL | Royal Caterers | Renews itself | The morning check confirms it |
| 6 Nov | Google Workspace, 5 users | Meridian Logistics | YTP bills (₹8,400) | Invoice made 7 Oct |
| 18 Nov | lakshmisilks.in | Lakshmi Silks | YTP bills (₹1,416) | First alert 19 Oct |
| 24 Nov | Hosting share on YTP-HS-01 | Aroma Bakes | YTP bills (₹4,720) | First alert 25 Oct |

**10 renewals in 60 days; ₹36,802 from what we bill.** Confirmed in the last 30 days: brightmindstuition.in (today, by the check), kaverihospitals.com SSL (21 Sep), coastalrealty.in (16 Sep). **Missed renewals this year: 0.**

**This morning's automations (14 runs):** backup 02:00 · domain and SSL check 06:00 (46 domains, 40 SSL, 1 date changed) · expiry moved by the check 06:01 · renewal alerts 06:05 · 3 skipped checks (nothing due) · AMC task for Aroma Bakes 06:10 · daily summaries 07:30 (6 sent, Rahul on leave) · follow-up reminders 08:30 · Velocity Motors monthly bill 09:00 (WhatsApp retried once) · payment reminders skipped · late task reminder 09:05 · Bloom Florists 6-hour lead alert 10:05.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Long dashboard** | The founder and manager dashboards scroll. The first screen keeps the approved style-round-2 layout; more cards follow below. The dark menu stays in place. |
| **Success measures** | A number, its target (green when met, amber when close) and a thin line with a target mark. |
| **Days-left ring** | A ring that fills as a date gets closer: red at 7 days or less and unpaid, amber when someone must act, blue for an invoice step, green when it renews itself, grey beyond 30 days. |
| **Renewal steps** | Five small bars on each renewal card: alerted, invoiced, paid, renewed at the vendor, confirmed. Done is green, now amber, late red, and a dotted bar means the step is not needed (for example, no invoice when the client renews). |
| **Who renews** | A small tag: YTP bills, client renews, or renews itself. |
| **Later-step tag** | A dashed "Step 3.6" tag on parts of a screen that arrive with a later build step. |
| **Signed-in person** | Screens can show the menu and avatar of another person (Arun as Staff, Karthik as Manager); menu groups they cannot open disappear. |
| **Section menu: Contracts** | Renewals board, services sold, agreements, AMC and free maintenance, subscriptions and products. Finance gets **Ad spend**. |

---

## Command Centre

### SCR-020 · Founder dashboard

- **Preview:** `dashboard.html` (scrolls)
- **Top:** date (and tomorrow's holiday), greeting, "14 automations ran this morning · all fine", "Morning summary sent 07:30", ✦ Brief me (reads the attention list aloud; uses the summary already made, so it costs almost nothing).
- **The 4 success measures (CC-008):** missed renewals 0 (target 0); invoices paid within 15 days 82% (target 80%); leads contacted within 24 hours 94% (target 95%, amber); **5-minute morning check**: today's took 4 minutes (07:48–07:52); under 5 minutes for 12 working days in a row.
- **Needs your attention (CC-001, CC-002, CC-003):** one list with filters (all 16, approvals 8, money 2, renewals 2, leads 2, work 2). Approvals can be approved from the list; every row opens its own record. The owner's approvals match the approval inbox (discount for Bloom Florists, Kaveri's new-work invoice, Rahul's 4-day leave, Arun's claim, and 4 more, including Meridian's own bill for the 4 extra Diwali posts, ₹6,000; choice 61, 22 Oct). Every discount and every expense claim is the owner's to approve, so Arun's ₹4,200 claim is simply the owner's (choices 7, 15 and 98, 22 Oct).
- **Sharma's renewal invoice is not an approval any more:** renewals send themselves (FIN-004). The dashboard shows it under "Tomorrow 9:00 am · invoice sends itself" with a **Hold** button (9:00 am is the Owner's send time; holidays included, choices 38 and 47, 22 Oct).
- **Right column:** ✦ "Your morning in 3 lines" with links to the records; today's meetings and follow-ups.
- **Further down:** renewals in the next 30 days; collections (to collect, overdue, ageing bar, who to call first); **risks (CC-004)**: renewals unpaid within 7 days, expired assets (0), clients with escalations, an agreement ended with money still due; revenue for the last 6 months (✦ explain); tasks by status; team today and workload; missing employee documents; YTP's own subscription spend (✦ saving to consider); this morning's automations.
- **Requirements:** CC-001 to CC-005, CC-008, FIN-004, AI-009, AI-010.

### SCR-021 · My day (employee dashboard)

- **Preview:** `my-day.html` (computer, shown as Arun, Staff) and `phone.html` (three phone screens)
- **Header (CC-007):** employee code YTP-003, role, work mode (hybrid, from home today), leave left (casual 5, sick 6, earned 10, comp-off 0, Saturdays 2: October has five Saturdays, so 2 off and no half day).
- **Check-in:** checked in at 09:58 with today's one-line plan; check out.
- **Counters:** tasks (today, done today, in progress, assigned, overdue, done this month) and to-dos (today, important, assigned, overdue, done).
- **Priority tasks** with ✦ suggested order; **meetings**; **to-dos**; **alerts and leave** (late task, a mention, tomorrow's holiday work, a waiting request).
- **Staff see only their own work and no money.** The menu hides Contracts, Finance, Academy, Reports and Settings.
- **Phone:** My day (header, check-in, counters, priority tasks); further down (next meeting with Join, to-dos, leave left, alerts, voice: "What is next for me?"); checked in (style round 2 screen, kept).
- **Requirements:** CC-005, CC-007, TEAM-009 (check-in), AI-009, AI-010.

### SCR-022 · Manager dashboard

- **Preview:** `manager-dashboard.html` (shown as Karthik, Manager; scrolls)
- **Same layout as the founder dashboard, limited to his area (CC-009):** his team (Arun, Divya, Rahul, Priya, Sanjay) and the clients they look after.
- **Measures for his area:** missed renewals of his clients, his leads contacted within 24 hours, team tasks done on time, support replies within 24 hours.
- **Needs you:** his approvals (Divya's half day, Arun's work from home), his lead, late and blocked work, a renewal proof he may confirm, cover for Rahul's leave, and Kaveri Hospitals' overdue invoice YTP/26-27/0038 (₹23,600, 3 days past due), one of his team's clients (choice 48, 22 Oct). Arun's ₹4,200 claim is no longer his to approve: every claim goes to the Owner (choice 7, 22 Oct).
- **Bills and amounts owed for his own clients only** (choice 48, 22 Oct). No company money totals, other clients' money, salaries or LLP figures. The menu hides Finance and Settings.
- **Requirements:** CC-009, CC-001 to CC-003, AI-009.

## Contracts & Renewals

### SCR-053 · Renewals board

- **Preview:** `renewals.html`
- **Top:** next 60 days (10 renewals, ₹36,802 we bill), at risk, proof to confirm, missed this year (0); ✦ "2 need you this week".
- **Lanes:** coming up → invoiced → paid (renew at the vendor) → renewed (confirm with proof) → confirmed (last 30 days). Each card: days-left ring, item and client, who renews, amount, the five steps, and the next step.
- **Rules shown on the board:** a renewal we bill becomes **at risk** when it is unpaid with 7 days or less left; paying or finishing the vendor task **never moves the date**; only the Owner, a Manager or Accounts can confirm, and only then does the date move (RULE-024).
- **Filters:** we bill, client renews, renews itself, agreements. 30, 60 or 90 days. Board or list.
- **Requirements:** CON-007, CON-008, CON-016, AUTO-001, AUTO-002, AUTO-007, AUTO-009, RULE-024, CC-008, AI-009.

### SCR-098 · Confirm renewal

- **Preview:** `renewal-confirm.html` (dialog over the board)
- **Proof:** provider invoice, portal screenshot or the client's proof; the file with who sent and added it.
- **✦ Read from the proof:** provider, plan, paid on, order number, account, valid until; "Use these details". Typing them in stays possible.
- **Dates:** expires now → new expiry date; renewed for 1 year, 2 years or other.
- **What happens:** the date moves; renewal history gets the entry with the proof; next year's alerts are set; the "did the client renew?" task closes.
- **Who:** Owner, Manager or Accounts confirm; anyone else can only add proof.
- **Requirements:** CON-008, CON-009, WEB-014, AUTO-008, RULE-024, AI-009.

### SCR-050 · Services sold

- **Preview:** `services-sold.html`
- **Counters:** active services, monthly retainer income, projects in progress, renewals in 30 days, website clients without AMC.
- **Views by type:** retainers, projects, AMC, domain and hosting, SSL and email, subscriptions, products.
- **Table:** client, service, type, price, billing timing (start of month, end of month, start-date anniversary, stages, yearly), next date, status, agreement.
- **AI:** "Ask about services" (read only).
- **Requirements:** CON-001, CON-003, CON-007, CON-010, AI-009.

### SCR-051 · Service sold

- **Preview:** `service-sold.html` (Anbu Textiles · website)
- **Header:** type, launched, client and contact, the proposal it came from; ✦ summarise for a call.
- **Money:** price, billed, paid, due (overdue and escalated), free care until.
- **Payment stages (CON-004):** each stage tied to signing, a date, a project stage or marked by hand; reaching it makes the invoice, which waits for approval as new work.
- **Billing and renewal:** payment terms for this client; the separate domain and hosting renewal.
- **Free maintenance (CON-005):** three months from the handover, ending on the date in the agreement and shown in the client portal; the AMC offer sends itself 30 days before (✦ personal note).
- **From step 3.6 (tagged):** revisions used (a third round is flagged as extra), change requests (per-client handling), client inputs checklist, support terms with the open issue.
- **Requirements:** CON-001, CON-004, CON-005, CON-011 to CON-014, AUTO-010, AI-009.

### SCR-052 · Agreements and SCR-244 · Agreement PDF

- **Preview:** `agreements.html`; the PDF is `docs-pdf.html#agreement`
- **List:** client, service, how it was agreed (separate agreement or the proposal itself), signature status, version; filters (to sign, auto-renewing, ended).
- **Detail:** key terms (fee, billing, ad spend terms, term, **notice deadline with its reminders 30, 15 and 7 days before** (choice 50, 22 Oct), support and changes); signature (both signed online, with time; other ways: Accept button or a signed copy as proof, D-062); versions with what changed (✦ compare); links to the service, invoices and client.
- **PDF:** agreement number, version and amendment note, numbered terms, both online signatures, "earlier versions are kept".
- **Requirements:** CON-002, CON-003, CON-015, CON-016, D-062, AI-009.

### SCR-054 · AMC and free maintenance

- **Preview:** `amc.html`
- **Free maintenance:** handover date, free until (the agreement's clause), time left, the AMC offer and its answer, status.
- **AMC:** price, what it covers, schedule, support targets, next maintenance (made as a task by the schedule), renewal.
- **AI:** "Who should get an offer?" (goes to the owner only) and a tip to hold Anbu Textiles' offer while ₹28,000 is overdue.
- **Requirements:** CON-005, CON-006, CON-014, AUTO-010, AUTO-021, AI-009.

### SCR-057 · Subscriptions and products sold

- **Preview:** `subscriptions-sold.html`
- **Subscriptions:** client, what, cycle, price, how it is paid (invoice each cycle, autopay chosen by the client once a gateway is connected, or on the retainer invoice), next date.
- **Products:** price, how delivered (licence key, download link, team set-up), status, key or link. A download link works for 30 days after delivery (Lakshmi Silks: delivered 30 Sep, ends 30 Oct; choice 54, 22 Oct). **Licence keys are stored locked, shown masked and opened for 30 seconds with a log entry.** Passwords are never kept.
- **Requirements:** CON-010, CORE-024, AUTO-028, AI-009.

## Finance

### SCR-113 · Ad spend rebilling

- **Preview:** `ad-spend.html` (Finance section menu: Ad spend)
- **Top:** spend we paid, our fees, to bill (after confirming), spend clients paid themselves; month picker; ✦ read a platform invoice.
- **Table:** client, platform, who pays the platform, fee (none, %, fixed or in the retainer), the month's spend and where it came from, fee, bill, status.
- **How a bill is worked out:** spend ₹20,000 + 10% fee ₹2,000 = ₹22,000; GST added from the registration date. A bill waits until the spend is confirmed, then sends itself like other monthly bills. The spend fills in by itself once the ad platform doors are connected (step 3.9).
- **Requirements:** FIN-017, CON-015, FIN-004, AI-009.

## Settings

### SCR-170 · Automations

- **Preview:** `automations.html` (Settings → new **Automations** group)
- **Engine status:** running, last check, nothing missed; rules on and always on; runs today, retried, failed; **dry run** switch (log only, change nothing).
- **Table:** rule and what it does, area, when, last run, result, next, on/off. Monthly bills and payment reminders run at the **send time the Owner sets** (sample 9:00 am), every day including holidays; payment reminders go by email and WhatsApp (choices 18, 38 and 47, 22 Oct). **Two rules are always on:** expiry dates move only with proof, and the daily backup.
- **Views by area**, and "later steps" for the 20 automations that arrive with projects, sales, reports and integrations. **New rule** (When → If → Do) comes in step 3.8.
- **Requirements:** CORE-070 to CORE-072, AUTO-001 to AUTO-012, AUTO-014, AUTO-015, AUTO-021, AUTO-028, AUTO-029, AUTO-033, AUTO-034, AUTO-037, CON-016, AI-009.

### SCR-172 · Run history

- **Preview:** `run-history.html`
- **List:** every run today with time, rule, what it did, result (done, skipped, retried, failed) and how long it took; views; any day.
- **One run, step by step:** the Velocity Motors monthly bill: invoice made, PDF emailed, WhatsApp timed out, retried, sent once. **Run key:** running again never makes or sends anything twice.
- **AI:** "In plain words" explains an error.
- **Requirements:** CORE-070, AUTO-003, AI-009.

---

## Questions answered

1. **"The morning check" (CC-008)** is the **5-minute morning check** from the owner's answers of 30 Sep: the owner's morning review on the dashboard takes 5 minutes or less. The dashboard shows today's time and the run of days under 5 minutes. CC-008 is reworded.
2. **Money on the manager dashboard** (answered again 22 Oct, choices 7 and 48): a manager sees the bills and amounts owed of their own clients only, approves no expense claims (the Owner approves every claim), and never sees company totals, other clients' money, salaries or LLP figures.

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
