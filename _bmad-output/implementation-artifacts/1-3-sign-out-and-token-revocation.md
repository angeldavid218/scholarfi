# Story 1.3: Sign-Out and Token Revocation

Status: done

## Story

As an authenticated user,
I want to sign out,
so that my token can no longer access protected endpoints.

## Acceptance Criteria

1. Given a valid authenticated token, when the user calls `/api/v1/auth/logout`, then the token is revoked server-side.
2. Given a revoked token, when it is used on protected endpoints, then access is denied with standardized auth error (`error.code`, `requestId`).

## Tasks / Subtasks

- [x] Review existing logout/token revocation behavior
- [x] Standardize unauthorized error envelope for protected routes
- [x] Add functional test proving token revocation blocks subsequent access
- [x] Verify backend lint, typecheck, and tests

## Dev Notes

- Logout endpoint already exists in `AccessTokenController.destroy`.
- This story hardens behavior guarantees and adds test coverage for revocation.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Story started after moving from Story 1.2.
- Added standardized auth failure envelope in auth middleware:
  - `error.code = AUTH_REQUIRED`
  - `error.message = Authentication required`
  - `error.requestId` derived from request context
- Added `auth_logout.spec.ts` functional coverage:
  - login -> logout -> reuse same token on `/api/v1/account/profile` returns `401`
  - response includes standardized auth error fields
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`3` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/1-3-sign-out-and-token-revocation.md`
- `/Users/angelserrano/development/scholarfi-back/app/middleware/auth_middleware.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/auth_logout.spec.ts`
