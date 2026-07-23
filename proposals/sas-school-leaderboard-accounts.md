# Estructura del programa y cuentas — SAS + Leaderboard de escuelas

Referencia a nivel de campos para el MVP del incubadora: cuentas/PDAs del programa propio **`scholarfi_school_leaderboard`**, más las cuentas **SAS** y el payload de attestation que usará ScholarFi. Complemento de [`sas-school-leaderboard.md`](./sas-school-leaderboard.md).

**Program id:** TBD (programa Anchor desplegado)  
**Cluster:** primero Devnet, después Mainnet  

---

## 1. Resumen

| Superficie | Dueño | Qué almacena |
|------------|-------|--------------|
| PDA `GlobalConfig` | Nuestro programa | Oráculo, season, pause |
| PDA `SchoolBoard` | Nuestro programa | Score agregado por escuela |
| PDA `StudentScore` | Nuestro programa (opcional) | Score por estudiante bajo una escuela |
| PDA `ProcessedAchievement` | Nuestro programa (recomendado) | Idempotencia: un envío → un crédito de score |
| Credential / Schema / Attestation SAS | Solana Attestation Service | Claim verificable de logro ligado a una wallet |

Los datos on-chain excluyen deliberadamente PII (nombres, emails, calificaciones como texto). El vínculo con filas off-chain se hace vía hashes e ids.

---

## 2. Programa propio: `scholarfi_school_leaderboard`

### 2.1 Mapa de cuentas

```text
scholarfi_school_leaderboard
├── GlobalConfig          PDA [b"config"]
├── SchoolBoard           PDA [b"school", institution_id]
├── StudentScore          PDA [b"student", school_board, student]   (opcional)
└── ProcessedAchievement  PDA [b"processed", submission_hash]       (idempotencia)
```

---

### 2.2 `GlobalConfig`

**Propósito:** Configuración singleton del programa. Define quién puede cambiar settings (`authority`), quién puede publicar scores (`oracle`), la season activa de la competencia y un kill switch.

**Seeds:** `[b"config"]`  
**Espacio (aprox.):** `8` (discriminator) + `32` + `32` + `8` + `1` + `1` + padding ≈ `88` bytes  

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `authority` | `Pubkey` | Clave admin. Puede rotar `oracle`, llamar `rotate_season`, `set_paused` y transferir authority. |
| `oracle` | `Pubkey` | Firmante del backend autorizado a llamar `init_school` y `record_score`. Suele ser el keypair custodial/oráculo de ScholarFi. |
| `season_id` | `u64` | Contador de season actual. Las UIs de ranking filtran o resetean con este valor. Empieza en `1`. |
| `paused` | `bool` | Si es `true`, `record_score` (y opcionalmente `init_school`) debe fallar. |
| `bump` | `u8` | Bump de la PDA `GlobalConfig`. |

**Quién escribe:** `initialize` (una vez), luego `set_oracle` / `rotate_season` / `set_paused` / `transfer_authority`.  
**Quién lee:** Toda instrucción que mute el estado del leaderboard.

---

### 2.3 `SchoolBoard`

**Propósito:** Standing on-chain de una institución (escuela). Es la cuenta principal de ranking: pública, agregable y sin PII de estudiantes.

**Seeds:** `[b"school", institution_id.to_le_bytes()]`  
**Espacio (aprox.):** `8` + `8` + `32` + `8` + `8` + `8` + `8` + `1` ≈ `89` bytes  

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `institution_id` | `u64` | `institutions.id` off-chain de ScholarFi. Debe coincidir con el seed. Sirve para unir DB ↔ chain. |
| `name_hash` | `[u8; 32]` | SHA-256 (o keccak) del nombre canónico de display de la escuela. Permite a explorers/UI verificar el binding del label sin guardar el string on-chain. Opcional: ceros si no se usa. |
| `total_points` | `u64` | Métrica principal de ranking. Se incrementa con `record_score`. |
| `achievement_count` | `u64` | Número de logros puntuados acreditados a esta escuela. Orden secundario / analítica. |
| `season_id` | `u64` | Season a la que pertenecen los contadores de este board. Al rotar season, o se resetean aquí o se exige que coincidan con `GlobalConfig.season_id` antes de aceptar writes. |
| `last_updated` | `i64` | Timestamp Unix del último `record_score` exitoso. |
| `bump` | `u8` | Bump de esta PDA `SchoolBoard`. |

