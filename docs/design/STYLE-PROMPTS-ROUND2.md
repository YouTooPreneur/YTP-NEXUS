# Style prompts, round 2: luxury and premium (step 1.5)

> **Decided after round 2:** no dark theme. Nexus uses one "mixed" style: a dark menu with a light work area, in **Emerald and Navy**, switchable (D-134, D-137). This file is kept as a record; its sample dates and amounts are older than the screens' sample world (Thursday 1 Oct 2026).

Round 1 is kept in `STYLE-PROMPTS.md`. This round is a **completely new, modern, luxury and premium look**. There are **4 screens**, each in **3 looks**, each look in **dark and light**: **24 ready prompts**.

## How to do it

1. **Every prompt below is complete.** Copy it, paste it into a new ChatGPT chat, generate. Nothing to replace.
2. Optional: attach `assets/brand/Logo for DP.png` and add "use this icon".
3. Save each image in `docs/design/style/` with the name shown above its prompt (e.g. `R2-1-E-dark.png`). The tracker labels it automatically.

**Easiest order (saves time):**
- **Step 1:** make the 6 dashboards (prompts 1–6) and pick the look you like.
- **Step 2:** make the other 3 screens only for that look, dark and light (6 prompts).
- Or make all 24 if you want to compare everything.

## The 3 premium looks

| Look | Idea | Dark theme | Light theme |
|---|---|---|---|
| **E · Emerald Luxe** | Your dark green brand colour as a rich, private-banking feel | Deep emerald-black | Warm ivory with emerald text |
| **N · Midnight Navy** | Your navy brand colour, calm and corporate-premium | Deep navy with frosted cards | Cool off-white with navy text |
| **M · Monochrome Neon** | Black-and-white minimalism; the neon green is the only colour | Charcoal black | Pure white, gallery-like |

## What to look for (score each 1–5)

1. **Feels premium and expensive**, but still clear
2. Feels like YTP (matches your logo and website)
3. Easy to read
4. Important things stand out ("overdue", "approve", "at risk")
5. Calm, not crowded
6. Comfortable for a full working day
7. **Dark and light versions feel like the same product**
8. Good for clients too (the portal uses the same design), and easy on a phone

Ignore spelling mistakes and odd details; judge only the look and feel.

## All 24 prompts at a glance

| No. | Screen | Look | Theme | Save as |
|---|---|---|---|---|
| 1 | Dashboard | E · Emerald Luxe | Dark | `R2-1-E-dark.png` |
| 2 | Dashboard | E · Emerald Luxe | Light | `R2-1-E-light.png` |
| 3 | Dashboard | N · Midnight Navy | Dark | `R2-1-N-dark.png` |
| 4 | Dashboard | N · Midnight Navy | Light | `R2-1-N-light.png` |
| 5 | Dashboard | M · Monochrome Neon | Dark | `R2-1-M-dark.png` |
| 6 | Dashboard | M · Monochrome Neon | Light | `R2-1-M-light.png` |
| 7 | Client profile | E · Emerald Luxe | Dark | `R2-2-E-dark.png` |
| 8 | Client profile | E · Emerald Luxe | Light | `R2-2-E-light.png` |
| 9 | Client profile | N · Midnight Navy | Dark | `R2-2-N-dark.png` |
| 10 | Client profile | N · Midnight Navy | Light | `R2-2-N-light.png` |
| 11 | Client profile | M · Monochrome Neon | Dark | `R2-2-M-dark.png` |
| 12 | Client profile | M · Monochrome Neon | Light | `R2-2-M-light.png` |
| 13 | Sales pipeline | E · Emerald Luxe | Dark | `R2-3-E-dark.png` |
| 14 | Sales pipeline | E · Emerald Luxe | Light | `R2-3-E-light.png` |
| 15 | Sales pipeline | N · Midnight Navy | Dark | `R2-3-N-dark.png` |
| 16 | Sales pipeline | N · Midnight Navy | Light | `R2-3-N-light.png` |
| 17 | Sales pipeline | M · Monochrome Neon | Dark | `R2-3-M-dark.png` |
| 18 | Sales pipeline | M · Monochrome Neon | Light | `R2-3-M-light.png` |
| 19 | Phone | E · Emerald Luxe | Dark | `R2-4-E-dark.png` |
| 20 | Phone | E · Emerald Luxe | Light | `R2-4-E-light.png` |
| 21 | Phone | N · Midnight Navy | Dark | `R2-4-N-dark.png` |
| 22 | Phone | N · Midnight Navy | Light | `R2-4-N-light.png` |
| 23 | Phone | M · Monochrome Neon | Dark | `R2-4-M-dark.png` |
| 24 | Phone | M · Monochrome Neon | Light | `R2-4-M-light.png` |

