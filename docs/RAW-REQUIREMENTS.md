# Raw requirements

Everything the owner has asked for, collected in one place **before** it is cleaned up into `docs/REQUIREMENTS.md` (step 1.3). Nothing here is new: every line comes from one of the sources below.

**Sources:** **[N]** the notes document (`docs/sources/YTP-Nexus-notes.docx`) · **[R]** the integrations and AI roadmap image (`docs/sources/roadmap-integrations-ai.webp`) · **[W]** the YTP website services and about pages · **[C]** the YTP careers page · **[A]** the owner's answers in planning, 2026-09-30 · **[Q]** the owner's own questions ("what if…"), turned into must-haves.

Where a later answer changed an earlier note, the later one wins and is marked **(replaces …)**.

---

## 1. Vision [N]

- The founder opens **one YTP application** every morning and immediately knows which clients need attention, what the employees are doing, which payments are pending and what must be done today.
- YTP Nexus is the company's **central management system**: connected departments plus one CEO dashboard (the **YTP Command Centre**).
- **Enter information once.** Employees update their assigned work, the modules connect the information, and the founder manages the business from the Command Centre.
- **Simple experience:** one login, role-based workspaces, one shared set of records, and a dashboard showing what actually needs attention.
- **Every dashboard item links back to its original record**, never to a separate copy.

### The client journey [N]
1. The client enquires → the lead is recorded; after conversion it becomes a permanent client profile.
2. The client signs the agreement → project value, agreed services, maintenance terms and renewal responsibilities are recorded.
3. The team builds the website → development is tracked; the domain, hosting and technical details are recorded.
4. YTP invoices the client → invoice and collections recorded; the client profile shows the financial status.
5. Maintenance begins → agreed coverage and schedule known; actual maintenance work recorded.
6. The hosting renewal approaches → a renewal obligation is raised from the expiry date; any YTP payment recorded.
7. All important updates reach the Command Centre.

### What the founder sees every morning [N]
Needs attention (decisions and overdue items) · upcoming renewals (next 30 days) · pending collections · team tasks · an attention list (for example: hosting renewal needs confirmation, overdue invoice needs follow-up, free maintenance ending, website handover acceptance pending).

---

## 2. Module structure

- **[N]** Originally 9 modules (M01–M09) + Command Centre + M10 Academy as a separate future project.
- **[N]** Later notes: build each module as an independent app, connect later, then add an AI Command Centre.
- **[A] (replaces both)** One connected app with **7 self-enclosed modules** on a shared Core, the Command Centre and Reports on top, and an AI assistant. Academy is included as M7. Modules must be **enclosed and must not create chaos**.
- **[A]** Nothing is "later": **everything is in scope**. No deadline; the goal is the complete product.
- **[A]** Build fresh. Do not reuse Agency OS, Client OS, WebCare or HostCore.

---

## 3. Features listed in the notes [N]

All 157 features from the notes, as written. (In the final structure some move modules; that mapping is done in step 1.3.)

### M01 Client Relationship Hub (Client OS): 13
Master Client Database · Client 360° Profile · Company and Founder Information · Contact Management · Client Communication History · Client Acquisition Source and Referral Tracking · Services Purchased and Project History · Client Relationship Management · Client Documents · Client Commercial Overview · Client Activity Timeline · Client Testimonials and References · Client Search, Filters, Import and Export

### M02 Growth Pipeline (Sales CRM): 14
Lead Database · Lead Capture and Source Tracking · Lead Qualification and Scoring · Business Diagnosis Integration · Sales Pipeline · Follow-up Management · Meetings and Discovery Calls · Proposal and Quotation Management · Sales Forecasting · Deal Conversion Tracking · Lost Lead Analysis · Upselling and Cross-selling Opportunities · Lead Generation Campaign Tracking · Sales Reports and Analytics

### M03 Contracts & Renewals: 14
Client Agreement Management · Project Contract Records · Service Retainer Agreements · Free Maintenance and Warranty Tracking · Annual Maintenance Contracts (AMC) · Maintenance Scheduling · Domain Renewal Management · Hosting Renewal Management · SSL and Software Licence Renewals · Renewal Payment and Confirmation Tracking · Contract Amendments and Version History · Agreement Expiry and Renewal Alerts · Warranty-to-Paid-Maintenance Conversion · Renewal History and Reports

### M04 Service Delivery & Project Operations: 15
Project Management · Service Delivery Management for All Eight YTP Capabilities · Standard Service Workflows · Project Milestones · Task Management · Employee and Freelancer Assignments · Service Checklists and SOPs · Deliverable Management · Quality Assurance and Reviews · Client Approvals · Recurring Service Operations · Project Communication · Project Completion and Closure · Service Automation and Engine Integration · Project Progress and Delivery Reports

### M05 Digital Estate & Infrastructure (WebCare + HostCore): 17
Website Management · Domain Management · Hosting Account Management · Shared Hosting Fleet Manager · Dedicated Server Management · Client Digital Asset Inventory · Website Maintenance History · Website Technical Information · Website Backup and Restoration Records · Website Security and Technical Issues · Hosting and Domain Ownership Records · SSL Certificates and Third-party Licences · Secure Credential References · Asset Handover Management · Client Handover Documents · Internal Technical Dossiers · Website Infrastructure Reports

### M06 Billing, Collections & Finance: 15
Quotation and Estimate Records · Invoice Management · Recurring Invoice Management · Payment and Receipt Tracking · Outstanding Collections · Automated Payment Reminders · Client Billing History · Vendor Management · Vendor Payment Management · Company Expense Tracking · Internal Subscription Management · Infrastructure Cost and Reimbursement Tracking · Multi-currency Transactions · Revenue and Profitability Reports · Financial Document Management

### M07 Calendar, Meetings & Follow-ups: 13
Central Calendar · Client Meeting Scheduler · Internal Team Meetings · Meeting Notes and Minutes · Meeting Action Items · Client Follow-up Reminders · Personal Reminders · Task and Project Deadline Calendar · Renewal and Payment Calendar · Google Calendar Integration · Meeting History · Daily and Weekly Schedule · Upcoming Events and Notifications

### M08 People & Capacity (Employee OS): 14
Employee Database · Employee Profiles · Roles and Permissions · Attendance Management · Leave Management · Payroll Management · Employee Task Overview · Workload and Capacity Planning · Employee Performance Tracking · Employee Goals and OKRs · Employee Documents · Freelancer and External Partner Management · Employee Dashboard · HR Reports

