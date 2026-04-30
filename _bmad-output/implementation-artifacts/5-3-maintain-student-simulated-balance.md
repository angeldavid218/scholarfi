# Story 5.3: Maintain Student Simulated Balance

Status: review

## Completion Notes

- Added simulated balance model and update flow during reward posting.
- On successful reward transaction, student balance increments in same transaction boundary.
- Balance updates are institution-scoped via `(institution_id, student_id)` upsert key.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/models/simulated_balance.ts`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/controllers/rewards_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/rewards.spec.ts`
