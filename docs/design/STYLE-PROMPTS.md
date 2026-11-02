# Style prompts for ChatGPT (step 1.5)

> **Kept as a record (21 Oct 2026).** Step 1.5 was approved and closed on 1 Oct 2026 (round 27). The chosen style (mixed, Emerald and Navy, Bold font, grouped menu, airy; D-134, D-137) is described in `docs/design/DESIGN-RULES.md`, and every version is in its section 8.

> **Round 1 (done).** The current round is **round 2: luxury and premium, dark and light**, in `docs/design/STYLE-PROMPTS-ROUND2.md`.

Use these prompts in ChatGPT's image generation to **choose the look of Nexus**. The images are for **style only** (colours, feel, spacing). AI images often get small text wrong; ignore that. The exact screens are designed in step 1.6.

## How to do it (2 rounds)

**Round A: pick a style (3 images)**
1. Open ChatGPT and start a new chat.
2. Copy **Prompt 1** (the dashboard) and replace `[STYLE]` with **Style A**. Generate.
3. Do the same with **Style B**, then **Style C**. You now have the same dashboard in three looks.
4. Save the images in `docs/design/style/` as `1A.png`, `1B.png`, `1C.png` (prompt number + style letter; the saved round 1 pictures use these names).
5. Pick one, or mix (for example "Style A's colours with Style B's spacing").

**Round B: check the style on 3 more screens**
1. Use **Prompts 2, 3 and 4** with your chosen style.
2. Save them as `client-profile.png`, `pipeline.png`, `phone.png` in `docs/design/style/`.
3. Tell Claude: **which style**, **what you like**, and **what you don't like**.

Tip: if an image is close but not right, reply to ChatGPT in plain words, e.g. "make the cards less rounded" or "use more white space".

**Nexus will have both a light and a dark theme** (each person chooses). So you are choosing the overall look, and which theme is the default. You can like Style A for dark and Style B for light.

## What to look for (score each style 1–5)

1. **Feels like YTP:** professional, clear, trustworthy; matches your website and logo.
2. **Easy to read:** text and numbers are clear without effort.
3. **Important things stand out:** "overdue", "at risk" and "approve" catch your eye first.
4. **Calm, not crowded:** enough space; not too many colours or boxes.
5. **Comfortable for a full day:** the team looks at it for 9 hours.
6. **The logo looks right** on that background.
7. **Good for clients too:** the client portal uses the same style.
8. **On a phone:** big, easy buttons.

**Ignore:** spelling mistakes, odd numbers and small details. AI images get these wrong. Judge only the look and feel.

---

## The three styles

**Style A: Dark command centre**
```
Dark theme. Page background near-black with a slight green tint (#0A0F0D); panels and cards slightly lighter (#111916) with thin subtle borders. The brand green #03FF96 is used for the key numbers, active menu item, main buttons and progress bars. Text in white and soft grey. Clean modern sans-serif font. Cards with 10px rounded corners. Calm and precise: no gradients, no glow, no 3D.
```

**Style B: Light and calm**
```
Light theme. Off-white page background (#F4F7F5) and white cards with thin light-grey borders. Text and the logo in the brand dark green (#1C3D36). Main buttons and the active menu item in brand dark green #1C3D36; the bright brand green #03FF96 only for small highlights and chart accents. Lots of white space. Clean modern sans-serif font. Cards with 10px rounded corners. No gradients, no glow, no 3D.
```

**Style C: Dark menu, light work area**
```
A left menu in the brand dark green (#1C3D36) with the logo in bright brand green #03FF96 and white menu text, and a light work area (#F4F7F5 background, white cards, dark green #1C3D36 text). Buttons and active states in dark green #1C3D36; bright #03FF96 for small highlights. Clean modern sans-serif font. Cards with 10px rounded corners. No gradients, no glow, no 3D.
```

Optional: also try **Style C with navy** by replacing `#1C3D36` with your navy `#10273A`, to compare the two dark brand colours.

---

## Shared description (already included in every prompt below)

YTP Nexus is the internal business software of YouTooPreneur, a digital agency in Chennai, India. The logo is a hexagon icon containing the letters Y and P with a small figure wearing a tie, next to the word YOUTOOPRENEUR™ in bold capitals. On dark backgrounds the logo is bright green #03FF96 (or white); on light backgrounds it is dark green #1C3D36. Amounts are in Indian rupees (₹) with Indian number formatting (₹1,84,500).

Tip: you can also **upload a logo file** from `assets/brand/` to ChatGPT with the prompt and say "use this logo".

---

## Prompt 1: Founder dashboard (desktop)

