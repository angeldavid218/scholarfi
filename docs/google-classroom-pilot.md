# Google Classroom pilot checklist

Use this list before testing the connector in a real school environment.

## GCP and backend

Follow [scholarfi-back/docs/google-classroom-setup.md](../../scholarfi-back/docs/google-classroom-setup.md):

- Classroom API enabled
- Internal OAuth consent (Workspace domain)
- Web OAuth client with redirect URI pointing at your API
- `GOOGLE_*`, `INTEGRATION_TOKEN_ENCRYPTION_KEY`, `FRONTEND_URL`, `CORS_ORIGIN` in `scholarfi-back/.env`

## ScholarFi data

1. **Admin** allocates teacher budget at `/admin/presupuesto-docentes`
2. **Students** exist with the same email as Google Classroom mock grades (see table below)
3. **Teacher** connects at `/teacher/integraciones`
4. **Pilot course** in Classroom has assignments with `maxPoints` and graded `assignedGrade` values

### Mock roster CSV

With `GOOGLE_CLASSROOM_MOCK=true`, import the demo roster at `/teacher/clases`:

**File:** [scholarfi-back/fixtures/demo_classroom_roster.csv](../../scholarfi-back/fixtures/demo_classroom_roster.csv)

Columns: `student_email`, `student_name`, `subject`, `section`, `class_name`

After `node ace demo:reset`, all five students below are already seeded. You can still import the CSV to verify the roster flow or refresh classroom-aligned groups (`Matematicas 3A`, `Ciencias 3A`).

| Email | Password | Mock grade (min 6) |
|-------|----------|-------------------|
| `demo.student1@scholarfi.test` | `DemoPass123!` | 8 — rewarded |
| `demo.student2@scholarfi.test` | `DemoPass123!` | 5 — skipped (below min) |
| `student-alpha@school.edu` | `DemoPass123!` | 8 — rewarded |
| `student-beta@school.edu` | `DemoPass123!` | 5 — skipped |
| `student-gamma@school.edu` | `DemoPass123!` | (none) — skipped (ungraded) |

## End-to-end flow

1. Teacher creates assignment in Google Classroom
2. Teacher imports it in ScholarFi with reward amount and minimum grade (absolute)
3. Students in the linked class roster are enrolled (CSV import or demo seed). ScholarFi creates pending submissions for them automatically.
4. Optional: students can also submit their own evidence on ScholarFi (`/student/tareas`)
5. Teacher grades assignments in Classroom (mock mode uses fixture grades)
6. Teacher clicks **Sincronizar** on the task in `/teacher`
7. Rewards are issued in ScholarFi completion order until teacher budget reaches zero

## Local mock mode

Set `GOOGLE_CLASSROOM_MOCK=true` in `scholarfi-back/.env` to exercise the flow without real Google credentials.

Mock grade fixtures apply to **any** imported task when mock mode is on. Student emails and grades are defined in `scholarfi-back/fixtures/demo_students.ts` (single source of truth for seed + Classroom mock sync).
