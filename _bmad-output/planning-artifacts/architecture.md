---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - /Users/angelserrano/development/scholarfi/_bmad-output/planning-artifacts/prd.md
  - /Users/angelserrano/development/scholarfi/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/angelserrano/development/scholarfi-back/_bmad-output/planning-artifacts/product-brief-scholarfi.md
  - /Users/angelserrano/development/scholarfi-back/_bmad-output/planning-artifacts/product-brief-scholarfi-distillate.md
workflowType: architecture
lastStep: 8
status: complete
completedAt: "2026-04-29"
project_name: scholarfi
user_name: Angel
date: "2026-04-28"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

From the PRD, the functional scope is a full governed workflow across four role types (`super_admin`, `school_admin`, `teacher`, `student`) plus internal demo operator behavior:

- Access/session: signup/login/logout/profile, role-aware access.
- Institution governance: create institution, unique code, activation gating.
- User/role administration within tenant boundaries.
- Task lifecycle (create/list/view/close semantics).
- Submission workflow with enforced statuses and clear transitions.
- Two-step approval model (teacher validation then school-admin approval/rejection).
- Simulated rewards + ledger posting without duplication.
- Audit visibility and deterministic demo support (seed/reset, repeatable walkthroughs).

Architecturally, this implies:
- Strong authorization boundaries (role + tenant scope).
- Explicit workflow/state machine invariants.
- Idempotent financial-like posting logic (simulated balance updates).

**Non-Functional Requirements:**

Key NFR drivers identified in PRD and UX:

- Security: tenant isolation, RBAC correctness, protected actions.
- Performance: fast queue/approval interactions suitable for live demos.
- Accessibility: keyboard-first core flows, focus visibility, WCAG-aligned contrast.
- Scalability posture: MVP-medium complexity now, with room for growth phase.
- Integration posture: defer heavy integrations; keep architecture extensible.
- UX consistency: Spanish canonical labels, deterministic state feedback, responsive behavior.

**Scale & Complexity:**

This is a **medium-complexity full-stack SaaS B2B** domain with governance-heavy workflows.

- Primary domain: **full-stack web (frontend + backend API + relational data model)**
- Complexity level: **medium (approaching high if integrations/realtime are added)**
- Estimated architectural components: **~10-14 core components/services** across identity, tenant governance, workflow orchestration, ledger simulation, auditing, frontend app shell, queue/detail UX, and operator tooling.

### Technical Constraints & Dependencies

- Backend stack currently: **AdonisJS + TypeScript + Lucid ORM** (`scholarfi-back`).
- Frontend stack currently: **React + Vite + TypeScript + Tailwind + daisyUI** (`scholarfi`).
- Data model already introduced for domain entities (institutions, roles, user_roles, tasks, submissions, validations, simulated balances, reward transactions).
- Existing API routes currently minimal (auth/profile scaffolding), so architecture must define clean module boundaries for upcoming domain endpoints.
- Product deliberately avoids wallet/on-chain coupling in MVP core school flows; architecture should keep this as a future adapter boundary, not core dependency.
- Spanish UX is not optional; state/copy consistency should be centrally managed (shared enum/contract strategy needed).

### Cross-Cutting Concerns Identified

- **Tenant isolation everywhere:** institution scoping on reads/writes, not just UI filters.
- **RBAC + workflow coupling:** role checks and valid state transitions must both pass.
- **Idempotency and consistency:** reward posting must be exactly-once per approved submission.
- **Auditability:** append-only-ish decision/event trail for teacher/admin actions.
- **Canonical domain language:** shared status vocabulary across backend + frontend.
- **Error semantics:** actionable, role-aware errors (especially for blocked transitions).
- **Deterministic demo operations:** seed/reset and predictable datasets as first-class operational concern.
- **Accessibility + responsive parity:** architecture should support UX constraints as implementation standards, not afterthoughts.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web application** with explicit split repositories:

- Backend API/domain: `scholarfi-back` (AdonisJS + Lucid + TS)
- Frontend UI: `scholarfi` (React + Vite + TS + Tailwind + daisyUI)

This matches project requirements (multi-role SaaS workflow, relational state machine, queue-heavy UI, accessibility constraints).

### Starter Options Considered

1. **Keep current split starters (selected)**
   - Backend: AdonisJS app scaffold already in place.
   - Frontend: Vite React scaffold already in place.
   - Pros: minimal migration risk, preserves in-progress schema/routes/UI work, aligns with current team momentum.
   - Cons: requires architecture conventions to keep FE/BE contracts synchronized.

2. **Re-bootstrap backend starter only**
   - Would re-run Adonis starter and port code.
   - Pros: could clean early scaffolding drift.
   - Cons: high churn, low value given current progress.

3. **Re-bootstrap frontend starter only**
   - Would re-run latest create-vite template and port UI.
   - Pros: latest template defaults.
   - Cons: low ROI; current project already tracks modern versions and daisyUI integration.

### Selected Starter: Existing Split Foundation (AdonisJS + Vite React)

**Rationale for Selection:**

- The existing repositories already implement the exact domain boundaries required by the PRD/UX.
- Current package baselines are modern and maintained (verified externally):
  - create-vite latest line (9.x) still uses `npm create vite@latest ... --template react-ts`.
  - daisyUI current v5.5.x line is actively maintained.
  - Adonis/Lucid stack in use is current enough for MVP architecture decisions.
- Avoids unnecessary reset while enabling clean architecture decisions from step 4 onward.

**Initialization Command:**

```bash
# Already initialized; no re-bootstrap required.
# If creating from scratch in future:
npm create vite@latest scholarfi -- --template react-ts
```