```
Create a high-fidelity UI design mockup of a desktop web app screen (16:10, 1600x1000), shown flat and straight-on, no device frame, no people.

Product: "YTP Nexus", the internal business software of YouTooPreneur, a digital agency in Chennai, India. Logo: a hexagon icon with the letters Y and P and a small figure wearing a tie, next to the word YOUTOOPRENEUR™ in bold capitals; bright green #03FF96 on dark backgrounds, dark green #1C3D36 on light backgrounds. Amounts in Indian rupees with Indian formatting (₹1,84,500).

Style: [STYLE]

Layout:
- Left menu with the logo at the top, then: Command Centre (active), CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings. Small badge "5" next to Command Centre.
- Top bar: a wide search box "Search clients, invoices, domains…", a "+ Quick add" button, a notification bell with a red dot, a language selector "EN", and a round profile photo.
- Page title "Good morning" with the date "Wed, 1 Oct 2026".
- A row of 4 number cards: "Missed renewals: 0" (with a green tick), "Paid within 15 days: 82%", "Leads answered in 24h: 94%", "To collect: ₹1,84,500 (₹46,200 overdue)".
- Left, large card "Needs your attention" listing 5 items, each with a small coloured tag and an action button:
  1. "Approve" tag — "Invoice for Sharma Dental Care, domain + hosting renewal, ₹8,850" — button "Approve & send"
  2. "Overdue" tag (red) — "YTP/26-27/0042 is 9 days overdue · Greenleaf Organics · ₹1,416" — button "Mark paid"
  3. "At risk" tag (red) — "greenleaforganics.com renews in 7 days, not paid yet" — button "Open"
  4. "Lead" tag (amber) — "New lead Bloom Florists (SEO) not contacted for 6 hours" — button "Call"
  5. "Support" tag (amber) — "Reply due in 2 hours · Velocity Motors · website form not working" — button "Open"
- Right, card "Today": 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders · Google Meet", "15:30 Weekly review · Team") and 3 follow-ups.
- Bottom left, card "Renewals in the next 30 days": a small table with columns Service, Client, Renews, Status (chips: "Invoiced", "Paid", "Client renews").
- Bottom right, card "Team today": 5 people with small avatars, each with a bar showing their open tasks, and one marked "On leave".
```

## Prompt 2: Client 360° profile (desktop)

```
Create a high-fidelity UI design mockup of a desktop web app screen (16:10, 1600x1000), flat, no device frame, no people.

Product: "YTP Nexus", internal business software of YouTooPreneur, a digital agency in Chennai, India. Same left menu and top bar as a business dashboard, with "CRM" active in the menu. Logo: hexagon icon with the word YOUTOOPRENEUR™; bright green #03FF96 on dark backgrounds, dark green #1C3D36 on light backgrounds. Amounts in Indian rupees.

Style: [STYLE]

Screen: the profile of the client "Sharma Dental Care".
- Header: company name "Sharma Dental Care", a green chip "Client", city "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral". On the right: "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task".
- A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline.
- Overview tab, three cards across:
  1. "Services": "Website design — Delivered", "Domain + hosting — ₹7,500/yr — renews 29 Oct 2026", "Annual maintenance — ₹12,000/yr".
  2. "Websites & accounts": "sharmadental.in — domain — expires 29 Oct 2026", "Business hosting — Hostinger", "Instagram page", "Google Business profile".
  3. "Open tasks": 3 tasks with owners and due dates.
- Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".
```

## Prompt 3: Sales pipeline board (desktop)

```
Create a high-fidelity UI design mockup of a desktop web app screen (16:10, 1600x1000), flat, no device frame, no people.

Product: "YTP Nexus", internal business software of YouTooPreneur, a digital agency in Chennai, India. Same left menu and top bar, with "CRM" active. Logo: hexagon icon with the word YOUTOOPRENEUR™; bright green #03FF96 on dark backgrounds, dark green #1C3D36 on light backgrounds. Amounts in Indian rupees.

Style: [STYLE]

Screen: "Sales pipeline" as a board.
- Above the board: filters "Service", "Source", "Owner", a search box, a toggle "Board / List", and a button "+ New lead".
- Six columns: "New", "Contacted", "Clarity session", "Proposal sent", "Won", "Lost". Each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000").
- Each card shows: company name, small chips for the services of interest (e.g. "SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source (e.g. "Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage", and the next follow-up date. One card has a small red "Follow-up overdue" tag.
- Use realistic Indian business names such as "Bloom Florists", "Sri Lakshmi Traders", "Kaveri Hospitals", "Urban Nest Interiors", "Aroma Bakes".
```

## Prompt 4: My day and check-in (phone)

```
Create a high-fidelity UI design mockup showing two mobile phone screens side by side (each 390x844), flat, no hands, no people, plain background.

Product: "YTP Nexus", internal business software of YouTooPreneur, a digital agency in Chennai, India. Logo: hexagon icon; bright green #03FF96 on dark backgrounds, dark green #1C3D36 on light backgrounds.

Style: [STYLE]

Screen 1 "My day":
- Greeting "Good morning, Arun" and the date.
- A large "Check in" button, with "Office hours 10:00 – 19:00" below it.
- A small card "Saturdays this month: 1 off left · 1 half day left".
- "Today's tasks" with 4 tasks (title, client, a priority dot, due time), one marked "Late".
- "Meetings": one at 11:00 with a "Join" button.
- A bottom menu: Home, Tasks, Calendar, Leads, More.

Screen 2 "Checked in":
- A green confirmation "Checked in at 9:58 AM".
- A text box "What will you work on today?" with a short example note.
- A button "Save note" and a smaller "Check out" button below.
```
