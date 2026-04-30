# Story 3.5: Submission Eligibility Enforcement

Status: review

## Story

As the system,
I want to enforce task eligibility before accepting submissions,
so that workflow integrity is preserved.

## Dev Agent Record

### Completion Notes List

- Added `POST /api/v1/submissions` (student-only) with task eligibility validation.
- Ineligible task submissions now return standardized workflow error:
  - `error.code = TASK_NOT_ELIGIBLE_FOR_SUBMISSION`
- Verified no submission row is created when task is ineligible.
- Minimal coverage included in `tasks_close_submission_eligibility.spec.ts`.

### File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/submission.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/task.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_close_submission_eligibility.spec.ts`
