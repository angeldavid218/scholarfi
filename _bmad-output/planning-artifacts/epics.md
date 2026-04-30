---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - /Users/angelserrano/development/scholarfi/_bmad-output/planning-artifacts/prd.md
  - /Users/angelserrano/development/scholarfi/_bmad-output/planning-artifacts/architecture.md
  - /Users/angelserrano/development/scholarfi/_bmad-output/planning-artifacts/ux-design-specification.md
---

# scholarfi - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for scholarfi, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A user can sign in with email and password.  
FR2: A signed-in user can sign out.  
FR3: A signed-in user can view their profile summary including assigned roles.  
FR4: The system can prevent access to authenticated areas when a user is not signed in.  
FR5: The system can restrict capabilities based on the user’s role(s).  
FR6: A Super Admin can create an institution with a unique institution code.  
FR7: A Super Admin can activate an institution to allow school operations.  
FR8: A Super Admin can deactivate an institution to block school operations.  
FR9: The system can prevent school operational actions when an institution is not active.  
FR10: The system can isolate institution data so users cannot access another institution’s records.  
FR11: A School Admin can create a user account for a teacher within their institution.  
FR12: A School Admin can create a user account for a student within their institution.  
FR13: A School Admin can assign one or more roles to a user within their institution.  
FR14: A School Admin can optionally associate a student with a teacher for assignment context.  
FR15: A Super Admin can create the first School Admin for a newly created institution.  
FR16: A Teacher can create an academic task with title, description, reward amount, and optional due time.  
FR17: A Teacher can view tasks they are responsible for within their institution.  
FR18: A Student can view active tasks available to them within their institution.  
FR19: A Teacher can close a task to prevent new submissions when allowed by policy.  
FR20: The system can prevent submissions to tasks that are not eligible for new submissions.  
FR21: A Student can submit evidence for a task as structured text and optional supporting link.  
FR22: A Student can view the current status of their submission on a defined institutional workflow.  
FR23: The system can enforce allowed status transitions for submissions.  
FR24: A Teacher can mark a submission as validated when it is eligible for teacher validation.  
FR25: A Teacher can reject a submission with a reason when it is eligible for teacher validation.  
FR26: A School Admin can approve a submission that has been validated by a teacher.  
FR27: A School Admin can reject a submission that has been validated by a teacher.  
FR28: A Teacher can view a queue of submissions requiring teacher action within their institution.  
FR29: A School Admin can view a queue of submissions requiring admin approval within their institution.  
FR30: The system can record a simulated reward disbursement associated with an approved submission.  
FR31: The system can maintain a simulated balance per student within an institution.  
FR32: A Student can view their simulated balance within their institution.  
FR33: A School Admin can view simulated reward history relevant to their institution.  
FR34: The system can prevent more than one simulated reward disbursement for the same submission.  
FR35: The system can record who performed teacher validation and admin approval actions for a submission.  
FR36: A user can view a chronological history of institutional actions taken on a submission sufficient to explain status changes.  
FR37: An internal operator can initialize demo data representing one institution, one school admin, one teacher, and two students.  
FR38: An internal operator can reset demo data to a known baseline state for repeated presentations.

### NonFunctional Requirements

NFR1 (Performance): For typical demo datasets (<=5k tasks/submissions), primary authenticated pages and queue views load within 2.0s p95 on a standard laptop in local/staging.  
NFR2 (Performance): Critical path server processing (open queue -> action -> updated status) within 500ms p95 excluding network, for MVP data sizes.  
NFR3 (Security): Passwords stored with modern adaptive hashing suitable for interactive login.  
NFR4 (Security): HTTPS enforced for staging/production web usage.  
NFR5 (Security): Cross-tenant access attempts denied 100% in automated checks across the MVP protected endpoint set.  
NFR6 (Security): Sessions/tokens revoke on logout; stale tokens do not authorize post-logout actions.  
NFR7 (Security): Seeded defaults follow least privilege.  
NFR8 (Scalability): Support >=10 institutions, >=500 users, >=5k submissions without manual tuning for demo scenarios.  
NFR9 (Scalability): Architecture can scale out API horizontally and upgrade DB without redesigning the workflow model (automation not required in MVP).  
NFR10 (Accessibility): Core flows operable via keyboard with visible focus.  
NFR11 (Accessibility): Default reading surfaces meet WCAG AA text/background contrast.  
NFR12 (Accessibility): Spanish status terminology is consistent across screens per workflow state.  
NFR13 (Integration): No third-party integrations are required in MVP.

