# Story 4.3: Teacher Validation Queue

Status: review

## Completion Notes

- Added teacher queue endpoint: `GET /api/v1/submissions/teacher-queue`.
- Queue returns institution-scoped, teacher-actionable `pending` submissions only.
- Included key metadata (`taskTitle`, `studentId`, timestamps, status labels).

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
