# Arquitectura MVP — ScholarFi

Documento de arquitectura inicial para el MVP. Todos los diagramas están en **Mermaid** para que puedas editarlos en GitHub, Notion, Miro (import), VS Code, etc.

**Criterio de aceptación:** arquitectura comprensible, viable y alineada con el alcance del MVP.

> **Alcance MVP:** Las transacciones cripto en **Solana son obligatorias** para el producto final. El modo `TOKEN_MODE=mock` (ledger simulado en DB) existe **solo para piloto y demostración** — permite validar el workflow escolar sin depender de la red en entornos de prueba, pero no sustituye la liquidación on-chain del MVP.

### Correcciones incorporadas (feedback Solana)

| Observación                                                                                          | Corrección en este documento                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| El proceso de aprobaciones no mostraba la **asignación de tokens/presupuesto antes de la cola FIFO** | §3.1, §10.1, §10.2 y §10.7: paso explícito `resolveSyncFunding` + `rewardAmount` **antes** de cargar la cola FIFO  |
| Ningún diagrama consideraba **handlers** (p. ej. presupuesto insuficiente)                           | Handlers añadidos en §3.1, §5, §10.1–§10.4 y §10.7 (`budget_exhausted`, mint fallido, OAuth, ATA, idempotencia)    |
| El diagrama de componentes no especificaba **qué información almacena** cada bloque                  | §1, §2 y §5: cada bloque etiqueta datos/entidades; §2 incluye columna «Datos que almacena / expone»                |
| Ampliar uso de tecnología para **mejorar adopción**                                                  | §1 y §7: stack Solana visible (SPL + **SAS** + **cNFT**/Bubblegum + ATA + Solscan); roadmap Phantom/Anchor en §7.4 |

---

## Guía para stakeholders Solana

Diagramas marcados con prioridad para presentaciones a fundaciones, grants, inversores o partners del ecosistema Solana.

| Prioridad    | Significado                  | Uso en pitch                |
| ------------ | ---------------------------- | --------------------------- |
| 🟣 **Alta**  | Demuestra uso real de Solana | Mostrar siempre             |
| 🟡 **Media** | Contexto técnico o escala    | Mostrar si hay tiempo / Q&A |
| ⚪ **Baja**  | Interno o educación escolar  | Omitir en primera reunión   |

### Orden recomendado de presentación (6 slides)

| Slide | Sección           | Por qué les importa                                               |
| ----- | ----------------- | ----------------------------------------------------------------- |
| 1     | **§1**            | Vista general: Solana como capa de liquidación + datos por bloque |
| 2     | **§4**            | Qué vive on-chain vs off-chain                                    |
| 3     | **§10.7** ⭐      | Historia completa: asignación → FIFO → SPL en wallet (+ handlers) |
| 4     | **§10.5 + §10.6** | Prueba técnica: mint, ATA, firmas                                 |
| 5     | **§10.1 o §10.8** | Volumen de txs y escala por aula                                  |
| 6     | **§9 + §7.4**     | Solana obligatorio + adopción tecnológica                         |

### Índice de diagramas por prioridad Solana

| Sección | Título                                   | Prioridad                    |
| ------- | ---------------------------------------- | ---------------------------- |
| §1      | Diagrama simple de arquitectura          | 🟣 Alta                      |
| §2      | Descripción de componentes               | 🟡 Media                     |
| §3.1    | Flujo de recompensa manual               | 🟡 Media                     |
| §3.2    | Flujo por rol (navegación)               | ⚪ Baja                      |
| §4      | Mapa usuario → wallet → Solana → DB      | 🟣 Alta                      |
| §5      | Componentes internos backend             | ⚪ Baja                      |
| §6      | Modelo de datos (ER)                     | ⚪ Baja                      |
| §7      | Dependencias e integraciones             | 🟡 Media                     |
| §7.4    | Ampliación tecnológica / adopción Solana | 🟣 Alta                      |
| §8      | Riesgos técnicos                         | 🟡 Media (Q&A)               |
| §9      | Decisiones de arquitectura               | 🟣 Alta                      |
| §10.1   | Pipeline Classroom + tokens              | 🟣 Alta                      |
| §10.2   | Classroom sync detallado                 | 🟡 Media                     |
| §10.3   | Bucle FIFO                               | 🟡 Media                     |
| §10.4   | Orquestación emisión                     | 🟡 Media                     |
| §10.5   | Secuencia on-chain (mint SPL)            | 🟣 Alta                      |
| §10.6   | Componentes on-chain                     | 🟣 Alta                      |
| §10.7   | End-to-end Classroom → wallet            | 🟣 **Alta — slide estrella** |
| §10.8   | Carga de datos / tablas                  | 🟡 Media                     |
| §11     | Arquitectura Post-MVP (programs)         | 🟣 Alta (roadmap Solana)     |

---

## 1. Diagrama simple de arquitectura

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 1 de 6

Vista de alto nivel de los componentes principales, **qué información guarda cada bloque**, y cómo se conectan al stack Solana (**SPL + SAS + cNFT** + explorador).

```mermaid
flowchart TB
    subgraph Usuario["👤 Usuarios"]
        Student["Estudiante\nperfil, wallet, saldo, logros"]
        Teacher["Docente\ntareas, validaciones, pool"]
        Admin["Admin escolar\naprobaciones, presupuesto,\nattestaciones"]
        Super["Super admin\ninstituciones, crypto toggle"]
    end

    subgraph Frontend["🖥️ Frontend — scholarfi"]
        SPA["React 19 + Vite + TypeScript\nTailwind + daisyUI\n· sesión JWT en memoria\n· UI por rol (sin secretos on-chain)"]
        AuthUI["AuthContext\nemail/password → JWT"]
        Routes["Rutas por rol\nstudent | teacher | admin | super"]
    end

    subgraph Backend["⚙️ Backend — scholarfi-back"]
        API["AdonisJS 7 API /api/v1\norquestación + handlers de error"]
        Auth["Auth + RBAC + Tenant\nroles, institution_id"]
        Workflow["Workflow académico\ntasks, submissions,\nvalidations, estados"]
        Credits["Motor de créditos\npools, rewardAmount,\nasignación previa a FIFO"]
        Handlers["Handlers de dominio\nbudget_exhausted · mint_failed\nOAuth · idempotencia"]
        TokenFactory["Token Service Factory\n@solana/web3.js + @solana/spl-token\n| mock (piloto/demo)"]
        SASSvc["SAS Attestation Service\nmilestones / logros verificables"]
        CnftSvc["cNFT Diplomas\nMetaplex Bubblegum"]
        GCConnector["Google Classroom\nOAuth tokens cifrados + sync"]
    end

    subgraph Data["💾 Datos — PostgreSQL 15+"]
        PG[("institutions, users, roles\ntasks, submissions, validations\nteacher/institution_credit_pools\ntoken_balances, token_transactions\nattestation PDAs / signatures\ndiploma assetIds\nwallets cifradas, syncMetadata")]
    end

    subgraph Blockchain["⛓️ Solana — obligatorio en MVP"]
        RPC["RPC Solana\ndevnet / mainnet-beta"]
        SPL["SPL Token Program\nmintTo · transfer\n(liquidación económica)"]
        SAS["Solana Attestation Service\ncredential · schema · attestation\n(prueba de logro)"]
        CNFT["Compressed NFTs\nMetaplex Bubblegum\n(diplomas / credenciales)"]
        ATA["Associated Token Accounts\n(estudiante + tesorería)"]
        MintAuth["Mint Authority\n(firma server-side)"]
        Custodial["Wallets custodiales\nkeypair por estudiante"]
    end

    subgraph External["🌐 Ecosistema / APIs"]
        GClassroom["Google Classroom API\nnotas + roster"]
        Solscan["Solscan / Explorer\nprueba pública de signature"]
    end

    Student & Teacher & Admin & Super --> SPA
    SPA --> AuthUI & Routes
    SPA -->|"HTTPS REST\nBearer JWT"| API

    API --> Auth
    Auth --> Workflow & Credits & GCConnector
    Credits --> Handlers
    Workflow & Credits & GCConnector --> PG
    Credits --> TokenFactory
    API --> SASSvc & CnftSvc
    Handlers -.->|"skip / rollback / retry"| Credits
    TokenFactory -->|"TOKEN_MODE=solana\n(MVP — producción)"| RPC
    TokenFactory -->|"TOKEN_MODE=mock\n(piloto / demo)"| PG
    SASSvc --> RPC
    CnftSvc --> RPC
    RPC --> SPL
    RPC --> SAS
    RPC --> CNFT
    SPL --> ATA
    MintAuth --> SPL
    Custodial --> ATA
    SAS -.->|"attestation PDA\nen wallet estudiante"| Custodial
    CNFT -.->|"leaf owner =\nwallet estudiante"| Custodial

    GCConnector --> GClassroom
    SPA -.->|"enlace de lectura\nde tx / PDAs"| Solscan
    Solscan -.-> RPC

    style SPL fill:#fff3e0,stroke:#E65100
    style SAS fill:#e8f5e9,stroke:#2E7D32
    style CNFT fill:#ede7f6,stroke:#5E35B1
```

**Qué almacena cada capa (resumen):**

