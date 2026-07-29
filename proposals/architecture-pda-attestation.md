# Architecture — PDA program + SAS attestation (as-built)

Current architecture of the on-chain school leaderboard PDAs and the off-chain SAS attestation path already wired into reward issuance.

**Status:** implemented (devnet POC)  
**Program id:** `9H5oUgPiu6AZKP6BTwSZ2z7gQSCg3d1Gxmk6q3ZSK9yF`  
**Related specs:** [`sas-school-leaderboard.md`](./sas-school-leaderboard.md) (original proposal), [`sas-school-leaderboard-accounts.md`](./sas-school-leaderboard-accounts.md) (account fields)

> **Order vs proposal:** production flow is **mint → attest → record_score** (best-effort), not attest → score → mint. Credits/SPL remain authoritative; SAS + leaderboard are additive proofs.

---

## 1. Layer map

```mermaid
flowchart TB
    subgraph OffChain["Off-chain"]
        FE["React SPA"]
        API["AdonisJS API\noracle + SAS signer + mint authority"]
        DB[("PostgreSQL\nsubmissions · pools · submission_chain_proofs")]
        GC["Google Classroom"]
    end

    subgraph SolanaStack["Solana"]
        SPL["SPL Token\nmintTo student ATA"]
        SAS["Solana Attestation Service\nCredential · Schema · Attestation"]
        LB["scholarfi_school_leaderboard\nGlobalConfig · SchoolBoard · ProcessedAchievement"]
    end

    GC --> API
    FE --> API
    API --> DB
    API -->|"1. mintTo (settlement)"| SPL
    API -->|"2. createAttestation (if SAS_ENABLED)"| SAS
    API -->|"3. record_score (if SAS_ENABLED)"| LB

    style SPL fill:#fff3e0,stroke:#E65100
    style SAS fill:#e8f5e9,stroke:#2E7D32
    style LB fill:#ede7f6,stroke:#5E35B1
```

| Layer | Responsibility | Trust model |
|-------|----------------|-------------|
| **SPL** | Economic settlement of rewards | Existing custodial mint authority |
| **SAS** | Portable, verifiable achievement claim | Credential authority = ScholarFi signer |
| **Leaderboard program** | Aggregate school points + idempotency PDAs | Oracle signer gates `init_school` / `record_score` |
| **Postgres** | Workflow, credit pools, chain-proof index | App DB (source of truth for product state) |

---

## 2. PDA program — accounts & instructions

```mermaid
flowchart LR
    subgraph Program["scholarfi_school_leaderboard"]
        GC["GlobalConfig\nseeds: [b\"config\"]"]
        SB["SchoolBoard\nseeds: [b\"school\", institution_id LE]"]
        PA["ProcessedAchievement\nseeds: [b\"processed\", submission_hash]"]
    end

    IX1["initialize\n(authority)"] --> GC
    IX2["init_school\n(oracle)"] --> SB
    IX2 -.-> GC
    IX3["record_score\n(oracle)"] --> SB
    IX3 --> PA
    IX3 -.-> GC
    IX4["set_paused\n(authority)"] --> GC
```

### PDAs (implemented)

| Account | Seeds | Purpose |
|---------|-------|---------|
| `GlobalConfig` | `[b"config"]` | Singleton: authority, oracle, `season_id`, `paused` |
| `SchoolBoard` | `[b"school", institution_id.to_le_bytes()]` | Aggregate school score for ranking |
| `ProcessedAchievement` | `[b"processed", submission_hash]` | Idempotency: one submission → one score credit |

### Instructions (implemented)

| Instruction | Signer | Effect |
|-------------|--------|--------|
| `initialize` | authority + payer | Creates `GlobalConfig` (season=1, paused=false) |
| `init_school(institution_id, name_hash)` | oracle + payer | Creates `SchoolBoard`; fails if paused |
| `record_score(submission_hash, points, student)` | oracle + payer | `SchoolBoard` += points; creates `ProcessedAchievement` |
| `set_paused(paused)` | authority | Emergency stop |

`record_score` guards: not paused · `0 < points ≤ u16::MAX` · school season matches global season · `ProcessedAchievement` must not already exist.

### Not on-chain yet

`StudentScore` PDA · `rotate_season` · `set_oracle` · on-chain SAS account check on `record_score` (proposal v1.1).

---

## 3. SAS surface (ecosystem program)

```mermaid
flowchart TB
    Setup["ace sas:setup\n(one-time)"] --> Cred["Credential PDA\nname: ScholarFi"]
    Setup --> Schema["Schema PDA\nscholarfi.achievement.v1"]

    Issue["issueAchievementAttestation"] --> Nonce["nonce = Keypair.fromSeed(submission_hash).pubkey"]
    Cred --> Att["Attestation PDA\n(credential, schema, nonce)"]
    Schema --> Att
    Nonce --> Att

    Att --- Data["Data fields\ninstitution_id · submission_hash · task_hash\npoints · issued_at · season_id"]
```

**Schema layout bytes:** `[3, 13, 13, 3, 8, 3]` → U64, VecU8, VecU8, U64, I64, U64.

Student wallet is **not** stored in SAS data; it is only passed to `record_score` / `ProcessedAchievement.student`.

---

## 4. Canonical hash bridge

Same `submission_hash` links off-chain rows, SAS attestation, and the leaderboard idempotency PDA:

```text
submission_hash = SHA256("scholarfi:submission:{submissionId}")   // 32 bytes
task_hash       = SHA256("scholarfi:task:{taskId}")
nonce pubkey    = Keypair.fromSeed(submission_hash).publicKey
```

