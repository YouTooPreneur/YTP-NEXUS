# Architecture fixtures (TASK-0008)

Small fake files that break each architecture rule on purpose. Written by the planner; builders never edit them. Files named `ok-*` must never be reported; files named `bad-*` must be.

- `apps/api/src/modules/crm/bad-loop-a.ts` and `bad-loop-b.ts` import each other (`no-circular`, checked by TASK-0008's test).
- `packages/contracts/src/` holds the shared contracts package's fixtures. TASK-0008's test cruises only `apps`; TASK-0009's test cruises `apps packages` and expects the frontend walls to cover this package (CR-008).
- `apps/web/src/bad-type-import.ts` and `bad-inline-type-import.ts` import backend code for its types only. TASK-0012's test expects the frontend wall to catch both once `tsPreCompilationDeps` is on (review of TASK-0011, CR-012): with `verbatimModuleSyntax`, the inline form leaves an import that can pull backend code into the screens' bundle.