| Bloque            | Tipo de información                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Frontend          | Solo UI/estado de sesión (JWT); **no** guarda secretos de wallet ni mint authority            |
| Backend Workflow  | Estados de tarea/envío/aprobación y auditoría off-chain                                       |
| Motor de créditos | Presupuesto asignado/utilizado, `rewardAmount`, fuente de fondeo (docente/institución)        |
| Handlers          | Resultados de excepción: `budget_exhausted`, mint fallido, OAuth inválido, replay idempotente |
| PostgreSQL        | Source of truth operativa + índice de txs SPL, attestation PDAs y diploma assetIds            |
| **SPL / ATA**     | Liquidación económica de recompensas (tokens fungibles)                                       |
| **SAS**           | Attestaciones verificables de logros (p. ej. milestone «5 primeras actividades»)              |
| **cNFT**          | Diplomas / credenciales comprimidas (Metaplex Bubblegum) como complemento al SPL              |
| Solscan           | Visibilidad pública para adopción y verificación (sin firma en cliente)                       |

---

## 2. Descripción breve de cada componente

> 🟡 **Stakeholder Solana — Prioridad media** · Referencia, no slide principal

| Componente                      | Repositorio / tecnología                                         | Responsabilidad                                                                                                 | Datos que almacena / expone                                                    |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Frontend (SPA)**              | `scholarfi` — React 19, Vite 8, TypeScript, Tailwind, daisyUI    | UI por rol, flujos de tareas/envíos/aprobaciones, login email/password, consumo de API REST                     | JWT en memoria, preferencias UI; enlaces Solscan (solo lectura)                |
| **Cliente API**                 | `src/api/client.ts`                                              | `fetch` autenticado, base URL `/api/v1`, manejo de errores en español                                           | Envelope `{ data }` / errores tipados                                          |
| **Backend API**                 | `scholarfi-back` — AdonisJS 7, TypeScript                        | Lógica de negocio, autorización, orquestación del workflow y emisión de recompensas                             | Requests, logs, resultados de handlers                                         |
| **Base de datos**               | PostgreSQL 15+ (Lucid ORM)                                       | Tenancy, usuarios/roles, tareas, envíos, validaciones, pools de crédito, auditoría off-chain e índice on-chain  | `users`, `tasks`, `submissions`, `*_credit_pools`, `token_*`, wallets cifradas |
| **Motor de créditos**           | `reward_issuance_service`, pools                                 | Asigna presupuesto (`remainingCredits` + `rewardAmount`) **antes** del bucle FIFO; debita e emite (idempotente) | `teacher_credit_pools/entries`, `institution_credit_*`                         |
| **Handlers de dominio**         | sync + issuance services                                         | Respuestas explícitas a fallos (presupuesto, mint, OAuth, duplicados)                                           | `reward_skipped_reason`, `token_transactions.status=failed`, rollbacks         |
| **Token Service (MVP)**         | `solana_token_service` + `@solana/web3.js` + `@solana/spl-token` | **Producción:** mint/transfer SPL, ATA, Mint Authority; cada recompensa genera tx on-chain                      | `transactionSignature`, ATA address, mint decimals                             |
| **Token Service (piloto/demo)** | `mock_token_service`                                             | **Solo demostración:** ledger simulado sin red Solana (`TOKEN_MODE=mock`)                                       | Filas simuladas en `token_balances` / `token_transactions`                     |
| **Wallet (MVP)**                | Backend custodial                                                | Keypairs por estudiante; firma server-side (sin Phantom en MVP)                                                 | `wallet_public_key`, `encrypted_wallet_secret`                                 |
| **Solana**                      | SPL Token Program, ATA, RPC                                      | **Red obligatoria del MVP** para liquidar recompensas SPL                                                       | Estado on-chain del mint y ATAs                                                |
| **Google Classroom**            | OAuth + sync de calificaciones                                   | Importar tareas, sincronizar notas, distribuir recompensas FIFO hasta agotar presupuesto                        | Refresh tokens cifrados, `external_grade`, `syncMetadata`                      |
| **Solscan / Explorer**          | Enlace externo en UI admin                                       | Prueba pública de tx para transparencia y adopción                                                              | URL por `signature` (sin custodia de datos)                                    |

---

## 3. Flujo básico del usuario

> 🟡 **Stakeholder Solana — Prioridad media** · §3.1 útil; §3.2 omitir en pitch

### 3.1 Flujo principal de recompensa (con asignación de tokens y handlers)

```mermaid
sequenceDiagram
    autonumber
    actor S as Estudiante
    actor T as Docente
    actor A as Admin escolar
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant SOL as Solana (MVP)

    S->>FE: Login (email/password)
    FE->>API: POST /auth/login
    API->>DB: Validar credenciales + roles
    API-->>FE: JWT + perfil

    T->>FE: Crear tarea (manual o desde Classroom)
    FE->>API: POST /tasks o /tasks/from-classroom
    API->>DB: Persistir tarea + rewardAmount

    S->>FE: Ver tareas disponibles
    FE->>API: GET /tasks/available
    S->>FE: Enviar trabajo
    FE->>API: POST /submissions
    API->>DB: submission = pending

    T->>FE: Validar envío
    FE->>API: POST /submissions/:id/teacher-action
    API->>DB: teacher_validated

    A->>FE: Aprobar envío
    FE->>API: POST /submissions/:id/admin-decision

    Note over API,DB: Asignación de tokens / presupuesto<br/>ANTES de emitir (equivalente a pre-FIFO en sync)
    API->>DB: resolveFunding + remainingCredits<br/>vs task.rewardAmount

    alt Handler: presupuesto insuficiente
        API->>DB: NO aprueba · registrar rechazo / error de créditos
        API-->>FE: Error: créditos insuficientes
    else Presupuesto OK
        API->>DB: BEGIN · approved + debit pool + reward_transaction
        API->>SOL: SPL mint/transfer (wallet custodial)
        alt Handler: mint Solana fallido
            SOL-->>API: error RPC / tx
            API->>DB: ROLLBACK · token_transactions=failed<br/>(aprobación NO persiste)
            API-->>FE: Error: Solana mint failed
        else Mint OK
            SOL-->>API: transaction signature
            API->>DB: COMMIT · signature + token_balances
            API-->>FE: Aprobado + signature
        end
    end

    Note over API,DB: Piloto/demo: TOKEN_MODE=mock omite Solana<br/>y escribe ledger simulado en DB

    S->>FE: Ver saldo e historial
    FE->>API: GET /rewards/balance, /rewards/history
    API-->>FE: Saldo + historial + transaction signature
```

**Handlers del flujo de aprobación (manual):**

| Condición                           | Handler              | Efecto                                                           |
| ----------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `remainingCredits < rewardAmount`   | Rechazo de emisión   | No cambia a `approved`; UI muestra créditos insuficientes        |
| Mint SPL / RPC falla                | Rollback de la tx DB | Submission no queda aprobada; `token_transactions.status=failed` |
| Reintento del mismo `submission_id` | Idempotencia         | No doble-emite; reutiliza resultado previo                       |

### 3.2 Flujo por rol (navegación)

> ⚪ **Stakeholder Solana — Prioridad baja** · Flujo escolar interno

```mermaid
flowchart LR
    Login["/login"] --> Auth["JWT + perfil"]
    Auth --> Redirect["HomeRedirect\n(por rol)"]

    Redirect --> Student["Estudiante\n/saldo, /tareas, /envíos"]
    Redirect --> Teacher["Docente\n/tareas, /clases, /integraciones, /cola-validación"]
    Redirect --> Admin["Admin escolar\n/usuarios, /presupuesto, /cola-aprobación, /bitácora"]
    Redirect --> Super["Super admin\n/instituciones, pools, crypto toggle"]
    Redirect --> NGO["NGO admin\n/dashboard"]
```

---

## 4. Mapa de flujo: Usuario → Wallet → Aplicación → Solana → Base de datos

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 2 de 6 — límites on-chain / off-chain

```mermaid
flowchart LR
    subgraph OffChain["OFF-CHAIN"]
        U["👤 Usuario\n(estudiante / docente / admin)"]
        Browser["🌐 Navegador\nReact SPA"]
        API["⚙️ Backend AdonisJS"]
        DB[("🗄️ PostgreSQL\nusuarios, tareas, envíos,\npools, ledger, auditoría,\nattestation + diploma índices")]
        GC["📚 Google Classroom API"]
    end

    subgraph OnChain["ON-CHAIN — obligatorio en MVP"]
        W["🔐 Wallet custodial\n(generada por backend,\nkeypair cifrado en DB)"]
        SPL["🪙 SPL Token\nmint/transfer\n(liquidación)"]
        SAS["📝 SAS Attestation\nlogros verificables"]
        CNFT["🎓 cNFT diplomas\nMetaplex Bubblegum"]
        Explorer["🔍 Solscan\n(prueba pública)"]
    end

    U -->|"1. Login email/password"| Browser
    Browser -->|"2. REST + Bearer JWT"| API
    API -->|"3. CRUD workflow + créditos"| DB
    API <-->|"4. OAuth + sync notas"| GC

    API -->|"5a. Liquidar recompensa SPL"| W
    API -->|"5b. Emitir attestation SAS"| SAS
    API -->|"5c. Mintear cNFT diploma"| CNFT
    W -->|"6. Firmar tx server-side"| SPL
    SPL -->|"7. Signature"| API
    SAS -->|"7b. Attestation PDA + sig"| API
    CNFT -->|"7c. assetId + sig"| API
    API -->|"8. Persistir signature / PDAs / saldo"| DB
    Browser -.->|"9. Enlace lectura (admin)"| Explorer
    Explorer -.-> SPL
    Explorer -.-> SAS
    Explorer -.-> CNFT

    style OffChain fill:#e8f4fd,stroke:#2196F3
    style OnChain fill:#fff3e0,stroke:#FF9800
    style SPL fill:#fff3e0,stroke:#E65100
    style SAS fill:#e8f5e9,stroke:#2E7D32
    style CNFT fill:#ede7f6,stroke:#5E35B1
```

