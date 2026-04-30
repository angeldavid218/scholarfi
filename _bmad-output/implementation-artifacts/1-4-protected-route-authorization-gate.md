# Story 1.4: Protected Route Authorization Gate

Status: done

## Story

As the system,
I want protected API routes guarded by authentication and role checks,
so that only permitted users can access sensitive operations.

## Acceptance Criteria

1. Given a protected endpoint with role requirements, when a request lacks auth or required role, then access is denied with standardized `error.code` and `requestId`.
2. Given a protected endpoint with role requirements, when a request is authenticated and role-authorized, then the request proceeds to controller logic.

## Tasks / Subtasks

- [x] Add role guard middleware for protected endpoints
- [x] Apply role guard to a real protected endpoint
- [x] Add functional tests for unauthenticated, forbidden-role, and authorized flows
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Added `role` middleware and role-lookup guard using `roles` + `user_roles`.
- Applied role guard to `/api/v1/account/profile` with allowed roles:
  - `super_admin`, `school_admin`, `teacher`, `student`
- Standardized forbidden envelope for missing role:
  - `error.code = FORBIDDEN_ROLE`
  - `error.message = Insufficient role permissions`
  - `error.requestId` from request context
- Added functional tests covering:
  - unauthenticated request -> `401 AUTH_REQUIRED`
  - authenticated without role -> `403 FORBIDDEN_ROLE`
  - authenticated with valid role -> `200` and controller response
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`6` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/1-4-protected-route-authorization-gate.md`
- `/Users/angelserrano/development/scholarfi-back/app/middleware/role_guard_middleware.ts`
- `/Users/angelserrano/development/scholarfi-back/start/kernel.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/auth_authorization_gate.spec.ts`