```mermaid
flowchart LR
    Sub["submission.id\n(Postgres)"] --> H["submission_hash\n32 bytes"]
    H --> Proof["submission_chain_proofs\n.submission_hash"]
    H --> SAS["SAS Attestation\ndata + nonce"]
    H --> PA["ProcessedAchievement\nPDA seed"]
```

---

## 5. End-to-end runtime flow

Triggered after a successful reward mint (`issueRewardForSubmission`), when `SAS_ENABLED=true`, institution is on-chain, mint is `confirmed`, and the student wallet is known.

```mermaid
sequenceDiagram
    actor Teacher
    participant API as Backend API
    participant DB as PostgreSQL
    participant SPL as SPL Token
    participant Hook as chain_proofs_hook
    participant SAS as SAS program
    participant LB as Leaderboard program

    Teacher->>API: Approve submission / issue reward
    API->>DB: Debit credit pool
    API->>SPL: mintTo(student ATA)
    SPL-->>API: confirmed signature

    opt SAS_ENABLED && on-chain && wallet present
        API->>Hook: maybeIssueChainProofsAfterMint
        Hook->>DB: upsert submission_chain_proofs (pending)

        Hook->>SAS: createAttestation (or reuse existing PDA)
        SAS-->>Hook: attestationPda + signature
        Hook->>DB: status = attested

        Hook->>LB: ensureSchoolBoard (init_school if missing)
        Hook->>LB: record_score(submission_hash, points, student)
        LB-->>Hook: leaderboard signature + PDAs
        Hook->>DB: status = scored (or partial / failed)
    end

    Note over API,Hook: Hook never throws into the reward path
```

### Status machine (`submission_chain_proofs`)

```mermaid
stateDiagram-v2
    [*] --> pending: row created
    pending --> attested: SAS ok, score pending/failed
    pending --> scored: both ok (rare single write)
    attested --> scored: record_score ok
    attested --> partial: one side only
    pending --> partial: one side only
    pending --> failed: both failed
    attested --> failed: score failed & no usable partial
```

Statuses used in code: `pending` → `attested` → `scored` / `partial` / `failed`.

---

## 6. Backend service map

```mermaid
flowchart TB
    Reward["reward_issuance_service\nissueRewardForSubmission"] --> Mint["SPL mint"]
    Reward --> Hook["chain_proofs_hook\nmaybeIssueChainProofsAfterMint"]

    Hook --> AttSvc["sas_attestation_service\nissueAchievementAttestation"]
    Hook --> LbSvc["leaderboard_score_service\nrecordScoreForSubmission"]
    Hook --> ProofModel["SubmissionChainProof"]

    AttSvc --> AttClient["sas_attestation_client\ncredential / schema / createAttestation"]
    AttSvc --> Hashes["hashes.ts\nsubmission_hash · task_hash · nonce"]
    LbSvc --> ScoreClient["school_score_client\nPDA helpers + IX builders"]
    LbSvc --> Hashes

    AttClient --> SasSdk["sas_sdk / sas-lib"]
    ScoreClient --> IDL["resources/idl/\nscholarfi_school_leaderboard.json"]
```

### Ops commands

| Command | Role |
|---------|------|
| `node ace sas:setup` | Create/pin Credential + Schema PDAs |
| `node ace sas:attest` | Manual attestation (+ optional `--record-score`) |
| `node ace school-score:devnet` | Smoke initialize / init_school / record_score |

---

## 7. Trust & failure boundaries

```mermaid
flowchart TB
    subgraph Authoritative["Authoritative product path"]
        Pool["Credit pool debit"]
        MintPath["SPL mint confirmed"]
    end

    subgraph Additive["Additive chain proofs — best effort"]
        Att["SAS attestation"]
        Score["record_score"]
        Index["submission_chain_proofs index"]
    end

    Pool --> MintPath
    MintPath -.->|"SAS_ENABLED"| Att
    Att -.-> Score
    Att --> Index
    Score --> Index

    MintPath -->|"survives attest/score failure"| Done["Reward stays issued"]
```

- Mint success is **independent** of attestation / leaderboard failures.
- Oracle / SAS authorized signer often reuse the mint authority keypair in the POC.
- No on-chain gate yet: `record_score` does not verify a SAS attestation account (planned v1.1).

---

## 8. Source map

| Area | Path |
|------|------|
| Program | `scholarfi-contracts/programs/scholarfi-school-leaderboard/` |
| Hashes | `scholarfi-back/app/services/attestation/hashes.ts` |
| SAS client / service | `scholarfi-back/app/services/attestation/sas_*.ts` |
| Post-mint hook | `scholarfi-back/app/services/attestation/chain_proofs_hook.ts` |
| Leaderboard client | `scholarfi-back/app/services/leaderboard/` |
| Reward integration | `scholarfi-back/app/services/credits/reward_issuance_service.ts` |
| Proof model / migration | `submission_chain_proof.ts` · `1776000000000_create_submission_chain_proofs.ts` |

---

## 9. Implemented vs still proposed

| Item | Status |
|------|--------|
| GlobalConfig / SchoolBoard / ProcessedAchievement | Done |
| initialize / init_school / record_score / set_paused | Done |
| SAS credential + schema + attestation | Done |
| Post-mint hook + `submission_chain_proofs` | Done |
| StudentScore PDA | Not yet |
| rotate_season / set_oracle | Not yet |
| On-chain SAS check on `record_score` | Not yet (v1.1) |
| Leaderboard UI / public indexer API | Not yet |
