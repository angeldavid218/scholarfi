# Story 4.5: Teacher Reject Submission with Reason

Status: review

## Completion Notes

- Added teacher reject endpoint: `PATCH /api/v1/submissions/:id/teacher-reject`.
- Reject requires reason and transitions status to `rejected_by_teacher`.
- Reject comment is persisted and returned in submission history.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/task.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
