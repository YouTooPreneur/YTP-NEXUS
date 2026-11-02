# Hours estimate (draft)

**Since 2 Nov 2026 Nexus is built in 18 small releases (D-186, `docs/RELEASES.md`).** This draft is reorganised release by release at step 1.7. Separating the frontend and the backend (D-187) adds about 10% per feature plus 2 or 3 set-up cards in Release 1; it is counted with the Release 1 task cards. Since round 53 the Release 1 steps are numbered as in `docs/TECH-DESIGN.md` section 10; the Phase 2 rows below keep the old numbering until that recount.

**Building all of YTP Nexus takes about 2,750 hours of building, review and checks (likely range 2,290 to 3,840), plus about 140 to 250 hours of the owner's own time.** These are hours only. There is no money in this document: the owner sets any prices, and a developer reviews and corrects these hours (owner to confirm who).

Drafted by Claude on 21 Oct 2026 for step 1.7 (PLAN, Gate 3). **This is a first draft.** It is counted again per release, with that release's task cards (D-188).

## Release 1, recounted with its cards (2 Nov 2026)

The 84 Release 1 cards (`docs/tasks/INDEX.md`) are the first real count. Cards marked "(split)" become one card per API door when their step is written (about 100 to 110 cards in all); the work, and so the hours, stay the same:

| Part | Cards | Build hours (2 to 4 per card) |
|---|---|---|
| Set-up (step 2.1) | 13 | 26 to 52 |
| Backend (steps 2.2 to 2.8) | 52 | 104 to 208 |
| Frontend (steps 2.4 to 2.7) | 19 | 38 to 76 |
| **All cards** | **84** | **168 to 336 (likely about 255)** |
| Reviews (about half an hour per card) | | about 40 |
| Two-person checks at the end of each step (8 steps) | | 8 to 16 |
| **Release 1 in all** | | **about 210 to 385 (likely about 300)** |

**The owner's own Release 1 hours:** the practice task (2 to 4), the accounts with Claude's steps (GitHub, Google Cloud, Gmail app password, Cloudflare; 2 to 3), the free server with Claude (3 to 5), the two-person checks and go-live checks (8 to 12), then 1 to 2 weeks of the team using Release 1. The old draft's figure for Phase 2 (about 254 hours) was close.

## What an hour means here

- **A build hour** is the time to get one task card built, verified, debugged and logged (D-092), with a person running the builder. The builder is named on each card (D-185); the owner runs the practice task in step 2.1 with Antigravity. The plan sizes every card at **2 to 4 hours** (PLAN task size; small cards, D-091).
- **Counted:** every card in Phase 2 (Foundation), Phase 3 (steps 3.1 to 3.10) and Phase 4 (Launch), plus a developer's 8-hour review in Phase 1. Each card includes its tests and its build, verify, debug loop.
- **Not counted:**
  - Claude's planning work: the plan, the task cards and tests, the guides, and the screen changes after the senior's review.
  - The time of the CA, the senior and other team members (listed separately below).
  - Running costs. Free options come first (D-032, NFR-016). The paid items known so far are Bunny Stream (D-118), AI use inside its budgets (D-103) and WhatsApp through AiSensy, already in use (D-154); anything else paid needs the owner's OK (NFR-016). `TECH-DESIGN.md` lists them.
  - Changes after the freeze. Each one goes into `docs/CHANGES.md` and is sized on its own (PLAN rule 3).
- **If the owner runs the executors,** the build hours are the owner's hours too (owner to confirm).
- **There is no deadline** (D-002). **Nothing is cut:** everything in the requirements is in scope (D-003).

## How the cards are counted (the rule)

One simple rule, used the same way for every step:

1. **1 card for each screen.** Screens come from the Build column of `SCREENS.md` (184 active screens). The screen card builds the page.
2. **1 card for each requirement, in each step its Build column names.** Requirements come from the Build column of `REQUIREMENTS.md`. The requirement card builds what makes the page work (the data, the rule or the automation) and its pass/fail test. Most features need both cards.
   - "3.3 / 3.9" means one card in 3.3 and one in 3.9.
   - "3.1, then each module" (AI-002, AI-003, AI-009) means one card in 3.1 and one in each later module step (3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.10). These are the AI helpers on each module's screens.