### Leyenda on-chain vs off-chain

| Capa                                | Qué vive aquí                                | Ejemplos                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Off-chain**                       | Gobernanza, workflow y datos operativos      | Login, RBAC, tareas, envíos, aprobaciones docente→admin, pools de crédito, presupuestos, integración Classroom, índice de transacciones / attestations / diplomas |
| **On-chain — SPL**                  | Liquidación económica de recompensas         | Mint/transfer SPL, ATA, `transactionSignature`                                                                                                                    |
| **On-chain — SAS**                  | Prueba portable de logro académico           | Credential / schema / attestation PDA (p. ej. milestone 5 actividades)                                                                                            |
| **On-chain — cNFT**                 | Credencial visual / diploma                  | Compressed NFT (Metaplex Bubblegum) en wallet del estudiante                                                                                                      |
| **Híbrido**                         | Backend orquesta; Solana liquida y atestigua | Aprueba off-chain → mint SPL (+ SAS / cNFT según flujo) → índice en DB                                                                                            |
| **Piloto/demo (`TOKEN_MODE=mock`)** | Simulación off-chain del ledger              | Solo para demostraciones y pruebas de workflow sin red; **no cumple el criterio de liquidación cripto del MVP**                                                   |

> **Nota MVP:** Toda recompensa aprobada debe terminar en una transacción Solana verificable (SPL). SAS y cNFT son **complementos** de prueba/credencial junto a la liquidación SPL. El modo mock acelera piloto y demos internas, pero la arquitectura de producción asume `TOKEN_MODE=solana` con `crypto_wallets_enabled` por institución.

---

## 5. Diagrama de componentes internos del backend

> ⚪ **Stakeholder Solana — Prioridad baja** · Due diligence técnica solamente

Cada bloque indica **qué información produce o persiste**.

```mermaid
flowchart TB
    subgraph HTTP["Capa HTTP — entrada/salida API"]
        C1["Auth Controllers\nJWT, perfil, roles"]
        C2["Tasks / Submissions\nestados, rewardAmount"]
        C3["Institutions / Groups\ntenancy, roster"]
        C4["Rewards / Credits\npools, historial, saldo"]
        C5["Google Classroom\nOAuth status, sync result"]
    end

    subgraph Middleware["Middleware — contexto de seguridad"]
        M1["auth\nBearer JWT"]
        M2["role\npermisos por rol"]
        M3["tenantScope\ninstitution_id"]
    end

    subgraph Services["Servicios de dominio — reglas + handlers"]
        S1["Role Query\nroles efectivos"]
        S2["Reward Issuance\ndébito + mint + handlers"]
        S3["Group Upsert / CSV\nroster estudiantes"]
        S4["Classroom OAuth + Sync\nnotas, FIFO, skip reasons"]
        S5["Token Factory\nsolana | mock"]
        S6["Mock Token Service\nledger simulado (demo)"]
        S7["Solana Token Service\nmint, ATA, signatures"]
        S8["SAS Attestation\nmilestone / logro PDA"]
        S9["cNFT Diplomas\nBubblegum mint"]
        H["Handlers\nbudget_exhausted\nmint_failed · OAuth\nalready_rewarded"]
    end

    subgraph Persistence["Persistencia — tipo de dato por almacén"]
        Models["Lucid Models\nmapeo entidad ↔ tabla"]
        PG[("PostgreSQL\nworkflow + pools +\níndice on-chain +\nattestation / diploma refs +\nwallets cifradas")]
    end

    subgraph Chain["Solana — liquidación + prueba + credencial"]
        SolanaRPC["RPC"]
        SPL["SPL Token\nmint authority, ATA"]
        SAS["SAS\ncredential · attestation"]
        CNFT["cNFT\nMetaplex Bubblegum"]
    end

    C1 & C2 & C3 & C4 & C5 --> M1 --> M2 --> M3
    M3 --> S1 & S2 & S3 & S4 & S5 & S8 & S9
    S2 & S4 --> H
    S5 --> S6 & S7
    S1 & S2 & S3 & S4 & S6 --> Models --> PG
    S7 & S8 & S9 --> PG
    S7 --> SolanaRPC --> SPL
    S8 --> SolanaRPC
    S9 --> SolanaRPC
    SolanaRPC --> SAS
    SolanaRPC --> CNFT
    H -.->|"skip / rollback / break"| S2

    style SPL fill:#fff3e0,stroke:#E65100
    style SAS fill:#e8f5e9,stroke:#2E7D32
    style CNFT fill:#ede7f6,stroke:#5E35B1
```

| Servicio             | Información que maneja                                                |
| -------------------- | --------------------------------------------------------------------- |
| Auth Controllers     | Credenciales, JWT, perfil con roles                                   |
| Tasks / Submissions  | Metadatos de tarea, `rewardAmount`, estados de envío                  |
| Rewards / Credits    | `remainingCredits`, entradas de débito, historial                     |
| Classroom Sync       | Notas GC, cola FIFO, `reward_skipped_reason`, `lastSyncSummary`       |
| Reward Issuance      | Fuente de fondeo, idempotencia por `submission_id` / `achievement_id` |
| Solana Token Service | Keypairs cifrados, ATA, `signature`, saldo on-chain indexado          |
| **SAS Attestation**  | Attestation PDA, schema/credential refs, signatures de milestone      |
| **cNFT Diplomas**    | `assetId`, metadata URI, proof/leaf owner en wallet estudiante        |
| Handlers             | Ramas de error sin dejar el sistema en estado inconsistente           |

---

## 6. Modelo de datos simplificado (entidades clave)

> ⚪ **Stakeholder Solana — Prioridad baja** · Omitir en pitch inicial

```mermaid
erDiagram
    INSTITUTION ||--o{ USER : tiene
    INSTITUTION ||--o{ TASK : publica
    INSTITUTION ||--o{ INSTITUTION_CREDIT_POOL : financia
    USER ||--o{ USER_ROLE : tiene
    USER ||--o{ SUBMISSION : envia
    TASK ||--o{ SUBMISSION : recibe
    SUBMISSION ||--o{ SUBMISSION_VALIDATION : audita
    TEACHER_CREDIT_POOL ||--o{ TEACHER_CREDIT_ENTRY : registra
    USER ||--o| SIMULATED_BALANCE : saldo_mock
    USER ||--o{ REWARD_TRANSACTION : historial
    USER ||--o| TOKEN_BALANCE : saldo_onchain
    USER ||--o{ TOKEN_TRANSACTION : tx_onchain
    INSTITUTION {
        string code
        boolean crypto_wallets_enabled
    }
    SUBMISSION {
        string status
    }
```

---

## 7. Dependencias técnicas e integraciones críticas

> 🟡 **Stakeholder Solana — Prioridad media** · Destacar fila Solana SPL en §7.2

### 7.1 Stack obligatorio (MVP core)

```mermaid
mindmap
  root((ScholarFi MVP))
    Frontend
      React 19
      Vite 8
      TypeScript
      Tailwind 4 + daisyUI 5
      react-router-dom 7
    Backend
      AdonisJS 7
      Lucid ORM
      VineJS validation
      Node.js 22+
    Datos
      PostgreSQL 15+
    Blockchain MVP
      Solana devnet/mainnet
      SPL Token mint/transfer
      Wallets custodiales
    Auth
      Bearer JWT
      RBAC por rol
      Tenant isolation
    Deploy
      Netlify SPA
      API Node hosting
```

### 7.2 Integraciones críticas

| Integración                 | Criticidad                | Modo                | Variables / requisitos                                                                                                   |
| --------------------------- | ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **PostgreSQL**              | 🔴 Bloqueante             | Siempre             | `DB_*`, migraciones Lucid                                                                                                |
| **Frontend ↔ Backend REST** | 🔴 Bloqueante             | Siempre             | `VITE_API_URL`, `CORS_ORIGIN`                                                                                            |
| **Auth JWT**                | 🔴 Bloqueante             | Siempre             | `APP_KEY`, tokens en `auth_access_tokens`                                                                                |
| **Solana SPL**              | 🔴 Bloqueante (MVP)       | `TOKEN_MODE=solana` | `SOLANA_RPC_URL`, `SCHOLARFI_TOKEN_MINT`, `MINT_AUTHORITY_SECRET`, `TREASURY_WALLET_PUBLIC_KEY`, `WALLET_ENCRYPTION_KEY` |
| **Solscan (UI)**            | 🟡 Alta (prueba on-chain) | MVP                 | `VITE_SOLANA_CLUSTER`, `VITE_TOKEN_MODE=solana`                                                                          |
| **Ledger simulado (mock)**  | 🟢 Piloto / demo          | `TOKEN_MODE=mock`   | Sin variables Solana; solo para demostraciones y pruebas de workflow                                                     |
| **Google Classroom**        | 🟡 Alta (piloto escolar)  | Integración piloto  | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                                                        |

