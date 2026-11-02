# Batch 1 · Foundation: screen specs

Step 1.6, batch 1 of 9. **16 screens**, built in Phase 2 (foundation). Status: **built and polished.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` and the screen viewer `viewer.html` (on this computer, and in the share and review copies in the Documents folder). No online link was made.
- **Style:** the approved style (D-137): dark menu and light work area, Emerald by default with Navy switchable, Sora headings with DM Sans text, grouped menu, airy spacing. Rules in `docs/design/DESIGN-RULES.md`.
- **Sample data only.** Names, numbers and emails are made up. Nothing saves; buttons for parts that come with a later step (for example e-signature) show a short notice.

## How to review (owner + team member)

1. Open each screen from the preview home. Click the tabs and links.
2. Try the colour switch (top bar) on any screen: Emerald and Navy.
3. Ask for each screen: is anything **missing**, **wrong** or **confusing**?
4. Write changes in the table at the end (or tell Claude). Approval comes once, after all 9 batches (D-153).

## Shared parts (on every staff screen)

| Part | What it does |
|---|---|
| **Side menu** (dark, grouped) | Daily work: Command Centre, Tasks, Calendar · Business: CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy · Insights & admin: Reports, Settings. Shows only what the role allows (USR-002). Your name at the bottom opens My profile. |
| **Top bar** | Search or ask Nexus (with mic), colour switch (Emerald / Navy with mini previews), language (EN), Ask Nexus (✦), alerts bell, Quick add, your photo. |
| **Page head** | Breadcrumb, title, one-line purpose, main buttons on the right. |
| **Phone** | No side menu. Dark bottom menu that **changes by role** (choice 13, 22 Oct): the Owner, and people who handle leads (such as Karthik), get Home, Tasks, Calendar, Leads, More; other staff and trainers (such as Arun) get Home, Tasks, Calendar, **Attendance** (check in and out), More. "More" holds every other area the role allows (the sample is Arun, Staff: CRM, Projects, WebCare and My HR), My profile, the colour switch and Sign out (CORE-113). |

---

## SCR-001 · Sign in

- **Preview:** `login.html` (computer), `phone-foundation.html` (phone), `login.html#twostep` (code step)
- **Who:** all staff (Owner, LLP partner, Manager, HR, Accounts, Staff, Trainer). Clients and students use their portals (batch 8, 9).
- **Layout:** left brand panel (logo, promise, three goals); right sign-in card; language pill top right.
- **Fields and actions:** Continue with Google · or email + password (show/hide) · Keep me signed in · Forgot password · Sign in.
- **Code step:** six boxes for the code, "Trust this computer for 30 days", Verify and continue, other ways (email code; WhatsApp code once WhatsApp is connected), Back.
- **States:** normal · code step · Google account not allowed (see Extra below). Wrong password: message under the field; after 5 tries a 15-minute lock and the owner is told.
- **Rules:** only emails in Users and roles can sign in (CORE-008). Two-step is required for roles that see money (CORE-002).
- **Requirements:** CORE-001, CORE-002, CORE-004, CORE-008.

## SCR-002 · Two-step set-up

- **Preview:** `login.html#setup`
- **Who:** first sign-in of anyone whose role needs two-step; anyone who turns it on.
- **Layout:** one card with three choices: Authenticator app (QR code, two steps, manual key) · Code by email · Code by WhatsApp (greyed until WhatsApp is connected). Continue.
- **Requirements:** CORE-002.

## SCR-003 · Forgot and reset password

- **Preview:** `login.html#forgot`, `login.html#sent`, `login.html#reset`
- **Steps:** enter email → "Check your email" (link lasts 30 minutes) → new password twice, with simple strength rules → back to sign in.
- **Rule:** people who sign in with Google reset in Google, not here (the screen says so).
- **Requirements:** CORE-001.

## Extra · Google account not allowed

- **Preview:** `login.html#denied`
- **What:** shown when a Google account is not on the allowed list. Tells the person to ask the owner, shows the email they used, and offers "Try another Google account".
- **Requirements:** CORE-008.

## Extra · Tamil sample

- **Preview:** `login.html#tamil`
- **What:** the sign-in screen in Tamil to check longer words fit. Draft wording; a native speaker checks it before go-live.
- **Requirements:** CORE-110.

## SCR-004 · Menu and top bar (app shell)

- **Preview:** any staff screen (e.g. `settings.html`); phone menu in `phone-foundation.html`
- **What:** the shared parts above. Menu items appear by role; a switched-off feature disappears from the menu (CORE-015).
- **Colour switch:** each person's own choice, remembered on their account. Clients always see the company colour.
- **Requirements:** USR-002, CORE-113, CORE-015.

## SCR-008 · My profile

