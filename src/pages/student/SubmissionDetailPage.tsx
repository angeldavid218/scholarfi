import { HiArrowLeft, HiDocumentText, HiListBullet } from 'react-icons/hi2'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatId } from '../../i18n/format'

interface HistoryRow {
  id: number
  action: string
  comment: string | null
  actorRole: string
  actorId: number | null
  createdAt: string
}

interface SubmissionDetail {
  id: number
  taskId: number
  status: string
  statusLabelEs: string
  evidenceText: string
  evidenceUrl: string | null
  submittedAt: string
  history: HistoryRow[]
}

export const SubmissionDetailPage = () => {
  const { submissionId } = useParams<{ submissionId: string }>()
  const { data, loading, error } = useTokenResource<SubmissionDetail>({
    load: async (token) => api.get<SubmissionDetail>(`/submissions/${submissionId}`, { token }),
    deps: [submissionId],
    fallbackMessage: 'No se pudo cargar el envio',
  })

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <AlertBanner tone="error">{error}</AlertBanner>
          <Link className="btn btn-ghost btn-sm" to="/student">
            Volver
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Trazabilidad de envio"
        title={`Envio #${formatId(data.id)}`}
        subtitle="Consulta evidencia, estado oficial y linea de decisiones para transparencia academica."
        actions={
          <Link className="btn btn-outline btn-sm gap-1" to="/student">
            <HiArrowLeft className="h-4 w-4" aria-hidden />
            Volver a estudiante
          </Link>
        }
      />

      <SectionCard
        title="Detalle de evidencia"
        subtitle={`Tarea #${formatId(data.taskId)}`}
        titleIcon={<HiDocumentText aria-hidden />}
      >
        <div className="badge badge-outline badge-lg border-primary/40 text-primary">{data.statusLabelEs}</div>
        <p className="mt-2 whitespace-pre-wrap text-base-content">{data.evidenceText}</p>
        {data.evidenceUrl ? (
          <p className="mt-2">
            <a className="link link-accent" href={data.evidenceUrl} target="_blank" rel="noreferrer">
              Enlace evidencia
            </a>
          </p>
        ) : null}
        <p className="mt-4 text-xs text-base-content/60">Enviado: {data.submittedAt}</p>
      </SectionCard>

      <SectionCard
        title="Historial"
        subtitle="Secuencia cronologica de acciones sobre este envio."
        titleIcon={<HiListBullet aria-hidden />}
      >
        {data.history.length === 0 ? (
          <p className="text-base-content/70">Sin acciones aun.</p>
        ) : (
          <ul className="relative max-w-2xl space-y-4 border-l-2 border-accent/30 pl-6">
            {data.history.map((h) => (
              <li key={h.id} className="relative">
                <span
                  className="absolute -left-[calc(1.5rem+3px)] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-base-100"
                  aria-hidden
                />
                <p className="text-xs text-base-content/60">{h.createdAt}</p>
                <p className="text-sm">
                  <strong>{h.action}</strong> <span className="text-base-content/70">({h.actorRole})</span>
                </p>
                {h.comment ? <p className="mt-1 text-sm text-base-content/80">{h.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