**Quién escribe:** `init_school` (crear), `record_score` (incrementar), opcional `reset_school_for_season`.  
**Quién lee:** UI del leaderboard (vía indexer), explorers, programas futuros.

**Invariante:** el `institution_id` en los datos de la cuenta debe ser igual al id usado en los seeds de la PDA.

---

### 2.4 `StudentScore` (opcional)

**Propósito:** Contribución por estudiante bajo una escuela. Útil para rankings internos y demos. Sigue sin PII: la identidad es solo el pubkey de la wallet.

**Seeds:** `[b"student", school_board.key(), student.key()]`  
**Espacio (aprox.):** `8` + `32` + `32` + `8` + `8` + `1` ≈ `89` bytes  

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `school` | `Pubkey` | Dirección de la PDA `SchoolBoard` padre. |
| `student` | `Pubkey` | Wallet del estudiante (custodial hoy; Phantom después). |
| `points` | `u64` | Puntos acreditados a este estudiante en la season actual. |
| `contribution_count` | `u64` | Cuántos logros se puntuaron para este estudiante. |
| `bump` | `u8` | Bump de la PDA. |

**Quién escribe:** `record_score` cuando se pasa la cuenta `student_score`.  
**Nota de privacidad:** Preferir agregados por escuela en páginas públicas; exponer PDAs de estudiante solo dentro del scope autenticado de la escuela, salvo que el producto quiera un board público de estudiantes.

---

### 2.5 `ProcessedAchievement` (recomendado para MVP)

**Propósito:** Idempotencia. Garantiza que el mismo envío aprobado no infla el leaderboard dos veces (espeja la unicidad de `achievement_id` en `token_transactions` off-chain).

**Seeds:** `[b"processed", submission_hash]`  
**Espacio (aprox.):** `8` + `32` + `32` + `32` + `8` + `8` + `1` ≈ `121` bytes  

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `submission_hash` | `[u8; 32]` | Hash del id de envío off-chain (o payload canónico). Debe coincidir con el seed. |
| `school` | `Pubkey` | `SchoolBoard` que recibió los points. |
| `student` | `Pubkey` | Wallet que recibió la attestation SAS / recompensa. |
| `points` | `u64` | Points aplicados en ese crédito. |
| `season_id` | `u64` | Season en el momento del crédito. |
| `bump` | `u8` | Bump de la PDA. |

**Quién escribe:** Se crea una sola vez dentro de `record_score`. Si la PDA ya existe, la instrucción falla (o hace no-op idempotente — elegir uno y documentarlo; preferir **fallar** para operaciones más claras).  
**Por qué incluirlo en el MVP:** Sin esto, un retry de la tx del oráculo puede doble-contar points de la escuela aunque el mint SPL sea idempotente en DB.

---

## 3. Instrucciones y account metas

### 3.1 `initialize`

Crea el singleton `GlobalConfig`.

| Cuenta | Writable | Signer | Descripción |
|--------|----------|--------|-------------|
| `global_config` | sí | no | PDA `[b"config"]` — se crea |
| `authority` | no | sí | Pasa a ser `authority` |
| `oracle` | no | no | Pubkey inicial del oráculo (puede ser la misma que authority) |
| `payer` | sí | sí | Paga el rent |
| `system_program` | no | no | System program |

**Args:** ninguno (o `season_id: u64` con default `1`).

---

### 3.2 `init_school`

Registra la PDA de board de una institución.

| Cuenta | Writable | Signer | Descripción |
|--------|----------|--------|-------------|
| `global_config` | no | no | No debe estar en pause (si aplica esa regla) |
| `school_board` | sí | no | PDA `[b"school", institution_id]` — se crea |
| `oracle` | no | sí | Debe ser igual a `global_config.oracle` |
| `payer` | sí | sí | Paga el rent |
| `system_program` | no | no | |

**Args:**

| Arg | Tipo | Descripción |
|-----|------|-------------|
| `institution_id` | `u64` | Id de la escuela off-chain |
| `name_hash` | `[u8; 32]` | Hash opcional de binding del nombre |

---

### 3.3 `record_score`

Acredita points después de aprobar un logro (y preferiblemente después de emitir la attestation SAS).