```bash
# Backend is already initialized in-repo via AdonisJS scaffold.
# Use standard run/build/test scripts from existing package.json.
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript-first in both repos.
- Node.js runtime with modern module system.

**Styling Solution:**
- Tailwind CSS + daisyUI in frontend, aligned to UX Step 6 decision.

**Build Tooling:**
- Frontend: Vite build/dev pipeline.
- Backend: Adonis assembler/build lifecycle.

**Testing Framework:**
- Backend includes Japa test setup.
- Frontend test stack still to be explicitly chosen in architecture decisions (recommended in later steps).

**Code Organization:**
- Backend module folders around controllers/models/middleware/migrations.
- Frontend component/app structure from Vite React baseline.

**Development Experience:**
- Hot reload/dev servers already configured.
- Lint/typecheck scripts in both repos.

**Note:** First implementation stories should focus on enforcing architecture conventions (contracts, shared status enums, tenant/RBAC middleware boundaries) rather than reinitializing starters.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. **Architecture style:** Modular monolith backend (`scholarfi-back`) + SPA frontend (`scholarfi`) with strict API boundary.
2. **Tenant isolation model:** Single database, institution-scoped row-level ownership enforced in service/query layer.
3. **Workflow/state machine enforcement:** Backend is source of truth for submission transitions.
4. **Reward posting integrity:** Idempotent posting guard (one reward transaction per approved submission).
5. **AuthN/AuthZ contract:** Token auth + role checks + institution scoping required for all protected endpoints.
6. **API contract strategy:** Versioned REST (`/api/v1`) with lightweight OpenAPI contract.
7. **Frontend state strategy:** Keep state minimal; fetch-on-route with local UI state, add query cache only where needed.

**Important Decisions (Shape Architecture):**

- Shared domain vocabulary for statuses/error codes.
- Audit trail event schema and storage pattern.
- Error envelope standard for role/tenant/workflow failures.
- Validation strategy unifying backend request rules and frontend form expectations.
- Observability baseline (structured logs + request IDs + domain event logging).

**Deferred Decisions (Post-MVP):**

- Event bus/microservices split.
- Real-time push updates (SSE/WebSocket).
- Redis/distributed cache.
- On-chain settlement adapters beyond interface stubs.

### Data Architecture

- **Database engine:** PostgreSQL (target current stable major line; PG18 is current stable line from 2026 checks).
- **ORM/migrations:** Continue with Adonis Lucid migrations as single migration authority.
- **Data modeling approach:** Institution-scoped entities with explicit foreign keys + unique constraints where needed.
- **State model:** Enumerated workflow states for submissions (`pending`, `teacher_validated`, `admin_approved`, `rewarded`, reject paths).
- **Idempotency controls:**
  - Unique constraint on reward transaction by `submission_id` (or equivalent composite guard).
  - Service-level transactional check before ledger mutation.
- **Audit model:** Use `submission_validations` as MVP audit backbone; defer generic event store.
- **Caching strategy:** No distributed cache in MVP; rely on query/index tuning and selective HTTP caching for safe reads.

### Authentication & Security

- **Authentication:** Adonis token-based auth for API consumers.
- **Authorization:** Layered checks:
  1. authenticated user
  2. role permission
  3. institution scope
  4. workflow precondition (for transition endpoints)
- **Security middleware baseline:** CORS, Shield, JSON-only API response, auth middleware, centralized exception mapping.
- **Secrets/data protection:** Environment-based secrets; password hashing via Adonis hash provider.
- **API abuse controls:** Add rate limiting at reverse proxy or app middleware for auth and mutation endpoints.
- **Security posture:** Deny-by-default route groups with explicit allowlists by role.

### API & Communication Patterns

- **API style:** REST JSON with versioned prefix (`/api/v1`).
- **Contract format:** OpenAPI 3.x contract file generated/maintained from route surface (keep tooling simple).
- **Endpoint organization:** Resource modules by domain:
  - auth/account
  - institutions
  - users/roles
  - tasks
  - submissions
  - validations/approvals
  - simulated balances/reward transactions
- **Error envelope standard:**
  - `code` (machine readable),
  - `message` (Spanish-ready user-safe),
  - `details` (field/domain context),
  - `requestId`.
- **Consistency rules:** Canonical status/error enums shared to frontend via typed API responses.
- **Service communication:** In-process service modules (modular monolith), no networked internal services in MVP.

### Frontend Architecture

- **App architecture:** React SPA (Vite) with route-level role shells.
- **State strategy:** Start minimal:
  - Server data fetched per route/module with thin API client.
  - Local UI state in components/context.
  - Introduce dedicated query cache library only if duplicate-fetch pain appears.
- **Form/validation strategy:** Keep existing stack lean; frontend validation mirrors backend rules for critical forms.
- **Component architecture:** daisyUI primitives + `sf-*` wrappers defined in UX spec (`SfPipeline`, `SfQueuePageShell`, etc.).
- **Routing strategy:** Role-aware protected routes with clear unauthorized/forbidden UX.
- **Performance baseline:** route-level code splitting and payload minimization before adding complexity.
- **Accessibility enforcement:** WCAG AA targets from UX spec integrated into component acceptance criteria.

### Infrastructure & Deployment

- **Repo topology:** Keep split repos (`scholarfi-back`, `scholarfi`) with explicit API contract sync process.
- **Runtime target:** Node LTS line (prefer Node 22/24 in deployment).
- **Environment strategy:** `.env` per environment with required-var boot validation.
- **Deployment model:** Managed Node hosting for backend + static hosting for frontend.
- **CI/CD baseline:**
  - lint + typecheck + tests on PR
  - migration check in backend pipeline
  - build artifacts for both repos
- **Observability baseline:**
  - structured logs,
  - request correlation IDs,
  - error monitoring hooks,
  - domain-action logs for approvals/rewards.
- **Scaling strategy:** Vertical first, then indexing/query optimization; horizontal scaling only when load warrants it.

### Decision Impact Analysis

**Implementation Sequence:**

1. Finalize canonical enums/contracts (statuses, errors, roles).
2. Implement auth+RBAC+tenant guard middleware/service policies.
3. Implement submission workflow services with transition guards.
4. Implement idempotent reward posting transaction path.
5. Expose REST endpoints + contract document.
6. Build frontend role shells + queue/detail flows using minimal state strategy.
7. Add observability and hardening (rate limit, structured error mapping).

**Cross-Component Dependencies:**

- Workflow UI correctness depends on backend state machine and canonical enums.
- Reward UI/ledger displays depend on idempotent backend transaction guarantees.
- Tenant-safe frontend filtering is insufficient without backend scope enforcement.
- Accessibility and consistency requirements depend on `sf-*` wrapper adoption across routes.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 major areas where AI agents could diverge:
- Naming
- Structure
- Format
- Communication
- Process

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case` plural (`user_roles`, `reward_transactions`).
- Columns: `snake_case` (`institution_id`, `created_at`).
- Foreign keys: `<entity>_id` (`student_id`, `submission_id`).
- Indices/constraints: `idx_<table>_<column>` and `uq_<table>_<columns>`.

