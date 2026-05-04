import { useMemo, useState } from 'react'
import { HiArrowUturnLeft, HiCheckBadge, HiDocumentText, HiSquares2X2 } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { ScholarDiWordmark, ScholarFiWordmark } from '../components/BrandLogos'
import { ExecutiveHero, KpiStrip, SectionCard } from '../components/ui/executive'
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
      <ExecutiveHero
        eyebrow="Escenario de inversion"
        title="ScholarFi Demo Ops"
        subtitle={CANONICAL_ES_COPY.governanceTitle}
        leadingIcon={<ScholarFiWordmark className="h-10 w-auto max-w-[220px]" />}
        actions={
          <>
            <Link to="/" className="btn btn-outline btn-sm gap-1">
              <HiArrowUturnLeft className="h-4 w-4" aria-hidden />
              Volver a la app
            </Link>
            <span className="badge badge-outline gap-2 px-2 py-1">
              <ScholarDiWordmark className="h-5 w-auto max-w-[100px] object-contain" />
              <span className="inline-flex items-center gap-1">
                <HiSquares2X2 className="h-3.5 w-3.5" aria-hidden />
                Sandbox visual
              </span>
            </span>
          </>
        }
      />
      <KpiStrip
        items={[
          { label: 'Estados canonicos', value: '5', hint: 'Definicion compartida' },
          { label: 'Roles orquestados', value: '4', hint: 'Gobernanza activa' },
          { label: 'Experiencia', value: 'MVP+', hint: 'Lista para demo ejecutiva' },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          title="Catalogo canonico de estados"
          subtitle={CANONICAL_ES_COPY.governanceHint}
          titleIcon={<HiSquares2X2 aria-hidden />}
        >
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
        </SectionCard>

        <SectionCard
          title="Detalle de envio"
          subtitle="Estado visible para estudiante, docente y administracion."
          titleIcon={<HiDocumentText aria-hidden />}
        >

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
        </SectionCard>
      </div>

      <SectionCard
        title="Readiness de experiencia"
        subtitle="Checklist rapido para accesibilidad, consistencia y responsive."
        titleIcon={<HiCheckBadge aria-hidden />}
      >
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/90">
            <li>Focus visible en todos los botones y enlaces.</li>
            <li>Indicadores de estado por texto + icono, no solo color.</li>
            <li>Navegacion usable en `sm`, `md`, `lg` y `xl`.</li>
          </ul>
      </SectionCard>
    </main>
  )
}
