# Batch 7 · Sales + Payroll: screen specs

Step 1.6, batch 7 of 9. **11 screens**, built in step 3.7, plus the proposal view of the secret-link page and a phone page. Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 7 section). CRM now has a section menu (leads and clients, pipeline, proposals, campaigns, broadcasts); Finance gets **Payouts**; the Team page gets a **Payroll** button.
- **Owner's answers used here (round 38):** payslips show a salary breakdown (D-164); PF, ESI and professional tax stay off until the CA confirms (D-165); AI drafts the first version of a proposal (D-166); broadcasts go by email and WhatsApp with a cost check and the owner's OK (D-167).
- **Sample data only.** Today is Thursday 1 October 2026; September salaries were paid today.

## Sample sales and pay, kept the same on every screen

| Proposal | Client | Value | Where it is |
|---|---|---|---|
| Q-2026-024 | Sri Lakshmi Traders · website + local SEO | ₹90,000 | AI draft from today's discovery call |
| Q-2026-023 | Bloom Florists · SEO 6 months | ₹38,250 (15% off ₹45,000) | Draft, not sent; discount waiting for the Owner |
| Q-2026-022 | Ganga Jewellers · ads | ₹60,000 | Sent 30 Sep · opened today |
| Q-2026-021 | Lotus Yoga Studio · social | ₹55,000 | Not opened · ends 8 Oct |
| Q-2026-020 | Velocity Motors · ads + videos | ₹1,20,000 | Opened 2 times |
| Q-2026-019 | Urban Nest Interiors · website | ₹85,000 | Version 2 goes today 14:00 |
| Q-2026-018 / 017 / 016 | Sunrise Clinic, Royal Caterers, Greenleaf Organics | ₹1,20,000 · ₹70,000 · ₹80,000 | Accepted in September (button, online signature, marked by hand) |

The 4 sent proposals add up to the pipeline's "Proposal sent" ₹3,20,000; the forecast ₹3,58,000 matches the pipeline. **Sunrise Clinic is now in the pipeline's Won lane** (won 29 Sep; its advance invoice draft was already in Finance), so "won in the last 30 days" is ₹2,70,000 from 3 deals. The pipeline's new lead "Aroma Bakes" is renamed **Thendral Sweets**, because Aroma Bakes is an existing client with a website project.

**September payroll:** 6 employees, gross ₹1,60,808, Karthik's incentive ₹2,400, Rahul's advance recovery ₹2,000, **net ₹1,61,208**; 5 paid on 1 Oct by the HDFC bulk file (₹1,58,900); Priya's ₹2,308 waits for her bank proof (it is on the missing documents list). Arun's net pay ₹31,400 matches My HR. Finance's "paid out" chart now says that salaries are counted in Payroll.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Section menu: CRM** | Leads and clients, pipeline, proposals, campaigns, broadcasts. |
| **AI first draft** | A mint banner on a draft says what AI used and that nothing is sent until a person presses Send; "What it used" and "Redo" sit beside it. |
| **Client-facing pages** | Secret-link pages (pay, proposal, testimonial, unsubscribe) share one look: brand band, language switch (only checked languages: English and Tamil in the sample; choice 11, 22 Oct), white cards, big buttons, a footer saying who the link is for and when it stops working. |
| **Cost before sending** | A warm box lists each channel's cost and the total before the owner approves. |
| **Consent counts** | Three boxes: who matches, who agreed and will get it, who is skipped. |
| **Salary breakdown** | A split bar (Basic, HRA, allowances) above the figures; deductions shown as Off until the CA confirms. |

---

## Sales (CRM)

### SCR-037 · Proposals

- **Preview:** `proposals.html`
- **Counters:** sent and waiting, drafts, discount waiting for approval, accepted this month, expiring this week.
- **Table:** number, client and work, value (with the discount shown), status, seen (opened, not opened), valid until (with the reminder date), owner.
- **Forecast for October** by pipeline stage; ✦ suggests a WhatsApp nudge for an unopened proposal.
- **Requirements:** CRM-015, CRM-016, CRM-017, CRM-021, FIN-023, RULE-011, AUTO-036, AI-009.

### SCR-038 · Proposal builder, the proposal by secret link and SCR-243 · Proposal PDF

