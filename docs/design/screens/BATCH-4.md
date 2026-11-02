# Batch 4 · WebCare + Finance: screen specs

Step 1.6, batch 4 of 9. **32 screens**, built in step 3.3 (WebCare + Finance), plus one phone page. Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 4 section) and the phone page `phone-money.html`.
- **AI (✦):** helpers where they save time, always beside the manual way, within the AI limits (D-155, D-156). AI never moves money, never deletes and never sees passwords.
- **Sample data only.** Nothing saves.

## Sample money, kept the same on every screen

Today is Thursday 1 October 2026. GST is applied for but not registered, so every invoice is a plain invoice (no GST) until the registration date.

| Invoice | Client | Issued | Amount | Balance | State |
|---|---|---|---|---|---|
| YTP/26-27/0033 | Anbu Textiles | 28 Aug | ₹48,000 | ₹28,000 | Part paid, 34 days, escalated |
| YTP/26-27/0036 | Coastal Realty | 2 Sep | ₹12,000 | ₹12,000 | 29 days, client on hold, credit note draft ₹6,000 |
| YTP/26-27/0038 | Kaveri Hospitals | 13 Sep | ₹23,600 | ₹23,600 | 15-day terms, 3 days past due |
| YTP/26-27/0040 | Meridian Logistics | 18 Sep | ₹35,000 | ₹35,000 | Due 3 Oct |
| YTP/26-27/0042 | Greenleaf Organics | 22 Sep | ₹1,416 | ₹1,416 | 9 days; the domain ends 8 Oct |
| YTP/26-27/0044 | Lakshmi Silks | 30 Sep | ₹24,000 | ₹24,000 | Due 15 Oct |
| YTP/26-27/0045 | Velocity Motors | 1 Oct | ₹15,000 | ₹15,000 | Monthly bill, sent by itself today |

**To collect ₹1,39,016 · overdue ₹65,016.** Collected in September ₹1,51,650 (7 payments) plus ₹1,850 TDS. Waiting for approval ₹15,650 (Kaveri clarity-session invoice ₹2,500, Meridian's own bill for 4 extra Diwali posts ₹6,000 (choice 61, 22 Oct), Arun's claim ₹4,200, Shutterstock bill ₹2,950). Bills still to pay ₹38,500. The dashboard, leads list, Ask Nexus and approval inbox were updated to match.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Section menu** | A row of pill links under the top bar for big areas. Finance: overview, invoices, payments, collections, vendors and bills, expenses, YTP subscriptions, LLP partners (locked), settings. WebCare: digital assets, expiry monitor, servers and hosting, provider accounts, technical dossiers, handovers. |
| **Money in tables** | Amounts right-aligned with equal-width digits, always in the text colour; balances due in red; totals in a shaded footer. |
| **Ageing bar** | One stacked bar for unpaid money by age (0–7, 8–15, 16–30, over 30 days) with labelled boxes under it. |
| **Flow** | Numbered steps with done (green), now (amber) and waiting (grey). Used for renewals with evidence and handovers. |
| **Document pages** | A4 previews on a soft background: letterhead, document title and number, parties, table, totals, payment box with a UPI QR code, footer. Paid and draft stamps. |
| **Dialog over a page** | The page fades behind a centred dialog (record payment, correct expiry date). |

---

## WebCare

### SCR-090 · Digital assets

- **Preview:** `webcare.html`
- **Layout:** counters (assets, expiring in 30 days, at risk, client renews to confirm, last automatic check); views by type (websites, domains, hosting, SSL, social pages, ad accounts, Google Business); table: asset, client, held in (YTP account or client account), provider, expires (checked today), status, login (vault link).
- **AI:** "Ask about assets" (never sees logins).
- **Requirements:** WEB-001, WEB-002, WEB-004, WEB-009, WEB-011, AI-009.

### SCR-091 · Asset

