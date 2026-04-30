# ScholarFi frontend — light backlog (happy paths)

Goal: **role-by-role happy paths** work end-to-end against `/api/v1` with minimal ceremony. No full epic/story machine—tick items off here or in your issue tracker.

Legend: **P0** = blocks a credible demo; **P1** = polish / stretch.

---

## Cross-cutting

| ID | Pri | Item | Status |
|----|-----|------|--------|
| X1 | P1 | Centralize user-visible API errors (map `error.code` → short Spanish copy; optional toast) | Done |
| X2 | P1 | Respect `prefers-reduced-motion` on any new transitions | Done |
| X3 | P1 | Align status strings with `src/i18n/es.ts` where UI duplicates backend labels | Done |

---

## Auth & shell

| ID | Pri | Item | Endpoints | Status |
|----|-----|------|-----------|--------|
| A1 | P0 | Login, session, logout | `POST /auth/login`, `POST /auth/logout`, `GET /account/profile` | Done |
| A2 | P0 | Role gates + nav | (client only) | Done |

---

## Student (happy path: task → submit → follow status → balance)

| ID | Pri | Item | Endpoints | Status |
|----|-----|------|-----------|--------|
| S1 | P0 | See simulated balance | `GET /rewards/balance` | Done |
| S2 | P0 | List active tasks, submit evidence | `GET /tasks/available`, `POST /submissions` | Done |
| S3 | P0 | Open submission detail + history | `GET /submissions/:id` | Done |
| S4 | P1 | “My submissions” list | `GET /submissions` | Done |

---

## Teacher (happy path: create task → see queue with evidence → validate/reject)

| ID | Pri | Item | Endpoints | Status |
|----|-----|------|-----------|--------|
| T1 | P0 | Create / list / close tasks | `POST /tasks`, `GET /tasks`, `PATCH /tasks/:id/close` | Done |
| T2 | P0 | Validation queue shows **evidence** before action | `GET /submissions/teacher-queue` (includes `evidenceText` / `evidenceUrl`) | Done |
| T3 | P0 | Validate / reject with reason | `PATCH /submissions/:id/teacher-action`, `PATCH /submissions/:id/teacher-reject` | Done |

---

## School admin (happy path: approve/reject validated + provision users + rewards view)

| ID | Pri | Item | Endpoints | Status |
|----|-----|------|-----------|--------|
| M1 | P0 | Admin queue shows **evidence** before decision | `GET /submissions/admin-queue` | Done |
| M2 | P0 | Approve / reject | `PATCH /submissions/:id/admin-decision` | Done |
| M3 | P0 | Provision user, assign role, link teacher–student | `POST /institutions/users`, `PATCH /institutions/users/:id/role`, `POST /institutions/teacher-students` | Done |
| M4 | P0 | Reward history refresh | `GET /rewards/history` | Done |

---

## Super admin (happy path: institution → activate → bootstrap admin)

| ID | Pri | Item | Endpoints | Status |
|----|-----|------|-----------|--------|
| U1 | P0 | Create institution, set status, bootstrap school admin | `POST /institutions`, `PATCH /institutions/:id/status`, `POST /institutions/:id/bootstrap-school-admin` | Done |
| U2 | P1 | List institutions | `GET /institutions` | Done |

---

## Demo / marketing page

| ID | Pri | Item | Status |
|----|-----|------|--------|
| D1 | P1 | Restyle `/demo` with same tokens as app, or mark as “legacy sandbox” | Done |

---

## How to use this doc

1. Pick a **P0** row in the role you’re demoing.
2. If **Status** is Todo, either implement it or split into a GitHub issue with the **Endpoints** column copied in.
3. When an item ships, flip **Done** here (or delete the row—keep it lightweight).

Last updated: 2026-04-30
