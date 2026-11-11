# Handover: how to continue YTP Nexus anywhere

**Written 2026-10-21 (D-175, D-176).** This file, Claude's memory notes and "where we stopped" load into every session automatically (`CLAUDE.md`); read `STATUS.md` (Resume here) and `DECISIONS.md` too. It holds what the other documents don't: how the owner likes to work, how Claude works on this project, where things live outside this folder, and the lessons learned. The full conversation since 29 Sep 2026 is in `history/` (section 8).

The way of working (history, handover, tracker tabs, Word copies, choices, design versions, screen check) follows the owner's Dharsha project. Only the process was taken from it, never its content.

## 1. The people

| Who | Role |
|---|---|
| **Owner** | Runs YouTooPreneur (Chennai digital agency). Decides, approves, and is the only one who signs off. Not a developer by trade; wants plain-English explanations |
| **Senior / team member** | Reviews the screens with the owner (review bundle with the Excel comment sheet). The owner and this person approve once, after all 9 batches (D-153) |
| **Claude** | Planner: plan, documents, task cards, tests, screen mockups, reviews. Also builds some cards (D-185): only cards that name Claude, only in a separate building session, and never reviews its own (`CLAUDE.md`, `AGENTS.md`) |
| **Executors** | Antigravity, Codex and Claude, building only from task cards; each card names its builder (D-185). Codex reviews Claude's cards (PASS or FAIL, never fixes). **While Codex has no tokens (D-194, from 2 Nov 2026), Antigravity builds every card and Claude reviews every card** |
| **CA** | Checks salary split, PF/ESI/professional tax, GST and invoice numbering before go-live |

## 2. How the owner likes to work

- **One place to look:** everything shows in the tracker, with nothing missing, so a new session, a crash, a new PC or a new account can recover everything (D-177). Keep every detail.
- **Short, simple, point-wise, plain English.** Lead with the answer. One table or list, not long sections. No requirement IDs or file paths unless asked.
- **Questions through the question tool**, and **one by one** when the owner says so. Put the recommended option first.
- **"Tell me what you understand first"** means: explain, then wait for approval before doing anything.
- **Short nudges** ("continue", "go", "try again", "do all remaining batches") mean: keep working with tools. Never answer "No response requested."
- **Show, don't describe:** send pictures (overview sheets of screens) with `SendUserFile`. Screens are coded HTML, not AI images (D-136).
- **Two lanes (D-196):** before every card or batch, say its lane in one line (careful or fast, and why) so the owner can switch it first. Careful cards go alone with the full three-angle review; fast cards go in batches of 2 to 5 (`docs/templates/BATCH-PROMPT.md`, one worktree `../ytp-work/BATCH-<first>-<last>`) with one review per batch (the automatic check on every card, `tools/tasks/check-lock.py`, one reviewer and a skeptic) and a demo. The owner can switch any card at any time: change `docs/tasks/LANES.md`, never the card itself. If the owner switches a careful card to fast, remind them of the risk once, then do as they say.
- **After every task (D-195):** tell the owner in plain words what the card built, why it is needed, the check result and anything fixed in the plan; when there is something to run, run it and send pictures. Keep the "What's built so far" list in `docs/STATUS.md` up to date.
- **Never approve on the owner's behalf.** The owner (and the senior) approve once, after all 9 batches (D-153).
- **AI everywhere, always with limits** ("anything we use with AI should have a limit"): budgets per role, person and feature; the manual way always works (D-155, D-156).
- **Everything is in scope:** "Don't put anything later." All requirements have a build step; nothing is dropped.
- **Release by release, small and slow (2 Nov 2026, D-186):** 18 small releases (`docs/RELEASES.md`); each is built, checked, put online, used by the team, improved from their feedback and closed before the next. "We can go slow and do everything perfectly." A release may be split if it is big.
- **Build only from our own plan (strict, 2 Nov 2026):** do not bring in outside planning documents unless the owner asks.
- **Settings, not code:** anything the owner might change is a no-code setting.
- **Free as much as possible.** Keep cost questions very simple.
- **Choices:** small decisions made while building go into `docs/CHOICES.md`; the owner answers them in one line ("3: Keep · 9: change") (D-179).
- **Reference projects are for ideas only:** take process ideas (for example from the Dharsha project), never copy their content.
- **More preferences, found when every file was read (21 Oct 2026):**
  - No deadlines: plan in phases and steps, never by date ("time doesn't matter, I want the complete product").
  - Automate as much of the agency's daily work as possible, end to end.
  - Explain a plan with an everyday story and "how professionals do it"; show it as one diagram or a clickable preview, end to end in one view.
  - Answer the owner's own questions first, then ask Claude's; keep asking until every question is closed. Before building a batch, ask its questions first, separately.
  - "Wait" means stop and don't push for decisions. Anything going to other people waits until the checks and reports are done.
  - Anything the owner pastes elsewhere (prompts, messages) is complete and ready to paste, with nothing to fill in.
  - Big documents are explained as a short numbered list in the chat, not only as a file link.
  - When a new kind of feature is added (for example AI helpers), retrofit the earlier batches so every screen stays consistent.
  - A conditional "if all okay, proceed" is not an approval to record; confirm first.
  - Say clearly when the tracker has been updated, and end status answers with a short "Next" and "Waiting on you".
