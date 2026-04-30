# Story 3.2: Teacher Task Listing

Status: review

## Story

As a Teacher,
I want to view tasks I am responsible for,
so that I can manage and review my active workload.

## Acceptance Criteria

1. Given a teacher with tasks, when they request task list, then only institution-scoped tasks assigned to that teacher are returned.
2. Inactive/closed states are visible for management actions.

## Tasks / Subtasks

- [x] Add teacher task-list endpoint
- [x] Filter tasks by teacher ownership and institution scope
- [x] Return status field for management visibility
- [x] Add minimal tests (scope filtering + status visibility)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started with MVP-light test scope.
- Added `GET /api/v1/tasks` for teacher task listing.
- Listing is filtered by:
  - authenticated teacher ownership (`createdByTeacherId`)
  - authenticated institution scope (`institutionId`)
- Response includes task `status`, keeping inactive/closed visibility for management.
- Minimal tests added:
  - teacher sees only own institution-scoped tasks
  - status values (`active`, `closed`) are returned
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`22` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/3-2-teacher-task-listing.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/tasks_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_list_teacher.spec.ts`
