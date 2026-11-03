# Batch message for the builder (fast lane, D-196)

Claude fills in the card IDs and the folder, and gives the owner the finished message to paste; nothing is left to fill in. Only consecutive **fast** cards from `docs/tasks/LANES.md` go into one batch (2 to 5 cards). A careful card is always sent on its own, with the single-card message.

```
You are the builder for a batch of task cards in the YTP Nexus project: <TASK-AAAA>, <TASK-BBBB>, <TASK-CCCC>, in this order. This folder is your own copy of the project for the whole batch: a git worktree on the branch batch/<TASK-AAAA>-<TASK-CCCC> (it is already made, so skip each card's "Make your own copy" line).
1. Read AGENTS.md completely and follow it exactly, including section 3a (batches).
2. Do the cards one at a time, in the order above. For each card: BEFORE YOU START (in its log write the line `- Start point (commit): <hash>`, with the hash from `git rev-parse HEAD` taken just before you begin it: the bare hash, with no backticks, bold or words after it), every STEP in order, VERIFY AND DEBUG, then WHEN GREEN with its own log, evidence, status lines and its one commit. Only then start the next card.
3. For each card, touch only the files in its ALLOWED FILES table, plus its log (docs/logs/TASK-XXXX.md), its evidence folder (docs/evidence/TASK-XXXX/) and its lines in docs/STATUS.md and docs/tasks/INDEX.md.
4. Never edit any test file or tests/LOCK. If anything is unclear, or a card is still failing after 5 tries, mark that card BLOCKED, write the question in that card's log under "If BLOCKED" (never in docs/QUESTIONS.md) and STOP the whole batch: do not start the next card.
5. In each log, list every command exactly as typed and paste the start-check output; save the final `pnpm verify --card` output in the card's evidence folder, exactly as printed. Never write a real password, key or token into any file. Do not push to GitHub.
6. Finish with one reply that gives, for every card, the reply described in AGENTS.md section 5.
```
