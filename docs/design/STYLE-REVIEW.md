# Style review (step 1.5)

> **Kept as a record (21 Oct 2026).** Step 1.5 was approved and closed on 1 Oct 2026 (round 27). The chosen style (mixed, Emerald and Navy, Bold font, grouped menu, airy; D-134, D-137) is described in `docs/design/DESIGN-RULES.md`, and every version is in its section 8.

Step 1.5 stayed **open until the owner approved** a style.

## Round 1 (2026-10-01): 12 images

The owner generated all 4 prompts in all 3 styles (`docs/design/style/1A.png` … `4C.png`). Owner feedback: **4C is terrible.**

### Claude's review

**Why 4C fails:** it squeezes the desktop side menu onto a phone. The menu takes a quarter of the width, the content is cramped, and there are two menus (side and bottom) doing the same job. This is a layout problem, not a style problem: **on phones no style shows a side menu**; phones use only the bottom menu (as in 4A and 4B). Style C on a phone would look like 4B.

| Point (1–5) | A: Dark | B: Light | C: Dark menu + light |
|---|---|---|---|
| 1. Feels like YTP | 5 | 3 | 5 |
| 2. Easy to read | 4 | 5 | 5 |
| 3. Important things stand out | 4 | 5 | 5 |
| 4. Calm, not crowded | 3 | 5 | 4 |
| 5. Comfortable for a full day | 3 (bright office) / 5 (night) | 5 | 4 |
| 6. Logo looks right | 5 | 4 | 5 |
| 7. Good for clients | 4 | 5 | 5 |
| 8. On a phone | 5 | 5 | 1 (fixable: use the 4B layout) |

**Good in every style:** dashboard layout; attention list with coloured tags and action buttons; the 4 success numbers; renewals table with status chips (blue Invoiced, amber Client renews, green Paid); big Check in button.

**To fix in step 1.6 whatever the choice:**
1. Style A uses green for too much (amounts, many buttons). Green should mean good/go; amounts neutral.
2. 2B is not a fair Style B sample: ChatGPT drew a dark green menu (really Style C).
3. Menus differ between images. Add **Tasks** and **Calendar** to the menu (daily use). "Knowledge Base" appeared in 3A/3B/3C but is **not in the requirements** (ChatGPT invented it).
4. App name differs ("YOUTOOPRENEUR" vs "YTP Nexus"); one standard header to be fixed.