---

## Screen 1: Dashboard (prompts 1–6)

### Prompt 1 · Dashboard · Emerald Luxe · Dark

Save as `R2-1-E-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: DARK "Emerald Luxe". Background deep emerald-black (#07110E); cards and menu a slightly lighter emerald (#0E1D18) with very thin borders (#1C3D36); text warm off-white (#ECEFE9) and muted sage grey. The bright brand green #03FF96 used sparingly: the active menu item, the main button and one key number only.
```

### Prompt 2 · Dashboard · Emerald Luxe · Light

Save as `R2-1-E-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: LIGHT "Emerald Luxe". Background warm ivory (#FAF8F3); cards and menu pure white with hairline borders (#E7E3D8) and very soft shadows; text deep emerald (#1C3D36); main buttons deep emerald #1C3D36 with white text; the bright brand green #03FF96 only as a thin accent line, the active menu marker and small dots.
```

### Prompt 3 · Dashboard · Midnight Navy · Dark

Save as `R2-1-N-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: DARK "Midnight Navy". Background deep navy (#0B1724); cards and menu navy (#10273A) with thin borders (#1D3A52) and a subtle frosted-glass look; text soft white and cool grey-blue; the brand green #03FF96 for the active menu item, the main button and a few key highlights only.
```

### Prompt 4 · Dashboard · Midnight Navy · Light

Save as `R2-1-N-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: LIGHT "Midnight Navy". Background cool off-white (#F5F7FA); white cards and a light menu with hairline cool-grey borders and soft shadows; text deep navy (#10273A); main buttons navy #10273A with white text; the brand green #03FF96 only for small highlights and progress bars.
```

### Prompt 5 · Dashboard · Monochrome Neon · Dark

Save as `R2-1-M-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: DARK "Monochrome Neon". True charcoal black background (#0A0A0A); graphite cards and menu (#141414) with thin grey borders; text white and grey; no other colour except the brand green #03FF96 (used only for the active menu item, the main button and success states) and small muted status tags. Extremely minimal, with lots of black space.
```

### Prompt 6 · Dashboard · Monochrome Neon · Light

Save as `R2-1-M-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "Command Centre" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the main dashboard. Page title "Good morning" with the date "Wed, 1 Oct 2026". Four key numbers: "Missed renewals 0", "Paid within 15 days 82%", "Leads answered in 24h 94%", "To collect ₹1,84,500 · ₹46,200 overdue". Card "Needs your attention" with 5 rows, each with a small tag, text and one action button: Approve — Sharma Dental Care renewal invoice ₹8,850 — "Approve & send"; Overdue — YTP/26-27/0042 is 9 days overdue, Greenleaf Organics, ₹1,416 — "Mark paid"; At risk — greenleaforganics.com renews in 7 days, not paid — "Open"; Lead — Bloom Florists (SEO) not contacted for 6 hours — "Call"; Support — reply due in 2 hours, Velocity Motors — "Open". Card "Today" with 2 meetings ("11:00 Discovery call · Sri Lakshmi Traders", "15:30 Weekly review · Team") and 3 follow-ups. Card "Renewals in the next 30 days": a small table with status chips Invoiced, Client renews, Paid. Card "Team today": 5 people with workload bars, one "On leave".

Theme: LIGHT "Monochrome Neon". Pure white background; very light warm-grey cards and menu (#F6F6F4) with hairline borders; text near-black (#111111); no other colour except near-black (#111111) main buttons with bright brand green #03FF96 text, tiny #03FF96 highlights and small muted status tags. Extremely minimal, gallery-like white space.
```

