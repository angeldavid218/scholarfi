# Pilot preflight checklist

Go / no-go list for one school, about two teachers, and about thirty students.

ScholarFi does not send invite emails and has no password reset. The lowest-friction path is: you create the school and the two teachers, each teacher connects Google Classroom, **Sincronizar estudiantes** creates the student accounts, and students only type their Classroom email plus one shared password.

Do not use CSV import for this pilot. New CSV rows are created as pending and inactive, so each student must also finish `/registro` with a matrícula. Manual “Alta de usuario” on `/admin` works, but it means typing every student by hand.

On-chain wallets are mandatory. The Solana Foundation and investor report is the mint ledger: each rewarded student needs a custodial wallet and a confirmed SPL transaction you can open on Solscan. `TOKEN_MODE=mock`, or `TOKEN_MODE=solana` with institution wallets off, writes a database balance and no signature.

The Classroom connector setup itself is in [scholarfi-back/docs/google-classroom-setup.md](../../scholarfi-back/docs/google-classroom-setup.md). [google-classroom-pilot.md](./google-classroom-pilot.md) is the local mock / judge sandbox, not this live-school list.

## Decide with the school before setup

Collect this in one message to the school contact:

- [ ] School name and a short unique code (institution `code` is globally unique).
- [ ] The two teachers’ names and the Google account email they use inside Classroom (not a personal alias).
- [ ] The pilot class already exists in Google Classroom, the teacher owns that course, assignments have `maxPoints`, and the roster shows a real email for every student.
- [ ] One assignment for day one: reward amount and minimum grade, as an absolute number such as 6, not a percent.
- [ ] How students will open the app (school lab URL, phones, or both) and one channel to send the login card (Classroom announcement or WhatsApp).
- [ ] An IT contact who can approve an internal OAuth app inside that school’s Google Workspace.

If the class is not in Google Classroom, stop and reschedule. There is no other low-friction onboarding path.

## OAuth

Internal OAuth only works for users inside the same Workspace as the GCP project. A developer-owned GCP project set to Internal will reject the school’s teachers.

Pick one:

- [ ] **Preferred:** school IT creates the GCP project inside their Workspace, consent screen **Internal**, Classroom API enabled, web client redirect `https://<api-host>/api/v1/integrations/google-classroom/callback`. Scopes from the Classroom setup doc, including `classroom.profile.emails`. Without that scope, roster sync has no emails and creates no students.
- [ ] **Fallback:** External consent in Testing, with only the two teacher emails as test users. Testing tokens expire in 7 days, so this is only safe for a pilot shorter than a week, and you must plan a reconnect.

- [ ] `CLASSROOM_STUDENT_DEFAULT_PASSWORD` is a phrase you can say out loud (8–32 characters), set **before the first sync**. Later changes do not update students already created. Default is `scholarfi-pass`.

## Platform go / no-go

Check these on the environment students will actually open (not localhost):

- [ ] Frontend URL loads over HTTPS. Backend is up. `FRONTEND_URL` and `CORS_ORIGIN` match that frontend. `GOOGLE_REDIRECT_URI` matches the OAuth client exactly.
- [ ] `GOOGLE_CLASSROOM_MOCK` is off.
- [ ] **Sincronizar** and **Sincronizar todo** run inside the API request. The nightly sweep is a Render cron: `node ace classroom:sync-all`. It does not need `queue:work`.
- [ ] Institution exists and status is **active**. New schools start as `draft`. Provisioning and Classroom import return `INSTITUTION_INACTIVE` until activation. Do this on `/super`.
- [ ] Credit pool is allocated on `/super` **before** anyone imports a task. Import fails if the pool cannot cover `rewardAmount`. Size it as students × reward × planned tasks, plus buffer. Example: 30 students, 10 credits, 3 tasks → at least 900, load 2,000.
- [ ] Teacher pools stay at zero unless you want a cap. If a teacher’s allocated credits are greater than zero, rewards come from that pool and stop at zero even if the school pool still has funds (`/admin/presupuesto-docentes`).
- [ ] You can log in as super admin and as the bootstrapped school admin.

## Solana proof (required for the report)

Both switches must be on. `isInstitutionOnChainExecution` is true only when `TOKEN_MODE=solana` **and** the institution’s `crypto_wallets_enabled` is true. Otherwise rewards use the mock ledger.

- [ ] Backend `TOKEN_MODE=solana`, with `SOLANA_RPC_URL`, `SCHOLARFI_TOKEN_MINT`, `MINT_AUTHORITY_SECRET`, `TREASURY_WALLET_PUBLIC_KEY`, and `WALLET_ENCRYPTION_KEY` set. The mint-authority wallet holds enough SOL for about 30 mints plus retries.
- [ ] Frontend build has `VITE_TOKEN_MODE=solana` and `VITE_SOLANA_CLUSTER` set to the same cluster as the RPC (devnet or mainnet). Without the frontend flag, **Bitácora de aprobación** (`/admin/bitacora-aprobacion`) hides the Solscan column.
- [ ] On `/super`, turn **crypto wallets on for this institution before the first student sync**. New Classroom students get a wallet at creation. Turning the flag on later backfills students who already exist, but the dress rehearsal should prove the flag was on first.
- [ ] Decide the cluster you will cite in the report and do not mix devnet and mainnet signatures.

The report you can export from the product today is that bitácora: student, credit amount, time, and `transactionSignature` when `provider` is `solana`. The same rows live in `token_transactions`. Wallet addresses are on `users.wallet_public_key`. There is no PDF or CSV export.

