# Batch 8 · Portals, Reports, API, AI: screen specs

Step 1.6, batch 8 of 9. **23 screens**, built in step 3.8 (portals, reports, API, AI) and step 3.9 (website forms), plus the client report view of the PDF page and a phone page. Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 8 section). The side menu's **Reports** now opens its screens; CRM gets **Live chat**; Settings gets a **Connections** group (integrations, API keys and MCP, website forms, client chatbot) and a **Client portal** tile (opens the portal as a client sees it; each contact's access is set on the client, SCR-033), and now scrolls. The voice button in the search box opens the voice assistant.
- **Built without a question round** (owner, "do all remaining batches"). The owner answered the open points afterwards (round 43, D-168 to D-171); the screens follow those answers.
- **AI (✦):** always beside the manual way, within the AI limits (D-155, D-156). Nothing goes to a client by itself.
- **Sample data only.** Today is Thursday 1 October 2026. Amounts are for layout; they are not meant to add up to a real profit and loss.

## Sample world, kept the same on every screen

| Who | Where they appear | Facts |
|---|---|---|
| **Kaveri Hospitals · Dr. Rao** | Client portal (most pages), client report PDF | Invoice YTP/26-27/0038 ₹23,600, 3 days past due; paid this year ₹90,100 (3 invoices, with TDS); TDS ₹9,010 (Jul–Sep Form 16A due 15 Nov); website care ₹23,600 a quarter since 1 Apr 2025, next bill 31 Dec; hosting on the client's GoDaddy renews 14 Oct (proof received); SSL renews itself 19 Dec; website redesign ₹1,20,000 in the Design stage, launch 5 Nov, client sees stages only; doctor videos 3 of 6 sent 29 Sep; support SR-0151 (old phone number, raised today 10:20 am, fix by Mon 5 Oct); quote CR-4 online booking ₹15,000; GST number change asked 30 Sep |
| **Royal Caterers · Mr. Ganesh** | Content approvals, in Tamil | Navaratri reel for Mon 5 Oct 18:00 waiting for approval; 6 of 12 launch posts published, 2 scheduled, 3 being made |
| **Aroma Bakes · Ms. Nithya** | Files we need | 2 of 4: logo files (asked 26 Sep) and "About us" text missing; 36 menu photos uploaded in the portal; domain access by vault link |
| **Velocity Motors** | Client results, client reports, voice | Ads: September ₹46,000 spend, 131 leads, ₹351 a lead (target under ₹400), 29 test drives, 7 cars sold; Meta ₹318 vs Google ₹448 a lead |
| **Arvind Opticals · Mr. Arvind** | Live chat, phone | New WhatsApp lead made by the chatbot; asked for a discount, so the chat went to Karthik |
| **YTP figures** | Reports, Partner dashboard | Client services Jul–Sep ₹4,85,000 (↑ 14% on Apr–Jun ₹4,25,000); vendor costs ₹62,400; margin 87%; recurring ₹1,10,000 a month = 8 retainers (as in Services sold); collected ₹4,72,750 (as in the dashboard trend). **Whole company** with the Academy: revenue ₹10,25,000, salaries ₹4,80,208 (the Jul, Aug and Sep payroll runs; Payroll shows September, ₹1,61,208), profit after salaries ₹2,00,000 (as in the Partner dashboard) |

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Portal frame** | Dark band with the YouTooPreneur mark, the portal menu (Home, Invoices, Services, Projects, Content, Support, Files we need, Proposals, Documents), a language switch with the languages that are open (EN / தமிழ் in the sample; Hindi, Malayalam and Telugu are added to the switch once a native speaker has checked each one, choice 11, 22 Oct) and the signed-in person. In Tamil, the menu and page text are in Tamil. Pages scroll and work on a phone. |
| **Portal cards** | Four number cards, "Needs you" rows with one clear button, stage bars, people on the work, and a footer saying what this person can see. |
| **Report layout** | Filters (period, compare with, service, client, owner), number cards, a chart, the table with change and margin bars, an AI note, export and schedule. The same layout serves every report area. |
| **Rule blocks** | WHEN (blue) → IF (amber) → DO (green) blocks on a grid, with a dry run that changes nothing. |
| **Voice view** | Hold-to-talk panel with the minutes used, the words heard (with an English line for Tamil), what Nexus will do as a filled form, Confirm / Change / Cancel. |
| **Chat bubbles** | Client on the left; AI on the right with the AI edge; a person in dark green; grey and red system lines for hand-overs. |

---

## Reports

### SCR-160 · Reports home

- **Preview:** `reports.html`
- **Ten areas** (company, sales, revenue and profitability, billing and collections, renewals, projects, support, infrastructure, HR, Academy), each with its key figure and the reports inside; a lock shows the ones only some roles can open. Revenue and profitability is for the Owner and LLP partners only; Accounts gets billing and collections (₹1,39,016 to collect, ₹65,016 overdue) (choice 81, 22 Oct).
- **Side:** scheduled reports; client results and client reports; ✦ ask about any report (read only).
- **Requirements:** RPT-001 to RPT-012, AI-009.

