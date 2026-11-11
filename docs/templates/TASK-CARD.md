# TASK-XXXX · <Title>

**Chain:** <CHAIN-NAME> (step N of M) · **Release:** <1–18> · **Module:** <module> · **Part:** <Backend / Frontend / Set-up (step 2.1 only)> (D-187) · **Depends on:** TASK-XXXX
**Requirement IDs covered:** <e.g. CRM-012>
**Builder:** <Antigravity / Codex / Claude> (D-185: Claude builds only in a separate building session) · **Reviewer:** <Claude / Codex / owner + team member> (never the builder)

## BEFORE YOU START
- TASK-XXXX must be **Done** in `docs/STATUS.md`
- Read: `AGENTS.md`, `docs/logs/TASK-XXXX.md` (Notes for next task), <other files>
- Work in your own git worktree on a branch cut from the current main. Write `- Start point (commit): <hash>` in your log: the bare hash, with no backticks or words after it (the Allowed files check reads this line).
- Enough free disk space for the card (at least 5 GB on drive C: when it installs or downloads anything big).
- Make sure no server uses port 3000 or 5173: stop any `pnpm dev` or demo you started. Since TASK-0013 every `pnpm verify` starts its own servers (End-to-end smoke), so on this computer only one verify runs at a time (AGENTS.md section 3).
- Run `pnpm verify`. It must be green. If not: STOP and mark BLOCKED.
- Run `pnpm verify --card TASK-XXXX` once: this card's tests must fail. Write both results in your log.

## CONTEXT (already exists from earlier tasks)
- <what exists, with file paths and which task created it>

## ALLOWED FILES (touch nothing else)
| File | Action |
|---|---|
| `<path>` | create / edit |

Patterns: `*` matches inside one folder; `**` matches anything, including `/`. So `dir/**/*.ts` needs at least one folder after `dir/`: when files directly in `dir/` are allowed too, add a `dir/*.ts` row as well (as TASK-0008 does). `dir/**` covers everything under `dir/`. Every other character, including `?`, is matched as written. A builder's own test file is allowed only when it is listed here.

## STEPS
1. <exact step: names, types, labels, messages all spelled out>
2. <exact step>

## TESTS (already written; DO NOT EDIT)
- `<path to test file>`

## VERIFY AND DEBUG
Run `pnpm verify --card TASK-XXXX`. If it fails, fix it inside the allowed files and run it again, up to 5 tries. If End-to-end smoke says a URL "is already used", do not change `playwright.config.ts`: stop the server on port 3000 or 5173 if you started it, otherwise wait for the other run to finish, then run verify again.
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
Stop. Write the question in your log (`docs/logs/TASK-XXXX.md`, under "If BLOCKED"). Mark the task BLOCKED. Do not edit `docs/QUESTIONS.md`.