---

## Screen 2: Client profile (prompts 7–12)

### Prompt 7 · Client profile · Emerald Luxe · Dark

Save as `R2-2-E-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: DARK "Emerald Luxe". Background deep emerald-black (#07110E); cards and menu a slightly lighter emerald (#0E1D18) with very thin borders (#1C3D36); text warm off-white (#ECEFE9) and muted sage grey. The bright brand green #03FF96 used sparingly: the active menu item, the main button and one key number only.
```

### Prompt 8 · Client profile · Emerald Luxe · Light

Save as `R2-2-E-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: LIGHT "Emerald Luxe". Background warm ivory (#FAF8F3); cards and menu pure white with hairline borders (#E7E3D8) and very soft shadows; text deep emerald (#1C3D36); main buttons deep emerald #1C3D36 with white text; the bright brand green #03FF96 only as a thin accent line, the active menu marker and small dots.
```

### Prompt 9 · Client profile · Midnight Navy · Dark

Save as `R2-2-N-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: DARK "Midnight Navy". Background deep navy (#0B1724); cards and menu navy (#10273A) with thin borders (#1D3A52) and a subtle frosted-glass look; text soft white and cool grey-blue; the brand green #03FF96 for the active menu item, the main button and a few key highlights only.
```

### Prompt 10 · Client profile · Midnight Navy · Light

Save as `R2-2-N-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: LIGHT "Midnight Navy". Background cool off-white (#F5F7FA); white cards and a light menu with hairline cool-grey borders and soft shadows; text deep navy (#10273A); main buttons navy #10273A with white text; the brand green #03FF96 only for small highlights and progress bars.
```

### Prompt 11 · Client profile · Monochrome Neon · Dark

Save as `R2-2-M-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: DARK "Monochrome Neon". True charcoal black background (#0A0A0A); graphite cards and menu (#141414) with thin grey borders; text white and grey; no other colour except the brand green #03FF96 (used only for the active menu item, the main button and success states) and small muted status tags. Extremely minimal, with lots of black space.
```

### Prompt 12 · Client profile · Monochrome Neon · Light

Save as `R2-2-M-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: the profile of the client "Sharma Dental Care". Header: the company name in large serif type, a soft chip "Client", "Chennai", main contact "Dr. Priya Sharma" with phone and email icons, tags "Healthcare" and "Referral"; on the right "Outstanding ₹8,850" and "Lifetime value ₹1,41,600", and buttons "New invoice", "Schedule meeting", "Add task". A row of tabs: Overview (active), Contacts, Services, Websites & accounts, Projects, Invoices, Tasks, Meetings, Files, Timeline. Three cards: "Services" (Website design — Delivered; Domain + hosting — ₹7,500/yr — renews 29 Oct 2026; Annual maintenance — ₹12,000/yr), "Websites & accounts" (sharmadental.in — expires 29 Oct 2026; Business hosting — Hostinger; Instagram page; Google Business profile), "Open tasks" (3 tasks with owners and due dates). Below, a wide "Timeline" card: "1 Oct — Renewal invoice drafted (system)", "29 Sep — Renewal alert: 30 days (system)", "1 Aug — Payment ₹70,800 received", "20 Jul — Invoice YTP/26-27/0039 sent".

Theme: LIGHT "Monochrome Neon". Pure white background; very light warm-grey cards and menu (#F6F6F4) with hairline borders; text near-black (#111111); no other colour except near-black (#111111) main buttons with bright brand green #03FF96 text, tiny #03FF96 highlights and small muted status tags. Extremely minimal, gallery-like white space.
```

