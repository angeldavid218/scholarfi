import { useCallback, useEffect, useState } from 'react'
import { HiArrowTopRightOnSquare, HiQueueList } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'

type SubmissionRow = {
  id: number
  taskId: number
  status: string
  statusLabelEs: string
  submittedAt: string
}

function statusBadgeClass(status: string): string {
  if (status === 'approved') return 'badge badge-success badge-sm'
  if (status === 'rejected_by_teacher' || status === 'rejected_by_admin') return 'badge badge-error badge-sm'
  if (status === 'validated') return 'badge badge-info badge-sm'
  return 'badge badge-warning badge-sm'
}

export function StudentSubmissionsPage() {
  const { token } = useAuth()
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const s = await api.get<SubmissionRow[]>('/submissions', { token })
      setSubmissions(Array.isArray(s) ? s : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel estudiantil"
        title="Mis envios"
        subtitle="Seguimiento de validaciones docentes y decisiones de administracion escolar."
      />
      <KpiStrip
        items={[
          { label: 'Envios totales', value: formatId(submissions.length), hint: 'Registro auditado' },
          {
            label: 'En curso',
            value: formatId(submissions.filter((s) => s.status === 'pending' || s.status === 'validated').length),
            hint: 'Pendiente o validado',
          },
        ]}
      />

      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      <SectionCard
        title="Mis envios"
        subtitle="Vista consolidada para seguimiento de validaciones y decisiones."
        titleIcon={<HiQueueList aria-hidden />}
      >
        {submissions.length === 0 ? (
          <EmptyState
            title="Aun no has enviado evidencias."
            detail="En Tareas disponibles puedes crear tu primer registro."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tarea</th>
                  <th>Estado</th>
                  <th>Enviado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <th>{formatId(submission.id)}</th>
                    <td>{formatId(submission.taskId)}</td>
                    <td>
                      <span className={statusBadgeClass(submission.status)}>{submission.statusLabelEs}</span>
                    </td>
                    <td className="whitespace-nowrap text-xs text-base-content/70">
                      <span title={submission.submittedAt}>{formatRelativeDate(new Date(submission.submittedAt))}</span>
                    </td>
                    <td>
                      <Link
                        className="btn btn-outline btn-sm gap-1"
                        to={`/student/submissions/${submission.id}`}
                      >
                        <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