### 7.3 Dependencias entre módulos

```mermaid
flowchart TD
    A[Auth + RBAC] --> B[Tenant Scope]
    B --> C[Tasks & Submissions]
    C --> D[Two-step Approval]
    D --> E[Credit Pools\nasignación de tokens]
    E --> F[Reward Issuance]
    F --> I[Custodial Wallets + SPL\n(MVP — liquidación)]
    F -.->|piloto / demo| H[Simulated Ledger\nTOKEN_MODE=mock]
    C --> J[Google Classroom Sync]
    J --> E
    E --> K[Cola FIFO]
    K --> F
    F --> L[Handlers\nbudget / mint / OAuth]
    F -.->|complemento| SAS[SAS Attestation\nlogros verificables]
    F -.->|complemento| CNFT[cNFT Diplomas\nMetaplex Bubblegum]
```

### 7.4 Ampliación tecnológica para adopción (Solana)

Para mejorar adopción y claridad ante el ecosistema Solana, el stack expuesto en arquitectura y producto incluye:

| Capa                 | Tecnología MVP                                                     | Señal de adopción                       | Post-MVP                             |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------ |
| Cliente RPC          | `@solana/web3.js`                                                  | txs reales en devnet/mainnet            | SDK + priorización de fees           |
| Tokens (liquidación) | `@solana/spl-token` (`mintTo`, ATA)                                | cada recompensa = signature verificable | Token-2022 si aplica                 |
| **Attestaciones**    | **Solana Attestation Service (SAS)**                               | logro portable on-chain (milestone)     | Más schemas / verificación pública   |
| **Credenciales NFT** | **Metaplex Bubblegum (cNFT)**                                      | diplomas comprimidos a escala aula      | Colecciones / transfer a Phantom     |
| Custodia             | Wallets backend cifradas                                           | onboarding escolar sin fricción         | Migración a Phantom / wallet-adapter |
| Transparencia        | Solscan / Explorer links                                           | confianza de admin/padres/docentes      | Deep links a PDAs SAS + assetId cNFT |
| Verificación         | `token_transactions.signature` + attestation PDA + diploma assetId | prueba pública sin instalar wallet      | Achievement accounts on-chain        |
| Programs             | (roadmap) Anchor                                                   | —                                       | Reward vault, escrow, registry       |

> La adopción se acelera mostrando **uso real de primitivas Solana** (SPL + **SAS** + **cNFT** + explorer) en el MVP, no solo un ledger interno.

---

## 8. Principales riesgos técnicos

> 🟡 **Stakeholder Solana — Prioridad media** · Reservar para Q&A (custodia, RPC)

| #   | Riesgo                                   | Impacto                         | Mitigación MVP                                                                                                                               |
| --- | ---------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Custodia de wallets en backend**       | Alto (seguridad, compliance)    | Cifrado con `WALLET_ENCRYPTION_KEY`; wallets custodiales obligatorias en MVP; documentar modelo custodial; mock solo en entornos de demo     |
| 2   | **Doble emisión de recompensas**         | Alto (integridad financiera)    | `issueRewardForSubmission()` idempotente; estados de submission estrictos; tests de emisión                                                  |
| 3   | **Fugas cross-tenant**                   | Alto (privacidad)               | Middleware `tenantScope` en todas las rutas sensibles; tests de aislamiento por `institution_id`                                             |
| 4   | **Transiciones de estado inválidas**     | Medio (workflow corrupto)       | Máquina de estados explícita; validación en servicio, no solo en UI                                                                          |
| 5   | **OAuth Classroom / tokens expirados**   | Medio (sync roto)               | Refresh tokens cifrados, endpoint de status, modo mock `GOOGLE_CLASSROOM_MOCK` para dev                                                      |
| 6   | **RPC Solana inestable o costoso**       | Alto (emisión MVP fallida)      | Retry + registrar error; health check `GET /token/health`; cola de reintentos; mock **solo** en entornos de piloto/demo, nunca en producción |
| 7   | **Desalineación FE/BE de contratos API** | Medio (bugs de integración)     | Envelope `{ data }` consistente; tipos compartidos a futuro (Tuyau/OpenAPI)                                                                  |
| 8   | **Complejidad de roles (5 tipos)**       | Medio (autorización incorrecta) | `RoleGate` en frontend + `role` middleware en backend; matriz de permisos documentada                                                        |
| 9   | **Scope creep hacia dApp completa**      | Medio (retraso MVP)             | MVP exige liquidación Solana custodial; wallet en navegador (Phantom) queda fuera del alcance inicial                                        |
| 10  | **Datos de demo no deterministas**       | Bajo (demos inconsistentes)     | Comandos `demo:seed` / `demo:reset`; fixtures CSV Classroom                                                                                  |

### Diagrama de riesgos por capa

```mermaid
quadrantChart
    title Riesgos técnicos (probabilidad vs impacto)
    x-axis Baja probabilidad --> Alta probabilidad
    y-axis Bajo impacto --> Alto impacto
    quadrant-1 Mitigar antes de producción
    quadrant-2 Monitorear y planificar
    quadrant-3 Aceptar / documentar
    quadrant-4 Resolver en MVP
    Custodia wallets: [0.35, 0.90]
    Doble emisión: [0.25, 0.95]
    Cross-tenant leak: [0.20, 0.92]
    Estado inválido: [0.45, 0.55]
    OAuth Classroom: [0.55, 0.50]
    RPC Solana: [0.60, 0.45]
    Contratos FE-BE: [0.50, 0.40]
    Scope dApp: [0.40, 0.35]
```

---

## 9. Decisiones de arquitectura clave (resumen)

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 6 de 6 — Solana obligatorio en MVP

```mermaid
flowchart TD
    D1["Monolito modular\n(AdonisJS)"] --> D2["API REST /api/v1"]
    D2 --> D3["RBAC + multi-tenant"]
    D3 --> D4["Workflow gobernado\n2 pasos de aprobación"]
    D4 --> D5["Créditos off-chain\n(gobernanza + pools)"]
    D5 --> D8["Liquidación Solana\n(MVP obligatorio)"]
    D5 -.->|piloto / demo| D7["Mock ledger\nTOKEN_MODE=mock"]
    D4 --> D9["Google Classroom\ncomo integración externa"]
```

| Decisión     | Elección MVP                                         | Alternativa descartada (por ahora)          |
| ------------ | ---------------------------------------------------- | ------------------------------------------- |
| Arquitectura | Monolito modular backend + SPA                       | Microservicios                              |
| Blockchain   | **Solana SPL obligatorio** para liquidar recompensas | Solo ledger simulado como producto final    |
| Modo mock    | Piloto y demostración (`TOKEN_MODE=mock`)            | No reemplaza la tx on-chain del MVP         |
| Wallet       | Custodial backend (firma server-side)                | Wallet en navegador (Phantom)               |
| Auth         | Email/password + JWT                                 | Wallet-based auth                           |
| Datos        | PostgreSQL relacional (workflow + índice de txs)     | Event sourcing / chain como source of truth |

---

## 10. Procesos críticos: Classroom sync + distribución de tokens (detalle)

> 🟣 **Stakeholder Solana — Prioridad alta** · Core del pitch on-chain (§10.5–10.7 son los más relevantes)

Esta sección detalla el **pipeline de mayor carga de procesamiento** del MVP: sincronizar calificaciones desde Google Classroom, evaluar elegibilidad en orden FIFO, debitar presupuesto docente y liquidar tokens en la wallet custodial del estudiante vía Solana.

**Servicios clave:** `sync_service.ts` → `roster_submission_service.ts` → `reward_issuance_service.ts` → `solana_token_service.ts`

### 10.1 Vista general del pipeline (datos pesados)

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 5 de 6 — escala y volumen de txs

Orden obligatorio: **asignación de tokens/presupuesto → cola FIFO → emisión**, con handlers en cada fase.

