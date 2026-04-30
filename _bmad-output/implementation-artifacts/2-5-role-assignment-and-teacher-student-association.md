# Story 2.5: Role Assignment and Teacher Student Association

Status: review

## Story

As a School Admin,
I want to assign roles and optional teacher-student associations,
so that accountability and workflow context are configured.

## Acceptance Criteria

1. Given institution users exist, when role assignment or association is updated, then relationship records are saved with institution scope.
2. Associated users appear correctly in task/submission context.

## Tasks / Subtasks

- [x] Add role assignment endpoint for school admins
- [x] Add teacher-student association endpoint scoped to institution
- [x] Enforce in-tenant validation for affected users
- [x] Add minimal tests (happy path + out-of-scope guard)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started with MVP-light testing.
- Added role assignment endpoint: `PATCH /api/v1/institutions/users/:userId/role` (school-admin only).
- MVP behavior note: role assignment currently uses replace-all semantics for the target user (single effective role after assignment), by explicit product direction.
- Added teacher-student association endpoint: `POST /api/v1/institutions/teacher-students` (school-admin only).
- Enforced institution-scope checks on role assignment and association updates (`TENANT_SCOPE_VIOLATION` on cross-tenant attempts).
- Association records are upserted in `teacher_students` with institution scope.
- Minimal tests added:
  - happy path role assignment + teacher-student association
  - cross-tenant role assignment rejection
- Validation:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`19` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/2-5-role-assignment-and-teacher-student-association.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/institutions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/institutions_role_association.spec.ts`
