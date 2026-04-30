# Story 3.1: Teacher Creates Task

Status: review

## Story

As a Teacher,
I want to create a task with reward and due metadata,
so that students can submit evidence for measurable work.

## Acceptance Criteria

1. Given an authenticated teacher in active institution, when they submit title, description, reward amount, and optional due date, then task is created with teacher ownership and institution scope.
2. Response returns the created task in standard envelope.

## Tasks / Subtasks

- [x] Add teacher task-creation endpoint
- [x] Persist task with institution scope and teacher ownership
- [x] Enforce active-institution guard for teacher task creation
- [x] Add minimal tests (success + inactive institution guard)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started from Epic 3 kickoff.
- Added `POST /api/v1/tasks` (teacher only) for task creation.
- Task creation persists:
  - `institutionId` from authenticated teacher scope
  - `createdByTeacherId` from authenticated teacher
  - `title`, `description`, `rewardAmount`, optional `dueAt`
- Added active-institution guard (`INSTITUTION_INACTIVE`) and standard error envelope.
- Minimal tests added:
  - teacher creates task in active institution
  - task creation blocked when institution is inactive
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`21` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/3-1-teacher-creates-task.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/tasks_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/task.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/task.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_create.spec.ts`