3. **An outside connection counts as 3 cards** (INT-001 to INT-024): the door, its settings with the Test button, and its error handling. Every outside service goes through a door in Core with a ready slot (CORE-120, CORE-121, CORE-123, D-018).
4. **Business rules** (RULE-001 to RULE-028) get no cards of their own. They are built inside the cards they touch.
5. **Quality targets with no build step** (NFR-001 to NFR-023) get **1 test card each** in step 4.3.
6. **Set-up work with no requirement ID** (skeleton, safety checks, moving online, import, go-live) is listed card by card at the end of this document: 51 cards. With the 23 test cards from rule 5, that list has 74 cards.
7. **Each card is 3 hours on average** (cards are 2 to 4 hours).
8. **Review and check adds 30%** to every step's build hours:
   - **20% for the card review:** a different session or model checks each card against its card text, PASS or FAIL, and failed cards are fixed.
   - **10% for the two-person check:** the fixes found when the owner and a team member click through the finished step (D-152).

## Hours by step

| Step | What | Requirements | Screens | Cards | Build hours | Review and check | Total |
|---|---|---|---|---|---|---|---|
| Phase 1 (rest) | 1.6 senior's review and approval, 1.7 architecture, data model (D-147) and tech stack (D-022), FREEZE, 1.8 task cards, 1.9 GitHub | — | — | — | — | 8 | **8** |
| 2 | Foundation: skeleton, verify, guards, database and backup, login and roles, settings, log, engine, languages, example feature, practice task | 32 | 16 | 65 | 195 | 59 | **254** |
| 3.1 | Core: tasks, messaging (test mode), files, import and export, services and templates, approvals, slots, AI base | 61 | 22 | 89 | 267 | 80 | **347** |
| 3.2 | CRM + Team | 47 | 31 | 78 | 234 | 70 | **304** |
| 3.3 | WebCare + Finance | 55 | 32 | 93 | 279 | 84 | **363** |
| 3.4 | Contracts & Renewals + Command Centre | 34 | 14 | 48 | 144 | 43 | **187** |
| 3.5 | Move online (server, Vaultwarden) | — | — | 11 | 33 | 10 | **43** |
| 3.6 | Projects + meetings and calendar | 40 | 17 | 59 | 177 | 53 | **230** |
| 3.7 | Sales + Payroll | 23 | 11 | 34 | 102 | 31 | **133** |
| 3.8 | Portals, Reports, API, AI | 47 | 22 | 73 | 219 | 66 | **285** |
| 3.9 | Integrations | 26 | 1 | 61 | 183 | 55 | **238** |
| 3.10 | Academy | 23 | 18 | 43 | 129 | 39 | **168** |
| 4 | Launch: import, full testing, CA fixes, go-live, handover | — | — | 48 | 144 | 43 | **187** |
| **Total** | | **388** | **184** | **702** | **2,106** | **640** | **≈ 2,746** |

- **Phase 1:** the 8 hours are a developer's review of the tech design and this estimate (6 to 10 hours). All other Phase 1 work is Claude's and the owner's (owner hours below).
- **Review and check** is 30% of build hours, rounded per row (a half rounds up), so the rows add up to 633, or 641 with Phase 1. The total row uses the exact 30% of 2,106 (632) plus Phase 1's 8 hours, which is why the row totals add up to 2,747, one hour more than the total row.
- **Requirements** counts entries: 359 requirements give 388 entries, because some are built in more than one step (counts at the end).

## Hours by module

The same 702 cards, grouped by area. Requirement sections and screen sections follow the two documents, so the rows can be rechecked.