**API Naming Conventions:**
- REST resources: plural nouns (`/tasks`, `/submissions`).
- Route params: `:id` in framework definitions.
- Query params: `snake_case` for backend/API compatibility.
- Header custom keys: standard prefix style (`X-Request-Id`).

**Code Naming Conventions:**
- TypeScript symbols: `PascalCase` for classes/components, `camelCase` for functions/variables.
- Backend files: Adonis conventions (controllers/models/middleware) in snake/kebab as existing project style dictates.
- Frontend components: `PascalCase` filenames for components (`SfPipeline.tsx`), helpers in `camelCase` or `kebab-case` by folder convention.
- Never mix `snake_case` and `camelCase` for the same conceptual field in a single layer.

### Structure Patterns

**Project Organization:**
- Keep repo split:
  - `scholarfi-back`: API/domain/data
  - `scholarfi`: UI/app
- Backend modules organized by domain slice (`institutions`, `tasks`, `submissions`, `rewards`) once expanded.
- Frontend organized by feature + shared `sf-*` components from UX spec.

**Test Placement:**
- Backend tests in `tests/` following Adonis/Japa defaults.
- Frontend tests (when added) colocated or centralized, but choose one pattern and keep it consistent per test type.

**Shared Utilities:**
- Backend domain utilities stay in backend only.
- Frontend formatting/UI utilities stay in frontend only.
- Cross-repo shared contract artifacts generated as explicit files (no hidden coupling).

### Format Patterns

**API Response Formats:**
- Success shape:
  - list: `{ data: [...], meta?: {...} }`
  - single: `{ data: {...} }`
- Error shape:
  - `{ error: { code, message, details?, requestId? } }`
- Do not return raw framework exceptions to clients.

**Data Exchange Formats:**
- JSON field naming at API boundary: `snake_case` (align backend/storage and reduce transform drift in MVP).
- Date/time format: ISO-8601 strings in UTC.
- Boolean: strict `true/false`.
- Nullability explicit; avoid absent-vs-null ambiguity for required keys.

### Communication Patterns

**Event / Domain Action Patterns (MVP-light):**
- Use action labels in logs/audit as `domain.action` (`submission.validated`, `submission.approved`, `reward.posted`).
- Payload minimum:
  - `actor_id`
  - `institution_id`
  - `entity_id`
  - `timestamp`
  - `context` (optional)

**State Management Patterns (frontend):**
- Server is source of truth for workflow states.
- UI derives display state from API payloads, not local inferred transitions.
- Local optimistic updates only for non-critical UI affordances, never for reward finality.

### Process Patterns

**Error Handling Patterns:**
- Backend:
  - throw/return domain errors with stable `code`.
  - map all errors through centralized exception handler.
- Frontend:
  - show Spanish user-safe messages.
  - expose role-aware "what next" guidance for blocked transitions.

