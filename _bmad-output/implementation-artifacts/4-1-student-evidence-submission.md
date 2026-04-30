# Story 4.1: Student Evidence Submission

Status: review

## Story

As a Student,
I want to submit evidence text and optional link,
so that my work can enter the institutional approval pipeline.

## Tasks / Subtasks

- [x] Add student submission endpoint
- [x] Persist submission with initial workflow status
- [x] Add minimal happy-path coverage for valid evidence submission
- [x] Verify backend tests and move to review

## Dev Agent Record

### Completion Notes List

- Endpoint exists at `POST /api/v1/submissions` with eligibility and duplicate guards.
- Added ineligible-task rejection in prior story work and now confirmed valid evidence happy path.
- Submission response confirmed with initial workflow status `pending`.
- Quick validation: `npm run test` passed (`25` tests).

### File List

- `/Users/angelserrano/development/scholarfi-back/app/controllers/submissions_controller.ts`
- `/Users/angelserrano/development/scholarfi-back/start/routes.ts`
- `/Users/angelserrano/development/scholarfi-back/tests/functional/tasks_close_submission_eligibility.spec.ts`