### M09 Performance, Reporting & Proof: 15
Company Performance Dashboard · Client Performance Tracking · Project Performance Reports · Service-specific Performance Indicators · Marketing Campaign Reports · Website and SEO Performance Reports · Sales Performance Reports · Financial Performance Analytics · Recurring Revenue Analytics · Client Reporting Schedules · Testimonials Management · Case Study Management · Portfolio and Success Stories · Automated Report Generation · Performance History and Comparison

### YTP Command Centre: 17
Founder Dashboard · Company-wide Overview · Client and Project Overview · Sales and Revenue Overview · Upcoming Renewals · Pending Payments and Collections · Employee Workload Overview · Today's Meetings and Follow-ups · Pending Approvals · Important Notifications and Alerts · Operational Risk Monitoring · Unified Search · Daily Business Summary · Weekly and Monthly Business Reports · Employee Dashboard · Restricted Client Dashboard · Future AI Business Assistant

### M10 Academy Operations: 10 (now M7 Academy [A])
Academy Management · Course Management · Student and Admission Management · Training and Batch Management · Trainer Management · Student Payment Management · Certificates and Assessments · Academy Lead Generation · Student Communication and Automation · Academy Reports

---

## 4. Calendar and meetings: field-level detail from the notes [N]

The notes contain a developer-ready field list for calendar and meetings. It is kept in full here.

| Feature | Fields and options |
|---|---|
| **Central calendar** | Views: Daily / Weekly / Monthly / Agenda · Event title · Event type: Client Meeting / Internal Meeting / Personal Event / Follow-up / Other · Date · Start and end time · All-day: Yes / No · Description · Related client · Related project · Assigned employee · Status: Scheduled / Completed / Cancelled · Colour by type · Filters: employee, client, type, status · Actions: Add / View / Edit / Reschedule / Cancel · Also shows task deadlines, renewals, invoice due dates and approved leave from other modules without re-entry |
| **Client meeting** | Title · Client · Contact person · Contact information (from the client record) · Type: Discovery / Follow-up / Project Review / Proposal / Support / Other · Mode: Online / In Person / Phone · Date, start and end time · Platform: Google Meet / Zoom / Microsoft Teams / Other · Meeting link · Location · Internal attendees · External attendees · Agenda · Organizer · Status: Scheduled / Completed / Rescheduled / Cancelled / No-show · Reminder · Notes · Actions: Schedule / Edit / Reschedule / Cancel / Open link / Add notes |
| **Internal meeting** | Title · Category: Daily Stand-up / Weekly Review / Project Review / Strategy / HR / Other · Date, start and end time · Mode: Online / Office / Other · Location or link · Organizer · Participants · Related project (optional) · Agenda · Recurring: None / Daily / Weekly / Monthly / Custom · Status: Scheduled / Completed / Cancelled · Notes · Action items. Client and internal meetings share one meeting system |
| **Meeting notes and minutes** | Meeting reference · Date · Attendees · Agenda · Discussion summary · Key decisions · Client requirements · Issues discussed · Action items, each with responsible person and deadline · Next meeting date · Additional notes · Attachments · Status: Draft / Finalized · Share summary. Notes are visible from the client profile with no duplicate copy |
| **Meeting action items** | Title · Description · Related meeting, client, project · Assigned to · Priority: Low / Medium / High / Urgent · Due date · Status: Pending / In Progress / Blocked / Completed · Completion date · Remarks · Convert into a task |
| **Follow-ups** | Title · Related client or lead · Contact person · Type: Sales / Proposal / Payment / Project / General · Method: Phone / WhatsApp / Email / Meeting · Date and time · Assigned employee · Priority: Low / Medium / High / Urgent · Status: Pending / Completed / Postponed / Cancelled · Previous discussion · Outcome: Interested / Not Interested / Awaiting Reply / Other · Next follow-up date · Related document · Notes · Actions: Create / Edit / Complete / Postpone / Reschedule / Create next follow-up. Shown on the client or lead profile |
| **Personal reminders** | Title · Description · Category: Personal / Business / Finance / General · Date and time · Frequency: Once / Daily / Weekly / Monthly / Custom · Priority: Low / Medium / High · Related client, project · Owner · Notification: In-app / Email · Status: Upcoming / Completed / Snoozed / Cancelled · Snooze until · Completion date · Actions: Add / Edit / Complete / Snooze / Delete |
| **Task and project deadline calendar** | Shows existing tasks: title, project, client, assignee, priority, deadline, status, overdue highlight, milestones · Filters: employee, project, client · Open the original task |
| **Renewal and payment calendar** | Renewal type: Domain / Hosting / SSL / Licence / Agreement · Client · Item · Renewal date · Responsibility: YTP / Client / Other · Renewal status · Invoice due date · Invoice status: Issued / Partially Paid / Paid / Overdue · Filters: renewals, agreements, payments · Open the original record |
| **Google Calendar integration** | Connected account · Status: Connected / Disconnected / Error · Calendar selection · Import meetings on/off · Create Google events on/off · Sync: one-way / two-way · Default calendar · Default duration: 15 / 30 / 45 / 60 minutes / custom · Time zone: Asia/Kolkata default, editable · Last sync · Sync error · Disconnect |
| **Meeting history** | Title · Date · Type: Client / Internal · Client · Project · Participants · Status: Completed / Cancelled / No-show · Summary · Decisions · Pending action items · Follow-up status · Documents · Search and filters: client, employee, date, type · Export one meeting summary |
| **Daily and weekly schedule** | Today's date · Today's meetings · Upcoming meetings · Pending follow-ups · Personal reminders · Tasks due today · Upcoming renewals · Payment due dates · Seven-day view · Filter by employee · Completed today · Next seven days · Quick actions: Schedule meeting / Add reminder / Create follow-up |
| **Notifications** | Title · Type: Meeting / Follow-up / Reminder / Deadline · Link to the record · Date and time · Recipient · Priority: Normal / Important / Urgent · Channel: In-app / Email · Status: Unread / Read / Dismissed · Actions: View / Mark as read / Snooze · Upcoming events · Missed activities · Preferences. Uses one shared notification system |

---

## 5. Roadmap image [R]