- **Preview:** `proposal-edit.html`, `proposal-link.html` (client view), `docs-pdf.html#proposal`, `phone-sales.html`
- **Builder:** ✦ first version drafted from the discovery call and the service templates (D-166) with "What it used" and "Redo"; client, validity (15 days by default), language; services with custom prices; discount (needs approval); GST shown as not registered yet; **terms for this client** (payment stages, revision rounds, change requests, free maintenance, "the accepted proposal is the agreement"); how the client can accept; case study and testimonial to show; live preview.
- **Client view:** what they get, total, how they pay, how we work, recent work; **Accept** (name, date and time recorded), sign online, ask on WhatsApp, download the PDF; English or Tamil. **After the valid-until date** the link still opens, shows "Expired" (the old prices can't be accepted) and offers a button to ask for a new proposal (choice 65, 22 Oct).
- **Accepting wins the deal:** client, services sold, project and the advance invoice draft are made by themselves.
- **Requirements:** CRM-015, CRM-016, CRM-017, FIN-023, RULE-011, RULE-023, CON-002, CON-005, D-062, NFR-022, AI-009.

### SCR-040 · Campaigns

- **Preview:** `campaigns.html`
- **Table:** campaign, where, service, budget, spent, leads, cost per lead (green, amber, red), deals won and revenue, status; a broadcast shows as a campaign too.
- **Leads by source** for the month. Spend is typed in until the ad platforms are connected (3.9). ✦ "Which works best?"
- **Requirements:** CRM-020, CRM-021, AI-009.

### SCR-041 · Broadcasts and SCR-232 · Unsubscribe and preferences

- **Preview:** `broadcasts.html`, `unsubscribe.html` (public), `phone-sales.html` (owner approves)
- **List:** each broadcast with its results (sent, delivered, read or opened, replied or clicked, stopped).
- **Compose:** who gets it (segment; matches, agreed, skipped), message (✦ write; WhatsApp needs a template approved by Meta), when (spread out to stay within provider limits) and **cost** (email free, WhatsApp per message), then **Approve and schedule** by the Owner (D-167). Test mode sends everything to the owner's test inbox.
- **Unsubscribe page:** offers by email and by WhatsApp can be switched off; invoices, renewals and project updates always come; language; the choice is saved with the date.
- **Requirements:** CRM-026, AUTO-040, RULE-021, NFR-022, AI-009.

## Payroll and payouts

### SCR-114 · Payouts

- **Preview:** `payouts.html` (Finance section menu: Payouts)
- **Kinds:** freelancers (rate per task, reel, day or project; a finished task makes the payout due) and referral partners or influencers (commission per deal, due when the client pays).
- **Table:** person, kind, for, basis, amount, status (planned, due, waiting for the client, paid), paid date and reference. TDS is off until the CA confirms.
- **Requirements:** FIN-019, TEAM-017, CRM-025.

### SCR-127 · Payroll run

- **Preview:** `payroll.html`
- **Steps:** calculate → review → approve (Owner) → payslips (emailed and in My HR) → bank list (bulk upload file) → mark paid.
- **Table:** paid days, gross, added (incentives, bonuses, overtime), taken off (advance recovery, loss of pay), net pay, paid. One person waits for missing bank proof.
- **Side:** the bank file, year to date for the chosen person, what is already added to the next run. ✦ "What changed?" from last month.
- **Pay day (choice 69, 22 Oct):** the 1st; when the 1st is a Sunday or holiday, pay goes on the next working day after it. October pay: 1 Nov is a Sunday, so Mon 2 Nov.
- **Requirements:** TEAM-013, TEAM-015, TEAM-016, RULE-016, D-164, D-165, AI-009.

### SCR-128 · Salary structures

- **Preview:** `salary.html`
- **List of people** with monthly gross and the last change; **the chosen person's breakdown** (Basic 50% of gross, HRA 40% of Basic, special allowance the rest, following the "Standard" template the CA confirms) and deductions (all off for now); **revisions and appraisals** with dates, ratings and percentages; next review; last opened (every opening is logged).
- **Review date (choice 73, 22 Oct):** each person's salary is reviewed on their joining anniversary, with new pay from that date (not everyone on 1 April). Sample: Arun joined 3 Jun 2024, reviewed 3 Jun 2025 (₹28,000) and 3 Jun 2026 (₹31,400), next 3 Jun 2027, so his Apr–Sep year to date in Payroll and on the payslip is ₹1,81,338 (April and May ₹28,000; June ₹31,138: 1 and 2 Jun at the old pay and the other 24 working days at the new, one day's pay being the monthly gross ÷ 26; July to September ₹31,400); the list shows Karthik Oct 2025, Divya Aug 2026, Rahul Jan 2026, Meena Apr 2026. The performance review falls on the same date (choice 36).
- **Requirements:** TEAM-013, TEAM-014, RULE-016, D-164, D-165.

### SCR-129 · Advances, bonuses and incentives

- **Preview:** `advances.html`
- **Advances** with the recovery plan; **bonuses and incentives** with approval (the Diwali bonus waits for the Owner); **overtime** chosen instead of comp-off (one day's pay = monthly gross ÷ 26).
- **Requirements:** TEAM-015, TEAM-016, TEAM-013, RULE-015.

### SCR-245 · Payslip PDF

- **Preview:** `docs-pdf.html#payslip`, `phone-sales.html` (in My HR)
- **Contents:** employee and code, bank and PAN masked, paid days and leave, earnings, deductions (off), net pay in figures and words, year to date.
- **Requirements:** TEAM-013, TEAM-022.

---

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