---

## Screen 3: Sales pipeline (prompts 13–18)

### Prompt 13 · Sales pipeline · Emerald Luxe · Dark

Save as `R2-3-E-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: DARK "Emerald Luxe". Background deep emerald-black (#07110E); cards and menu a slightly lighter emerald (#0E1D18) with very thin borders (#1C3D36); text warm off-white (#ECEFE9) and muted sage grey. The bright brand green #03FF96 used sparingly: the active menu item, the main button and one key number only.
```

### Prompt 14 · Sales pipeline · Emerald Luxe · Light

Save as `R2-3-E-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: LIGHT "Emerald Luxe". Background warm ivory (#FAF8F3); cards and menu pure white with hairline borders (#E7E3D8) and very soft shadows; text deep emerald (#1C3D36); main buttons deep emerald #1C3D36 with white text; the bright brand green #03FF96 only as a thin accent line, the active menu marker and small dots.
```

### Prompt 15 · Sales pipeline · Midnight Navy · Dark

Save as `R2-3-N-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: DARK "Midnight Navy". Background deep navy (#0B1724); cards and menu navy (#10273A) with thin borders (#1D3A52) and a subtle frosted-glass look; text soft white and cool grey-blue; the brand green #03FF96 for the active menu item, the main button and a few key highlights only.
```

### Prompt 16 · Sales pipeline · Midnight Navy · Light

Save as `R2-3-N-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: LIGHT "Midnight Navy". Background cool off-white (#F5F7FA); white cards and a light menu with hairline cool-grey borders and soft shadows; text deep navy (#10273A); main buttons navy #10273A with white text; the brand green #03FF96 only for small highlights and progress bars.
```

### Prompt 17 · Sales pipeline · Monochrome Neon · Dark

Save as `R2-3-M-dark.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: DARK "Monochrome Neon". True charcoal black background (#0A0A0A); graphite cards and menu (#141414) with thin grey borders; text white and grey; no other colour except the brand green #03FF96 (used only for the active menu item, the main button and success states) and small muted status tags. Extremely minimal, with lots of black space.
```

### Prompt 18 · Sales pipeline · Monochrome Neon · Light

Save as `R2-3-M-light.png`

```
Create a high-fidelity UI design of a desktop web app screen (16:10, 1600x1000), flat and straight-on, no device frame, no people.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Left menu with the logo, then Command Centre, Tasks, Calendar, CRM, Contracts & Renewals, Projects, WebCare, Finance, Team, Academy, Reports, Settings (with "CRM" active), and a small user card at the bottom. Top bar: search "Search clients, invoices, domains…", "+ Quick add", notification bell, language "EN", profile photo. Screen: "Sales pipeline" as a board. Above the board: filters "Service", "Source", "Owner", a search box, a "Board / List" toggle and a "+ New lead" button. Six columns: New, Contacted, Clarity session, Proposal sent, Won, Lost; each column header shows the number of deals and the total value (e.g. "Proposal sent · 4 · ₹3,20,000"). Each card shows the company name, small chips for the services of interest ("SEO", "Website", "Video"), the value (e.g. "₹85,000"), the source ("Instagram", "Referral", "Website form"), the owner's small avatar, "3 days in stage" and the next follow-up date. One card has a small muted red "Follow-up overdue" tag. Company names: Bloom Florists, Sri Lakshmi Traders, Kaveri Hospitals, Urban Nest Interiors, Aroma Bakes, Velocity Motors.

Theme: LIGHT "Monochrome Neon". Pure white background; very light warm-grey cards and menu (#F6F6F4) with hairline borders; text near-black (#111111); no other colour except near-black (#111111) main buttons with bright brand green #03FF96 text, tiny #03FF96 highlights and small muted status tags. Extremely minimal, gallery-like white space.
```

---

## Screen 4: Phone (prompts 19–24)

### Prompt 19 · Phone · Emerald Luxe · Dark