### Additional Requirements

- Use modular monolith architecture in `scholarfi-back` and keep `scholarfi` as separate frontend SPA repo with strict API boundary.
- Enforce tenant isolation in backend service/query layer for all protected operations.
- Implement backend-authoritative submission state machine with explicit allowed transitions.
- Guarantee idempotent reward posting (exactly one disbursement per approved submission).
- Keep versioned REST API under `/api/v1` with standardized response/error envelope.
- Use canonical status/error/role vocabulary shared between backend and frontend contract surfaces.
- Keep frontend state strategy minimal (route/module fetch + local UI state), avoid additional state infra unless pain appears.
- Adopt deny-by-default authorization with layered checks: auth -> role -> institution scope -> workflow precondition.
- Maintain auditability using `submission_validations` as MVP audit backbone and domain action logging conventions.
- Keep deployment and infra minimal for MVP: managed Node backend + static frontend + environment-based config.
- CI baseline must include lint, typecheck, tests, and migration checks for backend.
- First implementation priority includes canonical enums/contracts, guarded transition services, and reward idempotency path.

### UX Design Requirements

UX-DR1: Implement Spanish canonical status vocabulary across all core views (`Pendiente`, `Validada por docente`, `Aprobada por administrador`, `Recompensada`) using centralized i18n keys.  
UX-DR2: Build persistent pipeline visualization component (`SfPipeline`) reusable in student, teacher, and admin flows.  
UX-DR3: Implement queue-first dashboards for teacher/admin with explicit primary CTA and counts.  
UX-DR4: Implement right-rail audit/history pattern (`SfAuditTimeline`) on submission detail views.  
UX-DR5: Implement split authentication layout (`SfSplitAuthLayout`) for desktop and stacked mobile fallback.  
UX-DR6: Implement governance confirmation modal pattern (`SfConfirmActionModal`) for validate/approve/reject transitions.  
UX-DR7: Implement governance-block messaging component (`SfGovernanceBlock`) for invalid state/role/institution cases.  
UX-DR8: Configure Tailwind + daisyUI + semantic CSS tokens for ScholarFi theme (primary/secondary/tertiary/neutral/error/surfaces).  
UX-DR9: Add typography system with Plus Jakarta Sans and defined heading/body/badge hierarchy.  
UX-DR10: Apply spacing system (4px base, 8px rhythm) with asymmetric dashboard layout and tonal sectioning.  
UX-DR11: Implement responsive behavior: desktop asymmetric layout, tablet adapt, mobile drawer/accordion history rail.  
UX-DR12: Enforce WCAG 2.2 AA targets for contrast, keyboard navigation, focus handling, and non-color status communication.  
UX-DR13: Add accessibility patterns for modals (`aria-modal`, focus trap/restore), forms (`label` + `aria-describedby`), and landmarks (`header/nav/main`).  
UX-DR14: Restrict glass UI usage to top navigation and modal/drawer shells only, with contrast validation.  
UX-DR15: Maintain “simulated economy” honesty in copy (`Recompensa simulada`, `Saldo simulado`) and avoid wallet/blockchain metaphors in core school flows.

### FR Coverage Map

FR1: Epic 1 - Sign in  
FR2: Epic 1 - Sign out  
FR3: Epic 1 - Profile + roles  
FR4: Epic 1 - Auth gate  
FR5: Epic 1 - Role restrictions  
FR6: Epic 2 - Create institution  
FR7: Epic 2 - Activate institution  
FR8: Epic 2 - Deactivate institution  
FR9: Epic 1 - Block school ops when institution inactive  
FR10: Epic 1 - Tenant isolation  
FR11: Epic 2 - Create teacher account  
FR12: Epic 2 - Create student account  
FR13: Epic 2 - Assign roles  
FR14: Epic 2 - Teacher-student association  
FR15: Epic 2 - Bootstrap first school admin  
FR16: Epic 3 - Create academic task  
FR17: Epic 3 - Teacher task listing  
FR18: Epic 3 - Student task listing  
FR19: Epic 3 - Close task  
FR20: Epic 3 - Submission eligibility enforcement  
FR21: Epic 4 - Student evidence submission  
FR22: Epic 4 - Submission status visibility  
FR23: Epic 4 - Transition enforcement  
FR24: Epic 4 - Teacher validation  
FR25: Epic 4 - Teacher rejection  
FR26: Epic 4 - Admin approval  
FR27: Epic 4 - Admin rejection  
FR28: Epic 4 - Teacher action queue  
FR29: Epic 4 - Admin action queue  
FR30: Epic 5 - Record simulated disbursement  
FR31: Epic 5 - Maintain simulated balance  
FR32: Epic 5 - Student balance view  
FR33: Epic 5 - Admin reward history  
FR34: Epic 5 - Prevent duplicate disbursement  
FR35: Epic 4 - Record validator/approver identities  
FR36: Epic 4 - Chronological submission history  
FR37: Epic 6 - Seed demo baseline  
FR38: Epic 6 - Reset demo baseline