```mermaid
flowchart TB
    subgraph Trigger["Disparador"]
        T1["Docente: POST /tasks/:id/sync-classroom"]
    end

    subgraph Phase1["Fase 1 — Preparación de datos (DB + GC API)"]
        P1A["Cargar task + syncMetadata\n(courseId, courseWorkId, minGrade, rewardAmount)"]
        P1B["ensureClassroomTaskGroupSubmissions\nCrear submissions pending\npor cada estudiante del grupo"]
        P1C{"Handler OAuth:\n¿refresh token docente?"}
        P1Cerr["Error: docente no conectado\n→ abort sync"]
        P1D["GC API: list studentSubmissions\n(paginado)"]
        P1E["GC API: list course rosters\nuserId → email"]
        P1F["Mapa gradeByEmail\nemail → nota"]
    end

    subgraph Phase1b["Fase 1b — Asignación de tokens (ANTES de FIFO)"]
        P1H["resolveSyncFunding\nteacher | institution pool"]
        P1I["Leer remainingCredits\n+ task.rewardAmount"]
        P1J{"Handler: ¿hay presupuesto\npara al menos 1 reward?"}
        P1Jwarn["Continuar con cola;\ncada ítem puede ir a\nbudget_exhausted"]
    end

    subgraph Phase1c["Fase 1c — Carga de cola FIFO"]
        P1G["Query FIFO: submissions ⋈ users\nORDER BY submitted_at ASC"]
    end

    subgraph Phase2["Fase 2 — Bucle FIFO (N estudiantes) + handlers"]
        P2A{"Por cada submission\nen orden FIFO"}
        P2B["UPDATE external_grade,\ngrade_checked_at"]
        P2C{"¿Elegible?\nalready / grade / minGrade"}
        P2D["Handler skip:\nreward_skipped_reason\n+ continue"]
        P2E{"Handler budget:\nremaining >= rewardAmount?"}
        P2F["Handler budget_exhausted\n→ marcar skip + BREAK"]
        P2G["issueRewardForSubmission\n(DB transaction)"]
    end

    subgraph Phase3["Fase 3 — Emisión por estudiante"]
        P3A["Debitar teacher/institution pool"]
        P3B["Token Factory\n→ SolanaTokenService"]
        P3C["Provisionar wallet custodial\n(si no existe)"]
        P3D["SPL mint → ATA estudiante\n(liquidación)"]
        P3D2["(+ complemento) SAS attestation\ny/o cNFT diploma"]
        P3E["Persistir token_transactions\n+ token_balances + signature\n(+ attestation / assetId)"]
        P3F["Handler mint_failed:\nROLLBACK + NO approved"]
    end

    subgraph Phase4["Fase 4 — Cierre"]
        P4A["UPDATE task.syncMetadata\nlastSyncSummary"]
        P4B["markTeacherIntegrationSynced"]
    end

    T1 --> P1A --> P1B --> P1C
    P1C -->|No| P1Cerr
    P1C -->|Sí| P1D --> P1E --> P1F --> P1H --> P1I --> P1J
    P1J -->|Sí / No| P1Jwarn --> P1G
    P1G --> P2A --> P2B --> P2C
    P2C -->|No| P2D --> P2A
    P2C -->|Sí| P2E
    P2E -->|No| P2F
    P2E -->|Sí| P2G --> P3A --> P3B --> P3C --> P3D --> P3D2
    P3D -->|OK| P3E --> P2A
    P3D -->|fail| P3F
    P3D2 --> P3E
    P2A -->|fin cola| P4A --> P4B
    P2F --> P4A

    style Phase1 fill:#e3f2fd,stroke:#1565C0
    style Phase1b fill:#f3e5f5,stroke:#7B1FA2
    style Phase1c fill:#e8eaf6,stroke:#3949AB
    style Phase2 fill:#fff8e1,stroke:#F9A825
    style Phase3 fill:#fce4ec,stroke:#C62828
    style Phase4 fill:#e8f5e9,stroke:#2E7D32
```

### 10.2 Google Classroom sync — flujo detallado

> 🟡 **Stakeholder Solana — Prioridad media** · Detalle de integración; omitir en pitch corto

```mermaid
flowchart TD
    Start(["syncGoogleClassroomTask()"]) --> LoadTask["Cargar Task\nWHERE id, institution_id,\ncreated_by_teacher_id"]
    LoadTask --> ValidateGC{"externalSource =\ngoogle_classroom\nAND externalId?"}
    ValidateGC -->|No| Err1["Handler: task no vinculada"]
    ValidateGC -->|Sí| ParseMeta["parseSyncMetadata\n→ courseId, courseWorkId,\nminGrade, maxPoints, rewardAmount"]

    ParseMeta --> Roster["ensureClassroomTaskGroupSubmissions"]
    Roster --> RosterDetail["SELECT group_students\npor group_id de la tarea"]
    RosterDetail --> RosterInsert["INSERT submissions pending\npor estudiante sin envío previo\nsubmitted_at escalonado (FIFO)"]

    RosterInsert --> OAuth{"Handler OAuth:\n¿Refresh token docente?"}
    OAuth -->|No| Err2["Error: docente no conectado"]
    OAuth -->|Sí| FetchGrades["buildClassroomGradeByEmailMap"]

    subgraph GC_API["Google Classroom API (lectura)"]
        FetchGrades --> ListSubs["GET .../courseWork/:id/studentSubmissions\n(paginación nextPageToken)"]
        ListSubs --> ListRoster["GET .../courses/:id/students\n→ mapa userId → email"]
        ListRoster --> ResolveGrade["Por submission:\nassignedGrade | draftGrade\n→ gradeByEmail Map"]
    end

    ResolveGrade --> AssignTokens["⭐ Asignación de tokens (pre-FIFO)\nresolveSyncFunding +\ngetTeacher/InstitutionCreditPoolSummary\n→ fundingSource, remainingCredits\n+ task.rewardAmount"]
    AssignTokens --> LoadQueue["SELECT submissions ⋈ users\nWHERE task_id\nORDER BY submitted_at ASC\n(cola FIFO)"]
    LoadQueue --> LoopStart{"Siguiente submission\n(posición FIFO)"}

    LoopStart -->|Hay más| UpdateGrade["UPDATE submission\nexternal_grade, grade_checked_at"]
    UpdateGrade --> CheckRewarded{"Handler: ¿Ya tiene\nreward_issue\nen teacher_credit_entries?"}
    CheckRewarded -->|Sí| Skip1["skip: already_rewarded"]
    CheckRewarded -->|No| CheckGrade{"Handler: ¿Nota en\ngradeByEmail?"}
    CheckGrade -->|No| Skip2["skip: no_grade"]
    CheckGrade -->|Sí| CheckMin{"Handler: grade >= minGrade?"}
    CheckMin -->|No| Skip3["skip: grade_below_minimum"]
    CheckMin -->|Sí| CheckBudget{"Handler: remainingCredits >=\nrewardAmount?"}
    CheckBudget -->|No| Skip4["skip: budget_exhausted\n(+ BREAK si créditos se agotan mid-run)"]
    CheckBudget -->|Sí| IssueTx["DB TRANSACTION"]

    IssueTx --> IssueReward["issueRewardForSubmission\nfundingSource: teacher|institution"]
    IssueReward --> MintOk{"Handler mint:\n¿SPL confirmado?"}
    MintOk -->|No| MintFail["ROLLBACK · token_tx=failed\nsubmission NO approved"]
    MintOk -->|Sí| ApproveSub["UPDATE submission\nstatus = approved"]
    ApproveSub --> Validations["INSERT submission_validations\nvalidate + auto_approve"]
    Validations --> RefreshPool["Recargar pool summary\n(remainingCredits -= rewardAmount)"]
    RefreshPool --> LoopStart

    Skip1 & Skip2 & Skip3 --> SetSkipReason["UPDATE reward_skipped_reason"] --> LoopStart
    Skip4 --> SetSkipBudget["UPDATE reward_skipped_reason\n= budget_exhausted"] --> SaveMeta

    LoopStart -->|Cola vacía| SaveMeta["UPDATE task.syncMetadata\nlastSyncAt + lastSyncSummary"]
    SaveMeta --> MarkSynced["markTeacherIntegrationSynced"]
    MarkSynced --> End(["Retornar GoogleClassroomSyncResult"])

    style GC_API fill:#e8eaf6,stroke:#3949AB
    style AssignTokens fill:#f3e5f5,stroke:#7B1FA2
```

**Datos que entran y salen en el sync:**

| Entrada                             | Origen                                                                    | Volumen típico                               |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| Roster del grupo                    | `group_students`                                                          | 1 query × N estudiantes                      |
| **Asignación de tokens (pre-FIFO)** | `teacher_credit_pools` / `institution_credit_pools` + `task.rewardAmount` | 1 read de fondeo **antes** de la cola        |
| Submissions existentes              | `submissions` + `users`                                                   | 1 query, orden FIFO                          |
| Calificaciones GC                   | Classroom API                                                             | 2+ requests paginados (submissions + roster) |
| Presupuesto docente                 | `teacher_credit_pools`                                                    | 1 read inicial + 1 refresh por recompensa    |

| Salida             | Tabla / campo                       | Descripción                                        |
| ------------------ | ----------------------------------- | -------------------------------------------------- |
| Submissions nuevas | `submissions`                       | `pending` auto-creadas desde roster                |
| Nota externa       | `submissions.external_grade`        | Nota GC por email                                  |
| Skip reason        | `submissions.reward_skipped_reason` | Motivo si no se premió (`budget_exhausted`, etc.)  |
| Validaciones       | `submission_validations`            | `validate` + `auto_approve`                        |
| Créditos           | `teacher_credit_entries`            | Débito `reward_issue`                              |
| Tokens             | `token_transactions`                | Mint confirmado o failed                           |
| Resumen            | `tasks.syncMetadata`                | Contadores del último sync incl. `budgetRemaining` |

### 10.3 Bucle FIFO — reglas de elegibilidad y handlers

> 🟡 **Stakeholder Solana — Prioridad media** · Lógica de distribución justa

El orden **FIFO** (`submitted_at ASC`) garantiza que, si el presupuesto docente se agota a mitad del sync, los primeros en la cola reciben recompensa y el resto queda con `budget_exhausted`.