| Cuenta | Writable | Signer | Descripción |
|--------|----------|--------|-------------|
| `global_config` | no | no | Revisa `paused` y `season_id` |
| `school_board` | sí | no | Incrementa `total_points` / `achievement_count` |
| `processed_achievement` | sí | no | PDA `[b"processed", submission_hash]` — se crea |
| `student_score` | sí | no | Opcional; crear/init si es la primera vez |
| `oracle` | no | sí | Debe ser igual a `global_config.oracle` |
| `payer` | sí | sí | Paga rent de PDAs nuevas |
| `system_program` | no | no | |
| `attestation` | no | no | Referencia opcional en v0 / requerida en v1.1 (cuenta SAS) |

**Args:**

| Arg | Tipo | Descripción |
|-----|------|-------------|
| `submission_hash` | `[u8; 32]` | Clave de idempotencia |
| `points` | `u64` | Points a sumar (debe ser > 0) |
| `student` | `Pubkey` | Wallet del estudiante (también se usa si se crea `StudentScore`) |

**Checks (MVP):**
1. `!global_config.paused`
2. `oracle.key == global_config.oracle`
3. `school_board.season_id == global_config.season_id` (o política de auto-alineación)
4. `processed_achievement` aún no existe
5. `points > 0` y por debajo de un máximo razonable (p. ej. `u16::MAX`) para limitar errores

**Efectos:**
- `school_board.total_points += points`
- `school_board.achievement_count += 1`
- `school_board.last_updated = Clock::get()?.unix_timestamp`
- init/update de `student_score` si está presente
- crear `processed_achievement`

---

### 3.4 `rotate_season`

Inicia un nuevo periodo de ranking.

| Cuenta | Writable | Signer | Descripción |
|--------|----------|--------|-------------|
| `global_config` | sí | no | `season_id += 1` |
| `authority` | no | sí | Debe ser igual a `global_config.authority` |

**Args:** ninguno (o `reset_boards: bool` si más adelante se añade un reset masivo — no recomendado on-chain; preferir lazy reset en el próximo `record_score`).

**Política de lazy reset (recomendada):** En `record_score`, si `school_board.season_id < global_config.season_id`, poner a cero `total_points` / `achievement_count`, asignar `season_id = global_config.season_id` y luego aplicar el nuevo crédito.

---

### 3.5 `set_paused`

| Cuenta | Writable | Signer | Descripción |
|--------|----------|--------|-------------|
| `global_config` | sí | no | Asigna `paused` |
| `authority` | no | sí | |

**Args:** `paused: bool`

---

### 3.6 `set_oracle` / `transfer_authority`

Rotación operativa de claves. Mismo patrón: `global_config` writable, `authority` signer, nuevo pubkey en los args.

---

## 4. Bocetos estilo Anchor (referencia)

No es código de producción — ilustra la estructura para implementadores.

```rust
#[account]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub season_id: u64,
    pub paused: bool,
    pub bump: u8,
}

#[account]
pub struct SchoolBoard {
    pub institution_id: u64,
    pub name_hash: [u8; 32],
    pub total_points: u64,
    pub achievement_count: u64,
    pub season_id: u64,
    pub last_updated: i64,
    pub bump: u8,
}

#[account]
pub struct StudentScore {
    pub school: Pubkey,
    pub student: Pubkey,
    pub points: u64,
    pub contribution_count: u64,
    pub bump: u8,
}

#[account]
pub struct ProcessedAchievement {
    pub submission_hash: [u8; 32],
    pub school: Pubkey,
    pub student: Pubkey,
    pub points: u64,
    pub season_id: u64,
    pub bump: u8,
}
```

---

## 5. Cuentas SAS que usa ScholarFi

Estas cuentas son propiedad del programa **Solana Attestation Service**, no de `scholarfi_school_leaderboard`. ScholarFi las crea/lee vía el SDK de SAS; el leaderboard podrá verificarlas más adelante.

### 5.1 Credential

**Propósito:** Identidad on-chain del emisor (“ScholarFi”). Define qué firmantes pueden crear attestations bajo este credential.

| Concepto | Descripción |
|----------|-------------|
| Authority | Clave que administra el credential y los firmantes autorizados |
| Authorized signers | Clave(s) oráculo del backend que llaman “create attestation” |
| Name / metadata | Label legible del emisor (según la API de SAS) |

ScholarFi opera **un credential** para el producto (o uno por entorno: devnet/mainnet).

---

