# Story 1.5: Profile and Role Summary Endpoint

Status: done

## Story

As a signed-in user,
I want to fetch my profile and assigned roles,
so that the frontend can render role-aware navigation.

## Acceptance Criteria

1. Given an authenticated user, when they request `/api/v1/account/profile`, then the API returns profile data including role list and institution scope.
2. Response format follows the standard `{ data: ... }` envelope.

## Tasks / Subtasks

- [x] Review current profile endpoint payload
- [x] Add roles and institution scope to profile response
- [x] Add functional test coverage for profile payload shape
- [x] Verify backend lint, typecheck, and tests

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Updated `/api/v1/account/profile` payload to include:
  - profile summary fields
  - `institutionId` scope
  - `roles` list derived from `user_roles` + `roles`
- Profile response now returns explicit `{ data: ... }` envelope.
- Added functional spec `account_profile.spec.ts` validating:
  - authenticated profile fetch
  - role list population
  - institution scope presence
- Verification:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed (`7` tests)

### File List

- `/Users/angelserrano/development/scholarfi/_bmad-output/implementation-artifacts/1-5-profile-and-role-summary-endpoint.md`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/profile_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/account_profile.spec.ts`
