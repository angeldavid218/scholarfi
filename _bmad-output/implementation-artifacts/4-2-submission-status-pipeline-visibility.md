# Story 4.2: Submission Status Pipeline Visibility

Status: review

## Completion Notes

- Added student submission detail endpoint: `GET /api/v1/submissions/:id`.
- Response now includes canonical Spanish pipeline label via `statusLabelEs`.
- Student detail exposes backend source-of-truth state and action history.

## File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/submissions_pipeline.spec.ts`
