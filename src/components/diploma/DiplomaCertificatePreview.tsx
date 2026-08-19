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
}

function periodYear(period: string): string {
  const range = period.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (range) return range[2]
  const single = period.match(/(\d{4})/)
  return single ? single[1] : String(new Date().getFullYear())
}

/**
 * In-app formal diploma preview (mirrors on-chain SVG artwork).
 */
export function DiplomaCertificatePreview({
  achievementType,
  studentName,
  institutionName,
  academicPeriod,
  issueDate,
  recognitionId,
  compact = false,
}: DiplomaCertificatePreviewProps) {
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
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d4af37]/10 blur-3xl" aria-hidden />
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
