# AGENTS.md: rulebook for every AI working on YTP Nexus

Read this whole file before doing anything. These rules apply to every AI: Antigravity, Codex, Claude or any other.

## 1. Who does what

| Role | Who | Allowed to |
|---|---|---|
| **Owner** | The YTP owner | Decide what gets built, approve plans, approve finished work |
| **Planner** | Claude | Write and change the plan, docs, task cards and tests. Review finished work |
| **Executor** | Antigravity, Codex, Claude (each card names its builder) | Build **only** what a task card says. Nothing else |
| **Reviewer** | Claude (planning session), or Codex when asked; for a card Claude built: Codex, or the owner and a team member | Compare a finished task with its card and reply PASS or FAIL. Never fix anything. **Nobody reviews their own card** |

If you are an **executor**, you are not a designer. You do not decide anything. Every decision is already written in the task card and in `docs/`.

**Claude as an executor (D-185):** Claude builds only the cards that name Claude, only in a separate building session (never the session where it planned), and follows every executor rule in this file exactly like Antigravity and Codex. Claude never reviews a card it built.

## 2. Golden rules for executors

1. **Work only from a task card** in `docs/tasks/`. No card means no work.
2. **One task at a time.** Finish or block the current card before touching another.
3. **Touch only the files listed under ALLOWED FILES** in the card. Nothing else, not even to "fix" something.
4. **Never edit tests.** Tests are written by the planner. Make the code pass them; never change them.
5. **Never edit `AGENTS.md`, `CLAUDE.md` or anything in `docs/`** except your own task log, your evidence folder, and your task's line in `docs/STATUS.md` and `docs/tasks/INDEX.md`.
6. **Do not add, rename, refactor, "improve" or "clean up" anything** that the card does not ask for.
7. **Do not install new packages** unless the card says so, by exact name and version.
8. **If anything is unclear, missing or looks wrong: STOP.** Write your question in your task log under "If BLOCKED" and mark the task BLOCKED. Never guess. Do not edit `docs/QUESTIONS.md`: the planner copies your question there, with the answer, on `main`.
9. **Never claim something works without proof.** Proof is the verify output, pasted exactly as printed (never a summary you wrote yourself), plus any screenshot the card asks for.
10. **Never touch secrets.** Never write passwords, API keys or tokens into any file, log or message.

## 3. The task loop (every task, every time)

```
1. START CHECK  → The previous task in the chain is Done in docs/STATUS.md.
                  Read its log's "Notes for next task".
                  Work in your own git worktree, on a branch cut from the
                  current main; record that start commit in your log.
                  Run the verify command. It must be green BEFORE you start.
                  Then run it once with --card TASK-XXXX: your card's own
                  tests must fail (they test what you will build). Log both.
                  Not green? STOP. Mark BLOCKED. Do not build on a broken base.
2. BUILD        → Follow the card's STEPS exactly, in order. From TASK-0008 on,
                  run `pnpm format` before verifying (it only reformats code).
3. VERIFY       → Run the verify command with --card TASK-XXXX.
4. DEBUG LOOP   → Failed? Read the error, fix it inside the allowed files only,
                  run verify again. Up to 5 attempts.
5. STILL RED    → STOP. Mark the task BLOCKED in docs/STATUS.md.
                  Explain what failed and what you tried in your task log.
6. GREEN        → Save proof in docs/evidence/TASK-XXXX/
                  Write docs/logs/TASK-XXXX.md using docs/templates/TASK-LOG.md
                  Update your task's line in docs/STATUS.md and docs/tasks/INDEX.md
                  Rebuild the tracker: node tools/tracker/build-tracker.mjs
                  Commit (format below)
```