**Claude's recommendation:**
- Light theme (default): **Style C** on desktop.
- Dark theme (each person's choice): **Style A**, with less green.
- Phone, both themes: the **4A / 4B layout** (bottom menu, no side menu).
- Close second: Style B as the light theme, if the owner prefers calmer and plainer.

### Owner's decision

No round 1 style chosen. The owner asked for a **completely new modern, luxury and premium look**, with **dark and light both infused** (round 2).

## Round 2 (2026-10-01): all 24 built as coded screens

Prompts: `docs/design/STYLE-PROMPTS-ROUND2.md`: **24 complete prompts**, 4 screens (dashboard, client profile, pipeline, phone) × 3 premium looks × dark and light. Suggested order: the 6 dashboards first, then the other 3 screens for the chosen look.

- **E · Emerald Luxe:** emerald-black / warm ivory
- **N · Midnight Navy:** deep navy / cool off-white
- **M · Monochrome Neon:** charcoal black / pure white, with green as the only colour

Lessons from round 1 built into every prompt: the full menu (with Tasks and Calendar, no Knowledge Base); one header (the hexagon icon + "Nexus"); amounts in neutral colours; the brand green used sparingly; phones use only a bottom menu (D-135).

### Built by Claude as coded screens

The owner asked Claude to build every combination as a real coded screen instead of AI images (D-136). All **24** are done: 4 screens × 3 looks × dark and light.

- **Images:** `docs/design/style/R2-<screen>-<look>-<theme>-claude.png` (tracker → Screens → "Style images", grouped by screen).
- **Live screens:** `docs/design/mockups/`: `dashboard.html`, `client-profile.html`, `pipeline.html`, `phone.html`. Open one in a browser; the small panel at the bottom right switches look, theme and screen.
- **One design system:** `mockup.css` holds the 3 looks × 2 themes as colour and shape settings; every screen uses the same parts. Changing a colour changes all screens.
- **Re-make the images:** `node tools/mockups/render-mockups.mjs` (about 25 seconds, uses Edge or Chrome).
- **Fonts:** Instrument Serif (titles, big numbers), Manrope (everything else). Real logo from `assets/brand/icon.svg`.

What each look does differently:

| | E · Emerald Luxe | N · Midnight Navy | M · Monochrome Neon |
|---|---|---|---|
| Dark | Emerald-black, green main buttons | Deep navy with a soft glow and frosted cards, green main buttons | Pure black and grey, green main buttons |
| Light | Warm ivory, dark green buttons, a thin green line on the key number | Cool off-white, navy buttons | Pure white, black buttons with neon-green text |
| Corners | Soft (16px) | Softest (18px) | Sharper (10px) |

One change from the written prompts: Monochrome light uses black buttons with neon-green text (the prompt said dark green), so it doesn't look the same as Emerald light. The prompt was updated to match.

### Claude's review

*Waiting for the owner's feedback.* Claude's checks: all 24 fit the screen with nothing cut off; text and numbers are exact; the phone uses only the bottom menu; the green is kept to the main buttons, the active menu item and one key number.

### Owner's decision

**No full dark theme.** The owner chose the **mixed** style (dark menu, light work area) and a **dark bottom menu on phones**, left the look to Claude, and asked to use neon green as well (D-134).

## Round 3 (2026-10-01): the chosen style

**Emerald Luxe, mixed** (D-137), built on all 4 screens: `docs/design/style/R3-1-E-mixed-claude.png` … `R3-4-E-mixed-claude.png`. Live: any screen in `docs/design/mockups/` with `?look=E&theme=mixed`.

- **Menu:** dark green (`#1C3D36`, soft gradient) with the neon-green logo and active item. Phones: the same dark green as the bottom menu.
- **Work area:** warm ivory (`#FAF8F3`), white cards, dark-green text.
- **Neon green (`#03FF96`):** main buttons are dark green with neon text ("Quick add", "Approve & send", "Check in"); also the active menu item, the key-number line, the tab underline and live dots. Never used as text on the light area, because it is too faint to read there.
- **Removed:** the sun/moon theme switch.

### Claude's review

All 4 screens fit with nothing cut off; the menu, buttons and phone bottom menu match; text contrast is fine on the light area and in the dark menu.

### Owner's feedback (round 3)

The owner asked to change the fonts, the menu and layout, and the feel and spacing. Claude built 3 options for each on the dashboard:
- Fonts: Classic serif, **Modern**, Bold
- Menu: Wide, **Grouped**, Slim icons
- Spacing: **Airy**, Balanced, Compact

The live screens can switch between all of them with the panel at the bottom right.

The owner chose:
- **Modern font** (Plus Jakarta Sans)
- **Airy spacing** (as before)
- **Menu: left to Claude**, who chose **Grouped** (Daily work · Business · Insights & admin), because 14 items are easier to scan in named sections and full names stay readable

The round 3 images were re-made with these choices (D-137 updated).

**Then, in the live screens, the owner settled on:**
- Emerald, mixed, **Bold font** (Sora titles + DM Sans text), **grouped menu**, airy spacing
- "Make the menu text more visible": the dark-menu text is now near-white (about 9:1 contrast) and larger (14.5px); section names are brighter and bolder (about 5:1); the phone's bottom menu labels follow the same rule

The round 3 images were re-made again.

**Both colours, switchable (owner, 1 Oct):** the owner likes Emerald and Navy, so the mixed style comes in both. Each person switches with the two colour dots in the top bar; the company default is Emerald (D-134). Round 3 images now exist in both colours (`R3-*-E-mixed-claude.png`, `R3-*-N-mixed-claude.png`).

**Preferences confirmed, and premium switches (owner, 1 Oct):**
- The owner confirmed mixed, Bold font, grouped menu, airy spacing and both colours.
- At the owner's request, the colour switch was redesigned as a pill with mini colour previews, and the style preview panel as a frosted panel with segmented pills that can be folded away.

### Owner's decision

**Approved on 1 Oct 2026.** Mixed style (dark menu, light work area) in Emerald (default) and Navy, switchable; Bold font (Sora + DM Sans); grouped menu; airy spacing; premium colour switch (D-134, D-137). Step 1.5 is closed.