### 5.2 Schema — `scholarfi.achievement.v1`

**Propósito:** Plantilla de lo que contiene una attestation de logro. Todas las attestations de logro deben coincidir con este schema.

| Campo en los datos del schema | Tipo (lógico) | Descripción |
|-------------------------------|---------------|-------------|
| `institution_id` | `u64` | Escuela que otorgó el logro |
| `submission_hash` | `[u8; 32]` | Enlace al envío off-chain / `ProcessedAchievement` |
| `task_hash` | `[u8; 32]` | Identidad de la tarea sin guardar título/PII |
| `points` | `u64` | Points que deben (o fueron) acreditados en el leaderboard |
| `issued_at` | `i64` | Timestamp Unix al emitir |
| `season_id` | `u64` | Alineación de season con `GlobalConfig` |

Codificar/decodificar exactamente según el layout del schema SAS (el orden de bytes y de campos debe coincidir con el schema registrado).

---

### 5.3 Attestation

**Propósito:** Un claim verificable de que un nonce dado (típicamente wallet del estudiante, o una clave única del logro) posee un logro académico aprobado bajo `scholarfi.achievement.v1`.

| Concepto | Descripción |
|----------|-------------|
| Derivación de PDA | Según SAS: credential + schema + nonce |
| Nonce | Preferir **único por logro** (p. ej. pubkey derivada de `submission_hash`) para que un estudiante pueda tener muchos logros; si el nonce = solo wallet, queda una sola attestation “última” por schema — suele ser incorrecto para ScholarFi |
| Expiry | Poner lejos en el futuro o por política (p. ej. fin del año escolar) |
| Data | Campos del schema de arriba, codificados |
| Signer | Debe ser un firmante autorizado del Credential |

**Descripción de producto:** La attestation es la prueba portable (“esta wallet ganó este logro aprobado”). El mint SPL es la recompensa económica; `SchoolBoard` es la agregación competitiva.

---

## 6. Campos de índice off-chain (PostgreSQL)

No son cuentas de Solana, pero hacen falta para operar el programa desde la app:

| Columna / campo | Descripción |
|-----------------|-------------|
| `submission_id` | Clave primaria existente del workflow |
| `institution_id` | Une con el seed de `SchoolBoard` |
| `student_wallet` | Pubkey custodial |
| `submission_hash` | Bytes usados on-chain para `ProcessedAchievement` + SAS |
| `attestation_pda` | Dirección de la attestation SAS |
| `attestation_signature` | Tx que creó la attestation |
| `leaderboard_signature` | Tx de `record_score` |
| `school_board_pda` | Dirección cacheada de `SchoolBoard` |
| `processed_achievement_pda` | PDA de idempotencia cacheada |
| `mint_signature` | Prueba SPL existente |

---

## 7. Relaciones (resumen)

```text
Submission (Postgres)
    │
    ├─► SAS Attestation          (prueba del logro)
    │       campos del schema: submission_hash, points, institution_id
    │
    ├─► record_score
    │       ├─► SchoolBoard += points
    │       ├─► StudentScore += points   (opcional)
    │       └─► ProcessedAchievement     (idempotencia)
    │
    └─► SPL mintTo               (liquidación económica, existente)
```

| Cuenta | En una frase |
|--------|----------------|
| `GlobalConfig` | Plano de control del programa: quién puede puntuar, qué season, pause. |
| `SchoolBoard` | Standing público y descentralizado de una escuela. |
| `StudentScore` | Contribución opcional por wallet bajo una escuela. |
| `ProcessedAchievement` | Evita contar dos veces el mismo envío. |
| Credential SAS | ScholarFi como emisor de confianza. |
| Schema SAS | Forma de un claim de logro académico. |
| Attestation SAS | Instancia de ese claim para un logro de estudiante. |

---

## 8. MVP vs campos posteriores

| Ítem | MVP | Después |
|------|-----|---------|
| `GlobalConfig` | sí | — |
| `SchoolBoard` | sí | — |
| `ProcessedAchievement` | sí | — |
| `StudentScore` | opcional | sí si el producto quiere boards de estudiantes |
| Cuenta `attestation` en `record_score` | solo pasar/guardar ref | verificar credential/schema/data en el programa |
| Cuentas token vault / escrow | no | arquitectura §11 |
| String del nombre de escuela on-chain | no (solo `name_hash`) | seguir prefiriendo off-chain |
