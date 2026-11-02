# TASK-XXXX · <Title>

**Chain:** <CHAIN-NAME> (step N of M) · **Release:** <1–18> · **Module:** <module> · **Part:** <Backend / Frontend / Set-up (step 2.1 only)> (D-187) · **Depends on:** TASK-XXXX
**Requirement IDs covered:** <e.g. CRM-012>
**Builder:** <Antigravity / Codex / Claude> (D-185: Claude builds only in a separate building session) · **Reviewer:** <Claude / Codex / owner + team member> (never the builder)

## BEFORE YOU START
- TASK-XXXX must be **Done** in `docs/STATUS.md`
- Read: `AGENTS.md`, `docs/logs/TASK-XXXX.md` (Notes for next task), <other files>
- Work in your own git worktree on a branch cut from the current main; write the start commit in your log.
- Run `pnpm verify`. It must be green. If not: STOP and mark BLOCKED.
- Run `pnpm verify --card TASK-XXXX` once: this card's tests must fail. Write both results in your log.

## CONTEXT (already exists from earlier tasks)
- <what exists, with file paths and which task created it>

## ALLOWED FILES (touch nothing else)
| File | Action |
|---|---|
| `<path>` | create / edit |

## STEPS
1. <exact step: names, types, labels, messages all spelled out>
2. <exact step>

## TESTS (already written; DO NOT EDIT)
- `<path to test file>`

## VERIFY AND DEBUG
Run `pnpm verify --card TASK-XXXX`. If it fails, fix it inside the allowed files and run it again, up to 5 tries.
Still failing: mark BLOCKED in `docs/STATUS.md`, explain in your log, and STOP.

## WHEN GREEN
- [ ] Proof saved in `docs/evidence/TASK-XXXX/`
- [ ] Log written: `docs/logs/TASK-XXXX.md` (use `docs/templates/TASK-LOG.md`)
- [ ] `docs/STATUS.md` task log line and `docs/tasks/INDEX.md` → Done, with your AI name
- [ ] Commit only this card's files, by name: `TASK-XXXX: <Title> [<your AI name>]` (D-189)

## NEXT TASK
TASK-XXXX: <what it will do>

## OUT OF SCOPE
Anything not in STEPS. Do not rename, refactor or improve anything.

## IF UNSURE
Stop. Write the question in `docs/QUESTIONS.md`. Mark the task BLOCKED.