| Area | Built in | Requirements | Screens | Cards | Build hours | Review and check | Total |
|---|---|---|---|---|---|---|---|
| Core (login, roles, settings, tasks, calendar, messaging, files, search, import/export, API) | 2, 3.1 (also 3.2, 3.3, 3.6, 3.8, 3.9, 3.10) | 87 | 37 | 124 | 372 | 112 | **484** |
| CRM (with sales) | 3.2, 3.7 (also 3.3, 3.6, 3.9) | 31 | 14 | 45 | 135 | 41 | **176** |
| Contracts & Renewals | 3.4, 3.6 | 16 | 8 | 24 | 72 | 22 | **94** |
| Projects | 3.6, 3.8 | 17 | 11 | 28 | 84 | 25 | **109** |
| WebCare | 3.3 (also 3.4, 3.9) | 17 | 9 | 26 | 78 | 23 | **101** |
| Finance (with LLP partner money) | 3.3 (also 3.4, 3.7, 3.9, 3.10) | 31 | 20 | 51 | 153 | 46 | **199** |
| Team (with hiring and payroll) | 3.2, 3.7 | 29 | 22 | 51 | 153 | 46 | **199** |
| Academy (with the student portal) | 3.10 | 14 | 15 | 29 | 87 | 26 | **113** |
| Command Centre | 3.4 (also 3.8) | 9 | 3 | 12 | 36 | 11 | **47** |
| Reports | 3.8 | 12 | 2 | 14 | 42 | 13 | **55** |
| Client portal | 3.8 | 12 | 12 | 24 | 72 | 22 | **94** |
| AI (base, helpers in every module, voice, client chatbot) | 3.1, 3.8 and each module step | 42 | 8 | 50 | 150 | 45 | **195** |
| Automations (AUTO-001 to AUTO-040, plus the 3 automation screens SCR-170 to SCR-172) | every build step except 3.5 | 40 | 3 | 43 | 129 | 39 | **168** |
| Integrations (INT-001 to INT-024, 3 cards each) | 3.9 (also 2, 3.1, 3.3, 3.6, 3.8, 3.10) | 28 | — | 84 | 252 | 76 | **328** |
| Public pages and PDF documents (screens P and Q) | with their module | — | 20 | 20 | 60 | 18 | **78** |
| Quality targets (NFR-024, NFR-025, plus 23 test cards in 4.3) | 3.1, 3.8, 4.3 | 3 | — | 26 | 78 | 23 | **101** |
| Set-up work with no ID (foundation 15, move online 11, launch 25) | 2, 3.5, 4 | — | — | 51 | 153 | 46 | **199** |
| **Total** | | **388** | **184** | **702** | **2,106** | **632** | **≈ 2,738** |

- **Rounding:** rows are rounded one by one (a half rounds up), so they add up to 634 (and the row totals to 2,740); the total row uses the exact 30% (632). Phase 1's 8 hours are not in this table.
- **Settings screens:** HR settings (SCR-197) are counted under Team and Finance settings (SCR-198) under Finance. All other settings screens are under Core.
- **Section L screens** ("Automations and AI"): the 8 AI screens are under AI; Automations, Automation builder and Run history (SCR-170 to SCR-172) are under Automations.
- **AI:** the 42 entries include 21 "AI helper" entries (AI-002, AI-003 and AI-009 in each of 7 module steps). The manual way always works (D-155), and every AI feature has limits (D-156).
- **Passwords:** WebCare builds Vaultwarden links only. Nexus never stores client or tool passwords (RULE-025, D-140), so no password vault is built or counted.

## Owner hours

