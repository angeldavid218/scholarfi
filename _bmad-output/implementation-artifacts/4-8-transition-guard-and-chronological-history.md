# Story 4.8: Transition Guard and Chronological History

Status: review

## Completion Notes

- Enforced guarded transitions for teacher/admin actions with `INVALID_STATE_TRANSITION`.
- Invalid transitions do not mutate submission history.
- Submission history returned in chronological order by action timestamp and id.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/app/models/submission_validation.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