- **Preview:** `my-profile.html` with tabs `#profile`, `#preferences`, `#notifications`, `#security`
- **Who:** every staff member, for themselves only.
- **Profile tab:** photo, employee code, role, joined date, full name, name shown to clients, sign-in email (changed only by the owner in Users and roles; history stays), phone, WhatsApp, short bio.
- **Preferences tab:** language (only checked languages are offered: English and Tamil in the sample; choice 11, 22 Oct), colour (Emerald / Navy), time zone, daily summary time, how dates, time and money look (₹1,84,500 Indian grouping, 12-hour time such as 3:30 pm by default (choice 4, 22 Oct), week starts Monday).
- **Notifications tab:** grid of topics × channels (In Nexus, Email, WhatsApp, Phone alerts): approvals, renewals at risk, overdue invoices, new leads not contacted, tasks due, @mentions. WhatsApp starts on only for renewals at risk and new leads not contacted. The alert in Nexus always arrives; for each alert, email and WhatsApp go **Straight away** or **Ask first** (prepared, then sent only when whoever set the alert taps Send). The Owner also sees **company-wide alerts I set for the team** (sample: renewal at risk to Meena by WhatsApp, Ask first) (choices 5 and 16, 22 Oct).
- **Sign-in and security tab:** two-step method, Google sign-in, password, where you're signed in, Log out everywhere.
- **AI and voice tab** (`#ai`): my AI use this month against my limit, AI helpers on or off, voice language, read answers aloud, link to my chats; **remembered about me** with Forget and Forget all.
- **Requirements:** CORE-005, CORE-110, CC-005, CORE-040 (@mentions), AI-006, AI-010, AI-013.

## SCR-010 · Record history

- **Preview:** `record-history.html`
- **Who:** Owner, Manager. Opened from any record's "History" button.
- **Layout:** filters (who, field, when) then a table: when, who (person or "Nexus · automatic"), field, before, after. The sample shows Arun (Staff) changing the phone number of Sharma Dental Care, a client assigned to him: staff may edit their own clients, never delete them (choice 9, 22 Oct).
- **Requirements:** CORE-090, USR-006.

## SCR-011 · Trash

- **Preview:** `trash.html`
- **Who:** Owner.
- **Layout:** table: type, name, deleted by, when, restore before (days left; red under 5 days), Restore.
- **Rules:** kept 30 days; restore brings back links, files and history. Issued invoices are never deleted (use a credit note).
- **Requirements:** CORE-093.

## SCR-180 · Settings home

- **Preview:** `settings.html`
- **Who:** Owner (others see only what their role allows).
- **Layout:** search box, then five groups of tiles: Company · People and access · Work and messages · **AI and voice** (AI settings, usage and limits, knowledge, quality) · System. Every tile opens its screen (all 9 batches are built).
- **Rule:** every change in Settings is logged with who, when, old and new value.
- **Requirements:** CORE-012.

## SCR-181 · Company profile

- **Preview:** `company-profile.html`
- **Who:** Owner.
- **Left:** current details (legal name, business type, PAN, GSTIN, address, state, company email), two logos (light and dark), company colour for client and student portals.
- **Right:** GST switch ("GST registered from [date]"; before it, plain invoices; after it, CGST + SGST in Tamil Nadu or IGST elsewhere) and **versions by date** (current proprietorship; LLP version waiting for its date).
- **Rule:** issued documents keep the version they were issued under.
- **Requirements:** CORE-010, CORE-011, FIN-025 to FIN-031 (LLP).

## SCR-182 · Users and roles

- **Preview:** `users-roles.html` with tabs `#users`, `#roles`, `#approvals`
- **People tab:** who can sign in: name, sign-in email and method, role, two-step, last active, status (Active, On leave, Switch email, Invited). Change email keeps history.
- **AI and voice per role:** which AI features the role may use, its monthly AI limit per person, and that AI actions always need the person's Confirm.
- **Roles tab:** nine default roles on the left; on the right a grid per area: see, add, edit, delete, approve, export, which records (own, team, all), with a key (Allowed · Not allowed · Not part of this area); "Hide money" switch; View as role. The sample Staff role can edit the CRM records assigned to them (not delete); every edit is logged (choice 9, 22 Oct). **Phone buttons** per role: Staff get Home, Tasks, Calendar, Attendance, More; a person who handles leads gets Leads instead of Attendance (choice 13, 22 Oct).
- **Approval limits tab:** what needs approval, who approves, the limit, what happens above it. The Owner approves every discount, every expense claim (paid back by bank transfer within 7 days) and every vendor bill, card bills too; leave up to 3 days by the reporting manager, then the Owner; the quality check by the project lead, a manager or the Owner (choices 7, 15, 41, 42 and 59, 22 Oct); every certificate cancel by the Owner, with a written reason (choice 89, 22 Oct).
- **Requirements:** USR-001 to USR-006, CORE-006, CORE-008, AI-004, AI-006.

## SCR-186 · Numbering and templates

