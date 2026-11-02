# Batch 2 · Core: screen specs

Step 1.6, batch 2 of 9. **22 screens**, built in step 3.1 (Core), plus one phone page. Round 34 added the **AI base** (Ask Nexus chat, usage and limits, settings, knowledge, quality), because AI is now built early (D-159). Status: **built.** Approved together with all 9 batches at the end (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 2 section) and the phone page `phone-core.html`.
- **New in this batch:** AI helpers (✦) and the voice button (D-155). In the preview they explain what they would do. In Nexus the AI base comes first, in Core (step 3.1), and each module's helpers come with that module's own step; only the voice assistant and the client chatbot wait for step 3.8 (D-159). Always within the AI limits (D-156). **Everything can still be done by hand.**
- **Sample data only.** Nothing saves.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Search or ask Nexus** (top bar) | One box: type a name, number or domain to search, or ask a question. A mic button starts the voice assistant (designed in batch 8). |
| **Ask Nexus button** (top bar) | Sparkle button beside the bell; opens the Ask Nexus chat. |
| **Bell and Quick add** (top bar) | Open the Notification centre and Quick add. |
| **AI helper button** | Pill with a sparkle and a thin neon-to-teal edge, next to the manual action, never replacing it. Results arrive as drafts to check. |
| **AI card** | Soft mint panel with a sparkle heading: AI answers, summaries and suggestions, with their sources and clear buttons (use, change, dismiss). |
| **AI tag** | Small "✦ AI draft" or "✦ AI action" badge on anything AI prepared. |
| **Saved views** | Round chips with counts (My tasks, Due today, Late…). |

---

## SCR-005 · Search or ask Nexus

- **Preview:** `search.html`
- **Who:** all staff; results follow each person's permissions.
- **Layout:** big search box with mic; an **AI answer card** when the search is a question (answer, source links, "Draft a reminder", Copy); results grouped by type (clients, websites, invoices, tasks, files) with a filter list on the left.
- **Rules:** AI answers use only what the person may see and count against the AI budget; plain search needs no AI.
- **Requirements:** CORE-100, AI-001, AI-009, AI-010.

## SCR-006 · Notification centre