**Precondición:** la **asignación de tokens** (`fundingSource`, `remainingCredits`, `rewardAmount`) ya está resuelta antes de entrar al bucle.

```mermaid
flowchart LR
    subgraph Pre["Pre-FIFO (ya resuelto)"]
        Assign["resolveSyncFunding\n+ rewardAmount"]
    end

    subgraph Input["Por submission (posición N)"]
        Email["users.email"]
        Grade["gradeByEmail.get(email)"]
        Pool["pool.remainingCredits"]
        Amount["task.rewardAmount"]
    end

    subgraph Rules["Reglas / handlers (en orden)"]
        R1["1. Handler already_rewarded?\nteacher_credit_entries\nentry_type=reward_issue"]
        R2["2. Handler no_grade?\n¿Nota existe?"]
        R3["3. Handler grade_below_minimum?\ngrade >= minGrade"]
        R4["4. Handler budget_exhausted?\nremainingCredits >= amount"]
    end

    subgraph Outcome["Resultado"]
        OK["✅ issueRewardForSubmission\n+ approved + validations"]
        SKIP["⏭️ reward_skipped_reason\n+ continue"]
        STOP["🛑 budget_exhausted\n+ BREAK loop"]
        MINTFAIL["💥 Handler mint_failed\nROLLBACK · no approved"]
    end

    Assign --> Email
    Email --> R1
    Grade --> R2 --> R3 --> R4
    Pool & Amount --> R4
    R1 -->|fail| SKIP
    R2 -->|fail| SKIP
    R3 -->|fail| SKIP
    R4 -->|fail| STOP
    R4 -->|pass| OK
    OK -.->|SPL error| MINTFAIL
```

| Handler               | Condición                                   | Acción                                      |
| --------------------- | ------------------------------------------- | ------------------------------------------- |
| `already_rewarded`    | Ya existe `reward_issue` para el submission | Skip + continue                             |
| `no_grade`            | Sin nota en Classroom                       | Skip + continue                             |
| `grade_below_minimum` | `grade < minGrade`                          | Skip + continue                             |
| `budget_exhausted`    | `remainingCredits < rewardAmount`           | Skip + **BREAK** (no premiar posteriores)   |
| `mint_failed`         | RPC/SPL falla tras débito intentado         | ROLLBACK DB; submission no queda `approved` |

### 10.4 Orquestación de emisión — `issueRewardForSubmission`

> 🟡 **Stakeholder Solana — Prioridad media** · Puente off-chain → on-chain

Punto central que conecta **presupuesto off-chain** con **liquidación on-chain** (o mock en piloto/demo). Incluye handlers de créditos insuficientes y mint fallido.

```mermaid
flowchart TD
    Start(["issueRewardForSubmission(params)"]) --> BeginTx["Iniciar DB transaction"]
    BeginTx --> CheckMode["isInstitutionOnChainExecution\nTOKEN_MODE=solana\nAND crypto_wallets_enabled"]
    CheckMode --> Factory["makeTokenServiceForInstitution\n→ SolanaTokenService | MockTokenService"]

    Factory --> FundSource{"fundingSource?"}
    FundSource -->|teacher| DebitTeacher["debitTeacherPoolForReward\nINSERT teacher_credit_entries\nUPDATE utilized_credits\n(idempotente por submission_id)"]
    FundSource -->|institution| DebitInst["debitInstitutionPoolForReward\nINSERT institution_credit_entries"]

    DebitTeacher --> BudgetOk{"Handler: ¿créditos\nsuficientes?"}
    DebitInst --> BudgetOk
    BudgetOk -->|No| Insuff["throw Insufficient*CreditsError\n→ caller marca budget_exhausted"]
    BudgetOk -->|Sí| Mint["tokenService.mintTokens\nachievementId = submissionId"]

    Mint --> MintResult{"Handler mint"}
    MintResult -->|OK| Link["linkTeacherCreditEntryToTokenTransaction\n(o institution equivalent)"]
    Link --> Commit["COMMIT transaction"]
    Commit --> Return(["IssueRewardResult\ntransactionId, signature,\nexecutionProvider"])

    MintResult -->|Solana mint failed| Rollback["ROLLBACK\n(aprobación NO persiste)"]
    Rollback --> Fail(["Error: Solana mint failed"])

    style CheckMode fill:#fff3e0
    style Mint fill:#fce4ec
    style Insuff fill:#ffebee,stroke:#C62828
    style Fail fill:#ffebee,stroke:#C62828
```

### 10.5 Proceso on-chain — mint SPL a wallet custodial del estudiante

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 4 de 6 — prueba técnica SPL

Detalle de lo que ocurre dentro de `SolanaTokenService.mintTokens()` — **obligatorio en MVP** cuando `TOKEN_MODE=solana`.

```mermaid
sequenceDiagram
    autonumber
    participant RS as reward_issuance_service
    participant STS as SolanaTokenService
    participant DB as PostgreSQL
    participant Crypto as wallet_crypto
    participant RPC as Solana RPC
    participant MA as Mint Authority<br/>(MINT_AUTHORITY_SECRET)
    participant SPL as SPL Token Program
    participant SW as Student Wallet<br/>(custodial keypair)

    RS->>STS: mintTokens(userId, amount, achievementId=submissionId)

    STS->>DB: SELECT token_transactions<br/>WHERE achievement_id (idempotencia)
    alt Ya existe mint confirmado
        STS-->>RS: return idempotent=true
    end

    STS->>DB: ensureCustodialWallet(userId)
    alt Sin wallet_public_key
        STS->>STS: Keypair.generate()
        STS->>Crypto: encryptWalletSecret(secretKey)
        Crypto-->>STS: encrypted_wallet_secret
        STS->>DB: UPDATE users SET wallet_public_key,<br/>encrypted_wallet_secret
    end

    STS->>Crypto: decryptWalletSecret
    Crypto-->>STS: student Keypair (SW)
    STS->>STS: loadAuthorityKeypair() → MA
    STS->>RPC: getMint(SCHOLARFI_TOKEN_MINT)
    RPC-->>STS: decimals, mintAuthority
    STS->>STS: Validar MA == mintAuthority

    STS->>RPC: getAssociatedTokenAddress(student, mint)
    STS->>RPC: getAccountInfo(ATA)

    alt ATA no existe
        STS->>SPL: createAssociatedTokenAccountInstruction<br/>(payer = MA)
    end
    STS->>SPL: createMintToInstruction<br/>(mint → student ATA, authority = MA)

    STS->>RPC: sendAndConfirmTransaction([MA])
    RPC->>SPL: Ejecutar tx on-chain
    SPL-->>RPC: confirmed
    RPC-->>STS: transactionSignature

    STS->>DB: INSERT token_transactions<br/>(status=confirmed, signature, provider=solana)
    STS->>DB: UPDATE token_balances<br/>balance += amount
    STS-->>RS: transactionId + signature

    Note over RS,DB: Si mint falla: INSERT token_transactions failed<br/>+ ROLLBACK de toda la tx DB<br/>(submission NO queda approved)
```

### 10.6 Diagrama de componentes on-chain (wallets y cuentas)

> 🟣 **Stakeholder Solana — Prioridad alta** · Slide 4 de 6 — cuentas y firmantes

SPL liquida; **SAS** atestigua el logro; **cNFT** aporta la credencial visual — los tres aterrizan en la wallet custodial del estudiante.

```mermaid
flowchart TB
    subgraph Backend["Backend (firma server-side)"]
        MA["🔑 Mint Authority Keypair\nMINT_AUTHORITY_SECRET\n(paga fees + rent ATA)"]
        SK["🔑 Student Keypair\n(generado por backend,\nsecret cifrado en users)"]
        SA["🔑 SAS authorized signer\n(emisor credential ScholarFi)"]
        BA["🔑 Bubblegum tree authority\n(cNFT diplomas)"]
    end

    subgraph Solana["Red Solana"]
        Mint["SPL Mint\nSCHOLARFI_TOKEN_MINT"]
        ATA_S["Associated Token Account\n(estudiante)"]
        ATA_T["Associated Token Account\n(tesorería — redenciones)"]
        SASCred["SAS Credential + Schema PDAs"]
        SASAtt["SAS Attestation PDA\n(logro / milestone)"]
        Tree["Bubblegum Merkle Tree"]
        Leaf["cNFT leaf\n(diploma → student wallet)"]
    end

    subgraph DB["PostgreSQL (índice off-chain)"]
        U["users.wallet_public_key\nusers.encrypted_wallet_secret"]
        TT["token_transactions\n(signature, amount, status)"]
        TB["token_balances.balance"]
        AT["attestation PDA + signature"]
        DP["diploma assetId + metadata"]
    end

    MA -->|"createMintTo"| Mint
    Mint -->|"tokens SPL"| ATA_S
    SK -.->|"owner de"| ATA_S
    MA -->|"create ATA si falta"| ATA_S
    SK -->|"redeem: transfer"| ATA_T

    SA -->|"create attestation"| SASCred --> SASAtt
    SASAtt -.->|"subject = student wallet"| SK

    BA -->|"mintToCollectionV2"| Tree --> Leaf
    Leaf -.->|"leafOwner = student"| SK

    Backend --> U
    Backend --> TT
    Backend --> TB
    Backend --> AT
    Backend --> DP

    style Mint fill:#fff3e0,stroke:#E65100
    style SASAtt fill:#e8f5e9,stroke:#2E7D32
    style Leaf fill:#ede7f6,stroke:#5E35B1
```

