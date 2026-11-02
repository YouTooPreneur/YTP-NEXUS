# Batch 9 · Academy: screen specs

Step 1.6, batch 9 of 9 (the last). **18 screens**, built in step 3.10 (Academy), plus a phone page. Status: **built.** All 9 batches are now ready for the owner's single approval (D-153); comments welcome any time.

- **Clickable preview:** `docs/design/mockups/index.html` (batch 9 section). The side menu's **Academy** now opens its screens, with a section menu (dashboard, courses, batches, admissions, students, assessments, certificates, fees). The student portal has its own menu.
- **Built without a question round** (owner, "do all remaining batches"). The owner answered the open points afterwards (round 43, D-172 to D-174); the screens follow those answers.
- **The Academy is shown running** with sample students, as it would look after step 3.10 (with earlier records imported, ACD-014). Numbering and templates still shows "none yet" for the YTA series because the Academy has not started.
- **Sample data only.** Today is Thursday 1 October 2026.

## Sample Academy, kept the same on every screen

| Course | Mode · length · fee | Batches |
|---|---|---|
| **Digital Marketing Mastery** | Mixed (Mon and Wed online 19:00, Sat classroom 10:00) · 12 weeks, 36 sessions · ₹35,000 in full or ₹12,000 × 3 · trainers Nandhini K (lead) and Karthik (weeks 4 to 6) | **DMM-Oct26** starts Mon 5 Oct, 18 of 25 seats · **DMM-Jul26** finished 26 Sep, 16 students, 14 certificates |
| **WordPress Website Building** | Classroom, Adyar (Tue, Thu 18:30, Sat 10:00) · 6 weeks, 18 sessions · ₹18,000 · Arun | **WP-Sep26** 12 of 15, session 11 today |
| **Instagram Reels for Business** | Recorded, 12 lessons in Bunny Stream · ₹4,999 · Rahul | 64 enrolled |
| **AI for Small Business** | Online live · 4 weeks · ₹9,999 | **AI-Nov26** starts 3 Nov, 8 of 20 |

- **Students in the examples:** Harini S (DMM-Oct26, instalment 1 YTA/26-27/0031 paid 28 Sep, next ₹12,000 on 5 Nov; finished Reels with certificate YTA-C/2026/0009), Keerthana R (DMM-Jul26, certificate YTA-C/2026/0018), Mohammed Arif, Sathish Kumar (attendance 60%) and Gokul R (70%) in WP-Sep26, Rakesh M (admission form filled today), Anitha R (enquiry from the chatbot, call at 16:30).
- **Money:** collected in September ₹3,46,989; to collect ₹53,997 (5 students, due 5 and 20 Oct); instalments on 5 Nov ₹1,44,000. Academy fees use the YTA series; the revenue report counts them only in the whole-company profit after salaries.

## Shared parts added in this batch

| Part | What it does |
|---|---|
| **Section menu: Academy** | Dashboard, courses, batches, admissions, students, assessments, certificates, fees. |
| **Student portal frame** | The portal frame from batch 8 with "YouTooPreneur Academy · Student portal" and the student's menu (Home, My courses, Fees, Attendance and results, Certificates). |
| **Session strip** | A numbered box per session: done (green), today (amber edge), to come (grey). |
| **Attendance dots** | Small squares per session (present green, absent red); below 75% shows in red. |
| **Certificate** | A framed page with the name, course, batch, grade, two signatures, the number and a QR code that opens the public check page. |

---

## Academy (staff)

### SCR-158 · Academy dashboard

- **Preview:** `academy.html`
- **Numbers:** admissions this month, seats filled in open batches, fees collected, fees to collect, attendance. **Batches** with seats, fees collected, attendance and status; **next sessions**; ✦ what is worth doing today.
- **Requirements:** ACD-013, ACD-012, AI-009.

### SCR-150 · Courses

- **Preview:** `courses.html`
- **List and editor:** mode, length and weekly rhythm, level, syllabus by week, recordings in Bunny Stream (only students of the batch, open 12 months after the course ends, no downloads; D-174), materials, **fee in full or instalments, set per course, the student chooses, no late fees (D-173)**, trainers chosen from Team, the certificate rule. ✦ draft a syllabus.
- **Requirements:** ACD-001, ACD-004, ACD-005, ACD-009.

### SCR-151 · Batches

- **Preview:** `batches.html` (WP-Sep26)
- **Batch:** days, place, trainer, seats; the 18 sessions (all on the calendar); students with attendance for the last sessions, the total and the first assignment; today's session with the class reminder; students who need a word. Online batches get a meeting link per session.
- **Requirements:** ACD-002, ACD-006, ACD-011.

