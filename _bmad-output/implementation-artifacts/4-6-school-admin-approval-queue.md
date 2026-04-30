# Story 4.6: School Admin Approval Queue

Status: review

## Completion Notes

- Added school admin queue endpoint: `GET /api/v1/submissions/admin-queue`.
- Queue is institution-scoped and lists only `validated` submissions.
- Payload includes decision context metadata for admin action.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
