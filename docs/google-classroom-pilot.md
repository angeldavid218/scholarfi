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
2. **Students** exist with the same email as Google Classroom (`/teacher/clases` CSV import works as interim roster)
3. **Teacher** connects at `/teacher/integraciones`
4. **Pilot course** in Classroom has assignments with `maxPoints` and graded `assignedGrade` values

## End-to-end flow

1. Teacher creates assignment in Google Classroom
2. Teacher imports it in ScholarFi with reward amount and minimum grade (absolute)
3. Students submit completion on ScholarFi (`/student/tareas`)
4. Teacher grades assignments in Classroom
5. Teacher clicks **Sincronizar** on the task in `/teacher`
6. Rewards are issued in ScholarFi completion order until teacher budget reaches zero

## Local mock mode

Set `GOOGLE_CLASSROOM_MOCK=true` in `scholarfi-back/.env` to exercise the flow without real Google credentials.

Mock grade fixtures apply to **any** imported task when mock mode is on. These ScholarFi student emails receive grades:

| Email | Grade | Result (min 6) |
|-------|-------|----------------|
| `demo.student1@scholarfi.test` | 8 | Rewarded (demo seed) |
| `demo.student2@scholarfi.test` | 5 | Skipped (below min) |
| `student-alpha@school.edu` | 8 | Rewarded |
| `student-beta@school.edu` | 5 | Skipped |
| `student-gamma@school.edu` | (none) | Skipped (ungraded) |