## Grades: what is stored, and what is not a report

There is no grade analytics screen, chart, or export.

Classroom sync writes each student’s grade onto the submission row (`submissions.external_grade`, `grade_checked_at`, `reward_skipped_reason` such as `grade_below_minimum` or `no_grade`). The task stores only the threshold and last-run counts (`tasks.sync_metadata`: `minGrade`, `lastSyncSummary` with `rewarded`, `skippedLowGrade`, `skippedNoGrade`, and the other skip counters). The same counts are in `classroom_sync_runs.result_json`. No API returns `external_grade`.

What the UI shows instead:

- After **Sincronizar**, the teacher sees one line: how many rewards were issued and how many submissions were skipped. It does not list names or grades. The task table does not show `lastSyncSummary`.
- **Ranking** (`/student/ranking`) and the school diploma preview rank students by confirmed mint credits, not by Classroom grade.
- **Bitácora de aprobación** is the on-chain credit ledger. It has no grade column.
- Public diploma metadata is built to omit grades.

For a grade table you query `submissions` joined to `users` and `tasks` (email, name, `external_grade`, `reward_skipped_reason`, task title). That query is not in the app.

## Accounts to create yourself

- [ ] On `/super`: create institution → set **active** → bootstrap one school admin (you, or a staff contact who will not be in the room).
- [ ] On `/admin` (“Alta de usuario”), create **only the two teachers** (`fullName`, Classroom email, password, role teacher). Hand each teacher their password directly.
- [ ] Do not pre-create the students. Classroom sync matches on email. A student created under a different email will not link, and a duplicate email returns a conflict. Emails are globally unique; a teacher who already exists in another school cannot be reused.

## Dress rehearsal (one day before)

Use a course that has you or one teacher plus one real or test student. Do not invite the class until this passes.

1. [ ] Teacher signs in at `/login`, opens **Google Classroom** (`/teacher/integraciones`), and completes Connect. They return to the app and see their courses. If consent fails, fix OAuth before the visit. Pop-up blockers matter on school browsers.
2. [ ] Import **one** coursework item with the day-one reward and minimum grade.
3. [ ] On `/teacher`, click **Sincronizar estudiantes**. The test student appears in **Mis clases** (`/teacher/clases`) and can log in with their Classroom email and the shared password. No matrícula, no `/registro`.
4. [ ] Grade that student in Classroom at or above the minimum. Click **Sincronizar** on the task (not only “Sincronizar todo”). Wait until the run finishes.
5. [ ] Student logs in and sees the credit balance on **Resumen** (`/student`).
6. [ ] Repeat sync once. The same grade must not pay twice.
7. [ ] The teacher budget or school pool decreased by exactly one reward.
8. [ ] On `/admin/bitacora-aprobacion`, that reward has a Solscan link. Open it and confirm the signature is on the cluster you will cite. A balance with no signature is a mock mint and does not go in the report.

If step 3 creates nobody, the roster has no email or the teacher connected the wrong Google account. If step 4 stays queued, the worker is down.

## What you hand the school

One card, same words for both teachers and the class:

- Address: the production `/login` URL.
- Teachers: the email and password you set. They connect Classroom once, import the one assignment, sync students, then sync again after they grade.
- Students: “Use the email from Google Classroom. Password is `…`. Open Resumen. You do not create an account.”
- Ask teachers to grade before the sync you will watch. Rewards are issued from Classroom grades in completion order until the budget hits zero. Students do not have to submit evidence for this path.

Tell teachers to ignore **Cola de validacion** (`/teacher/cola-validacion`) and tell students to ignore `/student/tareas`. Those screens work, but they are not in the sidebar. The Classroom path does not need them.

Students can change the shared password later from the header (**Cambiar contraseña**). Do not require it on day one. Anyone who knows a classmate’s email and the shared password can open that account, and you cannot email a reset. There is no admin password-reset screen. Plan to be in the room.

## Day-of order

1. [ ] Confirm worker, school pool balance, and both teacher logins before students arrive.
2. [ ] Teacher connects (skip if the dress-rehearsal connection is still valid).
3. [ ] **Sincronizar estudiantes** while you watch the roster count approach 30. Missing students are almost always a missing Classroom email. Add them in Classroom and sync again. Do not fall back to the admin form mid-class.
4. [ ] Students log in. You only need them to see Resumen. Session storage clears when the browser session ends, so a closed tab means logging in again. That is expected.
5. [ ] After grades exist, teacher clicks **Sincronizar** once. Confirm a few balances, then let the rest of the class refresh.
6. [ ] Stop when the pool is low. Say so out loud. Further syncs will not pay.

## Out of scope

- SAS attestations, diplomas, and the NGO dashboard. They are not the Foundation proof. The proof is the SPL mint on the bitácora.
- More than one assignment on day one.
- Student self-registration, CSV, and per-student passwords.
- Asking students to find `/student/tareas` or teachers to find the validation queue.
- A grade analytics dashboard. It does not exist yet. Do not promise investors a grade chart from the current UI.

## Abort conditions

Do not run the class session if any of these is true that morning:

- Teacher Connect does not return to the app.
- Dress-rehearsal student cannot log in, never received the test credit, or the bitácora row has no Solscan signature.
- Queue worker is not running.
- `TOKEN_MODE` is not `solana`, or this institution’s crypto wallets are off.
- School pool is below `30 × reward`.
- Institution is not `active`.
- You do not yet have the shared password that was set before the first student sync.
