# Design rules (step 1.6)

The approved style (D-134, D-137) written as rules for every screen. The **source of truth** is the shared design file `docs/design/mockups/mockup.css` (look `E` or `N`, `theme=mixed`, `font=geo`, `nav=grouped`, `density=airy`). Executors build from these rules and the screen specs, never from pictures.

## 1. Colours

| Token | Emerald (default) | Navy | Used for |
|---|---|---|---|
| Menu | `#1C3D36` (soft gradient) | `#10273A` (soft gradient) | Side menu, phone bottom menu |
| Work area | `#FAF8F3` warm ivory | `#F5F7FA` cool off-white | Page background |
| Card | `#FFFFFF` | `#FFFFFF` | Cards, tables, forms |
| Text | `#1C3D36` | `#10273A` | Main text |
| Muted text | `#5E6B64` | `#5B6D80` | Secondary text (at least 4.5:1 on every light background; darkened 21 Oct 2026, v1.10) |
| Main button | `#1C3D36` with `#03FF96` text | `#10273A` with `#03FF96` text | One main action per area |
| Neon accent | `#03FF96` | `#03FF96` | Logo, active menu item, key-number line, tab underline, focus ring (on dark surfaces: live dots) |
| On green | `#0E874D` | `#0E874D` | Switches that are on, live and current dots on the light area (buttons with white text use the green status colour `#1E7149` / `#17744A`) |

**Status colours** (soft background with dark text): red for overdue and at risk, amber for attention, green for done and paid, blue for invoiced, grey for neutral.

**Rules**
- **Neon is never used as text on the light area** (too faint). It's fine on dark green or navy.
- Amounts are always in the text colour, never green.
- **Readable text everywhere (screen check, D-181):** body text at least 4.5:1 against its background, large text 3:1. The faint grey is only for dots, lines and other marks, never for text. Content is never faded with opacity: a lost, revoked or old item keeps full contrast and shows a chip or strike-through. Only controls that are really disabled may look faded.
- **Client and student portals and public pages also work on a phone (390 px):** columns stack, rows and buttons wrap, wide tables scroll sideways inside their card.
- One main (neon-text) button per card or dialog; the others are outline buttons.
- Both colours must pass **WCAG 2.1 AA contrast**. The menu text is near-white (about 9:1) and section names about 5:1.

## 2. Type

| Use | Font | Size and weight |
|---|---|---|
| Page title | Sora | about 40px, 600 |
| Card title | Sora | about 20px, 600 |
| Big numbers | Sora | about 34px, 600 |
| Body text | DM Sans | 13.5px, 500 |
| Menu items | DM Sans | 14.5px, 500 (active 600) |
| Small labels | DM Sans | 11px, 600, capitals, letter-spaced |

Numbers use equal-width digits. Money follows Indian format (`₹1,84,500`); dates read `1 Oct 2026`; times are 12-hour (`3:30 pm`; 22 Oct 2026, choice 4; anyone can pick 24-hour on their profile). Leave about 30% extra room in labels for Tamil, Hindi, Malayalam and Telugu.

## 3. Space and shape

- **Airy spacing:** page edge 40px, cards 18px apart, card padding 16–22px, rows 9–12px tall padding.
- **Corners:** cards 16px, buttons and inputs 10px, checkboxes 5px. Status chips, counts, tags and pills are **fully round**. Photos and client logos are **circles**.
- Very soft shadows on cards, thin hairline borders, no heavy outlines.
- Icons: thin line icons, 1.5 stroke, 18–20px.

## 4. Layout

| Device | Layout |
|---|---|
| Computer (1200px and wider) | **Grouped side menu** (252px: Daily work · Business · Insights & admin), top bar (search or ask Nexus with a mic, colour switch, language, bell, Quick add, profile), content area |
| Tablet (768–1199px) | Side menu shrinks to the slim icon menu; content full width |
| Phone (under 768px) | **No side menu.** A dark bottom menu whose buttons change by role (choice 13, 22 Oct): the Owner and people who handle leads get Home, Tasks, Calendar, Leads, More; other staff get Attendance instead of Leads. Big touch targets (at least 44px), one column |

## 5. Building blocks