**Ports 3000 and 5173 (since TASK-0013):** every `pnpm verify` starts the API on port 3000 and the screens on port 5173 for its End-to-end smoke step. Before each verify run, stop any `pnpm dev` or demo you started; on one computer only one verify runs at a time. If End-to-end smoke says a URL "is already used", stop that server if you started it, otherwise wait and run verify again. Never stop a process you did not start, never change `playwright.config.ts` to get round it, and do not mark a card BLOCKED for a busy port alone. A verify output that contains `api could not start` or `EADDRINUSE` is not valid proof, even when it ends with `verify: PASSED` (its smoke tests may have reached another run's backend): free the ports and run verify again.

The verify command is created in Phase 2 (TASK-0007). **Cards TASK-0001 to TASK-0006 come before it exists:** wherever this loop says "verify", run the commands in the card's VERIFY AND DEBUG section instead, and for the start check run the commands in the card's BEFORE YOU START. Each builder's own copy is a git worktree at `../ytp-work/TASK-XXXX` on the branch `task/TASK-XXXX`. **After the reviewer's PASS**, the reviewer merges the card's branch into `main`.

**Resuming a BLOCKED card.** The planner answers your question in `docs/QUESTIONS.md` on `main`, fixes the card or its tests there if needed, and in a batch first reviews and merges the cards you already finished. When the owner tells you to resume, in your copy:
1. Run `git merge --ff-only --autostash main`. It brings in the planner's fix, keeps your unsaved work and makes no commit. Never use `git stash`: all copies share it.
2. If git reports a conflict or any error, STOP: copy what git printed into your log under "If BLOCKED" and tell the owner.
3. Run `pnpm install --frozen-lockfile`.
4. In your log, replace the hash on the line `- Start point (commit):` with the output of `git rev-parse HEAD` (replace it; never add a second such line, because the check reads the first one), and under "If BLOCKED" fill in `- Resumed after the planner's fix, earlier start: <old hash>`.
5. Read your card again (the planner may have changed it) and redo any step that changed.
6. Continue from VERIFY (step 3 of the loop). The 5 tries start again.

**A card sent back after review (FAIL)** is fixed in the same copy and on the same branch, from BUILD (step 2) on, inside the allowed files only. When `pnpm verify --card TASK-XXXX` is green, commit the fix's files by name as `TASK-XXXX: Fix after review [<your name>]`. Then run `pnpm verify --card TASK-XXXX` once more: once a card has its own commits, the allowed-files check reads only committed work, so this run is the proof. Save its output in `docs/evidence/TASK-XXXX/`, update your log, and commit those two by name as `TASK-XXXX: Proof after review [<your name>]`. Never change the card's first commit.

## 3a. Batches (the fast lane, D-196)

Each card has a lane, careful or fast, in `docs/tasks/LANES.md` (only the planner changes it, when the owner asks). A careful card is always built alone. Consecutive fast cards may be given to you together, 2 to 5 at a time (a **batch**), in one message from the owner (`docs/templates/BATCH-PROMPT.md`). In a batch:

- You work in one worktree for the whole batch, `../ytp-work/BATCH-<first card>-<last card>` on the branch `batch/<first card>-<last card>`.
- You do the cards **one at a time, in the order given**. Each card gets the whole task loop of section 3: its own start point (the commit just before you begin it, written in its log), steps, verify with `--card`, log, evidence, status lines and **its own commit**. Only then start the next card.
- **Stop the whole batch** at the first card that is BLOCKED: do not start the next card.
- The reviewer checks the batch once, card by card, and merges the batch branch after PASS. A card that fails review is sent back alone and fixed as section 3 says ("A card sent back after review").
- **Resuming a stopped batch:** follow "Resuming a BLOCKED card" (section 3) in the batch's copy. Only the blocked card's start point changes; the cards already committed keep theirs. Then carry on with the blocked card and the cards after it, in order.

## 4. Commit format

One commit per task, with only that card's files, added by name (allowed by the owner, D-189):

```
TASK-0142: Add GSTIN to client [antigravity]
```

Use your own name in the brackets: `antigravity`, `codex` or `claude`. Every commit you make starts with its card's ID: a card sent back after review gets two more, `TASK-XXXX: Fix after review [<your name>]` and `TASK-XXXX: Proof after review [<your name>]` (section 3). From TASK-0012 on, the allowed-files check fails on any commit not named for a card.

## 5. Your reply when you finish

Reply to the owner with exactly:

1. Task ID and result: **DONE** or **BLOCKED**
2. Files changed (must match the card's allowed list)
3. The final verify result
4. Path to your task log

## 6. Where things live

| Need | Look in |
|---|---|
| Where the project is, what's next | `docs/STATUS.md` (the **Resume here** section) |
| Why something is the way it is | `docs/DECISIONS.md` |
| Your task | `docs/tasks/TASK-XXXX.md` |
| What earlier tasks did | `docs/logs/` |
| Templates | `docs/templates/` |

## 7. Project facts every AI must respect

- The app is a **modular monolith**: one app, one login, one database split into sections per module.
- **Two parts in one repository (D-187):** both in TypeScript: the **frontend** (React, `apps/web`) only shows screens and calls the API; the **backend** (Express, `apps/api`) holds every rule, permission check and the database. The frontend never touches the database. **A card is either a backend card or a frontend card**; it says which. Only the **set-up cards** of Release 1, step 2.1, may cover both parts and more than 3 files; each lists every allowed file. A **backend card** covers one API door inside one module folder, every file listed. The **shared backend cards** of step 2.2 (development services, settings, database accounts and changes, transactions, logs, queues) have no door; each lists every file it touches, and may have more than 3 (CR-017).
- **7 modules** (CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy) sit on a shared **Core**, with the Command Centre, Reports and AI on top.
- **Floor rules:** a module may only *ask* modules on floors below it; to reach higher floors it *announces* events. No loops.
- **Each module owns its own data.** Other modules refer to it by ID and never copy it or write into it.
- Everything a user might change (roles, sources, senders, templates, rules) is a **setting**, not code.
- Every outside service connects through a **door** in Core. Modules never call outside services directly. Each planned service has a ready slot (CORE-123); build a door only when its card says so.
- **Nexus never stores client or tool passwords.** Use password-manager references (links to Vaultwarden items) only.
- **Built in 18 small releases, one after another** (D-186, `docs/RELEASES.md`); each screen's release is in `docs/SCREENS.md`.
- **Build only the release and step named on the card** (for example Release 3); never start work from a later release.

Full detail is in `docs/DECISIONS.md`, `docs/TECH-DESIGN.md` and `docs/DATA-MODEL.md`.
