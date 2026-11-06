import { ScholarFiWordmark } from '../BrandLogos'
import { achievementLabel, type DiplomaAchievementTypeKey } from '../../constants/diplomaAchievements'

type DiplomaCertificatePreviewProps = {
  achievementType: string
  studentName: string
  institutionName: string
  academicPeriod: string
  issueDate?: string | null
  recognitionId?: string | null
  compact?: boolean
  /** When set, renders the pilot Yu-Gi-Oh–style trading card with this art. */
  baseImageUrl?: string | null
}

function periodYear(period: string): string {
  const range = period.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (range) return range[2]
  const single = period.match(/(\d{4})/)
  return single ? single[1] : String(new Date().getFullYear())
}

function starCount(achievementType: string): number {
  switch (achievementType) {
    case 'excelencia_academica':
      return 7
    case 'logro_extraordinario':
      return 6
    case 'progreso_academico':
      return 5
    case 'participacion_destacada':
    case 'constancia_academica':
      return 4
    default:
      return 5
  }
}

function PilotTradingCardPreview({
  achievementType,
  studentName,
  institutionName,
  academicPeriod,
  issueDate,
  recognitionId,
  baseImageUrl,
  compact,
}: DiplomaCertificatePreviewProps & { baseImageUrl: string }) {
  const label = achievementLabel(achievementType)
  const year = periodYear(academicPeriod)
  const level = starCount(achievementType)
  const formattedDate =
    issueDate ??
    new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <article
      className={[
        'mx-auto w-full max-w-sm overflow-hidden rounded-xl border-2 border-[#5c4030] bg-gradient-to-br from-[#c4a574] via-[#e8d5a8] to-[#a67c4a] text-[#3d2b1f] shadow-xl',
        compact ? 'p-2' : 'p-3',
      ].join(' ')}
      aria-label={`Carta de reconocimiento ${label}`}
    >
      <div className="rounded-lg border border-[#8b6914]/70 bg-[#e8d5a8]/40 p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 rounded-md border border-[#5c4030]/50 bg-gradient-to-b from-[#f5edd8] to-[#d4c4a0] px-2 py-1.5">
            <p className="m-0 truncate text-sm font-bold uppercase tracking-wide md:text-base">
              {studentName}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#f6e6a8] bg-[#1e3a8a] text-center">
            <span className="text-[10px] font-bold text-[#f6e6a8]">SF</span>
            <span className="text-[10px] font-bold text-white">{year}</span>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-1" aria-hidden>
          {Array.from({ length: level }).map((_, index) => (
            <span
              key={index}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#c41e3a] text-[10px] text-[#ffd700] shadow-sm"
            >
              ★
            </span>
          ))}
        </div>

        <div className="mt-2 overflow-hidden rounded-md border-4 border-[#5c4030] bg-white">
          <img
            src={baseImageUrl}
            alt=""
            className="aspect-[544/420] w-full object-contain"
          />
        </div>

        <div className="mt-2 rounded-md bg-[#3d2b1f] px-2 py-1 text-center">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.15em] text-[#f6e6a8]">{label}</p>
        </div>

        <div className="mt-2 rounded-md border border-[#5c4030] bg-gradient-to-b from-[#f3e6c8] to-[#e2d0a8] px-2 py-2 text-left">
          <p className="m-0 text-xs font-bold uppercase">[Estudiante / {label}]</p>
          <p className="mt-1 m-0 text-xs leading-snug">
            Reconocimiento emitido por {institutionName} · período {academicPeriod}.
          </p>
          <p className="mt-2 m-0 text-[11px] text-[#5c4030]">
            Emitido {formattedDate}
            {recognitionId ? ` · ${recognitionId}` : ''}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-[#5c4030]/40 pt-1">
            <span className="text-[10px] text-[#5c4030]">© ScholarFi · Solana</span>
            <span className="text-xs font-bold">
              MERIT/{level * 300} · LOGRO/{year}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * In-app diploma preview. With school brand URL → pilot trading card; otherwise formal certificate.
 */
export function DiplomaCertificatePreview({
  achievementType,
  studentName,
  institutionName,
  academicPeriod,
  issueDate,
  recognitionId,
  compact = false,
  baseImageUrl = null,
}: DiplomaCertificatePreviewProps) {
  const schoolBrand = baseImageUrl?.trim() || null
  if (schoolBrand) {
    return (
      <PilotTradingCardPreview
        achievementType={achievementType}
        studentName={studentName}
        institutionName={institutionName}
        academicPeriod={academicPeriod}
        issueDate={issueDate}
        recognitionId={recognitionId}
        compact={compact}
        baseImageUrl={schoolBrand}
      />
    )
  }

  const label = achievementLabel(achievementType)
  const year = periodYear(academicPeriod)
  const formattedDate =
    issueDate ??
    new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <article
      className={[
        'relative overflow-hidden rounded-2xl border border-[#d4af37]/45 bg-gradient-to-br from-[#0c2e31] via-[#123a52] to-[#0f2840] text-[#e8dcc0] shadow-lg',
        compact ? 'p-4' : 'p-6 md:p-8',
      ].join(' ')}
      aria-label={`Vista previa del reconocimiento ${label}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d4af37]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl space-y-3 text-center">
        <div className="flex justify-center">
          <ScholarFiWordmark className="h-10 w-auto brightness-110 md:h-12" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e8dcc0]/85 md:text-xs">
          Reconocimiento al mérito académico
        </p>
        <h3 className="m-0 text-xl font-bold uppercase tracking-wide text-white md:text-3xl">{label}</h3>
        <p className="m-0 text-lg font-semibold tracking-widest text-[#d4af37] md:text-2xl">{year}</p>
        <p className="m-0 text-sm text-[#cbd5e1]">Se otorga el presente reconocimiento a</p>
        <p className="m-0 break-words text-2xl font-bold text-white md:text-4xl">{studentName}</p>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-[#cbd5e1]">
          En reconocimiento a su destacado desempeño, constancia y compromiso académico durante el
          período {academicPeriod}.
        </p>
        <div className="mx-auto h-px w-48 bg-[#d4af37]/40" aria-hidden />
        <p className="m-0 text-lg font-semibold text-white">{institutionName}</p>
        <p className="m-0 text-sm text-[#94a3b8]">ScholarFi Academic Achievement</p>
        <p className="m-0 text-sm text-[#94a3b8]">{formattedDate}</p>
        <p className="m-0 pt-1 text-[11px] tracking-wide text-[#64748b] md:text-xs">
          Verified by ScholarFi · Powered by Solana
          {recognitionId ? ` · ${recognitionId}` : ''}
        </p>
      </div>
    </article>
  )
}

export type { DiplomaAchievementTypeKey }
