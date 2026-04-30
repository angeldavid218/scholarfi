# Story 4.7: School Admin Approve or Reject Validated Submission

Status: review

## Completion Notes

- Added admin decision endpoint: `PATCH /api/v1/submissions/:id/admin-decision`.
- Admin `approve` transitions `validated -> approved`.
- Admin `reject` transitions `validated -> rejected_by_admin` and requires reason.
- Admin actor and timestamp are persisted in validation history.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/task.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