## Epic List

### Epic 1: Identity, Access, and Tenant Foundation
Deliver secure sign-in, role-based access, and institution isolation so every later capability runs in a trusted scoped context.  
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR9, FR10

### Epic 2: Institution Activation and User Provisioning
Enable Super Admin and School Admin to activate an institution and provision role-ready users for demo operations.  
**FRs covered:** FR6, FR7, FR8, FR11, FR12, FR13, FR14, FR15

### Epic 3: Academic Task Lifecycle
Enable teachers to create/manage tasks and students to discover eligible tasks for submission.  
**FRs covered:** FR16, FR17, FR18, FR19, FR20

### Epic 4: Submission Pipeline and Governance Decisions
Enable student evidence submission and the full teacher/admin governance flow with queues, transitions, and action history.  
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR35, FR36

### Epic 5: Simulated Rewards and Ledger Transparency
Enable approved outcomes to create one simulated disbursement and maintain institution-scoped balances/history.  
**FRs covered:** FR30, FR31, FR32, FR33, FR34

### Epic 6: Demo Operations and Experience Hardening
Enable repeatable seeded demos and UX consistency/accessibility/performance hardening required for sales-grade presentations.  
**FRs covered:** FR37, FR38

## Epic 1: Identity, Access, and Tenant Foundation

Deliver secure sign-in, role-based access, and institution isolation so every later capability runs in a trusted scoped context.

### Story 1.1: Initialize Approved Starter Foundations

As an internal developer,  
I want both existing starter foundations verified and baseline-configured,  
So that feature stories build on a stable, reproducible project setup.

**Acceptance Criteria:**

**Given** the approved architecture starter decision (existing `scholarfi-back` and `scholarfi` repos)  
**When** project setup verification is run  
**Then** backend and frontend dependencies install successfully and baseline scripts run (`dev`, `build`, `lint`, `typecheck` as applicable)  
**And** required environment templates/defaults are documented for local development.

### Story 1.2: Email Password Sign-In

As a platform user,  
I want to sign in with my email and password,  
So that I can access my role-specific workspace.

**References:** FR1, NFR3, NFR6

**Acceptance Criteria:**

**Given** a registered active user with valid credentials  
**When** they submit login on `/api/v1/auth/login`  
**Then** the API returns a valid auth token and user identity payload  
**And** failed logins return a standardized error envelope with `error.code`, `error.message`, and `requestId` without leaking credential details.

### Story 1.3: Sign-Out and Token Revocation

As an authenticated user,  
I want to sign out,  
So that my token can no longer access protected endpoints.

**References:** FR2, NFR6

**Acceptance Criteria:**

**Given** a valid authenticated token  
**When** the user calls `/api/v1/auth/logout`  
**Then** the token is revoked server-side  
**And** any subsequent protected request with that token is denied with standardized auth error (`error.code`, `requestId`).

### Story 1.4: Protected Route Authorization Gate

As the system,  
I want protected API routes guarded by authentication and role checks,  
So that only permitted users can access sensitive operations.

**Acceptance Criteria:**

**Given** a protected endpoint with role requirements  
**When** a request lacks auth or required role  
**Then** access is denied with standardized `error.code` and `requestId`  
**And** authorized users can proceed to controller/service logic.

### Story 1.5: Profile and Role Summary Endpoint

As a signed-in user,  
I want to fetch my profile and assigned roles,  
So that the frontend can render role-aware navigation.

**Acceptance Criteria:**