**Operaciones on-chain en el MVP (SPL + complementos):**

| Operación                     | Instrucción / programa            | Firmantes                   | Cuándo                                              |
| ----------------------------- | --------------------------------- | --------------------------- | --------------------------------------------------- |
| Crear cuenta token estudiante | `createAssociatedTokenAccount`    | Mint Authority              | Primera recompensa del estudiante                   |
| Emitir recompensa             | `mintTo` → ATA estudiante         | Mint Authority              | Cada aprobación / sync elegible                     |
| Redimir catálogo              | `transfer` estudiante → tesorería | Mint Authority + Student    | Canje aprobado por admin                            |
| **Attestar logro (SAS)**      | Solana Attestation Service        | Authorized signer ScholarFi | Milestones / logros (p. ej. 5 primeras actividades) |
| **Mintear diploma (cNFT)**    | Metaplex Bubblegum                | Tree authority              | Diploma / credencial del estudiante                 |

### 10.7 Secuencia end-to-end (Classroom → wallet estudiante)

> 🟣 **Stakeholder Solana — Prioridad alta — ⭐ SLIDE ESTRELLA** · Slide 3 de 6

```mermaid
sequenceDiagram
    autonumber
    actor Doc as Docente
    participant FE as Frontend
    participant API as sync_service
    participant GC as Google Classroom
    participant DB as PostgreSQL
    participant RI as reward_issuance_service
    participant SOL as Solana

    Doc->>FE: Sincronizar tarea Classroom
    FE->>API: POST /tasks/:id/sync-classroom

    API->>DB: Cargar task + grupo + rewardAmount
    API->>DB: Crear submissions pending (roster)

    alt Handler OAuth: sin refresh token
        API-->>FE: Error: docente no conectado
    else OAuth OK
        API->>GC: Refresh OAuth + fetch grades
        GC-->>API: gradeByEmail map

        Note over API,DB: ⭐ Asignación de tokens ANTES de FIFO
        API->>DB: resolveSyncFunding<br/>remainingCredits + rewardAmount

        API->>DB: Cargar cola FIFO submissions ⋈ users

        loop Por cada estudiante (FIFO)
            API->>DB: UPDATE external_grade
            alt Handler: already / no_grade / below_min
                API->>DB: reward_skipped_reason + continue
            else Handler: budget_exhausted
                API->>DB: reward_skipped_reason=budget_exhausted
                Note over API: BREAK — no premiar resto de la cola
            else Elegible
                API->>RI: issueRewardForSubmission (trx)
                RI->>DB: Debitar pool de créditos
                alt Handler: Insufficient*CreditsError
                    RI-->>API: créditos insuficientes
                    API->>DB: budget_exhausted + BREAK
                else Débito OK
                    RI->>SOL: mint SPL → wallet custodial
                    alt Handler: mint_failed
                        SOL-->>RI: error
                        RI->>DB: ROLLBACK · token_tx=failed
                    else Mint OK
                        SOL-->>RI: signature
                        RI->>DB: token_transactions + token_balances
                        RI->>DB: link credit_entry ↔ token_tx
                        Note over RI,SOL: Complementos on-chain:<br/>SAS attestation (logro) y/o cNFT diploma
                        API->>DB: submission=approved, validations
                    end
                end
            end
        end

        API->>DB: Guardar lastSyncSummary
        API-->>FE: { rewarded, skipped*, budgetRemaining }
        FE-->>Doc: Resumen del sync
    end
```

### 10.8 Tablas tocadas por operación (carga de datos)

> 🟡 **Stakeholder Solana — Prioridad media** · Alternativa a §10.1 para hablar de escala

```mermaid
flowchart LR
    subgraph SyncRead["Lecturas (sync)"]
        R1["tasks"]
        R2["group_students"]
        R3["submissions"]
        R4["users"]
        R5["teacher_credit_pools"]
        R6["teacher_credit_entries"]
    end

    subgraph SyncWrite["Escrituras (sync)"]
        W1["submissions\n(create, grade, status, skip)"]
        W2["submission_validations"]
        W3["teacher_credit_entries"]
        W4["teacher_credit_pools\nutilized_credits"]
        W5["token_transactions"]
        W6["token_balances"]
        W7["users\n(wallet provision)"]
        W8["tasks.syncMetadata"]
        W9["teacher_integrations\nlast_synced_at"]
    end

    subgraph External["Externo"]
        E1["Google Classroom API"]
        E2["Solana RPC"]
    end

    SyncRead --> SyncWrite
    E1 -.-> SyncRead
    E2 -.-> W5
```

| Operación                     | Reads                                 | Writes                  | Calls externos                    |
| ----------------------------- | ------------------------------------- | ----------------------- | --------------------------------- |
| Sync completo (N estudiantes) | 6+ tablas                             | 8+ tablas × N elegibles | 2–4 GC API + 0–N Solana tx        |
| 1 recompensa on-chain         | users, pools, token_tx                | 5 tablas                | 1–2 RPC (getMint, sendAndConfirm) |
| Idempotencia                  | token_transactions por achievement_id | 0 si ya existe          | 0                                 |

> **Piloto/demo:** Con `TOKEN_MODE=mock`, la fase Solana se sustituye por escritura directa en `token_balances` / `token_transactions` sin RPC. El pipeline Classroom + FIFO + débito de pool **sigue igual**.

---

## 11. Arquitectura Post-MVP — Solana Programs

> 🟣 **Stakeholder Solana — Prioridad alta** · Roadmap técnico on-chain · Ideal como slide final o anexo

Visión de evolución después del MVP: pasar de **integración SPL directa** (backend firma `mintTo`) a **programas Anchor on-chain** que gobiernan presupuestos, emisión idempotente y redenciones con reglas verificables en la red.

### 11.1 MVP vs Post-MVP — qué cambia en Solana

| Aspecto             | MVP (hoy)                                    | Post-MVP (programs)                                      |
| ------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Liquidación         | Backend llama `mintTo` vía `@solana/web3.js` | Programa Anchor hace CPI a SPL Token                     |
| Presupuesto         | `teacher_credit_pools` en PostgreSQL         | PDA **Reward Vault** on-chain + índice en DB             |
| Idempotencia        | `achievement_id` en `token_transactions`     | PDA por `submission_hash` — no re-emite on-chain         |
| Wallet estudiante   | Custodial (backend genera keypair)           | **Phantom / wallet-adapter** + migración opcional        |
| Prueba de logro     | Signature en DB + Solscan                    | **Achievement Record** account on-chain                  |
| Redención           | Transfer custodial → tesorería               | **Escrow program** con aprobación admin                  |
| Gobernanza workflow | 100% off-chain (RBAC)                        | Workflow off-chain; **reglas de emisión on-chain**       |
| Verificabilidad     | Solscan de mints                             | Solscan de instrucciones de programa + estado en cuentas |

### 11.2 Arquitectura Post-MVP (alto nivel)

```mermaid
flowchart TB
    subgraph Users["Usuarios"]
        Student["Estudiante\n(Phantom wallet)"]
        Teacher["Docente"]
        Admin["Admin escolar"]
    end

    subgraph App["Aplicación (off-chain)"]
        FE["React SPA\n+ wallet-adapter"]
        API["AdonisJS API\norquestador + oracle signer"]
        DB[("PostgreSQL\nworkflow, índices, auditoría")]
    end

    subgraph Programs["Solana Programs (Anchor)"]
        REG["scholarfi_institution_registry\nconfig por escuela"]
        VAULT["scholarfi_reward_vault\npresupuesto + emisión"]
        ACH["scholarfi_achievement\nrecibo verificable"]
        RED["scholarfi_redemption_escrow\ncanje catálogo"]
    end

    subgraph Solana["Solana runtime"]
        SPL["SPL Token / Token-2022\nSCHOLARFI mint"]
        PDAs["PDAs por institución,\ntarea, submission"]
    end

    Student & Teacher & Admin --> FE
    FE -->|"REST + JWT"| API
    FE -->|"firma tx redención"| RED
    API --> DB
    API -->|"issue_reward, fund_pool\n(firmado oracle)"| VAULT
    API -->|"record_achievement"| ACH
    API -->|"register_institution"| REG

    VAULT -->|"CPI mint"| SPL
    VAULT --> PDAs
    ACH --> PDAs
    RED -->|"CPI transfer"| SPL
    REG --> PDAs

    style Programs fill:#ede7f6,stroke:#5E35B1
    style Solana fill:#fff3e0,stroke:#E65100
```

### 11.3 Suite de programas — ideas concretas

Cuatro programas pequeños y composables (mejor que un monolito):

```mermaid
flowchart LR
    subgraph P1["① institution_registry"]
        R1["register_institution"]
        R2["set_mint / set_oracle"]
        R3["pause_institution"]
    end

    subgraph P2["② reward_vault ⭐ core"]
        V1["fund_pool\n(NGO/admin deposita SPL)"]
        V2["issue_reward\n(oracle + submission_hash)"]
        V3["close_pool"]
    end

    subgraph P3["③ achievement"]
        A1["record_achievement\n(task, grade, student)"]
        A2["close_record"]
    end

    subgraph P4["④ redemption_escrow"]
        E1["init_escrow\n(estudiante transfiere)"]
        E2["approve_redemption\n(admin)"]
        E3["cancel_escrow"]
    end

    P1 --> P2
    P2 --> P3
    P2 --> P4
```

