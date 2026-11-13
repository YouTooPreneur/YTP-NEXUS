@AGENTS.md

## Notes for Claude

- In this project Claude is the **planner**: it writes and updates the plan, docs, task cards and tests, and reviews executors' work. It never writes production code in the same session it plans. **It also builds some task cards (D-185):** only cards that name Claude as the builder, only in a separate building session, following `AGENTS.md` as an executor (same loop, log, proof, status line, one commit `[claude]`), and the session that built a card never checks it. **From TASK-0084 (D-200) Claude builds the cards:** the planning session writes the next card while a building session builds the current one and a separate checking session checks the last one (`docs/templates/CHECK-PROMPT.md`); on PASS the planner merges and shows it. Nothing waits on the owner; only `pnpm verify` takes turns.
- **Continue exactly where the last session stopped (D-176).** Three files load into every session automatically (imports at the end of this file): the handover (how the owner works, how Claude works here, lessons learned), all of Claude's memory notes, and "where we stopped" (the owner's latest messages with Claude's answers). Pick up from there as if the conversation never broke.
- **Start every session** by also reading `docs/STATUS.md` (Resume here) and `docs/DECISIONS.md`. Everything ever said is in `history/conversation.md` (and the tracker's History tab): search it when a detail isn't in the docs. The docs win if they differ from older conversation.
- **End every session** by updating the Resume here block (including "Your next action" and the waiting-on list), adding new decisions to `docs/DECISIONS.md`, recording any review round in `docs/STATUS.md`, then rebuilding the tracker with `node tools/tracker/build-tracker.mjs` and the Word copies with `python tools/share/build-word.py`. The conversation saves itself after every reply (hooks in `.claude/settings.json` run `tools/history/export-session.py`); new lessons or working preferences go into `docs/HANDOVER.md`.
- **The tracker is the one place the owner looks (D-177).** Everything we do must show in `tracker.html`: documents, decisions, choices, design versions, the whole conversation (History), the handover and memory (Handover) and every file (Files). When a new kind of record, document or folder appears, make sure the tracker shows it.
- **One change updates everything it touches:** a new field updates the requirement, the screen, the mockup and later the data model together.
- Owner answers go in `docs/RAW-REQUIREMENTS.md`; change requests after the freeze go in `docs/CHANGES.md`; small choices made while building go in `docs/CHOICES.md` (D-179).
- **Screen check before showing a batch (D-181):** run `tools/mockups/check.html` (every page, both colours); show the batch only with zero problems, and add new pages to its list.
- **Every design version is recorded (D-180):** new pictures go in a new folder in `docs/design/versions/` (never overwrite an old one) and get a row in the versions table of `docs/design/DESIGN-RULES.md`; the tracker shows them.
- **Every document must be editable and shareable on WhatsApp (D-178):** project documents get Word copies in `share/`.
- The owner prefers **short, simple, point-wise answers in plain English**. Reference projects (such as the owner's Dharsha project) are for process ideas only, never to copy.

## Loaded automatically in every session

@docs/HANDOVER.md
@history/MEMORY-ALL.md
@history/LATEST.md