### SCR-152 · Admissions

- **Preview:** `admissions.html`
- **Enquiry → called → form sent → admitted** (enquiries are CRM leads for an Academy course, from the website form, the chatbot, Instagram or a walk-in). **The admission form** the student fills: details, **Aadhaar last 4 digits only**, the fee plan they choose, reminders and consent. **Admit** makes the student record and the first YTA invoice.
- **Requirements:** ACD-003, ACD-012, ACD-005, CRM-026.

### SCR-153 · Students

- **Preview:** `students.html`
- **List** with batch, fee, attendance, result and certificate, and filters (fee due, attendance below 75%). **Student detail** (Harini S): courses, fees with YTA invoices and the coming instalments, results, certificates, documents, her portal.
- **Requirements:** ACD-003, ACD-005 to ACD-010.

### SCR-154 · Session attendance

- **Preview:** `phone-academy.html`
- **On the trainer's phone:** present, late or absent for each student (everyone starts as present), the counts, save.
- **Requirements:** ACD-006.

### SCR-155 · Assessments

- **Preview:** `assessments.html` (WP-Sep26 · Assignment 1)
- **Marks out of 20** with a short note per student, who has not handed in, the rubric and the weight; ✦ drafts the notes; **publish** shows the results in each student's portal.
- **Requirements:** ACD-007, AI-009.

### SCR-156 · Certificates and SCR-247 · Certificate PDF

- **Preview:** `certificates.html`, `docs-pdf.html#certificate`
- **The course rule** (attendance 75% or more and the final project passed); who qualifies; certificates numbered in the YTA-C series, sent by email and WhatsApp; the reason a student is "not yet"; **Ask to cancel** needs a written reason and the Owner's approval (a "Certificate cancel" request in Approvals); only after approval does the check page say "not valid" (choice 89, 22 Oct).
- **Requirements:** ACD-008.

### SCR-157 · Fees and instalments and SCR-254 · Academy fee invoice and receipt

- **Preview:** `academy-fees.html`, `docs-pdf.html#yta` (shown in Tamil; also English. Hindi, Malayalam and Telugu are built and offered once a native speaker has checked them, choice 11, 22 Oct)
- **Dues** with their YTA invoices, reminders and status; **fee plans**; **what is coming in**. An instalment invoice is made 7 days before its date; reminders 3 days before, on the day and 3 days after; no late fees. Paid by UPI QR, Razorpay or cash with a receipt.
- **Requirements:** ACD-005, ACD-011, FIN-024.

## Student portal and public page

### SCR-220 · Student login

- **Preview:** `student-login.html`
- **A one-time code** by WhatsApp (the number given at admission) or email; each student sees only their own classes and fees.
- **Requirements:** CORE-007, ACD-010, NFR-022.

### SCR-221 · Student home to SCR-225 · Certificates

- **Preview:** `student-home.html`, `student-courses.html`, `student-fees.html`, `student-results.html`, `student-certificates.html`, `phone-academy.html`
- **Home:** next class (the join link opens 10 minutes before), next fee, attendance, certificates, announcements, videos to watch before the course.
- **My courses:** schedule by week, materials, recordings (only for the batch) of every class, the online classes and the Saturday classroom workshops, added the same night so absent students can catch up (choice 91, 22 Oct), a finished recorded course to watch again.
- **Fees:** the plan, each instalment with its invoice or the date its invoice comes, receipts; pay by UPI QR or online.
- **Attendance and results:** attendance against the 75% needed, assessments to come, results with the trainer's note.
- **Certificates:** download, share link, the check page; what the running course needs before its certificate.
- **Requirements:** ACD-005 to ACD-011.

### SCR-231 · Certificate check

- **Preview:** `certificate-check.html`, `phone-academy.html`
- **Public, no login:** type the number or scan the QR; "genuine" with only what is printed on the certificate; a cancelled one (after the Owner approved the cancel, choice 89, 22 Oct) shows as not valid with the date.
- **Requirements:** ACD-008.

---

## Owner's answers (round 43, 6 Oct 2026)

1. **Certificate rule:** set per course; new courses start with attendance 75% or more and the final project passed; recorded courses use all lessons watched and the quiz passed (D-172).
2. **Instalments:** set per course (number, amounts, dates; an extra for paying in parts is optional); no late fees, reminders only (D-173).
3. **Recordings:** open 12 months after the course ends, a setting per course (D-174). Classroom sessions (the Saturday workshops) are recorded too, not only online classes (choice 91, 22 Oct).
4. **Trainer name:** keep the sample "Nandhini K" until the real trainer joins.

## Review notes

| # | Screen | Change asked | By | Done |
|---|---|---|---|---|
| | | | | |
