# Story 1.6: Tenant Scope Enforcement

Status: done

## Story

As the system,
I want institution scope enforced for all school operations,
so that cross-tenant data access is prevented.

## Acceptance Criteria

1. Given a school-role user from institution A, when they request records from institution B, then the backend denies access.
2. Automated checks assert zero cross-tenant access across protected routes.

## Tasks / Subtasks

- [x] Add tenant scope middleware for protected routes
- [x] Apply tenant scope middleware to protected account route group
- [x] Add functional tests for cross-tenant denial and same-tenant allowance
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Added `tenantScope` middleware to enforce institution ownership for school-role users.
- Middleware checks scoped institution requested via query/body/params (`institution_id`/`institutionId`) and denies cross-tenant access.
- Standardized cross-tenant denial envelope:
  - `error.code = TENANT_SCOPE_VIOLATION`
  - `error.message = Cross-tenant access is not allowed`
  - `error.requestId` from request context
- Applied middleware to protected account route group in `start/routes.ts`.
- Added functional tests in `auth_tenant_scope.spec.ts`:
  - school-role user from institution A denied when requesting institution B
  - same user allowed when requesting institution A
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`9` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/1-6-tenant-scope-enforcement.md`
- `/Users/angelserrano/development/scholarfi-back/app/middleware/tenant_scope_middleware.ts`
- `/Users/angelserrano/development/scholarfi-back/start/kernel.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/auth_tenant_scope.spec.ts`