**Loading State Patterns:**
- Use per-view loading states (`isLoadingList`, `isSubmittingApproval`), not one global opaque spinner.
- Disable primary action while submitting critical transitions.
- Always show post-action refresh state for queue/detail consistency.

### Enforcement Guidelines

**All AI Agents MUST:**
- Respect canonical status and role vocab from contracts.
- Enforce tenant scope checks in backend handlers/services (not only UI).
- Use the standard API success/error envelopes.
- Keep reward posting idempotent and transaction-safe.
- Preserve Spanish canonical labels in user-facing messages.

**Pattern Enforcement:**
- PR checklist includes:
  - naming/format compliance
  - response envelope compliance
  - tenant/RBAC checks present
  - state transition guard present
- Violations documented as architecture drift notes in PR discussion.
- Pattern updates require architecture document amendment before broad adoption.

### Pattern Examples

**Good Examples:**
- `POST /api/v1/submissions/:id/approve` returns `{ data: { submission_id, status } }`.
- Rejected transition returns `{ error: { code: "INVALID_STATE_TRANSITION", message: "...", details: {...} } }`.
- Audit log entry: `submission.approved` with actor + institution + submission IDs.

**Anti-Patterns:**
- Returning mixed response shapes across endpoints.
- Allowing frontend-only checks for tenant/role without backend enforcement.
- Using local UI state to mark reward as posted before backend confirmation.
- Mixing `camelCase` and `snake_case` unpredictably in API payloads.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
scholarfi-back/
├── README.md
├── package.json
├── tsconfig.json
├── adonisrc.ts
├── ace
├── .env
├── .env.example
├── bin/
│   ├── server.ts
│   ├── console.ts
│   └── test.ts
├── start/
│   ├── routes.ts
│   ├── kernel.ts
│   ├── env.ts
│   └── validator.ts
├── app/
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├── access_token_controller.ts
│   │   │   └── new_account_controller.ts
│   │   ├── account/
│   │   │   └── profile_controller.ts
│   │   ├── institutions/
│   │   ├── users/
│   │   ├── tasks/
│   │   ├── submissions/
│   │   ├── approvals/
│   │   └── rewards/
│   ├── services/
│   │   ├── auth/
│   │   ├── tenancy/
│   │   ├── workflow/
│   │   ├── rewards/
│   │   └── audit/
│   ├── policies/
│   ├── middleware/
│   │   ├── auth_middleware.ts
│   │   ├── force_json_response_middleware.ts
│   │   ├── tenant_scope_middleware.ts
│   │   └── role_guard_middleware.ts
│   ├── validators/
│   ├── models/
│   └── exceptions/
├── database/
│   ├── migrations/
│   ├── schema.ts
│   └── schema_rules.ts
├── config/
├── providers/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── functional/
└── docs/
    ├── api/
    │   └── openapi.yaml
    └── architecture/