- **Stages:** Now (independent apps) → Next (unified YTP Nexus: shared visibility, unified dashboard, connected records, cross-app search, founder command centre) → Later (AI Command Centre). *(Now built as one connected app from the start [A].)*
- **Integrations:** Website · WhatsApp · Instagram · Calendly · Google Calendar · Email / Gmail · Google Drive · Payment gateway · Meta Ads · Google Ads.
- **AI stage 1, read and understand:** answer questions, fetch records, summarise updates, weekly review.
- **AI stage 2, assist and prepare:** draft reminders, meeting summaries, suggest follow-ups, prepare reports.
- **AI stage 3, execute approved actions:** create reminders, update records, trigger workflows, only with approval.
- **AI role:** secure access, uses connected data, supports decisions, human approval for sensitive actions.

---

## 6. YTP's services [W]

YTP diagnoses before recommending: **clarity first, structure second, execution last.** Offices: Chennai · Dubai · global clients.

| # | Capability | Services |
|---|---|---|
| 1 | Growth & Customer Acquisition | Performance marketing (Meta and Google) · Lead generation and funnels · SEO and local SEO · Email and WhatsApp marketing · Social media growth |
| 2 | Web & Digital Experience | Website development · Landing pages · Conversion optimisation · UI/UX design · Maintenance and support |
| 3 | Customer Lifecycle & Conversational Growth | WhatsApp marketing and automation · Chatbots and AI assistants · CRM and marketing automation · Lead nurture and follow-ups · Retention and reactivation |
| 4 | Automation & Business Systems | Business process automation · Workflow integration · Internal tools and dashboards · Solution architecture · AI-enabled workflows |
| 5 | Custom Business Technology | Custom software development · Web portals and platforms · API integrations · Deployment and support · Internal tools |
| 6 | Data & Decision Intelligence | Business and marketing analytics · BI dashboards · Funnel and revenue tracking · Data reporting and insights · Predictive and AI-powered analysis |
| 7 | Brand, Content & Authority | Brand identity and design · Content strategy and production · Video and visual storytelling · Founder and personal branding · LinkedIn and digital authority |
| 8 | Startup & Launch Systems | Go-to-market strategy · Product and brand foundation · MVP development support · Launch campaigns · Investor-ready collateral |

Entry services: **Business Diagnosis / Clarity Session** and **AI Discovery Call**. Platforms worked on: WhatsApp, Instagram, Facebook, LinkedIn, Google, YouTube.

---

## 7. Careers page [C]

Competitive salary · innovation · employee development (conferences, workshops, courses) · recognition and rewards (appreciation, bonuses, incentives) · team building · office environment · casual dress code · performance-based growth (promotions).
**Owner decision [A]:** Nexus includes **hiring**, **bonuses and incentives**, **training records** and **recognition**.

---

## 8. Owner answers [A]

### Company
- Proprietorship in **Tamil Nadu**, becoming an **LLP** soon; company details must change from a date without altering issued invoices.
- **GST applied for**, not yet registered: invoices must work **without GST now and with GST later**.
- Domain: **youtoopreneur.com** for email and the future Nexus address.
- 16+ people, hybrid and remote. 100–300 clients and 100–300 websites. Today everything lives in **WhatsApp, the phone and memory**; no other tools.
- Brand: YouTooPreneur logos (with and without the slogan "Digital Business & Growth Ecosystem"); colours green `#03FF96`, dark green `#1C3D36`, navy `#10273A` (both dark colours current), white.
- **One "mixed" theme**: dark brand menu with a light work area; no dark theme (owner, 2026-10-01; this replaced "light and dark themes, each person chooses"). Later the same day the owner asked for **both Emerald and Navy, switchable** (round 19, D-134, D-137).

### Users and access
- Owner, Accounts, developers and support, clients (portal), students (portal).
- **Future roles created and assigned by the owner with no code.**
- Approvals: the owner plus managers the owner chooses, with limits.

### Money
- **Custom quote for every job**; no fixed prices. Pricing models: fixed project (any payment split), monthly retainer, yearly renewal, custom quote after diagnosis.
- Invoice sending: **mixed**. Renewals and monthly bills go automatically; new and one-time work waits for the owner's OK.
- Payments today: **UPI and cash**. Must support **every payment gateway** (Razorpay, Stripe, Instamojo and future ones) by **only adding keys**, with no credentials available yet.
- Payment terms vary: aim for **payment on receipt**, then chase at **7** and **15** days. Late payers are a real problem.
- **Non-payment:** alert the owner; the owner decides. Nothing pauses automatically.
- Invoice numbers: owner first asked for random numbers for security; agreed instead to **consecutive numbers** (GST rule) with **random secret links**. Clients `YTP/26-27/0001`, Academy `YTA/26-27/0001`. Owner to confirm with the CA.
- Financial year **April to March**. Foreign clients billed from India in **INR**. TDS not seen so far, support anyway.
- Ad spend: sometimes YTP pays and bills the client, sometimes the client pays directly.
- Partner and influencer commissions decided **case by case**.
- Owner approves discounts, leave, expense claims and vendor payments.

### Clients, sales and delivery
- Leads mostly handled **by the founder**. Pipeline: New → Contacted → Clarity session → Proposal sent → Won / Lost.
- Business Diagnosis: **questionnaire + notes + recommended services**; free or paid, per client.
- Proposal acceptance: **Accept button**, **online signature**, or **marked manually** after a WhatsApp or email reply.
- Domains and hosting: **some in YTP's accounts** (billed to the client), **some in the client's own accounts**.
- Free maintenance length and AMC price: **set per client**.
- Support: active clients get a **reply within 24 hours and a fix within 3 days**; others per client or AMC.
- **Content calendar** for client social media: plan, client approval, tracking now; direct publishing once platform keys are added.
- **Client portal:** view and pay invoices, see services and renewals, approve deliverables, raise support requests.
- Client logins (hosting, domain, WordPress): ~~an encrypted vault inside Nexus plus an optional password manager~~ **(replaced, round 16):** passwords live only in Vaultwarden; Nexus stores links to the vault items, never passwords (section 12, RULE-025, D-140).
- Files stored **inside Nexus**.

### Team and HR
- Team types: employees, freelancers, partners, influencers. Departments: design and video, development, marketing, sales and accounts.
- Attendance: no system today; owner asked Claude to choose a **simple, good** one.
- Work schedule: Monday to Saturday, 10 AM to 7 PM. Each person picks **1 Saturday off and 1 half-day Saturday (9 AM to 1 PM)** each month (2 off in a five-Saturday month). **Working on a leave day earns comp-off**, usable within 30 days.
- Leave: casual, sick, earned, loss of pay; quotas set later in Settings. **Tamil Nadu holidays.**
- Payroll: no system today; wants **salary calculation, payslips, PF / ESI / professional tax, freelancer and partner payouts**.
- **No time tracking.**

