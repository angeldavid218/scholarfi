# Story 2.4: Provision Teacher and Student Accounts

Status: review

## Story

As a School Admin,
I want to create teacher and student users in my institution,
so that academic workflows can run end to end.

## Acceptance Criteria

1. Given an active institution and school admin session, when user creation forms are submitted, then users are created tenant-scoped with requested role assignments.
2. Invalid inputs are rejected with field-level errors.

## Tasks / Subtasks

- [x] Add school-admin provisioning endpoint
- [x] Create tenant-scoped teacher/student user and assign requested role
- [x] Enforce active institution and school-admin role gates
- [x] Add minimal tests (happy path + role/inactive guard)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started with MVP-light test scope.
- Added `POST /api/v1/institutions/users` for school-admin provisioning.
- Endpoint creates teacher/student users scoped to the school admin's own institution and assigns requested role.
- Enforced institution-active guard (`INSTITUTION_INACTIVE`) and school-admin role requirement.
- Invalid input validation relies on Vine validators and returns field-level validation errors.
- Minimal tests added:
  - school admin can provision teacher in own active institution
  - school admin blocked when institution is inactive
- Validation:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`17` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/2-4-provision-teacher-and-student-accounts.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/institutions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/institutions_provision_users.spec.ts`