| What | Basis | Hours |
|---|---|---|
| 1.6: read the senior's comments, decide the changes, answer the 95 choices (`docs/CHOICES.md`, one line), approve all 184 screens once (Gate 2, D-153) | Comments not back yet | 6–10 |
| 1.7: read the Release 1 tech design and data model, then the Release 1 freeze (Gate 3) | | 4–6 |
| 1.9: private GitHub repository, open the folder in Antigravity and Codex (with Claude's steps) | GitHub account already done | 2–3 |
| 2.8: run the practice task | First card | 2–4 |
| Questions and choices while building (`docs/QUESTIONS.md`, `docs/CHOICES.md`, D-179) | 1–2 hours × 11 steps | 11–22 |
| Two-person checks and approvals (Gate 4, D-152) at the end of 2.8 and of each step 3.1–3.10 | 10–20 minutes per screen × 184, plus 1 hour to approve each of 11 steps | 42–72 |
| Fill in settings as each step lands: company details, roles, services and templates, message templates, leave quotas, holidays, LLP partner details (D-017, NFR-018) | | 10–16 |
| 3.5: choose the server (D-031); set up Vaultwarden with Claude's steps (D-140) | | 6–10 |
| Open each outside account and paste its keys, then press Test (CORE-120) | 24 services × 30–45 minutes; only accounts the owner decides to open | 12–18 |
| 4.1: gather data in Claude's Excel templates | 100–300 clients × about 5 minutes; 100–300 websites, domain names only, × about 1 minute; 16+ team members × about 15 minutes; vendors, subscriptions and open invoices; final check | 20–45 |
| 4.2: check the import report (counts and money totals must match) | | 4–6 |
| 4.4: CA check of GST invoices, invoice numbering, salary split and PF/ESI/professional tax (RULE-003, RULE-016, D-164, D-165) | Owner's time only | 4–8 |
| 4.5: train the team with Claude's guides for each role | About 6 group sessions plus preparation | 8–12 |
| 4.6: go live (Gate 5); use Nexus alongside WhatsApp for 2–4 weeks | About 30 minutes a working day | 6–12 |
| 4.7: handover sign-off (every account in YTP's name, keys and logins in Vaultwarden) | | 3–5 |
| **Total** | | **≈ 140–250** |

**Other people (not counted above):**

| Who | What | Hours |
|---|---|---|
| A team member | The two-person checks with the owner (D-152) | 31–61 (10–20 minutes per screen) |
| The senior | Screen review in step 1.6 | Their own pace |
| The CA | Checks in step 4.4 | Owner to confirm with the CA |
| Native speakers | Check the Tamil screens before go-live (on the waiting list), and Hindi, Malayalam and Telugu | Owner to confirm who |

## How sure is this

| Case | Hours per card | Cards | Build hours | Review and check (30%) | Total, with Phase 1 |
|---|---|---|---|---|---|
| Low | 2.5 | 702 | 1,755 | 527 | **≈ 2,290** |
| Expected | 3 | 702 | 2,106 | 632 | **≈ 2,750** |
| High | 3.5 | 842 (20% more) | 2,947 | 884 | **≈ 3,840** |

**Why the high case has 20% more cards:** a big screen counts as one card here, but it will be split when the real cards are written. Examples are the client profile with 13 tabs and the invoice editor.

**The main unknowns:**

| Unknown | Cards it touches | Why it may grow |
|---|---|---|
| Integrations | 84 cards | Each outside service works differently, and most accounts are not opened yet. Each one is built in its ready slot only when its account exists (CORE-123). Some services need their own approvals first, for example WhatsApp message templates (D-167). |
| Payroll rules | 8 Team cards in 3.7, plus the payslip PDF | PF, ESI and professional tax are ready as settings but stay off until the CA confirms (D-165, RULE-016). The salary split also needs the CA (D-164). If the CA asks for changes, more cards are needed. |
| AI | 50 AI cards, plus the AI helpers inside screen cards | Every AI change must pass the question set before it goes live (AI-008, AI-018). The chatbot has strict limits and hand-over rules (AI-019, AI-020), and voice must work in Tamil and English (INT-024). Provider behaviour can change. |
| Languages | Counted once (CORE-110, CORE-111, CORE-063) | Five languages from the start (D-083). The language system is counted. Writing and checking every screen's words in Tamil, Hindi, Malayalam and Telugu is not counted. |
| Moving online | 11 cards in 3.5 | The server is not chosen yet (D-031). Vaultwarden is set up on it (D-140). |
| Data import | 8 cards in 4.2, plus the owner's 4.1 hours | Today everything lives in WhatsApp, the phone and memory, with no other tools (raw requirements). How much can be gathered is not known yet. |
| The senior's review | Any screen | The comments are not back yet. Changes before the freeze can add or remove cards. |

**How it gets surer:**
1. After the freeze, step 1.8 writes the real task cards. Then this estimate is counted again from the cards themselves.
2. Compare the real time of the first 20 cards (from step 2 and the practice task in 2.8) with the 3-hour average, and correct the hours.
3. Each step's real hours then correct the next step.

## What it means in weeks

There is no deadline (D-002). The example below shows how the pace changes the length; the owner confirms the real pace.

| Build hours a week (example) | Weeks for about 2,750 hours |
|---|---|
| 20 | ≈ 138 |
| 40 | ≈ 69 |
| 60 (for example two executors on separate cards; owner to confirm) | ≈ 46 |

Waiting time (approvals, accounts, the CA) comes on top.

## If the hours must come down

Nothing is moved out: everything is in scope (D-003), and the owner asked not to put anything later. The build order already puts the least urgent work last:
- Integrations are built only when their account exists (3.9).
- The Academy is built last, with no rush (3.10, D-149).

## The counts, so anyone can recheck them

**Where the numbers come from (21 Oct 2026):**

| Count | Number | How |
|---|---|---|
| ID rows in `REQUIREMENTS.md` (sections 1–19) | 411 | Every table row whose first cell is an ID |
| Business rules (RULE) | 28 | No build step; built inside other cards |
| Quality targets (NFR) | 25 | 23 have no build step (1 test card each in 4.3); NFR-024 and NFR-025 have one |
| Retired requirement | 1 | POR-010 (round 16) |
| Requirements with a build step | 359 | 411 − 28 − 23 − 1 |
| Requirement entries | 388 | 359 plus 29 extra steps: CORE-007, CRM-007, AI-007, INT-003, INT-005, INT-011, INT-013 and NFR-025 (one more step each, 8) plus AI-002, AI-003 and AI-009 (7 module steps each, 21) |
| Integration entries | 28 | INT-001 to INT-024; four are built in two steps |
| Screen rows in `SCREENS.md` | 186 | Every table row starting `SCR-` |
| Retired screens | 2 | SCR-092, SCR-209 |
| Active screens | 184 | Matches the 9 batches of step 1.6 |

**Cards per step:**

| Step | Screens | Requirement entries | Extra for integrations (+2 each) | Set-up and test cards | Cards |
|---|---|---|---|---|---|
| 2 | 16 | 32 | 1 × 2 = 2 | 15 | 65 |
| 3.1 | 22 | 61 | 3 × 2 = 6 | — | 89 |
| 3.2 | 31 | 47 | — | — | 78 |
| 3.3 | 32 | 55 | 3 × 2 = 6 | — | 93 |
| 3.4 | 14 | 34 | — | — | 48 |
| 3.5 | — | — | — | 11 | 11 |
| 3.6 | 17 | 40 | 1 × 2 = 2 | — | 59 |
| 3.7 | 11 | 23 | — | — | 34 |
| 3.8 | 22 | 47 | 2 × 2 = 4 | — | 73 |
| 3.9 | 1 | 26 | 17 × 2 = 34 | — | 61 |
| 3.10 | 18 | 23 | 1 × 2 = 2 | — | 43 |
| 4 | — | — | — | 48 | 48 |
| **Total** | **184** | **388** | **56** | **74** | **702** |

**Requirement entries per step, by ID group:**

| Step | Entries |
|---|---|
| 2 | USR 6 · CORE 24 · AUTO 1 · INT 1 = 32 |
| 3.1 | CORE 38 · AI 17 · AUTO 1 · INT 3 · NFR 2 = 61 |
| 3.2 | CRM 16 · TEAM 24 · AI 4 · AUTO 3 = 47 |
| 3.3 | CORE 1 · CRM 1 · WEB 15 · FIN 25 · AI 3 · AUTO 7 · INT 3 = 55 |
| 3.4 | CON 12 · WEB 1 · FIN 2 · CC 8 · AI 3 · AUTO 8 = 34 |
| 3.6 | CORE 6 · CRM 4 · CON 4 · PRJ 14 · AI 3 · AUTO 8 · INT 1 = 40 |
| 3.7 | CRM 9 · FIN 2 · TEAM 5 · AI 3 · AUTO 4 = 23 |
| 3.8 | CORE 7 · PRJ 3 · CC 1 · RPT 12 · POR 12 · AI 6 · AUTO 3 · INT 2 · NFR 1 = 47 |
| 3.9 | CORE 4 · CRM 1 · WEB 1 · FIN 1 · AUTO 2 · INT 17 = 26 |
| 3.10 | CORE 1 · FIN 1 · ACD 14 · AI 3 · AUTO 3 · INT 1 = 23 |

**Screens per step, by `SCREENS.md` section:**

| Step | Screens |
|---|---|
| 2 | A 7 · M 9 = 16 |
| 3.1 | A 4 · F 4 · L 5 · M 7 · Q 2 = 22 |
| 3.2 | C 9 · F 1 · I 18 · M 1 · Q 2 = 31 |
| 3.3 | G 8 · H 17 · M 1 · P 1 · Q 5 = 32 |
| 3.4 | B 3 · D 6 · G 1 · H 1 · L 2 · Q 1 = 14 |
| 3.6 | C 1 · D 2 · E 9 · F 4 · P 1 = 17 |
| 3.7 | C 4 · H 1 · I 3 · P 1 · Q 2 = 11 |
| 3.8 | E 2 · K 2 · L 4 · M 1 · N 12 · Q 1 = 22 |
| 3.9 | P 1 = 1 |
| 3.10 | J 9 · O 6 · P 1 · Q 2 = 18 |

**Set-up and test cards (74: 51 set-up cards plus the 23 quality test cards in 4.3):**

| Step | Card | Cards |
|---|---|---|
| 2.1 | Project skeleton with a folder for each module (D-010, D-011) | 2 |
| 2.2 | The verify command | 2 |
| 2.2 | Architecture guards: floor rules, each module owns its data, outside services only through doors (D-014, D-015, D-018, NFR-011) | 3 |
| 2.3 | Database set-up and safe database changes (add before remove, NFR-017), from the data model locked in step 1.7 (D-147) | 2 |
| 2.5 | Notice board: events between modules (D-014) | 2 |
| 2.7 | The example feature that executors copy | 3 |
| 2.8 | Practice task run by the owner | 1 |
| 3.5 | Server set-up with the same setup as the computer (NFR-015, D-022); which server is still to decide (D-031) | 2 |
| 3.5 | Web address and HTTPS (the address is a setting, D-095) | 1 |
| 3.5 | Release steps: a backup before every release, and a rollback (NFR-017) | 2 |
| 3.5 | Vaultwarden on YTP's server, with its own backup and restore test (D-140) | 2 |
| 3.5 | Daily backup copied off the server, and the first restore drill (NFR-007, AUTO-037) | 2 |
| 3.5 | Uptime and error alerts online (NFR-006, NFR-012) | 1 |
| 3.5 | Move the data from the computer to the server and check it | 1 |
| 4.2 | Import, one card per data set: clients and contacts; websites and domains (expiry dates filled in automatically, CORE-104); services sold and renewals; open invoices and balances; team members (Aadhaar last 4 digits only, no password ever imported, RULE-017, RULE-027); vendors and YTP subscriptions; leave balances. The exact list comes with Claude's 4.1 templates | 7 |
| 4.2 | Import check report: counts and money totals match | 1 |
| 4.3 | One test card per quality target with no build step (NFR-001 to NFR-023), for example the security scan, speed with 100 people at once, the restore drill, accessibility and portal isolation | 23 |
| 4.3 | Every automation end to end (AUTO-001 to AUTO-040), 1 card per 10 automations | 4 |
| 4.4 | Fixes after the CA's check (allowance; owner to confirm after the CA) | 4 |
| 4.6 | Go-live checklist. Test mode stays on through every build step (CORE-065, RULE-021); this card turns it off, and only after Gate 5 | 2 |
| 4.6 | Fixes during the 2–4 weeks alongside WhatsApp (allowance) | 6 |
| 4.7 | Handover checklist: every account in YTP's name, keys and logins in Vaultwarden | 1 |

**Sources:** `docs/REQUIREMENTS.md` and `docs/SCREENS.md` (Build columns, counted on 21 Oct 2026), `docs/PLAN.md` (steps, gates, task size), `docs/DECISIONS.md`, `docs/STATUS.md` (waiting-on list, owner to-do), `docs/HANDOVER.md`, and `docs/RAW-REQUIREMENTS.md` for the size of the business (16+ people, 100–300 clients, 100–300 websites). The layout follows the owner's Dharsha project; only its format was used.
