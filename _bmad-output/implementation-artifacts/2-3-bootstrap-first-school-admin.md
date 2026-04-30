# Story 2.3: Bootstrap First School Admin

Status: review

## Story

As a Super Admin,
I want to create the first School Admin for a new institution,
so that tenant-local administration can begin.

## Acceptance Criteria

1. Given a valid institution, when Super Admin creates the initial school admin user, then the user is assigned `school_admin` role within that institution.
2. Account credentials follow security defaults.

## Tasks / Subtasks

- [x] Add bootstrap school-admin endpoint for super admins
- [x] Create school-admin user scoped to institution and assign `school_admin` role
- [x] Keep credentials aligned with security defaults (hashed password via existing user model behavior)
- [x] Add minimal functional coverage (success + role protection)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started with MVP-minimal testing.
- Added `POST /api/v1/institutions/:id/bootstrap-school-admin` (super-admin only).
- Endpoint creates the first school admin user for the target institution and assigns `school_admin` role.
- Uses existing `User` model credential behavior (password hashing/security defaults).
- Added minimal tests for:
  - successful bootstrap by super admin
  - forbidden access for non-super-admin
- Validation:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`15` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/2-3-bootstrap-first-school-admin.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/institutions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/institutions_bootstrap_admin.spec.ts`
