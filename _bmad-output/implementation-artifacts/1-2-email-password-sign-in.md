# Story 1.2: Email Password Sign-In

Status: done

## Story

As a platform user,
I want to sign in with my email and password,
so that I can access my role-specific workspace.

## Acceptance Criteria

1. Given a registered active user with valid credentials, when they submit login on `/api/v1/auth/login`, then the API returns a valid auth token and user identity payload.
2. Given invalid credentials, when login fails, then the API returns a standardized error envelope with `error.code`, `error.message`, and `requestId` without leaking credential details.

## Tasks / Subtasks

- [x] Review current login endpoint behavior
- [x] Implement standardized failed-login error envelope
- [x] Add functional tests for valid/invalid login paths
- [x] Verify lint, typecheck, and tests pass for backend

## Dev Notes

- Existing login endpoint is in `scholarfi-back/app/controllers/access_token_controller.ts`.
- Keep endpoint path unchanged: `/api/v1/auth/login`.
- Preserve existing token issuance behavior for successful auth.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started after Story 1.1 completion.
- Login controller now returns standardized 401 envelope for invalid credentials:
  - `error.code = INVALID_CREDENTIALS`
  - `error.message = Invalid email or password`
  - `error.requestId` included from request context
- Added functional coverage for:
  - successful login payload (token + user identity)
  - failed login standardized envelope
- Verification completed in backend:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`2` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/1-2-email-password-sign-in.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/access_token_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/auth_login.spec.ts`