### SCR-161 · Report

- **Preview:** `report.html` (revenue and profitability, Jul–Sep against Apr–Jun)
- **Filters**, **number cards** (revenue, vendor costs, margin, recurring a month, collected and outstanding), **billed and collected by month**, **top clients**, **by service** with change, vendor costs and margin.
- **Margins by service** are after vendor and freelancer costs. **Profit after salaries** for the whole company (services and Academy) is at the bottom, shown only to the Owner and LLP partners; it matches the Partner dashboard (D-171).
- **Export** (PDF, Excel) and **schedule** (1st of each month). This report opens only for the Owner and LLP partners; Accounts gets the billing and collection reports instead (choice 81, 22 Oct).
- **Requirements:** RPT-003, RPT-010, RPT-011, RPT-012, AI-009.

### SCR-067 · Client results

- **Preview:** `client-results.html`
- **A list of clients** with what each service measures (a setting); **Velocity Motors ads** by month: spend, leads, cost per lead against the target, test drives, cars sold (from the client), the platform split, who entered it and from where.
- **Typed in** until the ad, analytics and social doors are connected (step 3.9). ✦ a short summary for the client.
- **Requirements:** PRJ-014, AI-009.

### SCR-068 · Client reports and SCR-249 · Client report PDF

- **Preview:** `client-reports.html`, `docs-pdf.html#report`
- **Schedules** per client (when, by email, portal or WhatsApp PDF, next date, status); the Velocity draft waits for a person's check, with ✦ the summary draft; the Kaveri report was sent today and opened in the portal.
- **Builder:** sections on or off (summary, uptime and backups, visits and calls, work done, next month, invoices), language, template, who checks it.
- **PDF:** Kaveri Hospitals website report for September: summary, six numbers, visits by month, most visited pages, requests fixed, next month.
- **Requirements:** PRJ-015, RPT-011, AI-009.

## Client portal

All portal pages are at `portal-*.html`. Kaveri Hospitals is the sample client unless noted.

### SCR-200 · Portal login

- **Preview:** `portal-login.html`
- **A 6-digit code** by email or WhatsApp, no password; works 10 minutes and once; keep this device for 30 days. Only people the company added can sign in; each sees their own company only.
- **Requirements:** CORE-007, POR-001, NFR-022.

### SCR-201 · Portal home

- **Preview:** `portal-home.html`
- **Number cards:** open requests, work in progress, to pay, paid this year (matching the invoices, with TDS).
- **Needs you:** approve 3 videos, pay an invoice, a quote. **Agreements card:** type, fee, start, end (an expired one shows a warning). **Coming up**, **latest from us**, **your team**.
- **Requirements:** POR-001, POR-004, POR-011.

### SCR-202 · Invoices and payments

- **Preview:** `portal-invoices.html`
- **Invoices** with status and receipts; **pay** by UPI QR, online (Razorpay, test mode) or bank transfer; paying with TDS; **statement** and **TDS certificates** (upload Form 16A).
- **Requirements:** POR-002, FIN-001.

### SCR-203 · Services and renewals

- **Preview:** `portal-services.html`
- **What they have**, when each renews or ends and **who renews it** (we bill, you renew, renews itself); for items the client renews, reminders 30, 15, 7 and 1 day before, the same as the team's alerts (choice 78, 22 Oct); the hosting proof being checked; **what website care covers** with its dates; **September in short** with the report.
- **Requirements:** POR-003, CON-003.

### SCR-204 · Projects and approvals

- **Preview:** `portal-projects.html`, `phone-ai.html`
- **Approve or ask for changes** with a comment (revision rounds shown); progress as this client is set to see it (stages only); earlier approvals; messages the client can see; the change they asked for; **who is working on it**.
- **Requirements:** POR-004, PRJ-005, PRJ-006, CON-011.

### SCR-205 · Content approvals

- **Preview:** `portal-content.html` (Royal Caterers, **in Tamil**)
- **The post waiting for approval** with its preview, caption (Tamil or English), date and time; approve or ask for a change; the month's posts by status; how it works.
- **Requirements:** POR-008, POR-009, PRJ-012.

### SCR-206 · Support

- **Preview:** `portal-support.html`
- **Raise a request** (page link, screenshot up to 25 MB, how urgent); **follow it**: received → being fixed → fixed → closed when the client says OK, or by itself 3 days after the fix if the client does not reply (the client can reopen it; choice 80, 22 Oct); reply and fix times from the plan; a fix deadline on a Sunday moves to Monday (SR-0151, raised today: fix by Mon 5 Oct; choice 97, 22 Oct); past requests.
- **Requirements:** POR-005, PRJ-013.