Save as `R2-4-E-dark.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: DARK "Emerald Luxe". Background deep emerald-black (#07110E); cards and menu a slightly lighter emerald (#0E1D18) with very thin borders (#1C3D36); text warm off-white (#ECEFE9) and muted sage grey. The bright brand green #03FF96 used sparingly: the active menu item, the main button and one key number only.
```

### Prompt 20 · Phone · Emerald Luxe · Light

Save as `R2-4-E-light.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: LIGHT "Emerald Luxe". Background warm ivory (#FAF8F3); cards and menu pure white with hairline borders (#E7E3D8) and very soft shadows; text deep emerald (#1C3D36); main buttons deep emerald #1C3D36 with white text; the bright brand green #03FF96 only as a thin accent line, the active menu marker and small dots.
```

### Prompt 21 · Phone · Midnight Navy · Dark

Save as `R2-4-N-dark.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: DARK "Midnight Navy". Background deep navy (#0B1724); cards and menu navy (#10273A) with thin borders (#1D3A52) and a subtle frosted-glass look; text soft white and cool grey-blue; the brand green #03FF96 for the active menu item, the main button and a few key highlights only.
```

### Prompt 22 · Phone · Midnight Navy · Light

Save as `R2-4-N-light.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: LIGHT "Midnight Navy". Background cool off-white (#F5F7FA); white cards and a light menu with hairline cool-grey borders and soft shadows; text deep navy (#10273A); main buttons navy #10273A with white text; the brand green #03FF96 only for small highlights and progress bars.
```

### Prompt 23 · Phone · Monochrome Neon · Dark

Save as `R2-4-M-dark.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: DARK "Monochrome Neon". True charcoal black background (#0A0A0A); graphite cards and menu (#141414) with thin grey borders; text white and grey; no other colour except the brand green #03FF96 (used only for the active menu item, the main button and success states) and small muted status tags. Extremely minimal, with lots of black space.
```

### Prompt 24 · Phone · Monochrome Neon · Light

Save as `R2-4-M-light.png`

```
Create a high-fidelity UI design showing two mobile phone screens side by side (each 390x844), flat and straight-on, no hands, no people, plain background.

This is "YTP Nexus", the private business software of YouTooPreneur, a premium digital agency in Chennai, India. Header logo: the YouTooPreneur hexagon icon (letters Y and P with a small figure wearing a tie) followed by the word "Nexus". Amounts in Indian rupees with Indian formatting (₹1,84,500).

Overall feel: luxury and premium, calm and confident, like a private banking app or the software of a high-end design studio. Generous white space; fewer but larger elements; refined typography: an elegant modern serif for page titles and big numbers, a clean geometric sans-serif for everything else. Thin hairline borders, very soft depth, 14px rounded corners, thin line icons. Restrained colour: mostly neutrals; the brand green appears only on the few most important things. Amounts in neutral colours, not green. Status colours soft and muted: red for overdue, amber for attention, green for done.

Phone layout: no side menu at all; only a bottom menu with 5 items: Home, Tasks, Calendar, Leads, More. Big, easy-to-tap buttons. Screen 1 "My day": greeting "Good morning, Arun" in serif type and the date; a large "Check in" button with "Office hours 10:00 – 19:00" below it; a small card "Saturdays this month: 1 off left · 1 half day left"; "Today's tasks" with 4 tasks (title, client, priority dot, due time), one marked "Late"; "Meetings" with one at 11:00 and a "Join" button. Screen 2 "Checked in": a confirmation "Checked in at 9:58 AM"; a text box "What will you work on today?" with a short example note; a "Save note" button and a smaller "Check out" button below.

Theme: LIGHT "Monochrome Neon". Pure white background; very light warm-grey cards and menu (#F6F6F4) with hairline borders; text near-black (#111111); no other colour except near-black (#111111) main buttons with bright brand green #03FF96 text, tiny #03FF96 highlights and small muted status tags. Extremely minimal, gallery-like white space.
```