### Academy
- Same company as YTP, **own invoice series**. Online live, classroom and recorded courses. Fees in full or instalments (student chooses). **Student portal.**

### Communication
- Email: **domain email plus any provider** (Gmail, Microsoft, Yahoo, Zoho and others).
- WhatsApp: only the **WhatsApp Business app** today.
- Staff alerts: **in the app, email, WhatsApp and browser notifications**.
- Languages: English, **Tamil, Hindi, Malayalam, Telugu**, and **any language can be added later**.
- Phone browser is enough; no native apps.

### Hosting and cost
- **Build on the local computer first**, always ready to deploy; **move online early** so the remote team can use it. Server not chosen yet.
- **Free options as much as possible.**
- AI inside Nexus: **any provider, with fallback**.

---

## 9. Must-haves from the owner's own questions [Q]

The owner asked "what if…" for each of these. Each answer became a requirement.

1. **New roles** can be created at any time, and access given, with no code.
2. Nexus can be used through **MCP and API keys**.
3. **Storage** is managed properly: no leaks, available where needed, and fast.
4. **Import and export** are handled by the system, not done manually.
5. **New automations** involving outside tools and several modules can be created later.
6. **User access** is secure, and access is given per role.
7. **Sensitive data** is protected.
8. There are **configuration settings** for everything that may change.
9. **AI** is built in.
10. **Retries, security, many users at once, database and server management, and failure safety** are all handled, including "what if it fails".
11. **Any area can grow** (for example adding fields, connecting more data, enlarging the Tasks area) without disturbing others.
12. **Leads from any source** (website, word of mouth, ads, referral, others), and **new sources can be added later**.
13. **Several communication channels and several email addresses or numbers**, which can be **changed easily** later.
14. **Logging, retries, backups, monitoring** and **error handling** for both failures and successes.
15. **Meetings on any platform** (Zoom, Google Meet, others) and booking tools like **Calendly**; new platforms and accounts can be added or changed; **who can assign meetings** is controlled.
16. **New kinds of integration** can be added in future.
17. Integrations are **ready before the keys are bought**; adding a key later makes it work **instantly**.
18. **AI builders must follow the plan:** tasks are spoon-fed, small and chained, never "thought up" by the executor; every task is **debugged, tested and verified** before it counts, and **everything the AI does is recorded**.
19. **Data is secured**, and there is a **recovery plan** if data is ever lost or wiped.
20. **New features never damage existing client data.**
21. **Several AI providers** can be connected; **one expiring must not break** Nexus.
22. Modules are **self-enclosed**; changes must **not require an architecture change**; structure must **not create chaos**.

---

## 10. Added after the owner's review (2026-10-01) [A]

### All services, now and in future
- Nexus must work for **every YTP service**, not only websites, including the **new services launching next month** and any added later.
- New services will be of **all four kinds**: projects (one-time work with stages and deliverables), monthly retainers, **packages / bundles** (several services sold together at one price), and **products or subscriptions** (templates, tools, software plans).
- **Service templates**, created in Settings with no code, define for each service: how it is billed, its workflow (stages, checklist, deliverables), any extra information it needs, and any recurring work.
- **Products** can be delivered as a download file or link, as access or a licence key, or set up by the team; chosen **per product**.
- **Subscriptions** are paid by **invoice each cycle** by default, or by **autopay** (card or UPI AutoPay) once a payment gateway is connected; the **client chooses**.

### Each service follows its own process
Different services are handled differently, so each **service template** also sets:
- **Client inputs:** a checklist of what the client must provide before work starts (logins, brand files, content, account access). Reminders to the client can be **switched on or off** per client or checklist, because clients don't always provide things on time.
- **Approval steps**, internal and client, at chosen stages (for example script approval, then final cut approval).
- **Revision rounds:** **vary per client**. Set in each client's quote or contract (a number, unlimited, or not tracked); never a fixed rule. Extra rounds can be charged.
- **Payment stages:** **vary per client**. Set in each client's quote or contract: any number of stages, as a % or an amount, tied to a stage, a date, or marked by hand.
- **Recurring cycles** (for example monthly SEO tasks plus a monthly report, created automatically).
- **Results tracked** per service (for example leads and cost per lead for ads; rankings and traffic for SEO).
- **Aftercare** per service (for example free maintenance for websites; nothing after delivery for a video).

**Extra work outside the agreed scope** is recorded as a **change request**. How it is handled **varies per client**: "always quote", "small changes free", or "decide each time" (the default). Charged work follows quote → client approval → bill.

**The rule for all of the above:** a service template may **suggest** a starting value (blank by default), but **each client's agreement always decides**.

**Client accounts tracked in WebCare**, beyond websites, domains and hosting: **social media pages**, **ad accounts** (Meta, Google, with budgets), **Google Business profiles, Analytics, Search Console, Tag Manager**, and **WhatsApp numbers and chatbots**.

### Leads for any service
- A lead from **any source** (website, WhatsApp, phone, word of mouth, referral, ads, Instagram, others) must be captured for **any YTP service**, not only website development.
- Each lead records the **services it is interested in** (one or several, from the full service list including bundles and products), or **"Not sure / needs diagnosis"**.
- Ads campaigns and website forms are **linked to a service**, so their leads arrive already tagged with it.
- **Quick add** for leads from calls or WhatsApp (about 10 seconds).
- Leads can be **assigned automatically by service**; reports show leads, conversions and revenue **by service and by source**.

### Complete employee management
In addition to section 8, Nexus includes: joining and leaving checklists · offer, appointment, experience and relieving letters · probation tracking · employee self-service (view payslips, apply for leave, update own details) · company policies with acknowledgement · company assets given to staff (laptops and so on) · salary revision and appraisal history · salary advances · reporting managers and org chart · birthdays and work anniversaries.

### Attachments and client resources
- **Attachments** on tasks, projects (including deadlines and milestones), deliverables, support requests, meetings and client records.
- A **"Client resources" folder** per client and per project for the raw material clients send (images, documents, logos, logs and others).
- **Clients can upload resources themselves** through the client portal.
- Image and PDF **previews**; older **versions** are kept.
- **Upload limit: 25 MB per file** (a setting). Bigger files are added as a **Google Drive (or similar) link** instead of being stored.
- Storing many files must **never slow down the app**; storage usage must be visible.
- Passwords are never stored as files; they go into the password manager (Vaultwarden, outside Nexus; D-140).

