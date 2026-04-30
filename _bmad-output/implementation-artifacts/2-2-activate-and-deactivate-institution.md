# Story 2.2: Activate and Deactivate Institution

Status: review

## Story

As a Super Admin,
I want to activate or deactivate an institution,
so that school operations can be enabled or paused.

## Acceptance Criteria

1. Given an existing institution, when Super Admin toggles status, then institution status persists and is reflected in operational checks.
2. Inactive institutions block school-role mutation operations.

## Tasks / Subtasks

- [x] Add institution status toggle endpoint for super admins
- [x] Persist `active` / `inactive` institution status updates
- [x] Add minimal functional coverage (success + role denial)
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started with MVP-minimal testing approach.
- Added `PATCH /api/v1/institutions/:id/status` for super admins.
- Status update validator restricts values to `active` and `inactive`.
- Institution status updates persist and return standard `{ data: ... }` response payload.
- Added lightweight tests for:
  - super admin activate -> deactivate flow
  - non-super-admin forbidden role access
- Validation:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`13` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/2-2-activate-and-deactivate-institution.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/institutions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/institutions_status.spec.ts`