- **Preview:** `asset.html` (a website: sharmadental.in)
- **Header:** type, online status, platform, server, client, who looks after it; Correct expiry date, Start handover, Log maintenance.
- **Renewal flow:** invoice → client pays → renew at the vendor (task) → confirm with the provider's invoice as evidence → new expiry. **Paying or finishing the task never moves the date** (RULE-024).
- **Technical:** platform, theme, PHP, plugins (updates), DNS, email, SSL; link to the dossier.
- **Domain and hosting:** registrar and account, expiry checked today, server and since when, provider account; **client pays / our cost / margin** (cost uses this site's share of the shared hosting, recorded once on the server; the share follows the disk the site uses: sharmadental.in 6 GB of 124 GB = ₹968 of ₹19,999, so our cost ₹2,067 and margin ₹6,783; choice 40, 22 Oct).
- **Logins:** vault links only, with owner and last verified date; opening one is logged.
- **Maintenance log** (✦ summarise for the client report), **backups** (daily, restore tested), **issues**.
- **Requirements:** WEB-001 to WEB-009, WEB-014, FIN-016, RULE-024, RULE-025, AI-009.

### SCR-093 · Servers and hosting

- **Preview:** `servers.html`
- **Layout:** servers and hosting accounts on the left (shared, VPS, client-owned); the chosen one on the right: renews, cost recorded once, how clients are billed, the bill split across the sites by the disk each uses (each site's disk and cost share; the 12 shares add up to ₹19,999; choice 40, 22 Oct); **one renewal, one alert** (dates listed) that names every site; sites on the account with from and to dates (placement history); disk and site counts.
- **Rule:** clients never see shared logins or other clients on the same account.
- **Requirements:** WEB-010, FIN-016, FIN-018.

### SCR-094 · Expiry monitor

- **Preview:** `expiry.html`
- **Layout:** domains and SSL checked today, expiring in 30 days, changes found today; a 30-day strip; a list with days-left rings, who renews (YTP after payment, client, or renews itself) and the next step; changes found by the check (a client renewed elsewhere: the registry date is the evidence, no invoice is created); uptime shown as a ready slot (step 3.9).
- **Requirements:** WEB-004, WEB-005, AUTO-029, RULE-007, RULE-024.

### SCR-095 · Asset handover

- **Preview:** `handover.html`
- **Layout:** flow (choose assets, before the transfer, transfer, handover document); checklist: final backup, all invoices paid, client sets their own password, domain moved, analytics ownership, website moved, placement ended, YTP access removed and vault items archived; the handover document card.
- **Requirements:** WEB-012, RULE-025.

### SCR-096 · Technical dossiers

- **Preview:** `dossier.html`
- **Layout:** sections (how it is built, DNS and email, access, restore a backup, known issues, change notes); access written as vault links; staff with WebCare access only; history.
- **AI:** "Ask this dossier" (answers name their section; never shows logins).
- **Requirements:** WEB-013, WEB-009, RULE-025, AI-009.

### SCR-097 · Provider accounts

- **Preview:** `providers.html`
- **Layout:** banner when an account has two-step sign-in (MFA) off; table: account (registrar, hosting, DNS; YTP or client), owner, recovery email, MFA status, assets inside, vault link. Advice to use company recovery emails.
- **Requirements:** WEB-016, WEB-009.

### SCR-099 · Correct expiry date

- **Preview:** `expiry-fix.html`
- **Layout:** dialog: the date in Nexus (struck through) and the correct date; reason (required); evidence (required); what happens (no renewal, invoice or payment; saved in history; tomorrow's check confirms). Owner and Managers only.
- **Requirements:** WEB-017, RULE-024.

### SCR-248 · Handover document PDF

- **Preview:** `docs-pdf.html#handover`
- **Content:** what was handed over, where it now lives, who owns each account, last backup, logins (never written), support after handover, signatures.
- **Requirements:** WEB-012.

## Finance

### SCR-100 · Finance overview

- **Preview:** `finance.html`
- **Layout:** to collect, overdue, collected in the month, waiting for approval; ageing bar; money in and out for 6 months; "needs you" list (approvals, calls, risks, tomorrow's automatic invoices).
- **AI:** "Explain this month" and a short monthly summary.
- **Requirements:** FIN-009, FIN-004, RULE-008, AI-009.

### SCR-101 · Invoices

- **Preview:** `invoices.html`
- **Layout:** views (drafts, waiting for approval, unpaid, overdue, paid, credit notes); series filter (YTP clients, YTA Academy later); table: number (drafts show "No number yet"), client and work, issued, due, amount, balance, status, age; totals.
- **Requirements:** FIN-001 to FIN-005, FIN-009, RULE-003, RULE-004, RULE-009.

### SCR-102 · Invoice editor

- **Preview:** `invoice-edit.html`
- **Layout:** client, place of supply, payment terms, contact; lines from services with SAC, quantity, rate; subtotal, GST (none before registration; CGST + SGST in Tamil Nadu or IGST elsewhere after it), round off, total; **agreement value / invoiced before / this invoice / remaining after**; bank or UPI account; online payment link; live preview with the UPI QR.
- **Actions:** save draft; **submit for approval** for new and one-time work, or send for renewals and monthly bills.
- **AI:** fill from the agreement; checks before sending (stage amount, state and GST, sending rule).
- **Requirements:** FIN-001 to FIN-006, FIN-008, FIN-020, RULE-002 to RULE-006, RULE-009, AI-009.

### SCR-103 · Invoice (issued)

- **Preview:** `invoice.html`
- **Layout:** number, status and age; amount, paid, balance; lines; **locked** note (issued invoices never change; credit note instead); what happened (issued, opened by the client, reminders, AI draft waiting, next reminder, escalation date); linked asset at risk; secret link (copy, expiry, opens); payments and credit notes.
- **Actions:** PDF, client's view, send reminder, record payment.
- **AI:** suggested next step (call when opened but unpaid).
- **Requirements:** FIN-001, FIN-003, FIN-007, FIN-009, AUTO-004, AUTO-005, RULE-005, AI-009.

### SCR-104 · Record payment

- **Preview:** `payment-record.html`
- **Layout:** dialog: how it was paid (UPI, bank transfer, cash, cheque, Razorpay), date, reference, amount received, TDS (with section), balance after, TDS certificate later, duplicate check; the receipt goes out by itself and reminders stop.
- **AI:** reads a pasted bank or UPI message and matches the invoice (TDS included).
- **Requirements:** FIN-007, FIN-011, FIN-013, AUTO-006, AI-009.

### SCR-105 · Credit note

- **Preview:** `credit-note.html`
- **Layout:** against which invoice, reason, note for the client, line and amount, reduce what they owe or refund, balance after; own series (number on issue); credit notes this year.
- **Requirements:** FIN-003, RULE-005.

### SCR-106 · Client statement

- **Preview:** `statement.html`
- **Layout:** period; table with opening balance, invoices, payments (with TDS), running balance, closing; totals (billed, received, TDS, still to pay); TDS certificates by quarter; PDF and send in the client's language.
- **Requirements:** FIN-010, FIN-011.

### SCR-107 · Payments and receipts

- **Preview:** `payments.html`
- **Layout:** month; a payment seen in the bank but not yet matched (✦ likely client) with Match; table: date, receipt number, client and invoice settled, how, reference, amount, TDS; month total.
- **Requirements:** FIN-007, FIN-008, FIN-011, AUTO-006, AI-009.

### SCR-108 · Collections

- **Preview:** `collections.html`
- **Layout:** ranked list (who to call first): client, invoice, contact and language, reminder steps (day 7, day 15, escalation point), amount and age, actions; coming due; rules (reminders, escalation per client, email and WhatsApp in the client's language (choice 18, 22 Oct), **no late fees**, test mode).
- **AI:** plan today's calls; draft a message in the client's language (sent only after approval).
- **Requirements:** FIN-009, AUTO-004, AUTO-005, RULE-008, AI-009.

### SCR-109 · Vendors and SCR-110 · Vendor bills and payments

- **Preview:** `vendors.html` (bills) and `vendors.html#vendors`
- **Bills:** duplicate transaction blocked banner; table: date, vendor and what for, amount (**original currency with provisional rupees until the statement, then the actual**), approval, paid (split payments shown), bill file; still to pay.
- **Approval:** every bill needs the Owner's approval, repeating card bills too; nothing is pre-approved. The October DigitalOcean card bill shows "Approved" (the Owner approved it at 9:15 am) (choice 41, 22 Oct).
- **Vendors:** name, category (registrar, hosting, ad platform, freelancer, other), GSTIN, paid this year; detail: bills, paid with, account, assets it is used for.
- **AI:** read a bill PDF or photo; warn about duplicates.
- **Requirements:** FIN-012, FIN-013, FIN-016, FIN-018, FIN-022, AI-009.

### SCR-111 · Expenses and claims

- **Preview:** `expenses.html` (computer), `phone-money.html` (phone)
- **Layout:** views (waiting, to pay back, company expenses, my claims); table: date, what, category, who, amount, status; a claim panel with the receipt, category and client, Approve / Ask a question / Reject.
- **Rules:** the Owner approves every claim (no manager limit); approved claims are always paid back by bank transfer within a set number of days (Finance settings, sample 7 days); no "with the next salary" option (choices 7 and 42, 22 Oct).
- **AI:** reads the receipt photos and checks the total.
- **Requirements:** FIN-014, FIN-022, CORE-075, AI-009.

### SCR-112 · YTP subscriptions

- **Preview:** `subscriptions.html` with tabs `#cards`, `#calendar`, `#spend`
- **Layout:** this month, a year at this rate, renewing in 7 days, paid in US dollars; cards (plan, price and cycle, renews, for clients or internal, autopay, vault link); a calendar of renewals; spending by category, top 5, by cycle.
- **AI:** spot savings (for example unused seats) — you decide.
- **Requirements:** FIN-015, AUTO-034, RULE-025, AI-009.

### SCR-115 · LLP partners and shares and SCR-116 · Partner money

- **Preview:** `partners.html` and `partners.html#money`
- **Banner:** LLP registration in progress; shares provisional until the agreement date; profit provisional until the CA confirms.
- **Shares:** each partner's contribution %, profit share %, capital and current account; shares by date (a new split from a date keeps earlier periods).
- **Money:** investments, withdrawals and distributions with proof; **withdrawals and distributions need both partners' approval** (shown per partner).
- **Who:** the Owner and LLP partners only. "Partner 2" is a sample name until the real details are added.
- **Requirements:** FIN-025 to FIN-028, RULE-026.

### SCR-117 · Partner statement and SCR-253 · Partner statement PDF

- **Preview:** `partner-statement.html`
- **Layout:** partner and period; "adds up" summary; the statement document: opening, distributions, withdrawals, share of profit, closing, split into capital and current; marked provisional.
- **Requirements:** FIN-029, FIN-031, RULE-026.

### SCR-118 · Partner dashboard

- **Preview:** `partner-dashboard.html`
- **Layout:** revenue, expenses and profit for the quarter, profit for the year so far; by quarter chart; bank, cash, to receive, to pay; the quarter's profit shared by the agreed split with each partner's capital and current account; same figures for both partners.
- **AI:** explain the quarter (read-only).
- **Requirements:** FIN-030, FIN-031, AI-009.

### SCR-198 · Finance settings

- **Preview:** `finance-settings.html` with tabs `#bank`, `#invoices`, `#reminders`, `#gst`, `#payments`
- **Bank and UPI:** the account money is paid into (one now, more later), who can see full numbers.
- **Invoices:** financial year, default payment terms and per-client terms, round off, amounts in paise, sending rule (renewals and monthly bills automatic; new work after approval); **send time** for automatic bills, set by the Owner (sample 9:00 am), every day including Sundays and holidays (choices 38 and 47, 22 Oct).
- **Reminders:** days after the invoice date, default escalation, no late fees (locked), channel (email and WhatsApp; a client's own preference wins; choice 18, 22 Oct), the same send time as bills, per-client escalation, paused clients.
- **GST:** registration status and date (from Company profile), our state, foreign clients (CA to confirm), rates by service.
- **Online payments:** Razorpay test mode, other gateways as ready slots, part payments, currencies, TDS, and the days to pay back approved staff claims by bank transfer (sample 7 days) (choice 42, 22 Oct).
- **Requirements:** RULE-001 to RULE-009, FIN-004, FIN-008, FIN-018, FIN-020.

### SCR-230 · Secret-link document

- **Preview:** `pay-link.html` (computer), `phone-money.html` (phone)
- **Layout:** public page, no login, in the company colour; the amount due and the lines; a warning when a linked domain is about to expire; pay by any UPI app (QR), online with Razorpay, or bank transfer; download the PDF; "already paid? send proof"; English or Tamil; the link shows only this invoice and expires. The same page type shows proposals with Accept in batch 7.
- **Requirements:** FIN-001, FIN-008, CRM-016, NFR-022.

### SCR-240 · Invoice PDF, SCR-241 · Credit note PDF, SCR-242 · Payment receipt PDF

- **Preview:** `docs-pdf.html` with tabs `#invoice`, `#tax`, `#credit`, `#receipt`
- **Invoice (now):** plain invoice, "not registered under GST yet", amount in words, UPI QR, payment link and bank details.
- **Tax invoice (after GST):** our GSTIN, place of supply, taxable value, CGST 9% + SGST 9% (IGST 18% for other states), round off.
- **Credit note:** draft stamp, "number given when issued", against which invoice, balance after.
- **Receipt:** paid stamp, invoice settled, how paid, reference, amount in words.
- **Requirements:** FIN-001, FIN-003, FIN-007, RULE-002 to RULE-006.

---

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
