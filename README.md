# ScholarFi Frontend (`scholarfi`)

React + Vite + TypeScript frontend for the ScholarFi demo simulator.

## Prerequisites

- Node.js 22+ (or current active LTS)
- npm 11+

## First-Run Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env
```

3. Set API base URL in `.env` (optional if you rely on the Vite dev proxy):

- `VITE_API_URL` — e.g. `http://localhost:3333/api/v1`. If unset, the app calls same-origin `/api/v1`, which Vite proxies to the backend (see `vite.config.ts`).

4. Start the app:

```bash
npm run dev
```

Default app URL: `http://localhost:5173`

## Script Matrix

- `npm run dev` - Start Vite dev server
- `npm run build` - Run TypeScript project build + Vite production build
- `npm run lint` - Lint codebase with ESLint
- `npm run preview` - Preview production build locally

## UI theme (ScholarFi + daisyUI)

- **Tailwind CSS v4** + **daisyUI 5** with a custom theme **`scholarfi`** in `src/index.css` (colors from `notes/design-notes.md`, semantic mapping per `_bmad-output/planning-artifacts/ux-design-specification.md`).
- **PostCSS** (`postcss.config.mjs` + `@tailwindcss/postcss`) compiles CSS. (The `@tailwindcss/vite` plugin was dropped: with Vite 8 it left `@tailwind utilities` unparsed, so no styles shipped to the browser.)
- `index.html` sets `data-theme="scholarfi"`. **Typography:** Plus Jakarta Sans (Google Fonts `<link>` in `index.html`).

## Epic 6 UI Hardening Notes

- Canonical Spanish status/copy labels are centralized in `src/i18n/es.ts`.
- Core demo dashboard/detail screen uses centralized labels from the i18n module (`src/App.tsx`).
- Accessibility baseline includes visible keyboard focus styles and non-color status cues (icon + text).
- Responsive baseline is validated at `sm`, `md`, `lg`, and `xl` breakpoints in `src/app-demo.css`.