- **Hard rules from the owner:**
  - Never touch Agency OS (being closed; its screenshots are only a feature list).
  - Nexus never stores client or tool passwords: Vaultwarden links only (RULE-025, D-140). Aadhaar: last 4 digits only. Never import passwords.
  - Test mode during development: no message ever reaches a real client.
  - No git commits unless the owner asks, except the one commit per finished task card that its builder makes (D-189) and Claude's own planning saves to `main` (D-193). Uploads (`git push`) are run by the owner: Claude gives the one upload line with a **Run** button and the owner clicks it.

## 3. The process

- Written out in `docs/PLAN.md`: 5 phases (Prepare → Foundation → Modules → Launch → Run and improve), with steps such as 1.6 and 3.4, built in **18 small releases** (D-186, `docs/RELEASES.md`). **Build only the release and step named on the card.**
- **Review loop:** steps 1.2 to 1.7 repeat until the owner is happy; every round is numbered in `STATUS.md`. Then the **FREEZE**.
- **Gates are the owner's approvals** (no client, no payments): requirements, screens (with the senior's review), the architecture, each module after its two-person check, and go-live (D-182).
- **Small-task rule:** one screen, endpoint or component per card, about 2–4 hours, about 200 lines, 1–3 files (D-091), 1–3 acceptance criteria (`docs/PLAN.md`).
- **Session routine:** start by reading STATUS, DECISIONS and this file; end with section 7.

## 4. Where things live