#### Programa 1: `scholarfi_institution_registry`

Registro on-chain de cada escuela/institución.

| Instruction            | Quién firma       | Qué hace                                                                  |
| ---------------------- | ----------------- | ------------------------------------------------------------------------- |
| `register_institution` | Super-admin key   | Crea PDA `[institution, code]` con mint SPL, oracle pubkey, estado activo |
| `update_oracle`        | Institution admin | Rotar clave del backend autorizado a emitir                               |
| `pause` / `unpause`    | Institution admin | Congelar emisiones sin tocar workflow off-chain                           |

**Cuenta (simplificada):**

```
InstitutionAccount {
  authority: Pubkey,
  oracle: Pubkey,        // backend signer
  token_mint: Pubkey,
  is_active: bool,
  bump: u8,
}
```

#### Programa 2: `scholarfi_reward_vault` ⭐ (más importante)

Vault SPL por institución/docente. Reemplaza la lógica crítica de `mintTo` directo.

| Instruction       | Quién firma                       | Qué hace                                                                                           |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `fund_pool`       | NGO / school admin                | Transfiere SPL al vault PDA `[institution, teacher]`                                               |
| `issue_reward`    | Oracle (backend) + opcional admin | Valida: pool ≥ amount, submission_hash no usado, institución activa → **CPI `mint_to`** estudiante |
| `withdraw_unused` | Institution admin                 | Retira saldo no utilizado del vault                                                                |

**Idempotencia on-chain:** PDA `[submission_hash]` — si existe → instruction falla (no double-mint).

```
RewardVault {
  institution: Pubkey,
  teacher: Pubkey,
  token_mint: Pubkey,
  allocated: u64,
  distributed: u64,
  bump: u8,
}

IssuedReward (PDA por submission_hash) {
  student: Pubkey,
  amount: u64,
  task_id_hash: [u8; 32],
  issued_at: i64,
}
```

#### Programa 3: `scholarfi_achievement`

Recibo verificable de logro académico (complementa el mint, no lo reemplaza).

| Instruction                  | Quién firma | Qué hace                                              |
| ---------------------------- | ----------- | ----------------------------------------------------- |
| `record_achievement`         | Oracle      | Escribe account con hash de tarea + nota + timestamp  |
| _(fase 2)_ `mint_credential` | Oracle      | Metaplex cNFT como credencial portable del estudiante |

**Idea concreta fase 1:** account Anchor barato (~0.001 SOL rent) por logro.  
**Idea fase 2:** migrar a **compressed NFTs** (Metaplex Bubblegum) para escala masiva por aula.

#### Programa 4: `scholarfi_redemption_escrow`

Canje del catálogo de recompensas con trazabilidad on-chain.

| Instruction          | Quién firma          | Qué hace                                                |
| -------------------- | -------------------- | ------------------------------------------------------- |
| `init_escrow`        | Estudiante (Phantom) | Transfiere SPL a escrow PDA vinculado a `redemption_id` |
| `approve_redemption` | School admin         | Libera SPL a wallet del comercio/tesorería              |
| `reject_escrow`      | School admin         | Devuelve SPL al estudiante                              |

### 11.4 Secuencia Post-MVP — emisión con programa

```mermaid
sequenceDiagram
    autonumber
    actor Doc as Docente
    participant API as Backend (oracle)
    participant DB as PostgreSQL
    participant VAULT as reward_vault program
    participant ACH as achievement program
    participant SPL as SPL Token
    participant SW as Student wallet

    Doc->>API: POST /tasks/:id/sync-classroom
    API->>DB: Pipeline FIFO (igual que MVP)

    loop Por cada estudiante elegible
        API->>API: submission_hash = hash(institution, task, student, submission)
        API->>VAULT: issue_reward(submission_hash, amount, student)
        VAULT->>VAULT: Validar vault balance + idempotencia PDA
        VAULT->>SPL: CPI mint_to(student ATA)
        SPL-->>SW: tokens acreditados
        VAULT-->>API: IssuedReward account creada

        API->>ACH: record_achievement(task, grade, student)
        ACH-->>API: Achievement account

        API->>DB: Índice off-chain (signature, accounts, submission_id)
    end
```

### 11.5 Modelo de cuentas on-chain (PDAs)

```mermaid
flowchart TB
    subgraph Seeds["PDAs derivadas (ejemplos)"]
        I["[b\"institution\", code]\n→ InstitutionAccount"]
        V["[b\"vault\", institution, teacher]\n→ RewardVault + token account"]
        S["[b\"issued\", submission_hash]\n→ IssuedReward (idempotencia)"]
        A["[b\"achievement\", submission_hash]\n→ AchievementRecord"]
        E["[b\"escrow\", redemption_id]\n→ RedemptionEscrow"]
    end

    subgraph Signers["Firmantes"]
        Oracle["Oracle keypair\n(backend HSM)"]
        Student["Estudiante\n(Phantom)"]
        Admin["Admin PDA authority"]
    end

    Oracle --> V
    Oracle --> S
    Oracle --> A
    Student --> E
    Admin --> E
```

### 11.6 Evolución por fases (roadmap Solana)

```mermaid
timeline
    title Evolución on-chain ScholarFi
    section MVP
        SPL mint directo : Custodial wallets
                        : Solscan proof
                        : PostgreSQL pools
    section Post-MVP v1
        reward_vault program : Presupuesto on-chain
                             : Idempotencia por submission_hash
                             : Oracle signer backend
    section Post-MVP v2
        achievement + escrow : Achievement accounts
                             : Redención con Phantom
                             : Migración custodial → self-custody
    section Post-MVP v3
        Escala : Compressed NFTs (credenciales)
               : Token-2022 transfer hooks
               : Multi-region RPC + priority fees
```

### 11.7 Qué gana el ecosistema Solana (mensaje para stakeholders)

| Hoy (MVP)                           | Post-MVP con programs                                     |
| ----------------------------------- | --------------------------------------------------------- |
| N mints SPL verificables por sync   | + vault accounts con estado consultable on-chain          |
| Actividad en Solscan                | + instrucciones de programa indexables (Dune / Solana FM) |
| 1 escuela = N txs por semestre      | + PDAs persistentes = **datos on-chain** por institución  |
| Custodial → barrera de entrada baja | + Phantom = **usuarios reales** con wallet propia         |
| Backend como único firmante         | + oracle model extensible a **multisig escolar**          |

**Métricas on-chain que pueden medir:**

- `issue_reward` instructions / mes
- SPL volume minted por `SCHOLARFI_TOKEN_MINT`
- Active `RewardVault` PDAs (escuelas financiadas)
- Student wallets con balance > 0
- Redemptions completadas on-chain

### 11.8 Stack técnico Post-MVP (referencia)

| Capa            | Tecnología propuesta                                                |
| --------------- | ------------------------------------------------------------------- |
| Programs        | **Anchor** (Rust)                                                   |
| Client backend  | `@coral-xyz/anchor` + `@solana/web3.js`                             |
| Client frontend | `@solana/wallet-adapter-react` (Phantom, Solflare)                  |
| Token           | SPL Token → evaluar **Token-2022** (transfer hooks para compliance) |
| Credenciales    | Metaplex **cNFT** (fase 2)                                          |
| Indexación      | Helius / Triton webhooks → actualizar PostgreSQL                    |
| Deploy          | devnet piloto → mainnet-beta tras auditoría                         |

---

## 12. Cómo editar estos diagramas

1. **En VS Code / Cursor:** instala extensión "Markdown Preview Mermaid Support" o usa preview nativo.
2. **En GitHub:** los bloques ` ```mermaid ` se renderizan automáticamente en `.md`.
3. **En Miro / Lucidchart:** exporta desde [mermaid.live](https://mermaid.live) pegando el código.
4. **En Notion:** bloque `/code` → lenguaje Mermaid.

---

## Referencias en el código

| Tema                   | Ubicación                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Frontend API client    | `scholarfi/src/api/client.ts`                                                            |
| Rutas y roles UI       | `scholarfi/src/App.tsx`                                                                  |
| Enlaces Solscan        | `scholarfi/src/utils/solanaExplorer.ts`                                                  |
| Rutas API              | `scholarfi-back/start/routes.ts`                                                         |
| Token factory          | `scholarfi-back/app/services/tokens/factory.ts`                                          |
| Emisión de recompensas | `scholarfi-back/app/services/credits/reward_issuance_service.ts`                         |
| Google Classroom sync  | `scholarfi-back/app/services/integrations/google_classroom/sync_service.ts`              |
| Roster → submissions   | `scholarfi-back/app/services/integrations/google_classroom/roster_submission_service.ts` |
| Grades GC API          | `scholarfi-back/app/services/integrations/google_classroom/client.ts`                    |
| Mint SPL on-chain      | `scholarfi-back/app/services/tokens/solana_token_service.ts`                             |
| ADR completo           | `scholarfi/_bmad-output/planning-artifacts/architecture.md`                              |