- **Preview:** `notifications.html`
- **Layout:** views (Unread, All, Snoozed, Dismissed, Mentions); grouped by day; each alert has an icon, words, time, Open, Snooze, Dismiss. Right: snoozed list; **waiting for your tap** (an alert set to Ask first: the WhatsApp to Meena about greenleaforganics.com, with Send, Edit, Don't send); how alerts reach you (In Nexus always; email; WhatsApp for urgent ones; Ask first; link to My profile) (choices 5 and 16, 22 Oct).
- **AI:** "Summarise unread" writes a short summary with a button to the most urgent place.
- **Requirements:** CORE-066, CORE-040 (@mentions), AI-009.

## SCR-007 · Quick add

- **Preview:** `quick-add.html` (computer), `phone-core.html` (phone)
- **Layout:** a dialog over the current screen. Top: "type or say what to add" with mic. AI shows what it understood (type, title, client, when, who, reminder) with **Confirm and add**, **Change in the form**, Cancel. Below: 8 forms by hand (lead, task, to-do, client, meeting, payment, expense, file) with keyboard letters.
- **Rules:** nothing saves until Confirm; with AI off or at its limit, only the forms show.
- **Requirements:** CORE-040, AI-009, AI-010.

## SCR-009 · Approval inbox

- **Preview:** `approvals.html` (computer), `phone-core.html` (phone)
- **Layout:** views by kind (discounts, leave, expenses, vendor bills (choice 41, 22 Oct), invoices, certificate cancel (choice 89, 22 Oct), AI drafts and actions); list on the left with amount and waiting time; details on the right with why it needs you, the requester's note, an **AI context card**, a comment box, and Approve / Approve with changes / Reject.
- **Rules:** follows delegation limits (every discount, every expense claim and every vendor bill, card bills too, goes to the owner, choices 7, 15 and 41, 22 Oct; leave over 3 days goes to the owner); invoices for new and one-time work wait here, including the own bill for approved extra work (Meridian's 4 extra Diwali posts, ₹6,000; choice 61, 22 Oct); AI drafts and AI actions always wait here; certificate cancel requests (with their written reason) wait here for the Owner (choice 89, 22 Oct); every decision is logged.
- **Requirements:** CORE-075, USR-005, AI-002, AI-003, AI-004.

## SCR-080 · Tasks

- **Preview:** `tasks.html`
- **Layout:** List or Board; saved views (My tasks, Due today, Late, In review, Blocked, Team, By client, Workload, Save view); filters (client, service, assignee, priority) and search; table with title and related record, service tag, people, priority, due (late in red), status.
- **Statuses:** Pending, In progress, In review, Blocked, Completed, Cancelled.
- **AI:** "Plan my day" suggests an order for today; "Use this order" or dismiss.
- **Requirements:** CORE-040, CORE-041, CORE-044 to CORE-046, CORE-101, AI-009.

## SCR-081 · Task

- **Preview:** `task.html`
- **Layout:** title with status, late marker, priority and service tag; actions: Draft update to client (AI), Duplicate, Mark completed. Left: description, subtasks with progress, comments with @mentions (attach, mic, send). Right: assignees, owner, due, priority, related records, service, repeats; files; activity with a link to history.
- **AI:** suggest subtasks, summarise comments, draft a client update (waits for approval).
- **Requirements:** CORE-040, CORE-041, CORE-044, AI-009.

## SCR-082 · To-do lists and reminders

- **Preview:** `todos.html`
- **Layout:** left: smart views (Today, Important, Assigned to me, Overdue, Completed) and own lists with colours and nested lists. Centre: a shared list with people, progress %, List or Board, an add box (type, paste notes, or mic), items with due time, reminder, repeat, subtasks, assignee and an Important star. Right: AI "turn notes into to-dos" and personal reminders (category, repeat, on/off).
- **Requirements:** CORE-043, CORE-047, AI-009.

## SCR-087 · Files and client resources

- **Preview:** `files.html`
- **Layout:** folders per client (brand assets, website, social media, agreements, reports, logins as vault links, Google Drive folder, trash); filters; table with type, name and version, folder, size, who added, "client can see" switch, Preview or Get. AI "find a file" box with mic; space used by this client.
- **Rules:** files are private (links expire in minutes, downloads logged); 25 MB per file, bigger files are added as a Google Drive link; **logins are Vaultwarden links only, never passwords**.
- **Requirements:** CORE-080 to CORE-084, INT-020, AI-009.

## SCR-183 · Services and templates

- **Preview:** `services.html`
- **Layout:** views by type (projects, monthly retainers, bundles, products, subscriptions); the 8 capabilities and entry services on the left; the chosen service on the right: price ("set in each quote"), GST and SAC, suggested payment stages and revisions (blank by default), delivery stages with checklists and client approvals, client inputs, results and aftercare.
- **AI:** "Draft from a brief" suggests stages and checklists to edit.
- **Requirements:** CORE-020 to CORE-027, AI-009.

## SCR-184 · Custom fields

- **Preview:** `custom-fields.html` (tab beside Lists)
- **Layout:** choose the record type; table of fields (type, required, shown on, who can see, how often filled); an edit panel (name, type, choices, required, show in list, who can see).
- **Rule:** new fields appear in forms, lists, filters, imports, exports and reports at once.
- **Requirements:** CORE-030.

## SCR-185 · Lists

- **Preview:** `lists.html`
- **Layout:** list types grouped (CRM, work, team) on the left; the chosen list on the right with drag order, colour, how often used, where it comes in from, on/off, edit; add a new choice.
- **Rule:** turning a choice off hides it from new records; old records keep it.
- **Requirements:** CORE-012, CORE-042, CORE-043.

## SCR-187 · Messaging

- **Preview:** `messaging.html` with tabs `#senders`, `#routing`, `#templates`, `#delivery`
- **Test mode banner** with its switch (on during building).
- **Senders:** email senders (name, address, sent through, status) and **WhatsApp numbers with their provider** (AiSensy now; other providers when added), what happens if it fails, status.
- **Routing:** per message type: first channel, fallback, sender, language, on/off. A client's own preference wins. Payment reminders go by both email and WhatsApp, like invoices and renewal notices (choice 18, 22 Oct).
- **Delivery:** recent messages with status (delivered, failed and retrying).
- **Requirements:** CORE-060 to CORE-065, CORE-068, INT-003, D-154.

## SCR-188 · Integrations

- **Preview:** `integrations.html`
- **Layout:** views (connected, ready slots, planned); cards grouped (messages; AI and voice; money, storage and calendar) with logo, purpose, a status line, buttons (test, settings, connect, guide) and a status badge; the remaining ready slots listed below.
- **Shown:** AiSensy and Razorpay (connected, test mode), Gmail and backup storage connected; Meta Cloud API and other WhatsApp providers as ready slots; AI providers, speech services and AI limits; Stripe, Instamojo, Cashfree and PayU as ready slots; Google Calendar, Google Chat (planned).
- **Requirements:** CORE-120, CORE-121, CORE-123, INT-001 to INT-024.

## SCR-191 · Data

- **Preview:** `data.html` with tabs `#import`, `#export`, `#keep`
- **Import:** 4 steps (upload, match columns, check rows, import); AI matches columns with a "Sure" or "Check" mark; recent imports with Undo; templates per module.
- **Export:** everything at any time; saved views on a schedule.
- **Keeping data:** periods per kind (settings; CA to confirm). Meeting recordings are kept until someone deletes them, never removed automatically (choice 63, 22 Oct).
- **Requirements:** CORE-102, CORE-103, AI-007.

## SCR-196 · Storage

- **Preview:** `storage.html` (tab beside Data)
- **Layout:** space used, files, backups, big files kept as Drive links; space by area; largest files; AI clean-up suggestions (copies, old drafts). AI never deletes anything.
- **Requirements:** CORE-083, CORE-084, INT-022, AI-009.

## SCR-250 · Email templates

- **Preview:** `email-templates.html`
- **Layout:** templates grouped (billing, renewals, everyday, layout); a live preview in the branded layout with fill-in words in blue; language chips with status (done, draft, missing); fill-in words list; Send a test to me.
- **AI:** translate missing languages (drafts for a native speaker), improve wording.
- **Requirements:** CORE-063, CORE-111, AI-009.

## SCR-251 · WhatsApp templates

- **Preview:** `whatsapp-templates.html`
- **Layout:** templates synced from AiSensy with what they are used for, type (utility, marketing, login code) and Meta status; a WhatsApp-style preview with buttons; fill-in word mapping; provider, fallback and last sync; approximate cost per message.
- **AI:** draft a new template; explain a rejection and offer new wording.
- **Requirements:** CORE-063, CORE-064, INT-003, AI-009, D-154.

## SCR-173 · Ask Nexus chat

- **Preview:** `ask-nexus.html`
- **Layout:** left: New chat, search my chats, pinned, today, this week, and my AI use this month. Centre: the chat with the person's questions on the right and Nexus answers on the left (text, a small table, source links, thumbs up/down, copy, time taken); an **action card** ("Nexus will do this after you confirm") with Confirm, Change, Cancel; a "writing…" state with Stop; the message box with attach, an attached record, mic and send. Right: this chat (attached, areas used, size against its limit, speed), remembered notes with Forget, suggested questions.
- **Rules:** answers only from what the person may see; actions only after Confirm; money and client messages through approval; long-term notes only with consent; chats kept 12 months; each chat has a size limit and is summarised when long; first words within about 2 seconds.
- **Requirements:** AI-001 to AI-004, AI-011 to AI-015, AI-017, AI-018, NFR-024, NFR-025.

## SCR-174 · AI usage and limits

- **Preview:** `ai-usage.html`
- **Layout:** spent this month against the budget, money saved by memory and cheaper models, questions answered (and how many came free from memory), voice minutes; the monthly budget: no fixed levels, the Owner types the amount (₹3,000 in the sample), with **Change amount** and **Top up** (add any amount, any day of the month), top-ups so far and what is left, a bar and alert points at 50%, 80% and 100%; at 100% AI and voice pause until a top-up or the 1st (choice 20, 22 Oct); limits per feature (chat, helpers, voice, client chatbot, imports and reports); limits per role; usage per person and per provider.
- **Rules:** at any limit only AI pauses; everything still works by hand.
- **Requirements:** AI-005, AI-006, AI-011, AI-020, D-156.

## SCR-256 · AI settings

- **Preview:** `ai-settings.html` with tabs `#models`, `#guard`, `#actions`, `#memory`
- **Providers and models:** main and backup providers (only ones that do not train on our data), speech provider; the model size for each job (small for autofill and the chatbot, standard for drafts and chat, advanced only for reports).
- **Guardrails:** same permissions as the person, never sees passwords, hidden instructions ignored, personal details masked, money and client messages need approval, never deletes, everything logged; most are locked on.
- **What AI may do:** each action on or off, and the approval it needs; deleting is never allowed.
- **Memory and chats:** how long chats are kept, notes only with consent, answers from memory for repeated questions, long chats summarised, size limit per chat.
- **Requirements:** AI-003 to AI-005, AI-011, AI-013 to AI-015, AI-017.

## SCR-257 · AI knowledge

- **Preview:** `ai-knowledge.html`
- **Layout:** knowledge items (company profile, services, FAQs, brand voice, office hours, price guide, case studies) marked Team, Chatbot or Team only, with on/off; brand voice text; **test as a client** to see how the chatbot would answer and when it hands over.
- **AI:** suggest FAQs from the website and past emails (each approved before use).
- **Requirements:** AI-016, AI-019.

## SCR-258 · AI quality

- **Preview:** `ai-quality.html`
- **Layout:** question set pass rate (needs 95%), speed, thumbs-up rate, answers to review; the last 6 runs (runs under 95% did not go live); questions that failed today; poor answers with a fix (improve knowledge, update brand voice, add a test question, mark reviewed).
- **Requirements:** AI-008, AI-018, NFR-024.

## Phone · Quick add by voice and approvals

- **Preview:** `phone-core.html`
- **Quick add:** bottom sheet while listening: the words heard, what Nexus understood, **Confirm**, Change, Cancel.
- **Approvals:** cards with amount and one-tap Approve / Reject / Details; AI drafts marked.
- **Requirements:** CORE-113, AI-010.

---

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
