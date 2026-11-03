# LOG · TASK-XXXX · <Title>

| | |
|---|---|
| **Done by** | <antigravity / codex / claude> |
| **Date** | YYYY-MM-DD |
| **Result** | DONE / BLOCKED |
| **Attempts** | <number of verify runs> |

## Start check
- Previous task Done: yes / no
- Start point (commit): <hash>
- `pnpm verify` green before starting: yes / no
- `pnpm verify --card TASK-XXXX` before building: this card's tests fail (expected): yes / no

## Files changed
| File | Action |
|---|---|
| `<path>` | created / edited |

## Commands run
```
<each command, in order, including the ones that start a server or take a screenshot>
```

## Errors and fixes
| # | Error (short) | What I changed to fix it |
|---|---|---|
| 1 | — | — |

## Final verify result
```
<paste the last lines of `pnpm verify --card TASK-XXXX` exactly as printed, ending with the `verify:` line>
```

## Evidence
- `docs/evidence/TASK-XXXX/<files>` (save command output without colour codes: first run `$env:NO_COLOR = '1'` in PowerShell, or `export NO_COLOR=1` in bash; for a screenshot, write here the address it shows)

## Notes for next task
- <anything the next task must know: new files, names, gotchas>

## If BLOCKED
- My question (the planner copies it into docs/QUESTIONS.md and answers it there):
- What failed:
- What I tried:
- What I think is needed:
- Resumed after the planner's fix (AGENTS.md section 3), earlier start:
