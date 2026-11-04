# LOG · TASK-XXXX · <Title>

| | |
|---|---|
| **Done by** | <antigravity / codex / claude> |
| **Date** | YYYY-MM-DD |
| **Result** | DONE / BLOCKED |
| **Attempts** | <how many times you ran `pnpm verify --card` after building (AGENTS.md section 3, steps 3 and 4): 1 if the first run passed> |

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
- `docs/evidence/TASK-XXXX/<files>` (for a screenshot, write here the address it shows)
- Save the final verify output with exactly one of these, which keep both output streams and leave out colour codes:
  - Git Bash: `NO_COLOR=1 pnpm verify --card TASK-XXXX > docs/evidence/TASK-XXXX/verify-output.txt 2>&1`
  - PowerShell: `$env:NO_COLOR = '1'; cmd /c "pnpm verify --card TASK-XXXX > docs\evidence\TASK-XXXX\verify-output.txt 2>&1"`
  - Never save it with `WriteAllLines`, `Out-File` or a PowerShell `>`: they drop pnpm's lines on the error stream (failure details included) or write the wrong encoding.

## Notes for next task
- <anything the next task must know: new files, names, gotchas>

## If BLOCKED
- My question (the planner copies it into docs/QUESTIONS.md and answers it there):
- What failed:
- What I tried:
- What I think is needed:
- Resumed after the planner's fix (AGENTS.md section 3), earlier start:
