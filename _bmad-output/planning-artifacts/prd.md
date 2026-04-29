---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - /Users/angelserrano/development/scholarfi-back/_bmad-output/planning-artifacts/product-brief-scholarfi.md
  - /Users/angelserrano/development/scholarfi-back/_bmad-output/planning-artifacts/product-brief-scholarfi-distillate.md
workflowType: 'prd'
classification:
  projectType: saas_b2b
  domain: edtech
  complexity: medium
  projectContext: brownfield
documentCounts:
  briefCount: 2
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
---

# Product Requirements Document - scholarfi

**Author:** Angel
**Date:** 2026-04-28

## Executive Summary

ScholarFi Demo Simulator is a **B2B institutional workflow simulator** that demonstrates ScholarFi’s academic reward lifecycle end-to-end **without blockchain setup**. In one repeatable session, a presenter can onboard a school, operate as **Super Admin / School Admin / Teacher / Student**, and run:

**Task → Submission → Teacher Validation → School Admin Approval → Simulated Reward**

The experience must make **operational governance** tangible first: **role separation, approval authority, auditable progression, and predictable outcomes**—with **Spanish-language status clarity** and **simulated balances** that behave like a treasury ledger for demo purposes.

### What Makes This Special

- **Governance-first incentives:** rewards move through **teacher validation + admin approval**, not instant “points.”
- **Sales-grade determinism:** seeded users + a tight happy path reduce live-demo risk.
- **Bridge to Web3 later:** simulated ledger events preview economics **without wallets or minting** in MVP.

## Project Classification

- **Project Type:** `saas_b2b` (multi-role institutional product; institution-scoped operations)
- **Domain:** `edtech`
- **Complexity:** `medium` (privacy/accessibility credibility matters even in demos)
- **Project Context:** `brownfield` (implementation underway; PRD formalizes MVP intent)

## Success Criteria

### User Success

- Presenter completes full role-switched happy path in **≤ 2 minutes** without manual database fixes.
- Each role lands on a screen that clearly indicates the **next best action**.
- Students can understand progress in Spanish via an always-visible pipeline: **Pendiente → Validada por docente → Aprobada por administrador → Recompensada**.
- School admins trust final control: **no reward posting without admin approval** after teacher validation.
- Teachers can validate/reject from a **clear queue** with minimal required fields.

### Business Success (ScholarFi GTM / Sales)

- **Demo repeatability:** 3 consecutive successful runs on the same seeded credentials/data.
- **Stakeholder coverage:** one session demonstrates **admin governance + educator workflow + student experience** without blockchain setup.

### Technical Success

- **Tenant isolation:** **0** cross-institution data access on protected operations (enforced server-side).
- **Workflow integrity:** **100%** of `rewarded` outcomes follow valid transitions and create **exactly one** simulated disbursement record per submission.
- **Deterministic operations:** migrations + seed path can recreate the demo environment reliably.

### Measurable Outcomes

- **TTD (internal):** clean DB → first `rewarded` outcome in **≤ 10 minutes** using documented setup.
- **Demo script duration:** **≤ 120s** end-to-end.
- **P0 demo-breaker budget:** **0** in the seeded golden path (login, routing, queues, approvals, balance updates).

## Product Scope

### MVP Strategy & Philosophy

**MVP type:** Experience MVP (sales) + Problem-solving MVP (institutional trust). Prove the governed pipeline quickly; defer integrations and blockchain.

**Team assumption:** 1 strong full-stack engineer (or split FE/BE) + occasional design support for Spanish UX polish.

### MVP (Phase 1) — Must Ship

**Core journeys supported**
- Super Admin: institution + first school admin + activation
- School Admin: provision users + approve validated submissions + observe ledger outcome
- Teacher: tasks + validate/reject + queue
- Student: submit + track pipeline + view simulated balance
- Internal operator: seed/reset + repeatable role switching

**MVP capabilities**
- Authentication + RBAC: `super_admin`, `school_admin`, `teacher`, `student`
- Institution lifecycle with **active gating** for school operations
- User provisioning within institution + optional teacher↔student association
- Tasks: create/list/view + close/eligibility rules for submissions (MVP-simple)
- Submissions: evidence capture + enforced workflow states
- Teacher validation + admin approval/rejection + lightweight audit trail
- Simulated rewards: student balance + non-duplicative disbursement per submission
- Spanish UI labels for core surfaces + pipeline visualization
- Seed dataset: 1 school, 1 admin, 1 teacher, 2 students (+ optional starter task/submission)

### Growth (Phase 2)

- Invitations + password reset; CSV exports; richer evidence (files) + basic scanning policy
- Operational analytics: time-in-stage, throughput, workload
- Enterprise auth (SSO/OIDC) for pilots

### Vision (Phase 3)

- On-chain settlement + wallets + production treasury controls
- Policy-based reward rules; multi-asset support; country-specific compliance packaging

### Scope Risks & Mitigations

- **Technical:** RBAC/tenant bugs or state-machine holes → automated transition checks + golden-path seed tests.
- **Market:** dismissed as “crypto/gamification” → governance-first narrative + simulated-token labeling + principal-friendly demo script.
- **Resourcing:** integration/reporting creep → keep a public “out of scope for MVP” list tied to success metrics.

## User Journeys

### Journey A — Sales Engineer (Internal): “Two minutes, zero drama”

**Opening:** 10 minutes before a LatAm call; needs a crisp narrative without wallets.  
**Rising action:** seed/reset → role-switch walkthrough narrated in Spanish.  
**Climax:** balance increases only after admin approval.  
**Resolution:** buyer questions shift from crypto mechanics to operational rollout.  
**Failure/recovery:** mis-scoped actions blocked with clear Spanish errors + “what’s next” guidance.

### Journey B — Super Admin: “Activate a real institution”

**Opening:** new pilot school.  
**Rising action:** create institution + unique code + first school admin + activate.  
**Climax:** institution becomes operational for school roles.  
**Edge case:** duplicate institution codes blocked with actionable errors.

### Journey C — School Admin: “Final accountability”

**Opening:** fast onboarding + control over disbursement.  
**Rising action:** create users + optional assignments + open approval queue.  
**Climax:** approve validated submission → ledger updates.  
**Edge case:** cannot approve non-validated submissions.

### Journey D — Teacher: “Validate evidence, protect integrity”

**Opening:** publishes rewarded task.  
**Rising action:** review queue; validate or reject with reason.  
**Climax:** validated items advance to admin approval (teacher authority visible, not final).  
**Edge case:** late submissions (MVP must choose hard-stop vs flagged-late).

### Journey E — Student: “Clarity beats novelty”

**Opening:** wants fairness and predictability.  
**Rising action:** Spanish task surfaces + submit evidence + track pipeline.  
**Climax:** balance increases post-approval.  
**Edge case:** duplicate submission attempts (MVP likely single submission per task).

### Journey F — Buyer/Principal (Observer): “Prove governance in one sitting”

**Opening:** skeptical of crypto incentives.  
**Rising action:** watches two-step approval separation.  
**Climax:** sees **independent teacher + admin** controls.  
**Resolution:** moves to implementation planning.

### Journey Requirements Summary

Requires: role dashboards w/ next actions, institution lifecycle + scoping, task/submission queues, enforced workflow transitions, Spanish pipeline UX, simulated ledger records, seed/reset tooling.

## Domain-Specific Requirements

### Compliance & Regulatory

- **Privacy posture:** plan for student-data minimization; assume **FERPA/COPPA** as a baseline mental model for US-facing conversations; LatAm legal localization is **post-MVP** beyond baseline security hygiene.
- **Minimum data:** identity/role/institution + academic task content + submission evidence + approvals.
- **Guardian consent:** production-facing consent flows are **post-MVP** (demo uses synthetic users).

### Technical Constraints

- **Authorization model:** institution-scoped access for all school operations; super admin manages institutions without leaking cross-tenant school data in school-role views.
- **Auditability:** record teacher/admin decisions that explain state changes (MVP-light).
- **Accessibility credibility:** keyboard/contrast/focus expectations on core flows.
- **Content safety (optional):** evidence length limits; profanity filtering is optional post-MVP.

### Integration Requirements

- **MVP:** none (no LMS/SIS, email/SMS, chain).
- **Post-MVP:** exports and enterprise integrations as needed.

### Domain Risk Mitigations

- **Crypto fear:** academics-first UX; avoid DeFi jargon on student surfaces.
- **Financial misinterpretation:** explicit **simulated token** labeling + internal-demo disclaimers.
- **Privacy optics:** synthetic emails; no real minor PII in seeds.

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Governed academic settlement (simulated):** disbursement-like controls rather than unstructured points.
- **Sales-safe sequencing:** prove operations before infrastructure.
- **“Intellectual Ledger” UX:** auditability via progression + tonal hierarchy (not consumer-game chrome).

### Market Context & Competitive Landscape

Landscape includes recognition/PBIS-style programs emphasizing fast praise and redemptions; ScholarFi’s MVP story emphasizes **multi-party authorization** and **institutional accountability** (not equivalency claims). Context links: [Knowlej](https://www.knowlej.io/), [Minga student points](https://minga.io/student-points-recognition/), [PBIS Rewards](https://www.pbisrewards.com/), [Rang for schools](https://www.rang.com/for-schools).

### Validation Approach

- Demo repeatability (3x runs), workflow correctness tests, buyer question-shift observation in sales calls.

### Innovation Risk Mitigation

Avoid novelty theater; if differentiation isn’t perceived, win on **clarity + governance + demo quality**.

## SaaS B2B Specific Requirements

### Tenant Model

- **Tenant = institution**
- **Isolation:** default deny cross-tenant access for school operations
- **Activation gate:** inactive institutions cannot run school workflows

### RBAC Matrix (MVP)

- **super_admin:** institutions + first school admin + activation
- **school_admin:** provision users/roles + optional assignments + approval queue + institution ledger views
- **teacher:** tasks + teacher queue + validate/reject
- **student:** active tasks + submit + status + balance

**Non-negotiable enforcement:** server-side RBAC + workflow transition validity.

### Commercial Model

- **No billing/tiers in MVP**

### Integration Posture

- **MVP:** none
- **Later:** exports, enterprise identity, chain settlement

### Compliance (Product-Type)

- Minimize PII, secure credentials, HTTPS in deployed environments, Spanish consistency for statuses.

## MVP Implementation Context (Engineering — Non-FR)

This section records the intended MVP stack for execution alignment. It does not expand the capability contract beyond FR1–FR38.

- **Web client:** React + TypeScript + React Router; Spanish UI strings; role-based routing
- **API + persistence:** AdonisJS + PostgreSQL + ORM migrations; REST endpoints
- **Core engineering invariant:** strict submission state machine + idempotent simulated disbursement per submission

## Functional Requirements

### Access & Session

- FR1: A user can sign in with email and password.
- FR2: A signed-in user can sign out.
- FR3: A signed-in user can view their profile summary including assigned roles.
- FR4: The system can prevent access to authenticated areas when a user is not signed in.
- FR5: The system can restrict capabilities based on the user’s role(s).

### Institution & Tenant Governance

- FR6: A Super Admin can create an institution with a unique institution code.
- FR7: A Super Admin can activate an institution to allow school operations.
- FR8: A Super Admin can deactivate an institution to block school operations.
- FR9: The system can prevent school operational actions when an institution is not active.
- FR10: The system can isolate institution data so users cannot access another institution’s records.

### User & Role Administration (within an institution)

- FR11: A School Admin can create a user account for a teacher within their institution.
- FR12: A School Admin can create a user account for a student within their institution.
- FR13: A School Admin can assign one or more roles to a user within their institution.
- FR14: A School Admin can optionally associate a student with a teacher for assignment context.
- FR15: A Super Admin can create the first School Admin for a newly created institution.

### Academic Task Management

- FR16: A Teacher can create an academic task with title, description, reward amount, and optional due time.
- FR17: A Teacher can view tasks they are responsible for within their institution.
- FR18: A Student can view active tasks available to them within their institution.
- FR19: A Teacher can close a task to prevent new submissions when allowed by policy.
- FR20: The system can prevent submissions to tasks that are not eligible for new submissions.

### Evidence Submission & Workflow Status

- FR21: A Student can submit evidence for a task as structured text and optional supporting link.
- FR22: A Student can view the current status of their submission on a defined institutional workflow.
- FR23: The system can enforce allowed status transitions for submissions.
- FR24: A Teacher can mark a submission as validated when it is eligible for teacher validation.
- FR25: A Teacher can reject a submission with a reason when it is eligible for teacher validation.
- FR26: A School Admin can approve a submission that has been validated by a teacher.
- FR27: A School Admin can reject a submission that has been validated by a teacher.
- FR28: A Teacher can view a queue of submissions requiring teacher action within their institution.
- FR29: A School Admin can view a queue of submissions requiring admin approval within their institution.

### Simulated Rewards & Ledger

- FR30: The system can record a simulated reward disbursement associated with an approved submission.
- FR31: The system can maintain a simulated balance per student within an institution.
- FR32: A Student can view their simulated balance within their institution.
- FR33: A School Admin can view simulated reward history relevant to their institution.
- FR34: The system can prevent more than one simulated reward disbursement for the same submission.

### Auditability & Transparency (MVP-level)

- FR35: The system can record who performed teacher validation and admin approval actions for a submission.
- FR36: A user can view a chronological history of institutional actions taken on a submission sufficient to explain status changes.

### Demo Operations & Repeatability (internal operator)

- FR37: An internal operator can initialize demo data representing one institution, one school admin, one teacher, and two students.
- FR38: An internal operator can reset demo data to a known baseline state for repeated presentations.

## Non-Functional Requirements

### Performance

- **NFR-P1:** For typical demo datasets (≤ 5k tasks/submissions), primary authenticated pages and queue views load within **2.0s p95** on a standard laptop in local/staging.
- **NFR-P2:** Critical path server processing (open queue → action → updated status) within **500ms p95** excluding network, for MVP data sizes.

### Security

- **NFR-S1:** Passwords stored with modern adaptive hashing suitable for interactive login.
- **NFR-S2:** HTTPS enforced for staging/production web usage.
- **NFR-S3:** Cross-tenant access attempts denied **100%** in automated checks across the MVP protected endpoint set.
- **NFR-S4:** Sessions/tokens revoke on logout; stale tokens do not authorize post-logout actions.
- **NFR-S5:** Seeded defaults follow least privilege.

### Scalability

- **NFR-SC1:** Support **≥ 10 institutions**, **≥ 500 users**, **≥ 5k submissions** without manual tuning for demo scenarios.
- **NFR-SC2:** Architecture can scale out API horizontally and upgrade DB without redesigning the workflow model (automation not required in MVP).

### Accessibility

- **NFR-A1:** Core flows operable via keyboard with visible focus.
- **NFR-A2:** Default reading surfaces meet **WCAG AA** text/background contrast.
- **NFR-A3:** Spanish status terminology is consistent across screens per workflow state.

### Integration

- **Not applicable in MVP** (explicitly out of scope).
