# Story 5.5: Admin Reward History View

Status: review

## Completion Notes

- Added admin reward history endpoint: `GET /api/v1/rewards/history`.
- History includes amount, submission linkage, student, status/type, and timestamps.
- Results are institution-scoped and role-guarded to `school_admin`.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/rewards_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/rewards.spec.ts`
