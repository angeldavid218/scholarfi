# Story 3.4: Task Closure

Status: review

## Story

As a Teacher,
I want to close a task when appropriate,
so that no new submissions are accepted afterward.

## Dev Agent Record

### Completion Notes List

- Added `PATCH /api/v1/tasks/:id/close` (teacher-only).
- Enforces teacher ownership + institution scope before closure.
- Updates task status to `closed`.
- Covered with closure path in `tasks_close_submission_eligibility.spec.ts`.

### File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/tasks_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_close_submission_eligibility.spec.ts`