| Block | Rule |
|---|---|
| Buttons | Main: dark with neon text. Secondary: outline. Danger: red outline, with a confirmation. Every press reacts within 0.1 seconds (NFR-023). |
| Status chips | Fully round pill, small capitals, a 6px dot; colour from the status list in section 1. At least 6px from any words beside them. In a fixed column they keep their own width (never stretched). |
| Counts | A circle (22px) for one digit, a pill for more; the same style on card titles and tabs. |
| On/off switch | 44 × 24px track, white 20px knob with a soft shadow. Off: light grey track. On: "on green" track. Never reuse the switch for choosing between views. |
| View choice (Board / List) | A segmented control: outlined box, the chosen part raised. Same corner as buttons, never squeezed. |
| Checkboxes | 18px, 5px corners. Checked: **on green** fill with a white tick (same green as a switch that is on). Empty: white with a grey edge. Grids of checkboxes are centred in their columns, show a faint dash where an option doesn't apply, and have a key under them (Allowed · Not allowed · Not part of this area). |
| Live and current dots | Solid 8–12px dot in "on green" with a thin soft ring; no glow or blur. |
| Icon + text | Icon 14–18px, centred on the text line, 6–8px gap (e.g. clock + "Follow up 2 Oct"). |
| Cards | Title (Sora), count pill, "View all" link on the right. |
| Tables and lists | Search, filters, saved views, export; load page by page; an empty-state message with one clear next action. |
| Forms | Label above the field; help text below; errors in red next to the field; "saving…" while saving. |
| Dialogs | One task each; main button on the right. |
| Loading | Grey outline shapes (skeletons) instead of spinners; long jobs show a progress bar and a notification when done. |
| Colour switch | A pill with mini previews of Emerald and Navy; the chosen one is raised, ringed in neon and named. |
| AI helpers (✦) | A pill button with a sparkle and a thin neon-to-teal edge, placed **next to** the manual action, never replacing it. Results come back as drafts to check. With AI off or at its limit, helpers hide and the screen works fully by hand (AI-009, D-155). |
| AI card | Soft mint panel with a sparkle heading for AI answers, summaries and suggestions; shows its sources and plain buttons (use, change, dismiss). |
| AI tag | Small round "✦ AI draft" or "✦ AI action" badge on anything AI prepared. |
| Voice | A round dark mic button with a neon icon in the search box, Quick add, comment boxes and add boxes. Press to talk; Nexus shows the words heard and what it will do, then waits for Confirm (AI-010). |
| Boards (e.g. sales pipeline) | A summary band on top (the lead number on a dark card), then stage lanes: softly tinted lanes with a coloured top line, count, value, chance and share bar. Cards: client initials in a circle, where the lead came from, service tags, the amount, a ✦ AI score (red "Hot" for strong leads), and the next step coloured by urgency (red overdue, amber today, green done). Won lanes glow green; Lost lanes fade. Cards lift on hover; a dashed spot shows where a card will drop. |
| AI chat | People's messages on the right in the main dark colour; Nexus answers on the left with a sparkle avatar, sources and thumbs; actions in a mint card with Confirm; a Stop button while writing. |
| Counters strip | Small number cards across the top of a list (total, active, on probation, missing documents); amber when something needs action, and clicking one filters the list. |
| Today status | A dot and a word: in (green), working from home (blue), on leave (amber), not checked in (red). |
| Sensitive details | Bank, ID and salary show masked (•••• 6620) with a "Show full details (logged)" button for allowed roles only; Aadhaar is always last 4 digits only. Restricted tabs carry a lock icon. |
| Section menu | Big areas (CRM, Contracts, Projects, Calendar, WebCare, Finance, Reports, Academy) get a row of pill links under the top bar; the current page is a soft filled pill. Locked areas show a lock icon. |
| Money in tables | Amounts right-aligned with equal-width digits, in the text colour; balances due in red; totals in a shaded footer. Drafts show "No number yet". |
| Ageing bar | One stacked bar: 0–7 days blue, 8–15 amber, 16–30 orange, over 30 red, with a labelled box per age. |
| Flow | Numbered steps in a row: done green, now amber, waiting grey (renewals with evidence, handovers). |
| Document pages | A4 preview on a soft background: letterhead, title and number, parties, table, totals, a payment box with the UPI QR, footer; PAID and DRAFT stamps; amounts also in words. |
| Dialog over a page | The page fades and blurs behind a centred dialog with a clear main button and Cancel. |
| Long dashboards | Dashboards may scroll. The first screen holds what matters most (measures, attention list, today); more cards follow below. The dark menu stays in place. |
| Success measures | A card with the number, its target (green when met, amber when close, red when missed) and a thin line with a target mark. |
| Days-left ring | A ring that fills as a date gets closer, with the days inside: red at 7 days or less and unpaid, amber when someone must act, blue for an invoice step, green when it renews itself, grey beyond 30 days. |
| Renewal steps | Five short bars on a renewal card: alerted, invoiced, paid, renewed at the vendor, confirmed. Done green, now amber, late red; a dotted bar means the step is not needed. |
| Who renews | A small round tag: "YTP bills", "Client renews" or "Renews itself" (green). |
| Later-step tag | A dashed grey tag such as "Step 3.6" on parts of a screen that arrive with a later build step. |
| Comment pins | Numbered amber pins on a design or page preview, each tied to a comment. |
| Conversation | Client messages on the left in WhatsApp green, ours on the right in the dark main colour, internal notes in a dashed amber box clients never see, and grey system lines. |
| Deadline countdown | A small pill: green when met, amber when due soon, red when late, grey for later dates. |
| Week calendar | An all-day row (deadlines, milestones, invoices, leave, holidays) above a time grid; colour by type; a red line for now; holidays tinted. |
| Post chips | In the content calendar: platform letter badge, client initials and title, with a left edge coloured by status (draft grey, internal review purple, client approval amber, approved green, scheduled blue, published dark). |
| Recording consent | Recording for AI minutes starts only after everyone agrees; the agreement is shown with names and times. |
| Not for this service | Automations a service does not use are shown greyed with the reason. |
| AI first draft | A mint banner on an AI-made draft says what it used and that nothing is sent until a person presses Send; "What it used" and "Redo" sit beside it. |
| Client-facing pages | Secret-link pages (pay, proposal, testimonial, unsubscribe) share one look: brand band with a language switch, white cards, big buttons, and a footer saying who the link is for and when it stops working. |
| Cost before sending | A warm box lists each channel's cost and the total before the owner approves a broadcast. |
| Consent counts | Three boxes: who matches, who agreed and will get it, who is skipped. |
| Salary breakdown | A split bar (Basic, HRA, allowances) above the figures; deductions shown as Off until the CA confirms. |
| Seen as another person | Screens for staff and managers show that person's menu and avatar; menu groups they cannot open disappear, and money is hidden where their role hides it. |
| Portal frame | Client and student portals: a dark band with the mark, the portal menu, a language switch with the languages that are open (all 5 are built, and each opens after a native speaker's check: English and Tamil in the sample; choice 11, 22 Oct) and the signed-in person; a centred page up to 1,180px wide that scrolls and works on a phone; the footer says what this person can see. In Tamil the menu and text are in Tamil (Noto Sans Tamil). |
| Portal cards | Four number cards, "Needs you" rows with one clear button each, stage bars (done green, now amber), the people working on it, and agreement cards with type, fee, start and end. |
| Report layout | Filters (period, compare with, service, client, owner), number cards, a chart, a table with change arrows and margin bars, an AI note with sources, export and schedule. One layout for every report. |
| Rule blocks | Automation rules as WHEN (blue), IF (amber) and DO (green) blocks on a light grid, joined by arrows; a dry run lists what would happen and changes nothing. |
| Voice view | A dark hold-to-talk panel with the minutes used, the words heard (with an English line for Tamil), what Nexus will do as a filled form, and Confirm / Change / Cancel. |
| Chat bubbles | Client on the left; AI on the right with the thin AI edge and a sparkle; a person on the right in the dark main colour; grey and red system lines for hand-overs and limits. |
| Session strip | A numbered box per class session: done green, today with an amber edge, to come grey. Attendance dots per session: present green, absent soft red. |
| Certificate | A framed page: name, course, batch and grade, two signatures, the number and a QR code to the public check page. |
| Notifications | Bell with a red dot; a short message at the bottom for confirmations ("Invoice sent"). |

## 6. Screen patterns

The 11 patterns in `SCREENS.md` (P1 List … P11 Phone quick screen) use these blocks. Each screen spec names its pattern, and executors copy the pattern's coded example.

## 7. Accessibility and language

- Keyboard reachable, with a visible neon focus ring.
- Text alternatives on icons and the logo.
- Contrast passes WCAG 2.1 AA in both colours.
- All 5 languages must fit without breaking the layout. Each language switch (staff screens, the portal frame, the portal sign-in pages, portal settings and the public pages) offers only the languages that are open; a language opens after a native speaker has checked it (choice 11, 22 Oct), so the sample offers English and Tamil. Tamil is tried on full pages: the sign-in screen, the client portal's content approvals and the Academy fee invoice. Hindi, Malayalam and Telugu are so far tried only as language names (on the Languages and Email templates pages), so full pages in them still need a check when their translations are written.

## 8. Design versions

Every version keeps its own pictures; past pictures are never overwritten (D-180). A new version adds a row here and a new folder in `docs/design/versions/` (`node tools/mockups/capture.mjs <folder> NAME=PAGE …`). The tracker's Design tab shows every row with its pictures. Pictures for v1.1 to v1.9 were taken on 21 Oct 2026 from the screens as they are now; earlier pictures of those batches were not kept.

| Version | Date | Round | What changed | Live page | Pictures |
|---|---|---|---|---|---|
| v0.1 | 2026-10-01 | 10 | Round 1 style ideas: 4 screens × 3 styles, made with ChatGPT from Claude's prompts | — | `docs/design/style/[1-4][A-C].png` |
| v0.2 | 2026-10-01 | 14 | Round 2: every combination as a coded screen: Emerald Luxe, Midnight Navy and Monochrome Neon, each dark and light, on 4 screens (D-136) | `docs/design/mockups/dashboard.html?look=E&theme=dark` | `docs/design/style/R2-*` |
| v0.3 | 2026-10-01 | 15–20 | **Chosen:** mixed (dark menu, light work area), Emerald and Navy, Bold font, grouped menu, airy; switches made modern (D-137) | `docs/design/mockups/dashboard.html` | `docs/design/style/R3-*` |
| v1.1 | 2026-10-01 | 28–30 | Batch 1 · Foundation: sign-in, menu, profile, settings; polished switches, badges, circle logos, live dots, checkboxes | `docs/design/mockups/index.html` | `docs/design/versions/v1.1-batch-1-foundation/` |
| v1.2 | 2026-10-01 | 33 | Batch 2 · Core: search and Ask Nexus, notifications, approvals; AI helpers (✦) and the voice button in the shared parts | `docs/design/mockups/index.html` | `docs/design/versions/v1.2-batch-2-core/` |
| v1.3 | 2026-10-02 | 35 | Batch 3 · CRM + Team: leads, pipeline board, client profile, people, My HR on a phone | `docs/design/mockups/index.html` | `docs/design/versions/v1.3-batch-3-crm-team/` |
| v1.4 | 2026-10-02 | 36 | Batch 4 · WebCare + Finance: assets, expiry, invoices, collections, the pay page, document PDFs | `docs/design/mockups/index.html` | `docs/design/versions/v1.4-batch-4-webcare-finance/` |
| v1.5 | 2026-10-02 | 37 | Batch 5 · Contracts + Command Centre: long dashboards with the 4 success measures, renewals with proof, agreements | `docs/design/mockups/index.html` | `docs/design/versions/v1.5-batch-5-contracts-command-centre/` |
| v1.6 | 2026-10-02 | 39 | Batch 6 · Projects + meetings: project board and page, content calendar, calendar, meetings with AI minutes | `docs/design/mockups/index.html` | `docs/design/versions/v1.6-batch-6-projects-meetings/` |
| v1.7 | 2026-10-02 | 40 | Batch 7 · Sales + Payroll: proposals with AI first drafts, the proposal link, broadcasts with cost, payroll | `docs/design/mockups/index.html` | `docs/design/versions/v1.7-batch-7-sales-payroll/` |
| v1.8 | 2026-10-06 | 41, 43 | Batch 8 · Portals, Reports, API, AI: client portal (one page in Tamil), reports with profit after salaries, live chat, automation builder | `docs/design/mockups/index.html` | `docs/design/versions/v1.8-batch-8-portals-reports-ai/` |
| v1.9 | 2026-10-06 | 42, 43 | Batch 9 · Academy: dashboard, batches, admissions, student portal, certificates with QR; all 184 screens built | `docs/design/mockups/index.html` | `docs/design/versions/v1.9-batch-9-academy/` |
| v1.10 | 2026-10-21 | 44 | Screen check run to 0 problems on all 176 pages, both colours (D-181): grey text darkened to readable contrast, nothing faded with opacity (lost and revoked items keep full contrast), board columns scroll, client portal and public pages fit a phone, 7 screens brought in line with decisions, screen viewer added; then the problems found when every file was read: shared styles scoped so they no longer leak into pages, dates and Saturdays fixed, sample numbers agree across screens, portals offer all 5 languages, chat bubbles no longer cut off | `docs/design/mockups/viewer.html` | `docs/design/versions/v1.10-screen-check/` |
| v1.11 | 2026-10-24 | 45 | The owner's answers to the 99 choices applied (D-184): 12-hour times on every screen; the owner approves every claim, discount and supplier bill; "Ask first" alerts; only English and Tamil open until each language is checked; staff phones show Attendance; AI budget typed by the owner with top-ups; workload from office hours; pay day, leave carry-forward, yearly reviews; hosting cost split by disk; certificate cancel needs approval; screen check 0 problems on all 176 pages | `docs/design/mockups/index.html` | `docs/design/versions/v1.11-choice-answers/` |