**Given** an authenticated user  
**When** they request `/api/v1/account/profile`  
**Then** the API returns profile data including role list and institution scope  
**And** response format follows the standard `{ data: ... }` envelope.

### Story 1.6: Tenant Scope Enforcement

As the system,  
I want institution scope enforced for all school operations,  
So that cross-tenant data access is prevented.

**Acceptance Criteria:**

**Given** a school-role user from institution A  
**When** they request records from institution B  
**Then** the backend denies access  
**And** automated checks assert zero cross-tenant access across protected routes.

## Epic 2: Institution Activation and User Provisioning

Enable Super Admin and School Admin to activate an institution and provision role-ready users for demo operations.

### Story 2.1: Create Institution with Unique Code

As a Super Admin,  
I want to create an institution with a unique code,  
So that each tenant has a distinct operational identity.

**References:** FR6

**Acceptance Criteria:**

**Given** a Super Admin session  
**When** they submit institution name and code  
**Then** a new institution is created in inactive/controlled state  
**And** duplicate codes are rejected with actionable error details in standard error envelope fields.

### Story 2.2: Activate and Deactivate Institution

As a Super Admin,  
I want to activate or deactivate an institution,  
So that school operations can be enabled or paused.

**Acceptance Criteria:**

**Given** an existing institution  
**When** Super Admin toggles status  
**Then** institution status persists and is reflected in operational checks  
**And** inactive institutions block school-role mutation operations.

### Story 2.3: Bootstrap First School Admin

As a Super Admin,  
I want to create the first School Admin for a new institution,  
So that tenant-local administration can begin.

**Acceptance Criteria:**

**Given** a valid institution  
**When** Super Admin creates the initial school admin user  
**Then** the user is assigned school_admin role within that institution  
**And** account credentials follow security defaults.

### Story 2.4: Provision Teacher and Student Accounts

As a School Admin,  
I want to create teacher and student users in my institution,  
So that academic workflows can run end to end.

**Acceptance Criteria:**

**Given** an active institution and school admin session  
**When** user creation forms are submitted  
**Then** users are created tenant-scoped with requested role assignments  
**And** invalid inputs are rejected with field-level errors.

### Story 2.5: Role Assignment and Teacher Student Association

As a School Admin,  
I want to assign roles and optional teacher-student associations,  
So that accountability and workflow context are configured.

**Acceptance Criteria:**

**Given** institution users exist  
**When** role assignment or association is updated  
**Then** relationship records are saved with institution scope  
**And** associated users appear correctly in task/submission context.

## Epic 3: Academic Task Lifecycle

Enable teachers to create/manage tasks and students to discover eligible tasks for submission.

### Story 3.1: Teacher Creates Task

As a Teacher,  
I want to create a task with reward and due metadata,  
So that students can submit evidence for measurable work.

**Acceptance Criteria:**

**Given** an authenticated teacher in active institution  
**When** they submit title, description, reward amount, and optional due date  
**Then** task is created with teacher ownership and institution scope  
**And** response returns the created task in standard envelope.

### Story 3.2: Teacher Task Listing

As a Teacher,  
I want to view tasks I am responsible for,  
So that I can manage and review my active workload.

**Acceptance Criteria:**

**Given** a teacher with tasks  
**When** they request task list  
**Then** only institution-scoped tasks assigned to that teacher are returned  
**And** inactive/closed states are visible for management actions.

### Story 3.3: Student Active Task Listing

As a Student,  
I want to view active and eligible tasks,  
So that I know what I can submit now.

**Acceptance Criteria:**

**Given** a student in active institution  
**When** they request available tasks  
**Then** only eligible active tasks are returned  
**And** tasks outside institution or closed/ineligible are excluded.

### Story 3.4: Task Closure

As a Teacher,  
I want to close a task when appropriate,  
So that no new submissions are accepted afterward.

**Acceptance Criteria:**

**Given** a teacher-owned task  
**When** the teacher performs close action  
**Then** task status changes to closed/ineligible  
**And** subsequent submission attempts are blocked by backend rules.

### Story 3.5: Submission Eligibility Enforcement

As the system,  
I want to enforce task eligibility before accepting submissions,  
So that workflow integrity is preserved.

**Acceptance Criteria:**

**Given** a submission request for ineligible task  
**When** API validates request  
**Then** submission is rejected with standardized workflow error  
**And** no submission record is created.

## Epic 4: Submission Pipeline and Governance Decisions

