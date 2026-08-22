# ScholarFi — instructions for external evaluators

**You do not need a Google Classroom account.** This sandbox uses fixture courses, assignments, and grades.

The product UI is in Spanish. Button labels below match what you will see on screen.

- [English](#english)
- [Español](#español)

---

## English

### What you will see

ScholarFi turns classroom activity into on-chain ScholarFi Credits, Solana Attestation Service (SAS) milestones, and a compressed NFT diploma for the top-ranked student. Demo data is already seeded. You only click through the teacher import/sync flow, then visit the other roles.

Student wallets are **custodial**: the backend creates a Solana keypair per student and signs on their behalf. You will not connect Phantom or any browser wallet.

### 1. Sign in

Open `/login` and type the credentials from the backend README (or the list below). Password is `DemoPass123!`.

| Role | Email | What to look at |
|------|------|-----------------|
| Teacher | `demo.teacher@scholarfi.test` | Import fixture tasks and sync rewards |
| Student (Sofia Hernandez) | `sofia.hernandez@scholarfi.test` | Balance, ranking, explorer links |
| School admin | `demo.admin@scholarfi.test` | SAS attestations and NFT diploma |
| Super admin | `demo.super@scholarfi.test` | Institutions and crypto wallets |

To switch roles, log out from the header user menu and sign in with another account.

### 2. Teacher — import and sync (no Google)

1. Sign in as **Docente**.
2. Open **Classroom (demo)** in the sidebar (`/teacher/integraciones`).
3. Click **Usar Classroom de demo** (this does **not** redirect to Google).
4. Select course **Matematicas 3A**.
5. Keep reward at `10` and minimum grade at `6`.
6. Click **Importar todas**.
7. Go to **Docente** (`/teacher`).
8. Optional: **Sincronizar estudiantes**.
9. Click **Sincronizar todo**.

Fixture assignments: Ecuaciones lineales, Repaso unidad 2.

Expected after sync (minimum grade 6):

| Student | Mock grade | Result |
|---------|------------|--------|
| Sofia Hernandez | 8 | Rewarded |
| Valentina Rojas | 8 | Rewarded |

Sofia and Valentina complete both activities, so they become eligible for the SAS milestone.

### 3. Student

1. Log out and sign in as **Estudiante**.
2. On **Resumen** (`/student`), check credit balance and achievements.
3. Open **Ranking** (`/student/ranking`).
4. After the admin mints the diploma, the NFT card appears on the student home.

### 4. School admin — attestations and NFT

1. Log out and sign in as **Admin escolar**.
2. **Attestaciones SAS** (`/admin/attestaciones`): Sofia and Valentina should be **Elegible**. Click **Emitir attestaciones** and follow the Solana explorer links.
3. **Reconocimiento académico** (`/admin/diploma`): preview ranking #1, then **Emitir credencial NFT**.
4. Optional: **Bitácora de aprobación** for credit ledger / Solscan links.

### 5. Super admin

1. Log out and sign in as **Super admin**.
2. Open `/super` to list the demo institution (`SFA-DEMO`) and the crypto-wallets toggle.

### Other demo student

Same password `DemoPass123!`: `valentina.rojas@school.edu`.

---

## Español

### Qué vas a ver

ScholarFi convierte la actividad de clase en ScholarFi Credits on-chain, hitos de Solana Attestation Service (SAS) y un diploma NFT comprimido para el estudiante en el puesto 1. Los datos de demo ya están cargados. Solo tienes que importar y sincronizar como docente, y luego visitar el resto de roles.

Las wallets de los estudiantes son **custodiales**: el backend crea un keypair de Solana por estudiante y firma por ellos. No conectas Phantom ni ninguna wallet del navegador.

**No necesitas una cuenta de Google Classroom.** Cursos, tareas y calificaciones salen de fixtures.

### 1. Iniciar sesión

Abre `/login` e introduce las credenciales del README del backend (o la lista de abajo). La contraseña es `DemoPass123!`.

| Rol | Correo | Qué revisar |
|------|------|-------------|
| Docente | `demo.teacher@scholarfi.test` | Importar tareas de demo y sincronizar recompensas |
| Estudiante (Sofia Hernandez) | `sofia.hernandez@scholarfi.test` | Saldo, ranking y enlaces al explorer |
| Admin escolar | `demo.admin@scholarfi.test` | Attestaciones SAS y diploma NFT |
| Super admin | `demo.super@scholarfi.test` | Instituciones y wallets cripto |

Para cambiar de rol, cierra sesión en el menú del encabezado e inicia sesión con otra cuenta.

### 2. Docente — importar y sincronizar (sin Google)

1. Entra como **Docente**.
2. Abre **Classroom (demo)** en el menú (`/teacher/integraciones`).
3. Pulsa **Usar Classroom de demo** (no redirige a Google).
4. Elige el curso **Matematicas 3A**.
5. Deja la recompensa en `10` y la nota mínima en `6`.
6. Pulsa **Importar todas**.
7. Ve a **Docente** (`/teacher`).
8. Opcional: **Sincronizar estudiantes**.
9. Pulsa **Sincronizar todo**.

Tareas de demo: Ecuaciones lineales, Repaso unidad 2.

Resultado esperado (nota mínima 6):

| Estudiante | Nota de demo | Resultado |
|------------|--------------|-----------|
| Sofia Hernandez | 8 | Recompensada |
| Valentina Rojas | 8 | Recompensada |

Sofia y Valentina completan las 2 actividades, así que quedan elegibles para el hito SAS.

### 3. Estudiante

1. Cierra sesión y entra como **Estudiante**.
2. En **Resumen** (`/student`) revisa saldo y logros.
3. Abre **Ranking** (`/student/ranking`).
4. Cuando el admin emita el diploma, la tarjeta NFT aparece en el inicio del estudiante.

### 4. Admin escolar — attestaciones y NFT

1. Cierra sesión y entra como **Admin escolar**.
2. **Attestaciones SAS** (`/admin/attestaciones`): Sofia y Valentina deben aparecer como **Elegible**. Pulsa **Emitir attestaciones** y abre los enlaces del explorer de Solana.
3. **Reconocimiento académico** (`/admin/diploma`): previsualiza al puesto 1 y pulsa **Emitir credencial NFT**.
4. Opcional: **Bitácora de aprobación** para el libro de créditos / enlaces a Solscan.

### 5. Super admin

1. Cierra sesión y entra como **Super admin**.
2. Abre `/super` para ver la institución de demo (`SFA-DEMO`) y el interruptor de wallets cripto.

### Otra estudiante de demo

Misma contraseña `DemoPass123!`: `valentina.rojas@school.edu`.
