# ScholarFi Frontend (`scholarfi`)

React 19 + Vite 8 + TypeScript SPA for the ScholarFi demo simulator. Talks to **scholarfi-back** at `/api/v1` (Bearer auth).

## Prerequisites

- Node.js 22+ (or current active LTS)
- npm 11+
- Running backend (see `scholarfi-back/README.md`)

## First-run setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. API URL (optional locally):

- `VITE_API_URL` — e.g. `http://localhost:3333/api/v1`. If unset, the app calls same-origin `/api/v1`, which Vite proxies to the backend (see `vite.config.ts`).
- `VITE_TOKEN_MODE_LABEL` — optional internal badge for staff (e.g. `Demo Mode` or `Devnet`). Not shown to student accounts. Omit in production if unused.
- `VITE_TOKEN_MODE` — set to `solana` when the API runs with `TOKEN_MODE=solana` so the admin **Bitácora** table shows the **Comprobante** column (Solscan link). Omit or use `mock` for demo builds.

4. Start the app:

```bash
npm run dev
```

Default app URL: `http://localhost:5173`

## Script matrix

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` + Vite production build
- `npm run preview` — preview production build locally
- `npm run lint` — ESLint

## Application structure

Role-based routes (after login via `POST /auth/login`, token in `sessionStorage`):

| Role | Base paths |
|------|------------|
| Student | `/student`, `/student/tareas`, `/student/envios`, `/student/submissions/:id` |
| Teacher | `/teacher`, `/teacher/cola-validacion` |
| School admin | `/admin`, `/admin/cola-aprobacion`, `/admin/bitacora-aprobacion` |
| Super admin | `/super` (institutions) |

- **i18n:** Spanish labels in `src/i18n/es.ts` (status copy, `Credit` token name).
- **Design:** Tailwind CSS v4 + daisyUI 5, theme `scholarfi` in `src/index.css`; Plus Jakarta Sans in `index.html`.
- **PostCSS:** `@tailwindcss/postcss` in `postcss.config.mjs` (no `@tailwindcss/vite` — Vite 8 left utilities unparsed).
- **Demo UI kit:** `/demo` (`DemoPage.tsx`) for component showcase.
- **Login:** split layout with Solana ecosystem branding (`BrandLogos.tsx`); rewards remain simulated (no wallet integration).

## Optional environment variables

From `.env.example` (for future/on-chain demos):

- `VITE_TOKEN_MODE_LABEL` — staff-only header badge (hidden from students)
- `VITE_TOKEN_MODE=solana` — align UI with backend token mode when implemented
- `VITE_SOLANA_CLUSTER=devnet` — explorer links for admin bitácora

## Production (Netlify)

1. Build with backend URL set, e.g. `VITE_API_URL=https://your-api.example.com/api/v1`
2. SPA routing: `public/_redirects` contains `/* /index.html 200`
3. Ensure backend `CORS_ORIGIN` includes your Netlify URL (e.g. `https://scholarfi.netlify.app`)

## Backend pairing

Seed demo users with `node ace demo:reset` in **scholarfi-back**. With `GOOGLE_CLASSROOM_MOCK=true`, `/login` shows demo role chips (no Google Classroom account needed). External evaluators: [docs/judge-instructions.md](docs/judge-instructions.md) (English and Spanish).
