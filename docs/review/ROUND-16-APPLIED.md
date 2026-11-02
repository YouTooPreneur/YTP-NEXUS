# Round 16: what was applied (1 Oct 2026)

The owner approved the round 16 change list (`ROUND-16-CHANGE-LIST.md`). It was applied in review round 24. Every existing ID was kept, and every changed decision records its history.

## 1. What changed, by file

| File | Change |
|---|---|
| `REQUIREMENTS.md` | 41 reworded · 24 new (CORE-047, CORE-123, CRM-027–029, CON-016, WEB-016–017, FIN-025–031, TEAM-026–029, ACD-014, POR-011–013, NFR-022) · POR-010 retired · RULE-024–028 · Appendix C (Agency OS) · Build steps renumbered · now 393 rows |
| `SCREENS.md` | 31 updated · 15 new (SCR-097–099, SCR-115–118, SCR-139–140, SCR-158, SCR-211–212, SCR-252–254) · SCR-092 and SCR-209 retired · now 178 active screens |
| `DECISIONS.md` | Changed: D-001, D-018, D-045, D-070, D-106, D-118 · retired: D-067, D-131 · new: D-138, D-140 to D-151 (D-139 not used) · now 117 rows |
| `PLAN.md`, `STATUS.md` | 5 phases kept; 2.4 adds Google sign-in; 3.1 adds to-do lists and connection slots; 3.3 adds Vaultwarden links, renewal proof, shared hosting, Razorpay, LLP money; 3.5 adds Vaultwarden set-up; **3.8 Portals, Reports, API, AI · 3.9 Integrations · 3.10 Academy**; 4.7 keys in Vaultwarden |
| `RAW-REQUIREMENTS.md` | New section 12: round 16 additions |
| `AGENTS.md` | Section 7: never store passwords; build only the step on the card; connection slots |
| `docs/sources/` | The audit and the 60-screenshot document, with a README |

## 2. Audit corrections C1–C12

| # | Correction | Result |
|---|---|---|
| C1 | Release-based scope | Covered by the 5-phase plan (step by step, online at 3.5); D-138 |
| C2 | Core split | Covered: Core is built in two parts (Foundation and 3.1); the heavier parts are at 3.8 |
| C3 | External password manager | Applied: self-hosted Vaultwarden, references only (WEB-009, RULE-025, D-140); vault and portal reveal retired |
| C4 | Renewal evidence | Applied: proof confirmed by Owner, Manager or Accounts; expiry correction; currency and duplicate rules (RULE-024, D-141) |
| C5 | Shared hosting and provider accounts | Applied (WEB-010, WEB-016, D-142) |
| C6 | LLP partner finance | Applied (FIN-025–031, D-145); both partners approve withdrawals; quarterly profit split |
| C7 | Academy fast track | **Not taken** (owner): Academy last at 3.10 (D-149) |
| C8 | Google sign-in in Foundation | Applied (CORE-001, CORE-008, D-143) |
| C9 | Agency OS and earlier details | Applied (Appendix C), with chat deferred |
| C10 | Portal isolation | Applied (NFR-022, D-146) |
| C11 | Data model locked first | Applied (D-147, PLAN 1.7) |
| C12 | Safe migration | Applied as a rule if data is ever imported (RULE-027); Agency OS never touched (D-148) |

## 3. Agency OS features

Every function in the 60 screenshots is listed in `REQUIREMENTS.md` Appendix C as **added**, **kept**, **replaced** or **deferred**.
- **Deferred:** internal chat (use Google Chat and comments); white-label, mobile app and SaaS billing (unchanged).
- **Replaced:** the client credentials tab, now password-manager references.

## 4. Build order

1. **Prepare:** 1.5 style → 1.6 screens and preview → 1.7 data model and technology → freeze → 1.8 task cards → 1.9 tools.
2. **Foundation:** 2.1–2.8, with Google sign-in.
3. **Build modules:**
   - 3.1 Core
   - 3.2 CRM + Team
   - 3.3 WebCare + Finance
   - 3.4 Contracts + Command Centre
   - 3.5 Move online
   - 3.6 Projects + meetings
   - 3.7 Sales + Payroll
   - 3.8 Portals, Reports, API, AI
   - 3.9 Integrations
   - 3.10 Academy
4. **Launch:** 4.1–4.7.
5. **After launch:** ongoing.

## 5. Still open

- **Owner:** approve the style (step 1.5). *Done 1 Oct 2026 (round 27).*
- **Data, entered later in Nexus:** LLP partner details (3.3); course 1 details (before 3.10).
- **Decided later:** the server (before 3.5); CA checks of invoices and payroll (before launch).
