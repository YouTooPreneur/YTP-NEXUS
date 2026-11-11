# Releases

**Approved by the owner on 2 Nov 2026 (D-186).** The owner's idea: build YTP Nexus in small releases. Each release is built, checked, put online, used by the team, improved from their feedback and closed before the next one starts. Every one of the **184 screens** in `docs/SCREENS.md` is placed in exactly one of **18 releases**; nothing is dropped. The order follows our own build steps (Foundation, then 3.1 to 3.10): what others depend on comes first. A release may be split further when its task cards are written, if it turns out big (the owner's OK, 2 Nov 2026).

## Every release, the same cycle

1. Write the release's task cards; Antigravity, Codex or Claude builds them (D-185).
2. The owner and a team member check each part.
3. Put it online; the team uses it for 1 to 2 weeks.
4. Collect the feedback in one list (the release's feedback list, under its heading below); fix and improve.
5. The owner closes the release; the next one starts.

## The releases at a glance

| # | Release | Screens | What it gives |
|---|---|---|---|
| 1 | Base and sign-in | 15 | Sign in, roles, profile, settings, security, history, languages, health checks. Goes online with a daily backup. |
| 2 | Daily tools | 13 | Tasks, to-dos, quick add, alerts, search, files, approvals, lists, import and export. |
| 3 | Clients and leads | 10 | Leads, clients, pipeline, deals, business diagnosis. |
| 4 | Team basics | 11 | People, check-in, attendance, leave, My HR. |
| 5 | Calendar, meetings and projects | 9 | Calendar, meetings, projects, deliverables, workload. |
| 6 | Billing | 15 | Invoices, payments, receipts, collections, pay links, numbering. |
| 7 | Websites and hosting | 9 | Domains, hosting, servers, expiry checks, provider accounts, handovers. |
| 8 | Services sold and renewals | 8 | Services sold, AMC, subscriptions, agreements, the renewals board. |
| 9 | Dashboards, messages and automations | 8 | The morning dashboard, My day, email and WhatsApp, automatic reminders. |
| 10 | Delivery extras | 9 | Support, change requests, client inputs, content calendar, testimonials, case studies. |
| 11 | Sales and growth | 8 | Proposals, campaigns, broadcasts, forms, ad spend. |
| 12 | Complete HR | 9 | Hiring, joining and leaving, letters, policies, assets, goals. |
| 13 | Payroll and spending | 9 | Salary, payslips, advances, payouts, vendors, expenses. |
| 14 | Client portal | 12 | Everything a client sees and does in the portal. |
| 15 | Reports and LLP partners | 10 | Reports, client results and reports, partner money. |
| 16 | AI and integrations | 11 | Ask Nexus, AI settings and limits, voice, chatbot, live chat, automation builder, integrations, API keys. |
| 17 | Academy: running it | 9 | Courses, batches, admissions, students, attendance, assessments, fees. |
| 18 | Academy: students and certificates | 9 | Student portal, certificates and the public certificate check. |

**Total: 184 screens in 18 releases.**

## Every screen, release by release

### Release 1 · Base and sign-in (15 screens) · screens approved by the owner on 2 Nov 2026 · tech design and data model approved, Release 1 frozen 2 Nov 2026 (D-191)

| Screen | Name |
|---|---|
| SCR-001 | Login |
| SCR-002 | Two-step set-up |
| SCR-003 | Forgot / reset password |
| SCR-004 | App shell |
| SCR-008 | My profile and preferences |
| SCR-010 | Record history |
| SCR-011 | Trash |
| SCR-180 | Settings home |
| SCR-181 | Company profile |
| SCR-182 | Users and roles |
| SCR-190 | Security |
| SCR-192 | Languages |
| SCR-193 | Feature switches |
| SCR-194 | Monitoring |
| SCR-195 | Logs |

**Release 1 feedback list.** Problems found in each step's two-person check and while the team uses Release 1. The owner tells Claude, and Claude writes them here.

| Date | Found by | Problem | Fixed by (card or change) |
|---|---|---|---|
| — | — | — | — |

### Release 2 · Daily tools (13 screens)

| Screen | Name |
|---|---|
| SCR-005 | Search results |
| SCR-006 | Notification centre |
| SCR-007 | Quick add |
| SCR-009 | Approval inbox |
| SCR-080 | Tasks |
| SCR-081 | Task |
| SCR-082 | To-do lists and reminders |
| SCR-087 | Files and client resources |
| SCR-183 | Services and templates |
| SCR-184 | Custom fields |
| SCR-185 | Lists |
| SCR-191 | Data |
| SCR-196 | Storage |

### Release 3 · Clients and leads (10 screens)

| Screen | Name |
|---|---|
| SCR-030 | Leads and clients |
| SCR-031 | Quick add lead |
| SCR-032 | Client 360° profile |
| SCR-033 | Add / edit client and contacts |
| SCR-034 | Sales pipeline |
| SCR-035 | Deal |
| SCR-036 | Business diagnosis |
| SCR-039 | Duplicate merge |
| SCR-043 | Lead rules |
| SCR-252 | Client profile PDF |

### Release 4 · Team basics (11 screens)

| Screen | Name |
|---|---|
| SCR-120 | People |
| SCR-121 | Person |
| SCR-122 | Org chart |
| SCR-123 | Check in / check out |
| SCR-124 | Attendance register |
| SCR-125 | Leave |
| SCR-126 | Comp-off and overtime |
| SCR-138 | My HR (self-service) |
| SCR-139 | Employee documents check |
| SCR-140 | Attendance and WFH requests |
| SCR-197 | HR settings |

### Release 5 · Calendar, meetings and projects (9 screens)

| Screen | Name |
|---|---|
| SCR-083 | Calendar |
| SCR-084 | Schedule a meeting |
| SCR-085 | Meeting |
| SCR-086 | Meeting history |
| SCR-060 | Projects |
| SCR-061 | Project |
| SCR-062 | Deliverable |
| SCR-070 | Project handover |
| SCR-088 | Workload |

### Release 6 · Billing (15 screens)

| Screen | Name |
|---|---|
| SCR-100 | Finance overview |
| SCR-101 | Invoices |
| SCR-102 | Invoice editor |
| SCR-103 | Invoice |
| SCR-104 | Record payment |
| SCR-105 | Credit note |
| SCR-106 | Client statement |
| SCR-107 | Payments and receipts |
| SCR-108 | Collections |
| SCR-186 | Numbering and document templates |
| SCR-198 | Finance settings |
| SCR-230 | Secret-link document |
| SCR-240 | Invoice / tax invoice PDF (with UPI QR) |
| SCR-241 | Credit note PDF |
| SCR-242 | Payment receipt PDF |

### Release 7 · Websites and hosting (9 screens)

| Screen | Name |
|---|---|
| SCR-090 | Digital assets |
| SCR-091 | Asset |
| SCR-093 | Servers |
| SCR-094 | Expiry monitor |
| SCR-095 | Asset handover |
| SCR-096 | Technical dossiers |
| SCR-097 | Provider accounts |
| SCR-099 | Correct expiry date |
| SCR-248 | Handover document PDF |

### Release 8 · Services sold and renewals (8 screens)

| Screen | Name |
|---|---|
| SCR-050 | Services sold |
| SCR-051 | Service sold |
| SCR-052 | Agreements |
| SCR-053 | Renewals board |
| SCR-054 | AMC and free maintenance |
| SCR-057 | Subscriptions and products sold |
| SCR-098 | Confirm renewal |
| SCR-244 | Agreement PDF |

### Release 9 · Dashboards, messages and automations (8 screens)

| Screen | Name |
|---|---|
| SCR-020 | Founder dashboard |
| SCR-021 | My day (employee dashboard) |
| SCR-022 | Manager dashboard |
| SCR-170 | Automations |
| SCR-172 | Run history |
| SCR-187 | Messaging |
| SCR-250 | Email layout and templates (invoice, reminder, renewal notice, daily summary, login code, broadcast) |
| SCR-251 | WhatsApp message templates |

### Release 10 · Delivery extras (9 screens)

| Screen | Name |
|---|---|
| SCR-055 | Change requests |
| SCR-056 | Client inputs |
| SCR-063 | Content calendar |
| SCR-064 | Post editor |
| SCR-065 | Support inbox |
| SCR-066 | Support request |
| SCR-069 | Case studies and portfolio |
| SCR-042 | Testimonials |
| SCR-233 | Testimonial form |

### Release 11 · Sales and growth (8 screens)

| Screen | Name |
|---|---|
| SCR-037 | Proposals |
| SCR-038 | Proposal builder |
| SCR-040 | Campaigns |
| SCR-041 | Broadcasts |
| SCR-232 | Unsubscribe and preferences |
| SCR-234 | Enquiry and careers forms |
| SCR-243 | Proposal PDF |
| SCR-113 | Ad spend rebilling |

### Release 12 · Complete HR (9 screens)

| Screen | Name |
|---|---|
| SCR-130 | Hiring openings |
| SCR-131 | Applicants |
| SCR-132 | Applicant |
| SCR-133 | Joining and leaving |
| SCR-134 | Letters |
| SCR-135 | Policies |
| SCR-136 | Company assets |
| SCR-137 | Goals and performance |
| SCR-246 | HR letters PDF |

### Release 13 · Payroll and spending (9 screens)

| Screen | Name |
|---|---|
| SCR-127 | Payroll run |
| SCR-128 | Salary structures and revisions |
| SCR-129 | Advances, bonuses and incentives |
| SCR-245 | Payslip PDF |
| SCR-114 | Payouts |
| SCR-109 | Vendors |
| SCR-110 | Vendor bills and payments |
| SCR-111 | Expenses and claims |
| SCR-112 | YTP's own subscriptions |

### Release 14 · Client portal (12 screens)

| Screen | Name |
|---|---|
| SCR-200 | Portal login |
| SCR-201 | Portal home |
| SCR-202 | Invoices and payments |
| SCR-203 | Services and renewals |
| SCR-204 | Projects and approvals |
| SCR-205 | Content approvals |
| SCR-206 | Support |
| SCR-207 | Inputs and uploads |
| SCR-208 | Proposals |
| SCR-210 | Contact settings |
| SCR-211 | Documents from YTP |
| SCR-212 | Company profile |

### Release 15 · Reports and LLP partners (10 screens)

| Screen | Name |
|---|---|
| SCR-160 | Reports home |
| SCR-161 | Report |
| SCR-067 | Client results |
| SCR-068 | Client reports |
| SCR-249 | Client report PDF |
| SCR-115 | LLP partners and shares |
| SCR-116 | Partner money |
| SCR-117 | Partner statement |
| SCR-118 | Partner financial dashboard |
| SCR-253 | Partner statement PDF |

### Release 16 · AI and integrations (11 screens)

| Screen | Name |
|---|---|
| SCR-173 | Ask Nexus |
| SCR-174 | AI usage and limits |
| SCR-256 | AI settings |
| SCR-257 | AI knowledge |
| SCR-258 | AI quality |
| SCR-255 | Voice assistant |
| SCR-259 | Client chatbot settings |
| SCR-260 | Live chat inbox |
| SCR-171 | Automation builder |
| SCR-188 | Integrations |
| SCR-189 | API keys and MCP |

### Release 17 · Academy: running it (9 screens)

| Screen | Name |
|---|---|
| SCR-150 | Courses |
| SCR-151 | Batches |
| SCR-152 | Admissions |
| SCR-153 | Students |
| SCR-154 | Session attendance |
| SCR-155 | Assessments |
| SCR-157 | Fees and instalments |
| SCR-158 | Academy dashboard |
| SCR-254 | Academy fee invoice and receipt PDF (YTA, 5 languages) |

### Release 18 · Academy: students and certificates (9 screens)

| Screen | Name |
|---|---|
| SCR-156 | Certificates |
| SCR-220 | Student login |
| SCR-221 | Student home |
| SCR-222 | My courses |
| SCR-223 | Fees |
| SCR-224 | Attendance and results |
| SCR-225 | Certificates |
| SCR-231 | Certificate check |
| SCR-247 | Certificate PDF with QR |
