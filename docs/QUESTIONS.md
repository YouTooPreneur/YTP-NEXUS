# QUESTIONS

Builders write their question in their task log (under "If BLOCKED"), mark the task BLOCKED and stop. Claude copies it here on `main` with the answer, and the owner decides when a decision is needed (CR-009: the allowed-files check refuses a builder's edit to this file).

| # | Task | Question | Asked by | Date | Answer | Answered by |
|---|---|---|---|---|---|---|
| 1 | TASK-0032 | Two strings in `apps/api/test/db/signin.test.ts` (lines 238 to 243) hold real line breaks, so the file cannot be parsed | claude (building session) | 2026-11-14 | The planner's slip (a shell heredoc): both strings fixed on `main`; every new or changed planner test is now parse-checked before its card goes out (`node tools/tasks/parse-check.mjs`) | Claude (planner) |
| 2 | TASK-0032 | `apps/api/test/db/rate-counters.test.ts` (TASK-0023) checks the sign-in limit through its own test door `GET /api/auth/x` and expects 200, but the card's gate (rule 8) answers 404 for every `/api/auth` path that is not one of the seven open doors | claude (building session) | 2026-11-14 | The planner's slip: the limit's test door moved to `GET /api/core/two-step/x`, which the limit counts in the same sign-in bucket and the gate does not cover; the same test still counts `/api/auth` paths and refuses them with 429 | Claude (planner) |
| 3 | TASK-0032 | `apps/api/test/db/signin.test.ts` sends about 24 sign-in requests from one address within seconds, past `infra/.env.test`'s `signin:20/minute`, so its last tests get 429 | claude (building session) | 2026-11-14 | The planner's slip: every test now starts with no sign-in counts (`TRUNCATE core.rate_counters` before each test; each test sends at most 10) | Claude (planner) |