Enable student evidence submission and the full teacher/admin governance flow with queues, transitions, and action history.

### Story 4.1: Student Evidence Submission

As a Student,  
I want to submit evidence text and optional link,  
So that my work can enter the institutional approval pipeline.

**Acceptance Criteria:**

**Given** an eligible task and authenticated student  
**When** submission payload is valid  
**Then** submission record is created with initial workflow status  
**And** duplicate/ineligible attempts return clear errors.

### Story 4.2: Submission Status Pipeline Visibility

As a Student,  
I want to view pipeline status for my submission,  
So that I understand progress and next authority step.

**References:** FR22, UX-DR1, UX-DR2

**Acceptance Criteria:**

**Given** a student submission exists  
**When** student views submission detail  
**Then** status appears using canonical Spanish pipeline labels  
**And** UI state reflects backend source of truth.

### Story 4.3: Teacher Validation Queue

As a Teacher,  
I want a queue of submissions requiring my action,  
So that I can quickly validate or reject evidence.

**References:** FR28, UX-DR3

**Acceptance Criteria:**

**Given** pending submissions assigned to teacher context  
**When** teacher opens validation queue  
**Then** relevant submissions are listed with key metadata  
**And** queue excludes items outside institution scope.

### Story 4.4: Teacher Validate Submission

As a Teacher,  
I want to mark eligible submissions as validated,  
So that they can progress to school admin approval.

**Acceptance Criteria:**

**Given** a submission in teacher-actionable state  
**When** teacher validates  
**Then** status transitions to validated state  
**And** actor/timestamp are recorded in audit trail.

### Story 4.5: Teacher Reject Submission with Reason

As a Teacher,  
I want to reject a submission with mandatory reason,  
So that students receive actionable feedback.

**Acceptance Criteria:**

**Given** a teacher-actionable submission  
**When** teacher rejects with reason  
**Then** submission transitions to rejected state with reason persisted  
**And** reason is available in submission history.

### Story 4.6: School Admin Approval Queue

As a School Admin,  
I want a queue of validated submissions pending final decision,  
So that I can execute final governance control.

**References:** FR29, UX-DR3

**Acceptance Criteria:**

**Given** validated submissions in institution  
**When** admin opens approval queue  
**Then** only admin-actionable validated items are listed  
**And** queue data includes enough context for decision.

### Story 4.7: School Admin Approve or Reject Validated Submission

As a School Admin,  
I want to approve or reject validated submissions,  
So that final accountability is institutionally controlled.

**References:** FR26, FR27, UX-DR6, UX-DR7

**Acceptance Criteria:**

**Given** a validated submission  
**When** admin approves  
**Then** submission transitions to approved state eligible for reward posting  
**And** admin actor/timestamp are recorded.  
**Given** a validated submission  
**When** admin rejects with reason  
**Then** submission transitions to admin-rejected state with reason captured  
**And** invalid transition attempts return standardized workflow error codes.

### Story 4.8: Transition Guard and Chronological History

As the system,  
I want strict transition guards and chronological action history,  
So that every status change is valid and explainable.

**Acceptance Criteria:**

**Given** any transition request  
**When** requested state jump is invalid  
**Then** backend rejects with `INVALID_STATE_TRANSITION` style code  
**And** submission history remains unchanged.  
**Given** valid actions occur  
**When** history is requested  
**Then** actions are returned in chronological order with actor and action metadata.

## Epic 5: Simulated Rewards and Ledger Transparency

Enable approved outcomes to create one simulated disbursement and maintain institution-scoped balances/history.

### Story 5.1: Record Simulated Reward Disbursement

As the system,  
I want to create a reward transaction when admin approval finalizes,  
So that simulated economic outcome is traceable.

**Acceptance Criteria:**

**Given** an approved submission eligible for reward posting  
**When** reward service executes  
**Then** reward transaction is created with submission and institution references  
**And** status is reflected in submission/ledger views.

### Story 5.2: Idempotent Reward Posting

As the system,  
I want to prevent duplicate disbursements per submission,  
So that balances remain accurate and deterministic.

**Acceptance Criteria:**

**Given** a submission already rewarded  
**When** reward posting is re-triggered  
**Then** no second transaction is created  
**And** API returns deterministic idempotent result/error.

### Story 5.3: Maintain Student Simulated Balance

