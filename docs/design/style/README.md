# Style images (step 1.5, kept as a record)

Step 1.5 was approved on 1 Oct 2026. These pictures are the early style rounds; the design versions after that are in `docs/design/versions/` (D-180) and listed in `docs/design/DESIGN-RULES.md` section 8. Never overwrite these files.

- **Round 1** (ChatGPT, from `docs/design/STYLE-PROMPTS.md`): `1A.png` … `4C.png` (prompt number + style letter).
- **Round 2** (luxury and premium, dark and light, from `docs/design/STYLE-PROMPTS-ROUND2.md`):
  - ChatGPT pictures in `round2/`, e.g. `round2/R2-1-E-dark.png`.
  - Claude's coded screens of every combination, ending in `-claude`, e.g. `R2-1-E-dark-claude.png`.
  - Pattern: `R2-` + screen (1 dashboard, 2 client profile, 3 pipeline, 4 phone) + look (E Emerald Luxe, N Midnight Navy, M Monochrome Neon) + `dark` or `light`.
- **Round 3** (the chosen mixed style): `R3-1-E-mixed-claude.png` … `R3-4-E-mixed-claude.png` (Emerald) and `R3-1-N-mixed-claude.png` … `R3-4-N-mixed-claude.png` (Navy).

New pictures of screens are taken with `node tools/mockups/capture.mjs` into a new folder in `docs/design/versions/`. The old `tools/mockups/render-mockups.mjs` is retired: it would overwrite these record pictures.
