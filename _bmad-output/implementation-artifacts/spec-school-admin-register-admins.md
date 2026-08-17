---
title: 'School admins can register school admins'
type: 'feature'
created: '2026-07-30'
status: 'done'
baseline_commit: 'e13ad46924fa36ed682df14164ad5463e0f8b8ee'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** School admins can reassign an existing user to `school_admin`, but cannot create a new school admin from the institutional "Alta de usuario" form. The create API only accepts `teacher` | `student`.

**Approach:** Allow `school_admin` on `POST /institutions/users` (validator + role label handling) and add that option to AdminHome's create-user role select, matching the existing reassignment UI.

## Boundaries & Constraints

**Always:**
- Tenant-scoped: created user belongs to the acting school admin's institution.
- Only active institutions may provision users (existing `INSTITUTION_INACTIVE` guard).
- Creating `school_admin` does not create a student wallet.
- Role create path uses the same label map pattern as role assignment (`School Admin`).

**Ask First:**
- Restricting who may create school admins beyond the existing school_admin route gate.
- Changing replace-all role assignment semantics.

**Never:**
- Super-admin / NGO bootstrap flows.
- Frontend-only change without backend validator update.
- Multi-role assignment on create.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Active institution school admin POSTs user with `role: school_admin` | 200; user created in tenant with `school_admin` role; no wallet row | N/A |
| Alta UI | Admin selects "Admin escolar" and submits valid form | Success message; roster refresh shows new admin | Show API error message on failure |
| Invalid role rejected (regression) | POST with unknown role | 422 validation error | Vine field error |
| Inactive institution | School admin of inactive institution | 403 `INSTITUTION_INACTIVE` | Existing behavior |
| Email taken | Duplicate email | 409 `EMAIL_TAKEN` | Existing behavior |

</frozen-after-approval>

## Code Map

- `scholarfi-back/app/validators/institution.ts` -- `provisionInstitutionUserValidator.role` enum (currently teacher/student only)
- `scholarfi-back/app/controllers/institutions_controller.ts` -- `provisionUser`; role insert label ternary must include school_admin
- `scholarfi-back/tests/functional/institutions_provision_users.spec.ts` -- provision happy-path / inactive / list tests
- `scholarfi/src/pages/admin/AdminHome.tsx` -- Alta de usuario role state + select (reassign already has school_admin)

## Tasks & Acceptance

**Execution:**
- [x] `scholarfi-back/app/validators/institution.ts` -- Add `school_admin` to provision role enum -- unblock API accept
- [x] `scholarfi-back/app/controllers/institutions_controller.ts` -- Replace Teacher/Student ternary with label map including `school_admin` -- correct role seed label
- [x] `scholarfi-back/tests/functional/institutions_provision_users.spec.ts` -- Add case: school admin provisions another school_admin in active institution -- cover new path
- [x] `scholarfi/src/pages/admin/AdminHome.tsx` -- Widen create-role type/state and add "Admin escolar" option to Alta select -- surface capability in UI

**Acceptance Criteria:**
- Given an active-institution school admin session, when they create a user with role Admin escolar from AdminHome, then the user is created with `school_admin` and appears in the institution roster.
- Given the same session, when they still create teacher/student users, then existing behavior is unchanged (including student wallet when crypto wallets are enabled).
- Given `role: school_admin` on POST, when the role row must be inserted, then its label is `School Admin`.

## Spec Change Log

## Verification

**Commands:**
- `cd scholarfi-back && node ace test --files=tests/functional/institutions_provision_users.spec.ts` -- expected: all tests pass including new school_admin provision case
- Manual: AdminHome Alta form shows Estudiante / Docente / Admin escolar; creating Admin escolar succeeds and roster shows "Admin escolar"

## Suggested Review Order

**API accept path**

- Entry point: provision validator now accepts `school_admin` like assign.
  [`institution.ts:26`](../../../scholarfi-back/app/validators/institution.ts#L26)

- Label seed for first-time role insert matches assign path.
  [`institutions_controller.ts:378`](../../../scholarfi-back/app/controllers/institutions_controller.ts#L378)

**Admin UI**

- Alta de usuario role union includes school admin.
  [`AdminHome.tsx:58`](../../src/pages/admin/AdminHome.tsx#L58)

- Create form exposes Admin escolar beside student/teacher.
  [`AdminHome.tsx:273`](../../src/pages/admin/AdminHome.tsx#L273)

**Tests**

- Happy path: peer school admin, no wallet, label `School Admin`.
  [`institutions_provision_users.spec.ts:126`](../../../scholarfi-back/tests/functional/institutions_provision_users.spec.ts#L126)