### Email for testing
- The owner currently uses **Gmail**, not domain email. **Both must be available from the start**: Gmail now, domain email later.
- **Test mode:** while Nexus is being built and tested, **no message reaches a real client**; every outgoing email or WhatsApp message goes to the owner's test inbox.

### Limits on AI use
- AI use inside Nexus must be **limited and controlled**, with everything set in **Settings with no code**.
- **Budget tiers** to choose from (for example light, moderate, heavy) plus a **custom amount**; the owner fixes the amount later. **AI stays off until a budget is chosen.**
- **Everyone can use AI**, within **limits per role** (and per person if needed).
- Alerts at 50%, 80% and 100% of the budget. At the limit **only AI pauses**; the rest of Nexus keeps working.
- A usage screen: who used AI, how much, and the cost per provider.
- API and MCP keys have their own limits too.

### Business rule details (answers to Claude's questions)

**Money**
- Renewal alerts **30, 15, 7 and 1 days** before (editable).
- Payment reminders: due on receipt, then **7** and **15** days; **escalation to the owner is set per client**. **No late fees.**
- Invoice totals **rounded to the nearest rupee** with a "Round off" line.
- Ad spend billed back to a client: the fee (none, % or fixed) is **set per client**.
- Payments received into **one bank account / UPI ID now**; more can be added later and chosen per invoice or business line.
- Quote validity **set per quote** (default 15 days).

**Clients and sales**
- If a new lead is not contacted, alert the owner at **6 hours** and again at **24 hours**.
- Support requests come in through the **client portal, email, WhatsApp and phone calls**.
- Client portal: how much project progress a client sees is **set per client**; each client **contact** has their own login, and what they can see (invoices, projects, approvals, support) is **set per contact**.

**Team**
- **Daily summary for everyone:** the owner gets the full business summary; each staff member gets their own day. **Each person sets their own time.**
- Salary pay day is **set in Settings**.
- Extra hours or holiday work: **comp-off or overtime pay**, chosen per case.
- Late check-in: **only recorded** at first; rules (grace period, penalties) can be added later in Settings.
- Job applications come from the **careers page form, email, job portals (Naukri, LinkedIn, Indeed) and by hand**.

**More answers (round 7)**
- Retainer billing timing **set per client**: start of the month, end of the month, or the start-date anniversary.
- Accepted proposal as the agreement, or a separate signed agreement: **set per client or service**.
- **Broadcasts** (offers, newsletters, announcements) to YTP's own leads and clients: **yes, only with consent**, with unsubscribe.
- Leave approval chain **set per role or person**.
- Data retention for lost leads and rejected applicants **set in Settings**.
- Clients seeing their own logins in the portal: **set per client**.
- Two-step login: **authenticator app, email code or WhatsApp code**; each person chooses.
- Salaries paid by **bank transfer first**, UPI as the alternative.

**Academy**
- Recorded course videos are hosted on a **video platform** (**Bunny Stream**, chosen in round 16, D-118; replaces "not yet chosen"). Nexus shows them only to enrolled students.
- Certificates carry a **QR code and a public verification page**.