### SCR-207 · Files we need

- **Preview:** `portal-inputs.html` (Aroma Bakes)
- **The same checklist the team sees** in Client inputs; upload against each item (25 MB, or a Drive link); logins only by the vault link; the reminder schedule (every 3 days to start, or the longer gap the team set for this client; the client can ask for fewer reminders or a call; choice 79, 22 Oct).
- **Requirements:** POR-006, CON-013, RULE-025.

### SCR-208 · Proposals

- **Preview:** `portal-proposals.html`
- **A quote for a change** (online booking, ₹15,000): what they get, how they pay, the time it adds; accept, sign online, ask, or not now; earlier accepted proposals.
- **Requirements:** POR-007, CON-012, RULE-023.

### SCR-210 · Contact settings, SCR-211 · Documents, SCR-212 · Company profile

- **Preview:** `portal-settings.html`, `portal-docs.html`, `portal-profile.html` (the person's name at the top right opens the profile)
- **Settings:** language; messages by email and WhatsApp (account messages always on); what they agreed to, with dates; signing in and trusted devices; people from the company and their access.
- **Documents:** reports, statement, meeting summaries, project files and agreements marked for the client; internal notes never appear. A meeting summary shows only after it is finalized.
- **Company profile:** details as YTP has them; **request a change** (a GST number change waits for YTP's check).
- **Requirements:** POR-009, POR-012, POR-013, CRM-026.

## Automations, AI and connections

### SCR-171 · Automation builder

- **Preview:** `automation-builder.html` (Settings → Automations → New rule)
- **When → If → Do** with no code; the example "when a deal is won and includes SEO, create a Search Console access task"; a **dry run** that changes nothing; ask before messaging a client (on by default for new rules); limits, retries, versions, run history. ✦ build the blocks from a sentence.
- **Requirements:** CORE-071, AI-009.

### SCR-255 · Voice assistant

- **Preview:** `voice.html` (also the voice button in the search box), `phone-ai.html`
- **Hold to talk**, never always listening; the words heard in Tamil, English or a mix; **what Nexus will do** as a filled form; **Confirm / Change / Cancel**. The example is the acceptance test: "Add a lead, Ravi from Velocity Motors, website, sixty thousand"; Velocity is already a client, so it becomes a new deal for them.
- **Limits:** 300 voice minutes a month (46 used). Logged as "Voice, confirmed by [person]".
- **Requirements:** AI-010, INT-024, CRM-008.

### SCR-259 · Client chatbot settings

- **Preview:** `chatbot-settings.html` (Settings → Connections)
- **Where it answers** (WhatsApp through AiSensy, the website chat; Instagram in 3.9), **greeting** saying it is an AI, **what it may answer** (only knowledge marked for clients; **never prices**: every price, discount or payment question goes to a person, D-168), **lead questions**, **hand-over rules**, **office hours** (people answer Monday to Saturday, 10:00–18:30; outside them the AI takes the details and hands the chat over at 10:00, D-169), **limits** (₹100 a day, 20 messages a chat, 3 chats per number a day, short answers, spam blocking).
- **Requirements:** AI-019, AI-020, AI-016, CRM-030.

### SCR-260 · Live chat inbox

- **Preview:** `live-chat.html` (CRM → Live chat), `phone-ai.html`
- **Conversations** with who is answering (AI, a person, sent to support, limit reached); **the chat** with AI or person on every message and the hand-over lines (the example: a price question before 10:00 is handed to Karthik when the office opens); **the lead it made**; take over and hand back.
- **Requirements:** AI-019, AI-020, CRM-030.

### SCR-189 · API keys and MCP

- **Preview:** `api-keys.html` (Settings → Connections)
- **Keys** that act as one person with a scope, expiry and limits, shown once, revocable, last used; a refused call is logged. **MCP** tools for AI apps: reads run, changes wait for approval, money always waits.
- **Requirements:** CORE-130, CORE-131, CORE-132.

### SCR-234 · Website forms

- **Preview:** `forms.html` (Settings → Connections; built in step 3.9)
- **Forms** per service and the careers form, where each one sends (lead with the service set, Academy enquiry, Hiring), this month's count; **the form as on the website** with an optional consent box, the thank-you message and the embed code.
- **Requirements:** INT-006, TEAM-021, CRM-026, CRM-008.

---

## Owner's answers (round 43, 6 Oct 2026)

1. **Chatbot and prices:** no prices at all; every price question goes to a person, and the chatbot only takes the details (D-168).
2. **Chat hours:** people answer Monday to Saturday, 10:00–18:30; outside these hours the AI answers, collects the details and hands over when the office opens (D-169).
3. **Client reports:** always checked by a person before they go (D-170).
4. **Revenue report:** also show profit after salaries, for the Owner and LLP partners only (D-171).

Still to do: the Tamil text on the portal pages needs a check by a Tamil speaker before go-live.

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
