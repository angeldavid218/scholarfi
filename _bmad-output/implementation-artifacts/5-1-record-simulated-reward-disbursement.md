# Story 5.1: Record Simulated Reward Disbursement

Status: review

## Completion Notes

- On school admin approval, the backend now records a reward transaction in `reward_transactions`.
- Reward posting is executed atomically with submission status transition and validation audit insert.
- Approval response now includes `rewardTransactionId` to reflect posting in submission/ledger views.
- Minimal verification added in functional tests to assert transaction creation and posted amount.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/reward_transaction.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
