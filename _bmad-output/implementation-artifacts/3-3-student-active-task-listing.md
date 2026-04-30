# Story 3.3: Student Active Task Listing

Status: review

## Story

As a Student,
I want to view active and eligible tasks,
so that I know what I can submit now.

## Dev Agent Record

### Completion Notes List

- Added `GET /api/v1/tasks/available` (student-only).
- Returns only active tasks in student institution scope.
- Excludes closed/ineligible and cross-tenant tasks.
- Minimal verification included in `tasks_list_student.spec.ts`.

### File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/tasks_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_list_student.spec.ts`
