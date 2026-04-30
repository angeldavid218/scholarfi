# Story 2.1: Create Institution with Unique Code

Status: review

## Story

As a Super Admin,
I want to create an institution with a unique code,
so that each tenant has a distinct operational identity.

## Acceptance Criteria

1. Given a Super Admin session, when they submit institution name and code, then a new institution is created in inactive/controlled state.
2. Duplicate codes are rejected with actionable error details in the standard error envelope fields.

## Tasks / Subtasks

- [x] Add institution create endpoint and validation
- [x] Enforce `super_admin` role for create action
- [x] Return standard success/error envelope
- [x] Add functional tests for success and duplicate-code rejection
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Added `POST /api/v1/institutions` endpoint with `super_admin` role enforcement.
- New institutions are created with controlled/inactive status (`draft`).
- Duplicate institution codes now return `409` standard envelope:
  - `error.code = INSTITUTION_CODE_TAKEN`
  - `error.message = Institution code already exists`
  - `error.details` includes conflicting field/value
  - `error.requestId` included
- Added functional test coverage for:
  - successful institution creation by super admin
  - duplicate code rejection envelope
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`11` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/2-1-create-institution-with-unique-code.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/institutions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/validators/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/institution.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/institutions_create.spec.ts`