| What | Where |
|---|---|
| Status, next step, waiting-on list, review rounds | `docs/STATUS.md` |
| Every decision with its reason | `docs/DECISIONS.md` (D-001 onwards) |
| Everything the owner said, by round | `docs/RAW-REQUIREMENTS.md` |
| Requirements with pass/fail tests | `docs/REQUIREMENTS.md` (CORE-, CRM-, … IDs) |
| Every screen | `docs/SCREENS.md` (SCR-001 onwards) |
| Process, releases, scope, estimate, tech design, data model | `docs/PLAN.md`, `docs/RELEASES.md`, `docs/SCOPE.md`, `docs/ESTIMATE.md`, `docs/TECH-DESIGN.md` (React frontend + Express backend, both TypeScript, D-187), `docs/DATA-MODEL.md` |
| Choices for the owner | `docs/CHOICES.md` (the record), `docs/CHOICES-EXPLAINED.md` (each choice in plain words with an example, for the manager; Word copy in `share/`) and `share/YTP Nexus - Choices answer sheet.xlsx` (built by `python tools/share/build-choices-sheet.py`) |
| Change requests after the freeze | `docs/CHANGES.md` |
| Task cards, the card list and the tests | `docs/tasks/INDEX.md` (every card of the release, with builder and status), `docs/tasks/LANES.md` (each card's lane, D-196), `docs/templates/BATCH-PROMPT.md` (the fast-lane batch message), `docs/templates/CARD-PROMPT.md` (the single-card message), `docs/tasks/TASK-XXXX.md` (full cards, written one step at a time), `docs/TEST-PLAN.md`, the planner tests (`tests/`, `apps/*/test/`, `packages/*/test/`) and `tests/LOCK` (rebuilt by `python tools/tasks/write-lock.py` after any planner test changes; when reviewing a card, `python tools/tasks/check-lock.py <the builder's copy>` checks that no locked test changed) |
| Design rules and design versions | `docs/design/DESIGN-RULES.md` (versions table at the end), pictures in `docs/design/versions/` (never overwritten) and the early style rounds in `docs/design/style/` |
| Screen notes per batch | `docs/design/screens/BATCH-1.md` … `BATCH-9.md` |
| Clickable screens | `docs/design/mockups/` (start: `index.html`; viewer: `viewer.html`) |
| Tracker: the one place to look | `tracker.html`: every document, the whole conversation (History), the handover and memory (Handover), every file (Files) |
| Word copies for WhatsApp | `share/` (built by `tools/share/build-word.py`) |
| Review bundle for the senior | `Documents/YTP Nexus Screen Review` + `.zip` (built by `tools/share/build-review.py`) |
| **Files to share, in one place** | `Downloads/YTP Nexus - to share`: 1 the senior's review copy, 2 the choices list (Word), 3 the preview, plus a READ ME saying what goes to whom (built by `python tools/share/build-downloads.py`; the owner's request, 31 Oct 2026) |
| Full conversation and memory | `history/` (section 8) |

## 5. Outside this folder

| What | Where | Note |
|---|---|---|
| Planning notes (original) | `Downloads/YTP Nexus new notes.docx` | Copy in `docs/sources/` |
| Agency OS | Old system, being closed | Never touch it |
| Share copies | `Documents/YTP Nexus Preview` and `Documents/YTP Nexus Screen Review` (+ ZIPs) | Rebuilt by the tools; safe to delete |
| Dharsha project | `Downloads/dharsha-estate` | The owner's client project; its process was reused here, nothing else |
| Code repository | GitHub, private: `YouTooPreneur/YTP-NEXUS`, branch `main` (D-192) | Uploads through the repository-only deploy key on this computer; saves show YouTooPreneur. Kept off GitHub: the staff document, `history/`, `share/`, `tracker.html`. The owner runs uploads (this app asks the owner for uploads); builders commit one card at a time (D-189) |
| Higgsfield CLI | Installed and signed in | Not used for screens any more (D-136) |
| Early online preview | A claude.ai page made on 30 Sep 2026 (linked in the History) | Out of date: it shows the old 6-module design. Superseded by `docs/design/mockups/`; the link no longer opens |

## 6. How Claude works on the screen mockups

**Build**
- Plain HTML pages in `docs/design/mockups/`, one per screen, all using `mockup.css` and `mockup.js`.
- `mockup.js` builds the side menu and top bar (`<div class="app" data-active="CRM" data-sec="crm" data-sec-on="leads">`), the section menus (`SECNAV`), the client and student portal frame (`<div class="portal" data-pon="home" data-who="…">`), icons (`<i data-i="name">`), tabs (`data-tabs`/`data-panel`), AI helper notices (`data-ai`), links (`data-go`) and fitting to the window.
- Computer pages are 1600 × 1000; `.app.long` pages scroll. Phone pages show 2–3 phones side by side.
- **Sample world:** today is **Thursday 1 October 2026**; Gandhi Jayanti (2 Oct) is a holiday. Money in Indian format. Keep one set of sample facts across screens (each batch note lists them): to collect ₹1,39,016, overdue ₹65,016; Kaveri Hospitals (Dr. Rao) is the portal sample; Velocity Motors for ads; Harini S for the student portal.
- **A new page** goes in: the preview home (`preview-hub.src.html`, then `node tools/mockups/build-preview.mjs`), the batch note, `SCREENS.md` if it's a new screen, and the screen check list.

**Check before showing anything (D-181)**
1. Start the preview server: `.claude/launch.json` → "tracker" (port 8765).
2. Run the screen check headless: `python tools/mockups/run-check.py` (every page, both colours, every tab; portal and public pages also at phone width; about 10 minutes; `--pages a.html,b.html` for a few). Or open `http://localhost:8765/tools/mockups/check.html` and press **Run all checks** (the app's browser pane pauses hidden pages, so headless is more reliable). Show a batch only with zero problems. A new page goes into `PAGES` in `check.html`; the check lists any page that is missing from it.
3. Take pictures and look at them yourself: `node tools/mockups/capture.mjs docs/design/versions/<new-folder> "name=page.html" …`. For a phone-width picture of a portal or public page use the phone frame: `"name=../../../tools/mockups/frames/phone.html?p=portal-home.html@520x900"` (headless Edge can't open a window narrower than about 500 px). New versions get a new folder plus a row in the versions table.
4. The screen check also checks links (every `href` and `data-go` must point to an existing page).
5. Screen viewer: `docs/design/mockups/viewer.html` (every screen by batch, previous/next, colour, phone width) is rebuilt with the preview home by `node tools/mockups/build-preview.mjs`.

**Lessons learned (bugs seen before)**

| Bug | Cause or fix |
|---|---|
| Search box broken in the top bar | A page style named `.q` clashed with the search text (`partner-dashboard`, `diagnosis`). Never use shell class names page-wide: `.q`, `.mic`, `.search`, `.top`, `.side`, `.brand`, `.me`, `.av`, `.badge`. Tuning a copy inside your own box (for example `.filters .search`) is fine |
| Shared rules leaking into page parts (21 Oct) | Global `.who`, `.tags span`, `.phead span`, `.row`, `.amt`, the menu's `.brand` padding and the top bar's `.top` height reached page parts with the same names (grey chips, pill borders, a 76 px letterhead). They are now scoped in `mockup.css` to their owners (renewal cards, deal cards, phone header, dashboard rows, attention list, side menu, `header.top`). Still avoid these names page-wide, and also `.g2` (a layout grid). The bare `table` rule adds 22 px side margins: previews set `margin:0` on their tables. `.tbl td.num` is right-aligned and beats a page's `.x .num`: write `.tbl.x .num` to centre |
| Rows 262 px tall | Page class `.r2` clashed with the dashboard row. Also avoid `.ag0`–`.ag3` (ageing colours) and `.stack`; `.hello` may only tune the shared greeting row |
| Chat bubble laid out sideways | `.me` is the side menu's profile card; use another name |
| Page cut off at the bottom | Fixed pages are 1000 px tall and `main` hides overflow: trim rows or make the page `.app.long` |
| Text spilling out of cards | A flex child needs `min-width:0` before `text-overflow:ellipsis` works |
| Screenshots not saved | The preview server had stopped (curl returns 000): restart it with `preview_start` "tracker" |
| Blue digits in headless Edge pictures | Only in headless Edge; real browsers show them normally |
| Tamil text | Load Noto Sans Tamil and put class `ta` on the page part in Tamil |
| Gmail attachments | 25 MB limit; the review ZIP is just over it (Drive link, or WhatsApp) |
| Pale grey text (about 9,750 check problems on 21 Oct) | Muted text was 4.1–4.4:1 and "faint" grey was used for text. Muted is now 4.5:1+ on every light background; faint is only for dots and lines; never fade content with opacity |
| A helper emptied a page | A "read-only" helper agent emptied `search.html` (21 Oct). Before running helpers that might write, snapshot `docs/design/mockups/`; the screen check now reports empty pages; restore from `Documents/YTP Nexus Screen Review` if needed |
| Inline style beats the phone rule | A page that sets `grid-template-columns` inline keeps it on a phone; use a CSS variable (`--po-side`) so the shared phone rule can win |
| Words broken letter by letter on a phone | `overflow-wrap:anywhere` inside tables squeezes columns; tables keep `nowrap` and scroll sideways instead |
| History folder grew to 926 MB | The save copied the helpers' notes (`subagents/`) at full size. They are now kept compressed with each picture once (D-183): 819 MB became about 220 MB, and a test restore gave back all 218 notes unchanged |
| Share copies carried the private conversation | They copied `tracker.html` with its History and Handover tabs; they now build a share version (`build-tracker.mjs --share`) without History, Handover, Files or the last message |
| 24-hour times (24 Oct) | Screens write clock times 12-hour (`9:00 am`, `6:30–8:30 pm`; choice 4). The screen check flags a 24-hour time; phone status bars (`.status`) and video lengths (`.vth`) are left as they are. When converting text with a script, match ranges and single times in **one** pass: two passes turned `10:00 am` into `10:00 am am` |
| A session ended mid-workflow (24 Oct) | The 4 checkers were cut off when the session closed. Resuming with the same script and run id kept the finished helpers' work; the helpers re-ran, found their changes already made and only filled gaps |
| `.note` and link rules (28 Oct) | `.note` is a shared class (a notes box with a typing cursor): never use it page-wide. A page rule like `.x li > a` also restyles `a.btn` inside it: write `a:not(.btn)` |
| Session limit stops helpers | Big helper runs (dozens of agents) can hit the usage limit and stop half-way; resume the workflow (finished helpers are kept) and use smaller runs |
| Helpers stopped by a new message (2 Nov) | A background review stopped when the owner sent a message, and Claude wrongly said it was still running. Before saying helpers are running, read the workflow's `journal.jsonl`; tell the owner a new message or Stop may end them, and restart them if so |
| Review rounds that fix their own fixes (2 Nov) | The tech design review found 54 problems, the check of the fixes 24 more (mostly caused by the fixes), and a last check 6. Always re-check fixes with a fresh reviewer and a skeptic before showing the owner; keep each check narrower than the last |
| Test builds catch what reading misses (2 Nov) | Reviewers who actually built the first cards in a temp folder found pnpm 11 refusing esbuild's install script, a test that could not read its file in the browser-like mode, and Prettier rewriting the design tokens; none showed up by reading. Before releasing a step's cards, have a helper build the first cards literally in a temp folder. Tell every helper to delete only the temp folder it made: one cleaned the session scratchpad by mistake |
| Claude cannot give itself upload rights (2 Nov) | The owner asked why Claude can't upload with the deploy key, then said "take good decision". Claude tried to add a project-only `git push` permission to `.claude/settings.local.json`; this app's safety lock refused it (Claude may not change its own permissions). Do not try again or work around it. Uploads stay with the owner: after each save Claude shows the upload line in a `bash` block, and the owner clicks **Run**. Only the owner could add such a permission, in the app's own settings |
| Cards that describe a start command in words miss the error path (2 Nov) | TASK-0002 said "print api listening once listening"; Codex did exactly that, but under Express 5 the same callback also runs when the port is taken, so it reported success and exited normally. Reviewing a card's build with three angles (the card word for word, a clean rebuild, fit for the next cards) found it; the card-only check would not have. For start commands, schedules and anything that can fail at run time, give the code word for word and a planner test for the failure case |
| Lockfile changes outside the card's own part (2 Nov) | When a card adds a package that another tool can use (TASK-0003 added jsdom, which vitest can use), pnpm also rewrites that tool's line in the other apps' parts of `pnpm-lock.yaml`. That is expected: check that the versions and the root part are unchanged, or rebuild the lockfile offline from the previous one and compare; do not expect the other parts to be byte for byte the same |
| Merging a card while planning notes are unsaved (2 Nov) | The merge of TASK-0004 stopped because Claude's unsaved edits touched `docs/tasks/INDEX.md`, which the builder's branch also changes. Save (commit) planning edits before merging a card, or set them aside (`git stash`), merge, bring them back and combine the card list by hand |
| Showing the owner a card's work (2 Nov, D-195) | `.claude/launch.json` has `nexus-api` (port 3000) and `nexus-web` (port 5173): run `pnpm install --frozen-lockfile` in the main folder after each merge, start both with the preview tool, and take pictures. When a part is built but not used on any page yet (like the button), build a throwaway preview page in a scratch copy, never in the project. Save the pictures in `docs/progress/TASK-XXXX/`, add the card to "What's built so far" in `docs/STATUS.md`, and stop the servers afterwards so they never block a builder's ports |
| The scratch folder was emptied mid-session (2 Nov) | At about 9:52 pm Claude's whole scratch folder in the Temp folder disappeared while Antigravity was building (cause unknown). Nothing in the project was lost. Keep anything reused in `tools/` (for example `tools/tasks/check-lock.py`), and give review helpers and demos their own folders in `../ytp-review/`, next to the project, never in Temp |
| The C: drive filled up (2 Nov) | A reviewer found C: full (about 125 MB free); every card needs space for its own copy, and TASK-0006 (Docker images) and TASK-0013 (a test browser) download large files. Check free space before giving the owner a card's steps (`df -h /c`). After each merge, remove the merged builder copies (`git worktree remove ../ytp-work/TASK-XXXX`) and delete demo folders. The biggest easy win was npm's download cache (17 GB, `npm cache clean --force`, asked first: it is outside the project) |
| Reviewing cards that start Docker services (2 Nov) | The development services share fixed ports and one project name (`ytp-nexus-dev`, with the builder's volumes). Only one reviewer may start containers, under its own project name (`docker compose -p review0006 ...`, removed afterwards with `down -v` for that project only); everyone else reads. To show the owner, start them from the main folder with `pnpm services:up` (copy `infra/.env.example` to `infra/.env` there first; it is git-ignored), then `pnpm services:down`. The SeaweedFS file store needs a few seconds after start before it stores files |
| Tools missing from GitHub (3 Nov) | The `.gitignore` lines `history/` and `share/` (meant for the private conversation and the Word copies) also hid `tools/history/` and `tools/share/`, so the conversation-save, backup, Word, review-bundle and Downloads tools were never saved or uploaded. They are now `/history/` and `/share/` (only the folders at the top), and the 7 tools are saved. After changing `.gitignore`, run `git status --untracked-files=all` and check that nothing private became visible and nothing needed is still hidden |
| Merging when `main` has moved on (3 Nov) | Claude's planning saves can move `main` on while a card is being built, so a fast-forward merge is no longer possible. Merge the card's branch with a merge commit (`git merge --no-ff -m "Merge TASK-XXXX: ... (reviewed, PASS)" task/TASK-XXXX`), then run `pnpm install --frozen-lockfile` and `pnpm verify` on `main`. A card's own work is always compared with its start point, never with `main` |
| Reading a verify run (3 Nov) | Through `pnpm`, a failed run ends with pnpm's own `ELIFECYCLE` line, so look for the line starting with `verify:` instead of the last line. Pictures of pages outside the project (for example a demo of the check's output) are taken with headless Edge (`msedge --headless=new --screenshot=...`, a fresh profile and a timeout): the app's browser pane cannot draw them |
| A green check can hide a switched-off rule (3 Nov) | TASK-0008's lint passed, yet a misspelt name in `.mjs` verify code was never caught: the `tseslint.config` helper had copied its file list onto typescript-eslint's TypeScript-only block, which switches `no-undef` off. Only a planted mistake showed it. Every check gets a planner test that plants a mistake and expects it caught (TEST-PLAN section 3), and the reviewer of a checker card plants one mistake per rule in a throwaway copy |
| Reviewing a committed card (3 Nov) | Once a card is committed, the allowed-files check reads only the commits named for it, so a stray uncommitted file or a commit with another name is invisible to it. Until TASK-0012 adds the commit check, run `git log --format='%h %s' <start point>..HEAD` and `git status --porcelain` in the builder's copy as part of every review. To plant a mistake on a committed card in a throwaway clone, commit it with the card's ID in the subject. Builders write their questions in their own log (AGENTS.md rule 8); Claude copies them into `docs/QUESTIONS.md`. The single-card message is `docs/templates/CARD-PROMPT.md` |
| Logs need a planted secret, not a reading (3 Nov) | TASK-0010's log test passed, yet a password one level deeper, a token in an address or Referer, and the values inside a failed database query all reached the log; only sending such values for real and searching the log showed it. For anything that must never be logged, the planner test sends the secret through every path (fields at several depths, the address, headers, error properties and message) and searches the whole log. When a review finds gaps in a finished card, the fix goes into a new small card built next (here TASK-0086), never into a later card's unrelated steps |
| Re-check the planner's own fixes (4 Nov) | The fresh re-check of CR-012 found 5 mistakes in Claude's own notes (a setting that would have broken a locked test, list filters that turn an empty value into 0, a database time that would answer 500) and a new builder-message rule that clashed with TASK-0013's screenshots. Before changing `CARD-PROMPT.md` or `BATCH-PROMPT.md`, read the WHEN GREEN of the next cards; and check that a planted mistake really differs from the right code (`['query'].join('.')` is already `query`) |
| Planner tests must not read live project files (4 Nov) | A new TASK-0012 test copied the real Core module card into its temp folder; card 41 adds an announcement to that card, so the locked test of a Done card would have failed for every later builder. The re-check found it. A test builds its own fixed inputs; it reads a live file only to check that very file. Running `pnpm` in a temp workspace also installs there and leaves a link in pnpm's store: set `verifyDepsBeforeRun: false` in its `pnpm-workspace.yaml` |
| Fixed ports in every verify (11 Nov, TASK-0013) | Since TASK-0013, every `pnpm verify` starts the API on 3000 and the screens on 5173 with `reuseExistingServer: false`. Two runs at once, a demo (`nexus-api` or `nexus-web` in `.claude/launch.json`) or the owner's `pnpm dev` make End-to-end smoke fail at once. Review helpers and trial builds check `netstat -ano` for 3000 and 5173 before a run, wait if a port is busy and never stop a process they did not start; only one helper runs verify at a time, and demo servers are stopped right after the pictures. A test that needs a busy port starts its stand-in with `process.execPath` and no shell, in its own process, so `kill()` really frees the port |

**Windows and tool notes**
- The Bash tool breaks on heredocs with apostrophes and escaped quotes. Write Python scripts to a file and run them, or use the Edit tool.
- Headless Edge: use a fresh profile per picture and a timeout, or it may hang.
- Scratchpad files disappear between sessions; anything worth keeping goes into `tools/`.

## 7. End of every session

1. Update `STATUS.md`: Resume here (with "Your next action"), waiting-on list, review rounds.
2. Add new decisions to `DECISIONS.md`; add any new working preference or lesson to this file.
3. Rebuild the files:
   - `node tools/tracker/build-tracker.mjs`
   - `python tools/share/build-word.py`
4. If screens changed: run the screen check, then `node tools/share/build-share.mjs` and `python tools/share/build-review.py`, then `python tools/share/build-downloads.py` (the one folder in Downloads the owner shares from).
5. Run `python tools/history/make-backup.py` and upload the ZIP to Google Drive at least once a week: GitHub holds the documents and code, but **not** `history/` or the staff document (D-192), so the Drive backup is their only copy off this computer.

The conversation saves itself: after every reply and when a session closes, the hooks in `.claude/settings.json` run `python tools/history/export-session.py` in the background. That updates `history/` and the tracker. Run it by hand any time; problems are noted in `history/.save-error.log`.

## 8. The history folder

| File | What it is |
|---|---|
| `history/LATEST.md` | Where we stopped: the owner's latest messages with Claude's answers (loaded automatically) |
| `history/MEMORY-ALL.md` | All of Claude's memory notes in one file (loaded automatically) |
| `history/requests.md` | Every message from the owner, numbered |
| `history/conversation.md` | The whole conversation, readable |
| `history/sessions/<id>.jsonl.gz` | The complete record of each session (pictures in `-images/`, big tool results in `-extras/`) |
| `history/sessions/<id>-helpers/` | The working notes of every helper Claude started in that session, compressed, with their pictures stored once in `-images/` (D-183). `--restore` puts them back on a new PC |
| `history/memory/` | Claude's memory notes, one file each |
| `history/conversation.json` | The conversation for the tracker's **History** tab |

- Search `conversation.md` when a detail isn't in the documents. The documents win over the conversation: decisions may have changed since something was said.
- `history/` is private (the whole discussion). Keep the repository private, and never send this folder to anyone; the share and review copies leave it out.
- The main session record is about 75 MB compressed. GitHub refuses files over 100 MB: when it gets close, start a new session (the old one stays saved) or use Git LFS.

## 9. Continue on a new PC or account

**The full steps are in `docs/NEW-LAPTOP.md` (D-198):** a carry ZIP with everything, the save history included (`python tools/history/make-backup.py --with-git`), made last on the old laptop; on the new one, install the tools, unzip, `pnpm install --frozen-lockfile`, `--restore`, `git worktree prune`, `pnpm verify`, remake the builder copy of a card in progress, and give that laptop its own upload key. In short:

1. Install the Claude desktop app (or Claude Code), Git, Python 3, Node.js 24 with pnpm 11.10.0, Docker Desktop, Microsoft Edge or Google Chrome, and Antigravity.
2. Copy this folder onto the new PC from the carry ZIP (a plain backup ZIP or GitHub also work, but miss the save history or the conversation).
3. Run `python tools/history/export-session.py --restore`. It puts the old sessions and memory where Claude Code looks, so they can usually be reopened.
4. Open the folder in Claude and say: **"Continue from where we stopped."** The handover, memory notes and latest conversation load by themselves. Approve the project's hooks if Claude asks (they keep saving the conversation). If Python is called `py` or `python3` on that PC, change `python` in `.claude/settings.json`.
5. Keep the folder name `YTP-SAAS`: the save finds Claude's sessions by it. The old conversation is always kept in `history/sessions/`, so the tracker's History stays complete on any PC.
6. On a new account everything here still works (Claude keeps sessions on the PC, not in the account).