### Rate limits and many users at once
- **Rate limits** must protect Nexus from accidents, spam and attacks: logins, each user, API and MCP keys, public pages, outgoing messages (staying under each provider's limit), heavy jobs and AI. Hitting a limit shows a clear message and never breaks anything.
- **Many people at the same time:** one person with many tabs or double-clicks, and many people working on the same records at the same moment, must never cause duplicates, lost changes or slowdowns.
- Plan for **100 people at the same time** (staff, clients and students) and scale later. Academy: about **50–200 students** at a time.

---

## 11. Way of working [A]

- The owner is a **single developer working with AI**.
- **Claude plans.** **Antigravity and Codex both execute**; Codex sometimes reviews.
- Task cards must be **spoon-fed**, so executors never need to think.
- Tasks are **small chunks**, **connected to the previous task**, and each one runs **until debugged, tested and verified**.
- **Everything the AIs do is logged.**
- Progress is visible in an **interactive tracker**.
- Screen style is explored with ~~ChatGPT image generation~~ **coded screens built by Claude (replaces ChatGPT images, round 14, D-136)**; exact screens come from written specs and a clickable preview.
- Follow a **simple 5-phase plan** that contains all the industry stages.
- **Review loop:** requirements, screens, clickable preview and fields go round in **numbered review rounds** until the owner is fully satisfied. Only then are they **frozen**, and task cards (step 1.8) start. After the freeze, changes go through `docs/CHANGES.md`.
- **Technology inside the app** is proposed now and locked in step 1.7, after the design is final.

## 12. Round 16 additions (2026-10-01) [A]

Sources:
- the audit `YTP-NEX-AUD-02 v1.1`, written for the owner by a team member
- `EMPLOYEES DASHBOARD.docx`: 60 screenshots of the old Agency OS (employee portal, client portal, admin screens)
- the owner's brief and answers

Copies are in `docs/sources/`. The full approved list is `docs/review/ROUND-16-CHANGE-LIST.md`.

- **Plan:** the 5 phases stay. The Academy moves to the end (3.10), with no rush; 3.8 is Portals, Reports, API and AI; 3.9 is Integrations.
- **Connections:** every planned outside service gets a ready, documented slot from step 3.1 and is built when its account exists.
- **Login:** Google sign-in from Foundation, free; mixed Gmail and company accounts on an allow-list. New default roles: LLP partner, HR, Trainer.
- **Passwords:**
  - never in Nexus; self-hosted Vaultwarden holds them, and Nexus keeps links
  - clients get logins through secure share
  - a free Bitwarden account can be used until the server is ready
- **Renewals:**
  - an expiry date moves only with proof (invoice, screenshot, client proof) confirmed by the Owner, a Manager or Accounts, or by the automatic check
  - wrong dates are corrected with a reason
  - shared hosting has one renewal and one alert per account, with the cost recorded once
  - provider accounts record owner, recovery email and MFA status
- **Money:**
  - **LLP partner section:** shares (provisional until the LLP agreement), investments, withdrawals and distributions (both partners approve), statements, profit split quarterly plus a yearly total, a dashboard for both partners. The partners enter entries now; an accounts person later.
  - Razorpay first.
  - Outstanding and unbilled amounts shown separately.
  - Vendor payments in original currency and INR; duplicates blocked.
- **Agency OS features kept:**
  - task subtasks, several assignees, In review and Cancelled
  - personal to-do lists
  - lead details
  - client statuses and profile PDF
  - full employee details (bank details for Owner, HR, Accounts only)
  - employee status with reason; documents and agreements checklists
  - attendance minutes, live board, regularisation and WFH
  - half-day and emergency leave
  - payroll year-to-date
  - the employee's own page
  - client portal cards, company profile and documents; staff names shown to clients
  - dashboard widgets

  The one-line check-in note stays.
- **Not built:** internal chat (Google Chat and comments). Agency OS is not deployed and is never touched.
- **Status today:** GST applied, waiting; LLP in progress; server chosen before step 3.5.

## 13. Round 32 additions (owner, 1 Oct 2026)

- **WhatsApp:** "Right now I am using AiSensy but also have plans for other providers too… I may use multiple platforms." → AiSensy first; several providers at once (D-154).
- **AI in screens:** "Wherever the AI helper is needed, try to fit it in all screens… in future it totally becomes AI powered. Also have room to operate manually, but support with AI is essential." → AI-009, D-155.
- **Voice:** "It should be a voice assistant to the Nexus platform rather than doing things manually… room for doing it manually… AI voice assistant but with limits." → AI-010, INT-024, SCR-255.
- **Limits:** "Anything we use with AI should have a limit, otherwise we run out of tokens and it will increase the budget." → AI-006 reworded, AI-011, D-156.

## 14. Round 34 additions (owner, 1 Oct 2026)

- **WhatsApp leads:** "What if new leads come from WhatsApp? Are we able to grab and put them in my product automatically?" → yes, from step 3.6 (CRM-030, D-157).
- **AI autofill and chatbot:** "What about autofilling with AI and a chatbot with AI?" → autofill is part of the AI helpers on every form; client chatbot "good idea, but having limits on AI is very good… you decide" → WhatsApp and website, strict limits (AI-019, AI-020, D-158).
- **AI chat rules:** "cache, memory, context window, many people at the same time, loading, persistent chat, new chat, sessions, good performance, blazing fast, chat history" → AI-011 to AI-018, NFR-024, NFR-025.
- **AI screens and earlier batches:** "If additional screens are to be added, try to do it again from batch 1 itself" → new AI screens in batch 2; batch 1 screens gain their AI parts; AI base built early (D-159).
- **Pipeline board:** "make this board premium, luxury, modern, user friendly."

## 15. Round 38 answers (owner, 2 Oct 2026)

Asked before batches 6 and 7 ("Ask me questions first before you proceed, separately").

- **Meeting notes:** "Also from recordings" → AI tidies typed notes and can write minutes from an uploaded recording, with everyone's consent (D-160).
- **Client problems on WhatsApp:** "One tap, AI flags" → D-161.
- **Monthly services:** "As ongoing projects" → D-162.
- **Case studies:** "Link + copy for website" → D-163.
- **Payslips:** "Breakdown" → D-164.
- **Deductions:** "None yet, keep off" → D-165.
- **Proposals:** "AI drafts the first version" → D-166.
- **Broadcasts:** "Email + WhatsApp", with a cost check and the owner's OK → D-167.
- **The morning check** (batch 5 question) was already answered on 30 Sep: the success measure is a **5-minute morning check** → CC-008 reworded.

## 16. Round 43 answers (owner, 6 Oct 2026)

Asked one by one after batches 8 and 9 were built.

- **Chatbot and prices:** "No prices, always a person" → D-168, AI-019 reworded.
- **Chat hours:** "Monday to Sat 10 to 6.30; only these times can customers connect with humans; otherwise AI will hand over to it, and collect information when outside these hours" → D-169, AI-019 reworded.
- **Client reports:** "Always checked first" → D-170, PRJ-015 reworded.
- **Revenue report:** "Also show profit after salaries" → D-171, RPT-003 reworded.
- **Certificate rule:** "Set per course, 75% default" → D-172, ACD-008 reworded.
- **Instalments:** "Set per course, no late fees" → D-173, ACD-005 reworded.
- **Recordings:** "12 months, set per course" → D-174, ACD-009 reworded.
- **Trainer name:** "Not yet, keep the sample".

## 17. Review copy for the senior (owner, 7 Oct 2026)

- "Bundle me the preview home and the list of mockup screens in a single folder that should be shared to my senior for reviews. Tell me what you understand first" → the review copy `Documents/YTP Nexus Screen Review` (+ ZIP) with an Excel comment sheet (one row per screen: Open link, OK / Change needed / Question, comments, priority), the screen notes, the screen list and the tracker (the owner chose all three extras). Rebuilt by `python tools/share/build-review.py`. The senior and the owner approve once, after all 9 batches (D-153).

## 18. Round 44: the way of working (owner, 21 Oct 2026)

- "Refer to the Dharsha project only to grasp the idea of how the process works, and leave the actual project. Do it exactly like it, the whole process, just for this project. Tell me first, then I approve" → explained first; the owner chose "Approve as described" → D-175 to D-182 (history saved after every reply, handover, the tracker as the one place, Word copies, the choices list, design versions, the screen check and viewer, gates as the owner's approvals). Only the process was taken; nothing from Dharsha's content.
- "Read this entire folder without leaving any single file" → every file read (documents, all screens, every picture, the whole conversation and the session records), with a coverage check.


## 19. Round 45: the choices answered (owner, 22 Oct 2026)

- "several choices i can approve but not whole and some choices need to understand by my manager he is not techinicaly aware so make it good to undersatnd and great details" → the plain-words guide `docs/CHOICES-EXPLAINED.md` (Word copy in `share/`) and the Excel answer sheet.
- "donot go too much =better ask me chunk wise with explanation before that tell me how many of them are. also donot go too much in to detail explaining" → 99 choices asked as 96 questions (3 pairs were the same question) in 24 short rounds, with the suggestion first.
- All 99 answered the same day → D-184; every answer is in `docs/CHOICES.md`. Where the owner typed the answer:
  - Bill timing (choices 38, 47): "titming can be added as no code setting, and everyday can go bill no holidays skip"
  - Design sign-off (59): "both lead manager and I can anyone can signs"
  - Pay day (69): "1st of the month and somethmes 1st falls on holidays so after holiday put it on working day"
  - Probation (30): "different per role and different per people and somebody donot have probation only new joiners"
  - Leave carry-forward (33): "keep upto 90 days all leaves if not used"
  - Lead backup (27): "both options"
  - AI budget (20): "htere is no fixed limit but i can enter teh amount how much i have and also i can topup anytime"
  - Alerts (5, 16): "I need options like i can asked first before sending using email or whatsapp and also use recommended options too" → asked once more: whoever set the alert taps Send.
- Changes picked from the offered options: the owner approves every expense claim, discount and supplier bill, card bills too (7, 15, 41); payment reminders by email and WhatsApp (18); approved extra work billed at once (61); free small changes up to a set limit (62); claims always paid by bank within a set number of days (42); salary review on the joining anniversary (73); performance review once a year (36); workload from office hours (34); managers see their own clients' dues (48); only the owner and partners open the revenue report (81); staff can edit their own clients, not delete (9); meeting recordings kept until deleted (63); a Sunday fix deadline moves to Monday (97); fixed support requests close by themselves after 3 days (80); shared hosting cost split by disk space (40); download links work 30 days (54); an expired proposal link offers a new proposal (65); agreement reminders 30, 15 and 7 days before the notice deadline (50); client renewal reminders 30, 15, 7 and 1 day before (78); client input reminders every 3 days, gap per client (57, 79); 12-hour times (4); each language opens after a native speaker's check (11); phone buttons by role (13); a certificate is cancelled only with a reason and the owner's approval (89); classroom workshops recorded too (91).
- One day's salary (70) and holiday overtime (71) stay as they are until the CA checks them.

## 20. Who builds, and one folder to share (owner, 31 Oct 2026)

- "aCtually you also gonna participate in this building too sometimes not only antigravity and codex. so rewrite rule too same process but you also include in building" → Claude explained first; the owner said "okay do it" → D-185: Antigravity, Codex and Claude build from task cards with the same process; Claude only in a separate building session, never reviewing its own card; each card names its builder.
- "Also put the review choices and preview under downloads directory so that i can share withotu confustion" → one folder, `Downloads/YTP Nexus - to share`, with the review copy, the choices list and the preview, plus a READ ME (`tools/share/build-downloads.py`).

## 21. Release by release (owner, 2 Nov 2026)

- "actually one of my plan is to make release by release because in single short i cannot prepare the whole app and also if i fragment the things chunk by chunk means i can deploy and make the user to surf my app and get feedback and with those feedback we try to cover and complete those and finish the release rather than doing something else so it would create the product which is really useful and worthy and without quality miss."
- "Even you can increase the number of release because 5 release with each release have massive amount of screens and coding. which is heavy to find the missing and also heavy to review ... we can go slow and do everyhitng perfectly." Also: build only from our own plan (strict).
- "Approve the list ... even you can split the release if you want and also good now" → D-186: 18 small releases (`docs/RELEASES.md`).
- "Approve Release 1" → the 15 Release 1 screens (Base and sign-in) approved, 2 Nov 2026 (Gate 2 for Release 1).
- "Yes, start" → Claude wrote the Release 1 tech design and data model for the owner's OK (Gate 3), 2 Nov 2026.
- "But i actually want separate as frontend and backend" → after comparing one Next.js app, React + Express and React + NestJS, the owner chose **"React + NestJS"** (D-187), 2 Nov 2026.
- "i feel like i am good with express js for backend rather nest js and also have ts supported on frontend and backend" → "Yes i approve and also have ts on frontend too": the backend is **Express with TypeScript**, the frontend **React with TypeScript** (D-187 updated), 2 Nov 2026.
- "where is running nothing is running tell me what is next?" → the review had stopped when the owner's Express message arrived; Claude restarted it, and its 54 confirmed findings were fixed (round 53), 2 Nov 2026.
- "i want both options free now (preferred just now) and small paid one for next. Yes have git account youtoopreneur@gmail.com mail account in github" → server: a free cloud machine now, a small paid one later (D-190); the GitHub account is youtoopreneur@gmail.com (step 1.9). Confirmed with the question tool: "Yes, approve" (Gate 3 for Release 1, D-188; Release 1 frozen, D-191) and git saves by "The builder" (D-189), 2 Nov 2026.
- "Yes, start cards" → step 1.8 for Release 1: the card list, the test plan and the first 13 cards with their tests, 2 Nov 2026.
- Step 1.9, 2 Nov 2026: the repository is https://github.com/YouTooPreneur/YTP-NEXUS; the staff document and the history folder stay off GitHub ("Keep it off"), the Word copies too ("Leave it out"); "better can we go with ssh connection like personal token system rather than disturb the account myyofan?" → a repository-only deploy key; saves show YouTooPreneur ("if through youtoopreneur means okay with recommended") (D-192).
- "Yes, allow" → Claude saves its planning updates to `main` itself; the owner runs the uploads (D-193), 2 Nov 2026.
- "why cannot you push from your end ... why should i do on my own", then "take good decision i cannot understand even single word at all" → Claude decides: uploads stay with the owner, who clicks **Run** on the one upload line after each save (the app does not let Claude give itself upload rights), 2 Nov 2026.
- "task 2 done" → Claude reviews TASK-0002 (Codex): PASS, merged into `main`; two gaps in the plan found by the review are fixed or scheduled (CR-002), 2 Nov 2026.
- "done" (TASK-0003 built by Antigravity, and the upload) → Claude reviews TASK-0003: PASS, merged into `main`; two more gaps in the plan found by the review are fixed before those cards start (CR-003), 2 Nov 2026.
- "you review everything right now do not go codex right now because codex tokens ran out already" → while Codex has no tokens, Antigravity builds every card and Claude reviews every card (D-194), 2 Nov 2026.
- "after every task why don't you tell me what is being done? and describe about the task ... suppose any work done and in the stage of running the app means run and show me what is being done" → a plain-words report after every task, and the app run and shown with pictures when there is something to see (D-195), 2 Nov 2026.
- "Yes, go ahead" → D-194 (Antigravity builds every card while Codex has no tokens; Claude reviews every card) and D-195 (a plain-words report after every task, with the app run and shown) take effect, starting with the review of TASK-0004, 2 Nov 2026.
- "done" (TASK-0005 built by Antigravity) → Claude reviews TASK-0005: PASS, merged into `main`, shown live; the gap the review found (a failed answer counted as success) is fixed before TASK-0013 (CR-005), 2 Nov 2026.
- "Yes, clear it" → Claude clears npm's download cache (17 GB, outside the project; packages download again when needed): drive C: has 23 GB free, 2 Nov 2026.
- "done" (TASK-0006 built by Antigravity) → Claude reviews TASK-0006: PASS, merged into `main`, shown running; the review's notes for later cards are recorded (CR-006), 2 Nov 2026.
- 3 Nov 2026: "right now i have around 82 cards which takes 300 hours of time to release first version it is massive amount of time ... i like this split up cards way that is essential keep this method too. but also think alternate too"; "good so have both now and also i can switch it anytime right"; "are you able to intimate me whether this card needs careful or fast whenever we start before the cards? and also in lane 2 are we gonna fast by taking 3 to 5 cards at a time right"; "Yes, set them up" → two lanes, careful and fast, switchable any time; Claude names the lane before every start (D-196).
- "task done by antigravity" (TASK-0007) → Claude reviews TASK-0007: PASS, merged into `main`, shown passing and catching a deliberate mistake; the gaps found are fixed before TASK-0008 and TASK-0009 are built (CR-007), 3 Nov 2026.
- "done" (TASK-0008) → Claude reviews TASK-0008: PASS, merged into `main`, shown passing and stopping three planted mistakes; the gaps found are fixed before TASK-0009 and TASK-0010 are built (CR-008), 3 Nov 2026.
- "done" (TASK-0009) → Claude reviews TASK-0009: PASS, merged into `main`, shown stopping an edited test, files outside the card and a damaged lock list; the gaps found are fixed (CR-009, D-197), 3 Nov 2026.
- "done" (TASK-0010) → Claude reviews TASK-0010: PASS, merged into `main`, the backend shown answering 4 real requests; the log gaps found are fixed by a new careful card, TASK-0086 (safe logs), built before TASK-0011 (CR-010), 3 Nov 2026.
- "done" (TASK-0086) → Claude reviews TASK-0086: PASS, merged into `main`, shown before and after (secrets in the log 10 times before, 0 after); the last gap found (an error logged without a message) is fixed by a small careful card, TASK-0087, built before TASK-0011 (CR-011), 4 Nov 2026.
- "done" (TASK-0087) → Claude reviews TASK-0087: PASS, merged into `main`, shown before and after (a database error no longer puts a reset code and an email into the log); notes only, 4 Nov 2026.
- "done" (TASK-0011) → Claude reviews TASK-0011: PASS, merged into `main`, shown with a sample door; CR-012 plan fixes applied; the re-check and the TASK-0012 trial build wait for the next session (usage limit), 4 Nov 2026.
- "continue" (after the usage limit) → Claude re-checks CR-012 (5 of its own notes corrected) and trial-builds TASK-0012 and TASK-0013 (both pass first time); TASK-0012 goes to Antigravity, 4 Nov 2026.
- "done" (TASK-0012), then "continue" after the session ended mid-review → Claude reviews TASK-0012: PASS, merged into `main`, shown with 4 planted mistakes; CR-013 adds the missing checks to its test and notes for later cards; a fresh re-check fixes 2 points; TASK-0013 trial-built on the new main; TASK-0013 goes to Antigravity, 4 Nov 2026.
- "i will continue from another laptop from saturday ... make the folder ready to continue ... it needs everyting and portable" → "Yes, go ahead": a carry ZIP with everything including the save history, `docs/NEW-LAPTOP.md` with the steps on both laptops, a new upload key per laptop (D-198), 4 Nov 2026.
- "where we left? tell me in short" → "Yes, review it" (TASK-0013, built by Antigravity on 4 Nov) → Claude reviews TASK-0013: PASS, merged into `main`, shown running at both widths and with the backend off; CR-014 adds 3 checks to its tests and two small set-up cards (TASK-0088, TASK-0089), 11 Nov 2026.
- "Yes, write them" → Claude writes TASK-0088 and TASK-0089 in full, prototypes them, has a helper trial-build both word for word (both pass first time, every planted mistake caught), fixes what the fresh review found; TASK-0088 goes to Antigravity, 11 Nov 2026.
- (found by Claude, 11 Nov 2026) the GitHub repository is public, against D-192; no secret in it; the owner makes it private (Settings → General → Change visibility).
- "done" (TASK-0088) → Claude reviews TASK-0088: PASS, merged into `main`, shown catching 3 kinds of mistake the check used to miss; CR-015 notes for later cards; TASK-0089 goes to Antigravity; the repository is still public, 11 Nov 2026.
- "done" (TASK-0089) → Claude reviews TASK-0089: PASS, merged into `main`, shown catching planted mistakes; step 2.1 finished; CR-016 notes; next the owner's two-person check and step 2.2's cards; the repository is still public, 11 Nov 2026.
- "Yes, start step 2.2" → Claude writes step 2.2's first cards: TASK-0014 split in three (TASK-0090, TASK-0014, TASK-0091, CR-017); TASK-0090 trial-built and fixed; TASK-0014 written and prototyped; TASK-0090 goes to Antigravity, 11 Nov 2026.
- "done" (TASK-0090) → Claude reviews TASK-0090: PASS, merged into `main`, shown with the services on this computer only and the settings file read; the TASK-0091 trial's 6 gaps fixed in TASK-0014 and TASK-0091; TASK-0014 goes to Antigravity, 12 Nov 2026.
- "TASK-0014 done" → Claude reviews TASK-0014: PASS, merged into `main`, shown with the four accounts and their rights and one database container for every copy; another project's development server on port 5173 blocked the end-to-end step; TASK-0091 goes to Antigravity, 12 Nov 2026.
- (pasted Antigravity's stop on the busy port 5173, its request for "kill 12672", and Claude's advice) → Claude advised freeing the port; "done" (TASK-0091) → Claude reviews TASK-0091: PASS, merged into `main`, shown with Core's schemas and the migrate command; the GBM preview is another Claude session's and restarts itself, so it should move to another port; next Claude writes TASK-0015, 12 Nov 2026.
- "Yes, write it" (TASK-0015), then "continue" → TASK-0015 split in two (CR-018): Claude writes TASK-0092 (the `core.uuid_v7()` ID function and Core's first table `core.companies`) in full, prototypes it, has it trial-built word for word and reviewed, fixes the 4 gaps found (a failed database change now names its file and the database's own reason, so builders fix their own change), re-checks the fixes five more times, each narrower; TASK-0092 goes to Antigravity; TASK-0015 written next, 12 Nov 2026.
- (pasted Antigravity's stop at TASK-0092's start check: port 5173 held by the GBM-Studies-Prototypes preview; Antigravity refused to change Nexus's port itself) "try different port thats all" → Claude moves Nexus's screens from 5173 to 5310 on `main` (CR-019, D-199) instead of stopping the other project's preview; the full check passes again, End-to-end smoke included; Antigravity brings `main` into its copy and starts TASK-0092's start check again, 12 Nov 2026.
