# YTP Nexus

One app to run YouTooPreneur™: clients, renewals, websites and hosting, invoices and payments, projects, team and payroll, and the Academy, with automation doing the remembering and chasing.

**Current status:** Phase 1 (Prepare). All 184 screens are built and checked. Since 2 Nov 2026 Nexus is built in 18 small releases (`docs/RELEASES.md`); next: the owner approves the Release 1 screens. No application code yet.

## See progress

Open **`tracker.html`** (double-click it). It is the one place to look (D-177): status, your to-do list, the plan and every document, every decision and choice, the design versions with pictures, the whole conversation (History), the handover and every file. It is rebuilt with `node tools/tracker/build-tracker.mjs` (and after every reply, by the conversation save).

## Start here

Everyone, human or AI, reads these files first:

1. [`AGENTS.md`](AGENTS.md): the rules every AI must follow
2. [`docs/STATUS.md`](docs/STATUS.md): the **Resume here** section says where the project is and what comes next
3. Claude also reads [`docs/HANDOVER.md`](docs/HANDOVER.md) (loaded by `CLAUDE.md` with the memory notes and "where we stopped")

## Folder map

| Path | What lives there |
|---|---|
| `AGENTS.md` | Rulebook for every AI (Antigravity, Codex, Claude) |
| `CLAUDE.md` | Claude's notes; loads AGENTS.md, the handover, the memory notes and "where we stopped" |
| `docs/STATUS.md` | Where we are, what's next, what's blocked, review rounds |
| `docs/PLAN.md` | How the project runs: the gates, the 5 phases step by step, the rules |
| `docs/DECISIONS.md` | Every locked decision, with its reason |
| `docs/RAW-REQUIREMENTS.md` | Everything the owner said, by round |
| `docs/REQUIREMENTS.md` | Every requirement with its pass/fail test |
| `docs/SCOPE.md`, `docs/ESTIMATE.md`, `docs/TECH-DESIGN.md` | What is in scope with the quality targets; the hours estimate; the tech design draft for step 1.7 |
| `docs/SCREENS.md` | Every screen with its ID |
| `docs/CHOICES.md` | Small choices Claude made while building, for the owner to answer in one line |
| `docs/CHANGES.md` | Change requests after the freeze |
| `docs/QUESTIONS.md` | Questions raised by AIs while working |
| `docs/HANDOVER.md` | How to continue anywhere: the people, how the owner works, lessons learned |
| `docs/design/` | Design rules (with the versions table), screen notes per batch, clickable screens (`mockups/`: `index.html`, `viewer.html`), version pictures (`versions/`), early style rounds (`style/`) |
| `docs/tasks/`, `docs/logs/`, `docs/evidence/`, `docs/templates/` | Task cards and index, one log per task, proof per task, templates |
| `docs/sources/`, `docs/review/` | The owner's original material; the round 16 review |
| `share/` | Word copies of every document, for WhatsApp (built by `python tools/share/build-word.py`) |
| `history/` | The whole conversation, saved after every reply (private: never send it to anyone) |
| `tracker.html` | The project tracker (generated; do not edit by hand) |
| `tools/` | Tracker builder, Word copies, share and review copies, screen check (`mockups/run-check.py`), pictures, conversation save and backup |
| `assets/brand/` | Logo and brand files |

## The 5 phases

1. **Prepare**: write the complete plan (requirements, screens, data model, tasks)
2. **Foundation**: build the base the whole app stands on
3. **Build modules**: one module at a time, from small task cards
4. **Launch**: import data, test everything, train the team, go live
5. **After launch**: keep it healthy and keep improving
