import { HiArrowTopRightOnSquare, HiQueueList } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { submissionStatusTone } from '../../components/ui/statusTones'
import { TableShell } from '../../components/ui/TableShell'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'

interface SubmissionRow {
  id: number
  taskId: number
  status: string
  statusLabelEs: string
  submittedAt: string
}

export const StudentSubmissionsPage = () => {
  const { data, loading, error } = useTokenResource<SubmissionRow[]>({
    load: async (token) => {
      const s = await api.get<SubmissionRow[]>('/submissions', { token })
      return Array.isArray(s) ? s : []
    },
  })

  const submissions = data ?? []

  if (loading) return <PageSpinner />

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
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
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
          <TableShell compact>
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
                    <StatusBadge tone={submissionStatusTone(submission.status)}>
                      {submission.statusLabelEs}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap text-xs text-base-content/70">
                    <span title={submission.submittedAt}>
                      {formatRelativeDate(new Date(submission.submittedAt))}
                    </span>
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
          </TableShell>
        )}
      </SectionCard>
    </div>
  )
}