As the system,  
I want to update institution-scoped student balances from reward transactions,  
So that balances reflect approved outcomes.

**Acceptance Criteria:**

**Given** a successful reward transaction  
**When** ledger update runs  
**Then** student simulated balance is incremented correctly in same transaction boundary  
**And** balance is scoped to institution.

### Story 5.4: Student Balance Visibility

As a Student,  
I want to view my simulated balance,  
So that I can see approved reward outcomes.

**References:** FR32, UX-DR15

**Acceptance Criteria:**

**Given** student has balance record  
**When** student opens balance surface  
**Then** current balance is displayed with simulated terminology  
**And** unauthorized users cannot access another student balance.

### Story 5.5: Admin Reward History View

As a School Admin,  
I want to view institution reward history,  
So that I can audit simulated disbursements.

**Acceptance Criteria:**

**Given** reward transactions exist for institution  
**When** admin requests reward history  
**Then** list includes transaction amounts, submission linkage, and timestamps  
**And** results are institution-scoped only.

## Epic 6: Demo Operations and Experience Hardening

Enable repeatable seeded demos and UX consistency/accessibility/performance hardening required for sales-grade presentations.

### Story 6.1: Demo Seed Baseline

As an internal operator,  
I want to initialize a standard demo dataset,  
So that every demo starts from a reliable baseline.

**Acceptance Criteria:**

**Given** a clean or reset environment  
**When** seed command is executed  
**Then** one institution, one school admin, one teacher, and two students are created  
**And** optional starter task/submission data is created predictably.

### Story 6.2: Demo Reset Baseline

As an internal operator,  
I want to reset demo data to known state,  
So that I can run repeated demos without manual database fixes.

**Acceptance Criteria:**

**Given** demo environment with modified state  
**When** reset command is executed  
**Then** dataset returns to baseline deterministic state  
**And** reset process is documented and repeatable.

### Story 6.3: Canonical Spanish Status and Copy Centralization

As a product team,  
I want canonical Spanish labels centralized,  
So that status terminology remains consistent across roles/screens.

**References:** UX-DR1, UX-DR15

**Acceptance Criteria:**

**Given** frontend status and governance copy  
**When** strings are implemented  
**Then** canonical labels are sourced from central i18n structure (e.g., `src/i18n/es.ts`)  
**And** no conflicting status wording appears across student/teacher/admin flows.

### Story 6.4: Accessibility Hardening for Core Flows

As a keyboard and assistive-tech user,  
I want core flows to meet accessibility expectations,  
So that I can complete the workflow without barriers.

**References:** UX-DR12, UX-DR13

**Acceptance Criteria:**

**Given** core auth/submission/approval flows  
**When** tested with keyboard-only navigation  
**Then** focus order, visibility, and modal focus management are correct  
**And** non-color status cues and ARIA semantics are present for critical UI components.

### Story 6.5: Responsive Hardening for Core Screens

As a user on different screen sizes,  
I want core screens to adapt predictably,  
So that workflow comprehension is maintained on desktop, tablet, and mobile.

**References:** UX-DR11

**Acceptance Criteria:**

**Given** dashboard and submission detail screens  
**When** viewed at defined breakpoints (`sm`, `md`, `lg`, `xl`)  
**Then** layout adapts according to UX strategy (rail collapses/drawer patterns where needed)  
**And** primary actions remain visible and usable.

### Story 6.6: CI and Quality Baseline for MVP

As the engineering team,  
I want minimum CI quality gates,  
So that regressions in auth/workflow/tenant rules are caught early.

**Acceptance Criteria:**

**Given** a pull request  
**When** CI runs  
**Then** lint, typecheck, tests, and backend migration checks execute  
**And** failing checks block merge until resolved.

### Story 6.7: Epic 6 Readiness Gates and Sign-off

As the product and engineering team,  
I want explicit completion gates for demo ops, UX hardening, and CI quality,  
So that Epic 6 closes with unambiguous implementation readiness criteria.

**References:** FR37, FR38, UX-DR11, UX-DR12, UX-DR13

**Acceptance Criteria:**

**Given** Epic 6 implementation artifacts  
**When** readiness is reviewed  
**Then** demo ops gate is marked complete only if seed and reset commands pass on clean state  
**And** UX gate is marked complete only if accessibility and responsive checks pass for core flows  
**And** CI gate is marked complete only if required quality checks run and enforce merge blocking.
