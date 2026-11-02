# Change requests

Every new idea or request **after the freeze** goes here, numbered CR-001, CR-002… (before the freeze, changes go into the review rounds in `docs/STATUS.md`). A change **never interrupts a task in progress**. Claude checks its impact and size, the owner approves in writing, and only then does it become task cards. An approved change updates the requirement, screen, preview and data model together.

**Size:** Small (under 1 day: done within the step and logged) · Medium (1–10 days: sized, approved, planned into a step) · Large (touches the architecture, database or core flows: planned as its own step).

| # | Request | Raised by | Date | Size | Hours | Owner approval (date) | Decision | Planned in |
|---|---|---|---|---|---|---|---|---|
| CR-001 | **Release 1 build order adjustments** (from the independent review of the cards, 2 Nov 2026): Caddy is set up with the production containers (TASK-0079) instead of step 2.1; the worker's delivery of announcements (TASK-0020) moves into step 2.2 with the outbox; the Security screen (TASK-0063) is in step 2.5 after the Settings doors; two small cards added for design rules that had no card, the same-site check (TASK-0084, TECH-DESIGN 7) and the screens' API client headers (TASK-0085, TECH-DESIGN 2 and 6.7); cards holding several doors are split when their step is written; step 2.1 runs strictly in order | Claude (planner) | 2026-11-02 | Small | About 4 to 8 (the two new cards); the rest is reordering | To show the owner (ordering only; the frozen design is unchanged) | Applied to `docs/tasks/INDEX.md` | Release 1 |