scholarfi/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env
├── .env.example
├── public/
│   └── assets/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── router.tsx
│   │   ├── providers/
│   │   └── guards/
│   ├── api/
│   │   ├── client.ts
│   │   ├── contracts/
│   │   └── modules/
│   │       ├── auth.ts
│   │       ├── institutions.ts
│   │       ├── tasks.ts
│   │       ├── submissions.ts
│   │       └── rewards.ts
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── submissions/
│   │   ├── approvals/
│   │   └── rewards/
│   ├── components/
│   │   ├── sf/
│   │   │   ├── SfPipeline.tsx
│   │   │   ├── SfQueuePageShell.tsx
│   │   │   ├── SfSubmissionCard.tsx
│   │   │   ├── SfAuditTimeline.tsx
│   │   │   ├── SfGovernanceBlock.tsx
│   │   │   └── SfConfirmActionModal.tsx
│   │   └── ui/
│   ├── i18n/
│   │   └── es.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   └── globals.css
│   ├── types/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    └── frontend/
```

### Architectural Boundaries

**API Boundaries:**
- All business mutations flow through `scholarfi-back` `/api/v1/*`.
- Frontend never writes workflow state directly; only calls approved endpoints.
- Auth boundary: token issuance/validation only in backend auth module.
- Tenant boundary: all domain endpoints require institution scoping checks in backend.

**Component Boundaries:**
- `sf-*` components are reusable UI molecules/organisms; features compose them.
- Feature modules own screens and local orchestration, not global shared components.
- i18n strings centralized; feature code consumes keys/labels, does not hardcode duplicated status text.

**Service Boundaries (backend):**
- Controllers: transport layer only.
- Services: workflow/business logic (submission transitions, reward posting).
- Models/queries: persistence concerns.
- Policies/middleware: authorization and tenant scope enforcement.

**Data Boundaries:**
- PostgreSQL is source of truth.
- Workflow transitions validated in service layer before writes.
- Reward transactions and balances updated transactionally in one backend operation.
- Audit entries written by service actions; no frontend-authored audit events.

### Requirements to Structure Mapping

**Feature Mapping:**
- Access/session FRs -> `app/controllers/auth`, `app/services/auth`, `src/features/auth`.
- Institution governance FRs -> `app/controllers/institutions`, `app/services/tenancy`, `src/features/dashboard/admin`.
- Task management FRs -> `app/controllers/tasks`, `app/services/tasks`, `src/features/tasks`.
- Submission workflow FRs -> `app/controllers/submissions`, `app/services/workflow`, `src/features/submissions`.
- Validation/approval FRs -> `app/controllers/approvals`, `app/services/workflow`, `src/features/approvals`.
- Rewards FRs -> `app/controllers/rewards`, `app/services/rewards`, `src/features/rewards`.

**Cross-Cutting Concerns:**
- Tenant isolation -> backend middleware + service query guards.
- RBAC -> policies + route middleware + frontend route guards.
- Canonical statuses/errors -> `app/services/workflow` + `src/api/contracts` + `src/i18n/es.ts`.
- Accessibility and consistency -> `src/components/sf` + shared style tokens.

### Integration Points

**Internal Communication:**
- Frontend feature modules call typed API modules in `src/api/modules`.
- Backend controllers delegate to services; services use models/queries.
- Middleware injects auth/tenant context into request lifecycle.

**External Integrations (MVP-minimal):**
- None required beyond core DB and runtime.
- Optional monitoring/error sink can be added behind backend logger abstraction.

**Data Flow:**
- User action (frontend) -> API request -> auth/tenant checks -> workflow service decision -> DB transaction -> normalized API response -> UI refresh.
- Critical transitions (approve/reward) always re-fetch canonical state after mutation.

### File Organization Patterns

**Configuration Files:**
- Root-level env and build configs per repo.
- API contract docs under backend `docs/api`.
- Architecture docs under `_bmad-output/planning-artifacts` and repo docs folders as needed.

**Source Organization:**
- Backend by domain + layer (controller/service/model).
- Frontend by feature + shared component library (`sf-*`).

**Test Organization:**
- Backend: `tests/unit`, `tests/integration`, `tests/functional`.
- Frontend: unit/integration/e2e split once test stack is enabled.

**Asset Organization:**
- Frontend static assets in `public/assets`.
- Design tokens and global styles under `src/styles`.

### Development Workflow Integration

**Development Server Structure:**
- Run backend and frontend independently; contract alignment via typed API modules and shared response conventions.
- Dev environments use local `.env` with safe defaults.

**Build Process Structure:**
- Backend: lint/typecheck/test/build pipeline.
- Frontend: lint/typecheck/build and optional tests.
- CI validates migrations and API response shape expectations.

**Deployment Structure:**
- Backend deployable as Node service.
- Frontend deployable as static assets.
- Environment separation via per-target env vars and secrets management.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
- Core choices are mutually compatible: AdonisJS modular monolith backend + React/Vite frontend + PostgreSQL relational model.
- MVP-minimalism is consistently applied (no unnecessary microservices, no distributed cache, no realtime dependency).
- Security, tenancy, workflow invariants, and reward idempotency decisions reinforce each other without contradiction.

**Pattern Consistency:**
- Naming patterns (`snake_case` API/DB, TS conventions in code) align across backend/frontend boundaries.
- Response/error envelopes match process and communication patterns.
- State and workflow ownership is consistently backend-first, reducing UI drift risk.

**Structure Alignment:**
- Proposed directory boundaries mirror decision domains (auth, tenancy, workflow, rewards, audit).
- `sf-*` UI wrapper strategy aligns UX spec with implementation consistency rules.
- Integration boundaries are explicit (frontend modules -> versioned backend endpoints -> service layer).

### Requirements Coverage Validation

**Feature Coverage:**
- PRD journey requirements A-F are supported by mapped backend modules and frontend feature directories.
- Two-step governance (teacher validate -> admin approve) is explicitly represented in service boundaries and process patterns.
- Demo repeatability requirements are supported through deterministic flows and constrained architecture.

**Functional Requirements Coverage:**
- Access/session, institutions, user-role admin, tasks, submissions, validations/approvals, and simulated rewards each have architectural homes.
- Cross-cutting FRs (auditability, deterministic errors, role-safe flows) are covered by shared patterns and middleware/service rules.

**Non-Functional Requirements Coverage:**
- Security: tenant scope, role checks, deny-by-default route posture.
- Performance: lean stack, minimal abstraction overhead, targeted optimization path.
- Accessibility: inherited from UX architecture and enforced via component boundaries/patterns.
- Scalability: vertical-first path with clear future extension points.

### Implementation Readiness Validation

**Decision Completeness:**
- Critical and important decisions are documented with rationale.
- Version-sensitive choices are bounded without overcommitting to non-MVP tooling.
- Deferred decisions are clearly marked to prevent scope creep.

**Structure Completeness:**
- Two-repo tree and ownership boundaries are explicit.
- API, component, service, and data boundaries are documented enough for story-level execution.
- Requirements-to-structure mapping is concrete, not generic.

**Pattern Completeness:**
- Major multi-agent conflict points are addressed:
  - naming
  - structure
  - response/error formats
  - event/action vocabulary
  - loading/error process rules

### Gap Analysis Results

**Critical Gaps:** None blocking implementation.

**Important Gaps (should be handled in implementation stories):**
1. Finalize canonical status/error enum artifact location and generation process.
2. Specify exact OpenAPI generation/maintenance mechanism in backend workflow.
3. Decide frontend test runner/tooling baseline before broad FE implementation starts.

**Nice-to-Have Gaps:**
- Formal ADR index in repo docs.
- Optional contract test layer between frontend API modules and backend responses.
- Optional seed dataset automation docs for demo operators.

### Validation Issues Addressed

- Reduced previous "future-proofing" ambiguity by locking strict MVP minimalism.
- Removed dependency pressure for additional frontend state libraries unless proven necessary.
- Clarified that workflow finality and reward posting remain backend-authoritative and transaction-guarded.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions/bounds
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance/security considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements-to-structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear FE/BE split with explicit contract boundaries.
- Strong governance workflow and idempotency safeguards.
- Minimalist architecture that fits MVP scope and current repo reality.
- Consistency rules designed to reduce multi-agent implementation conflicts.

**Areas for Future Enhancement:**
- Contract automation (OpenAPI + typed clients).
- Observability depth (metrics/traces).
- Advanced caching/realtime only when validated by usage.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow documented boundaries before creating new abstractions.
- Enforce tenant + role + workflow checks on every protected mutation path.
- Keep response and error shapes consistent.
- Treat backend as workflow source of truth; frontend reflects canonical state.

**First Implementation Priority:**
1. Establish canonical enums/contracts (`roles`, `submission_status`, error codes).
2. Implement guarded workflow transitions and reward idempotency path in backend.
3. Implement frontend role shells + queue/detail flows consuming canonical responses.
