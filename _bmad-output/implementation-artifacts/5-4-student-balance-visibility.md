# Story 5.4: Student Balance Visibility

Status: review

## Completion Notes

- Added student balance endpoint: `GET /api/v1/rewards/balance`.
- Returns institution-scoped simulated balance with explicit `simulatedBalance` field.
- Route is role-guarded to `student` and respects tenant scope middleware.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/rewards_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/rewards.spec.ts`