- **Preview:** `numbering.html` with tabs `#series`, `#templates`
- **Series tab:** document, format (`YTP/{FY}/{0000}`), last issued, next number, starts again (every 1 April for invoices, credit notes and receipts; proposals, numbered Q-2026-025, every 1 January; certificates never), used by. Format parts explained below the table.
- **Templates tab:** invoice, receipt, credit note, proposal and agreement, HR letters, payslip, certificate, handover document; each with Edit layout.
- **Rules:** a number is given only when a document is issued, never to a draft; no gaps; at most 16 characters; the CA confirms the format.
- **Requirements:** CORE-013, RULE-003.

## SCR-190 · Security

- **Preview:** `security.html`
- **Two-step login:** required for Owner, LLP partner, Accounts, HR and Manager; optional for Staff and Trainer.
- **Sessions:** sign out after no activity (staff 8 hours, money roles 30 minutes); wrong passwords lock for 15 minutes after 5 tries.
- **Google sign-in:** allowed emails come from Users and roles; "Allow everyone @youtoopreneur.com" for later.
- **Limits:** requests per person, 2 heavy jobs at a time per person, portal codes, API and MCP keys, outgoing email.
- **AI guardrails card:** the always-on AI rules, with a link to AI settings.
- **Banner:** Nexus never stores client or tool passwords; logins are links to Vaultwarden items.
- **Requirements:** CORE-002 to CORE-004, CORE-008, NFR-020, NFR-021, AI-017.

## SCR-192 · Languages

- **Preview:** `languages.html`
- **Layout:** table of five languages with a sample word, screens and messages progress, native-speaker check, **voice** (speak and listen, or speak only), open to people (on/off). Below: how a new language is added (download, translate, upload) and a link to the Tamil sign-in sample.
- **Rule (choice 11, 22 Oct):** all five are built from the start, but each opens only after a native speaker has checked it; the switch unlocks after the check. Sample: Tamil checked 28 Sep and open; Hindi, Malayalam and Telugu are drafts, waiting, not open. Until a language opens, it is missing from every language switch (My profile, client and student portals, public pages).
- **Requirements:** CORE-110.

## SCR-193 · Feature switches

- **Preview:** `feature-switches.html`
- **Areas:** CRM, Contracts and Renewals, Projects, WebCare, Finance, Team, Academy (built last, step 3.10; on in the sample).
- **Features:** client portal, content calendar, payroll (PF, ESI and tax stay off until the CA check), broadcasts, **AI helpers, Ask Nexus chat, voice assistant, client chatbot** (each separately), student portal, Google Chat alerts (planned).
- **Rule:** turning off hides it everywhere, menus included; nothing is deleted.
- **Requirements:** CORE-015.

## SCR-194 · Monitoring

- **Preview:** `monitoring.html`
- **Top:** last backup, background jobs today (waiting, failed), messages sent today, uptime for 30 days. Today / 7 days / 30 days.
- **Needs a look:** failed or slow jobs with Retry now or Open.
- **Recent errors** and **Connections** (Gmail, WhatsApp through AiSensy in test mode, backup storage, domain and SSL checks, **AI health and spend today**, Razorpay in test mode).
- **Requirements:** CORE-140, CORE-123 (slots).

## SCR-195 · Logs

- **Preview:** `logs.html` with tabs `#activity`, `#security`
- **Activity log:** time, who, what, record, change (old → new). Automatic actions show "Nexus · automatic"; AI actions show "Nexus AI · approved by [person]" with their cost. Filter by people, Nexus or AI.
- **Security log:** sign-ins, failed sign-ins, views of bank or salary details, exports, vault link opens; with place and browser.
- **Rules:** logs can't be edited or deleted. Export available.
- **Requirements:** CORE-090, CORE-092.

---

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| 1 | All (switches) | On/off switches styled properly | Owner | Yes: 44 × 24 track, white knob, green when on |
| 2 | All (badges) | Badges fully round everywhere | Owner | Yes |
| 3 | Client profile | Client logo as a circle, not a square | Owner | Yes |
| 4 | All (counts) | Numbers in proper circles | Owner | Yes: cards and tabs |
| 5 | All (dots) | Green live dots crisp, not blurry | Owner | Yes: solid dot with a thin ring |
| 6 | All (checkboxes) | Checkboxes cleaner | Owner | Yes: firm edge, drawn tick |
| 7 | Tables | Space between a badge and the words next to it | Owner | Yes |
| 8 | Sales pipeline | Clock and "Follow up 2 Oct" aligned | Owner | Yes |
| 9 | Sales pipeline | Board, List and Export overlapped | Owner | Yes: the view switch had the wrong style |
| 10 | All (checkboxes) | Checkboxes still confusing; use a different colour | Owner | Yes: green with a white tick; role grid centred with a key |
| 11 | Several screens | Add AI where it is needed, from batch 1 | Owner | Yes: My profile, roles, security, feature switches, monitoring, logs, languages, record history, settings (round 34) |
