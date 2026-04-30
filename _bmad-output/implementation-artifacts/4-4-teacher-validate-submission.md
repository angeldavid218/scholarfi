# Story 4.4: Teacher Validate Submission

Status: review

## Completion Notes

- Added teacher action endpoint: `PATCH /api/v1/submissions/:id/teacher-action`.
- Teacher `validate` transition moves status `pending -> validated`.
- Recorded actor/timestamp/action in `submission_validations`.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/submission_validation.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/task.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
