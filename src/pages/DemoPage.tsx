import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CANONICAL_ES_COPY, type SubmissionStatusKey } from '../i18n/es'

/** Epic 6 static demo dashboard (no API). */
export function DemoPage() {
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatusKey>('pending')

  const statusEntries = useMemo(
    () => Object.entries(CANONICAL_ES_COPY.statusLabels) as [SubmissionStatusKey, string][],
    []
  )

  const selectedLabel = CANONICAL_ES_COPY.statusLabels[selectedStatus]
  const selectedHint = CANONICAL_ES_COPY.statusHints[selectedStatus]
  const selectedIcon = CANONICAL_ES_COPY.statusIcons[selectedStatus]

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6" aria-label="ScholarFi Demo Dashboard">
      <header className="hero overflow-hidden rounded-box border border-base-300 bg-gradient-to-br from-primary to-accent text-primary-content shadow-sm">
        <div className="hero-content w-full flex-col items-start gap-4 p-6 md:p-8">
          <Link to="/" className="link link-hover text-sm text-primary-content/90">
            Volver a la app
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">ScholarFi Demo Ops</h1>
            <p className="mt-2 max-w-3xl text-sm text-primary-content/90 md:text-base">
              {CANONICAL_ES_COPY.governanceTitle}
            </p>
          </div>
          <span className="badge badge-outline border-primary-content/60 text-primary-content">
            Sandbox visual
          </span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="status-catalog-title">
          <div className="card-body">
            <h2 id="status-catalog-title" className="card-title text-lg">
              Catalogo canonico de estados
            </h2>
            <p className="text-sm text-base-content/70">{CANONICAL_ES_COPY.governanceHint}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Estados de flujo disponibles">
              {statusEntries.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn h-auto justify-start whitespace-normal py-2 text-left ${
                    selectedStatus === key ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setSelectedStatus(key)}
                  aria-pressed={selectedStatus === key}
                >
                  <span aria-hidden="true">{CANONICAL_ES_COPY.statusIcons[key]}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="submission-detail-title">
          <div className="card-body">
            <h2 id="submission-detail-title" className="card-title text-lg">
              Detalle de envio
            </h2>
            <p className="text-sm text-base-content/70">Estado visible para estudiante, docente y administracion.</p>

            <article className="mt-2 space-y-3 rounded-box border border-base-300 bg-base-200 p-4" aria-live="polite">
              <p className="text-xs text-base-content/60">Submission #24015</p>
              <h3 className="text-base font-semibold">Laboratorio de energia solar</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {selectedIcon}
                </span>
                <strong>{selectedLabel}</strong>
              </div>
              <p className="text-sm text-base-content/80">{selectedHint}</p>
              <p className="text-xs text-base-content/60">Ultima accion: 2026-01-15 10:20 UTC</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn btn-primary btn-sm">
                  Ver historial completo
                </button>
                <button type="button" className="btn btn-outline btn-sm">
                  Volver a la cola
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="hardening-title">
        <div className="card-body">
          <h2 id="hardening-title" className="card-title text-lg">
            Readiness de experiencia
          </h2>
          <p className="text-sm text-base-content/70">Checklist rapido para accesibilidad y responsive.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/90">
            <li>Focus visible en todos los botones y enlaces.</li>
            <li>Indicadores de estado por texto + icono, no solo color.</li>
            <li>Navegacion usable en `sm`, `md`, `lg` y `xl`.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
