# Single-card message for the builder (careful lane, and any card built alone)

Claude fills in the card ID, makes the builder's copy (`git worktree add ../ytp-work/TASK-XXXX -b task/TASK-XXXX main`) and gives the owner the finished message to paste; nothing is left to fill in. Batches of fast cards use `docs/templates/BATCH-PROMPT.md` instead.

```
You are the builder for task card TASK-XXXX in the YTP Nexus project. This folder is your own copy of the project: a git worktree on the branch task/TASK-XXXX (it is already made, so skip the card's "Make your own copy" line, but in your log write the line `- Start point (commit): <hash>` with the bare hash from `git rev-parse HEAD`, with no backticks, bold or words after it).
1. Read AGENTS.md completely and follow it exactly.
2. Then do docs/tasks/TASK-XXXX.md exactly: BEFORE YOU START, every STEP in order, VERIFY AND DEBUG, then WHEN GREEN.
3. Touch only the files in the card's ALLOWED FILES table, plus your log (docs/logs/TASK-XXXX.md), your evidence folder (docs/evidence/TASK-XXXX/) and the TASK-XXXX lines in docs/STATUS.md and docs/tasks/INDEX.md.
4. Never edit any test file or tests/LOCK. If anything is unclear, stop, write the question in your log under "If BLOCKED" (never in docs/QUESTIONS.md) and mark the card BLOCKED.
5. Write the start-point line in your log before the start check, and set Done in docs/STATUS.md and docs/tasks/INDEX.md only after the final verify passes. In the log, list every command exactly as typed (including the one that saved the evidence file, which is one of the two save commands in docs/templates/TASK-LOG.md) and paste the real output of both start-check runs and the final run, never a summary you wrote. Run pnpm install first, and pnpm format before verifying. Never write a real password, key or token into any file. Make the one commit the card asks for, starting with the card's ID. Do not push to GitHub.
6. Finish with the reply described in AGENTS.md section 5.
```
