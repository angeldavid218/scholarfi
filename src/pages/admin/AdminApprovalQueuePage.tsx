import { useState, type FormEvent } from 'react'
import { HiCheck, HiClipboardDocumentCheck, HiXMark } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { RejectReasonModal } from '../../components/submissions/RejectReasonModal'
import { SubmissionEvidenceCell } from '../../components/submissions/SubmissionEvidenceCell'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { submissionStatusTone } from '../../components/ui/statusTones'
import { TablePagination } from '../../components/ui/TablePagination'
import { TableShell } from '../../components/ui/TableShell'
import { usePagination } from '../../hooks/usePagination'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

interface QueueRow {
  id: number
  taskId: number
  taskTitle: string
  studentId: number
  studentName: string
  evidenceText: string | null
  evidenceUrl: string | null
  status: string
  statusLabelEs: string
  submittedAt: string
}

interface QueueData {
  items: QueueRow[]
  meta: PaginatedMeta | null
}

export const AdminApprovalQueuePage = () => {
  const { token } = useAuth()
  const { page, perPage, onPageChange, onPerPageChange } = usePagination()
  const { data, loading, error, reload } = useTokenResource<QueueData>({
    load: async (authToken) => {
      const q = await api.get<PaginatedPayload<QueueRow>>(
        `/submissions/admin-queue?page=${page}&perPage=${perPage}`,
        { token: authToken }
      )
      return { items: Array.isArray(q?.items) ? q.items : [], meta: q?.meta ?? null }
    },
    deps: [page, perPage],
  })

  const queue = data?.items ?? []
  const queueMeta = data?.meta ?? null
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const approveSubmission = async (id: number) => {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${id}/admin-decision`, { json: { decision: 'approve' }, token })
      setActionMsg(`Envio ${id} aprobado (Credit registrado si aplica).`)
      await reload(false)
    } catch (err) {
      setActionMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Accion no permitida')
    }
  }

  const submitReject = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || rejectId === null) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${rejectId}/admin-decision`, {
        json: { decision: 'reject', reason: rejectReason.trim() },
        token,
      })
      setActionMsg(`Envio ${rejectId} rechazado por administracion.`)
      setRejectId(null)
      setRejectReason('')
      await reload(false)
    } catch (err) {
      setActionMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo rechazar')
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel de administracion"
        title="Cola de aprobacion"
        subtitle="Decision final sobre envios ya validados por docencia: aprueba para acreditar Credit al estudiante o rechaza con motivo auditado."
      />
      <KpiStrip
        items={[
          { label: 'Pendientes', value: formatId(queueMeta?.total ?? queue.length), hint: 'Por decidir' },
          { label: 'SLA sugerido', value: '48h', hint: 'Objetivo institucional' },
        ]}
      />
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {actionMsg ? <AlertBanner tone="info">{actionMsg}</AlertBanner> : null}
      <SectionCard
        title="Cola de aprobacion"
        subtitle="Ultimo control antes de registrar impacto en balance estudiantil."
        titleIcon={<HiClipboardDocumentCheck aria-hidden />}
      >
        {(queueMeta?.total ?? 0) === 0 ? (
          <EmptyState
            title="Sin envios validados pendientes."
            detail="El sistema mostrara aqui los casos listos para decision final."
          />
        ) : (
          <div className="space-y-3">
            <TableShell>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tarea</th>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Evidencia</th>
                  <th>Enviado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((s) => (
                  <tr key={s.id}>
                    <th>{formatId(s.id)}</th>
                    <td>{s.taskTitle}</td>
                    <td title={`ID estudiante: ${formatId(s.studentId)}`}>
                      {s.studentName?.trim() ? s.studentName : formatId(s.studentId)}
                    </td>
                    <td className="min-w-48 max-w-64">
                      <StatusBadge tone={submissionStatusTone(s.status)}>{s.statusLabelEs}</StatusBadge>
                    </td>
                    <SubmissionEvidenceCell evidenceText={s.evidenceText} evidenceUrl={s.evidenceUrl} />
                    <td className="whitespace-nowrap text-sm text-base-content/70">
                      <span title={s.submittedAt}>{formatRelativeDate(new Date(s.submittedAt))}</span>
                    </td>
                    <td className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-full gap-1"
                        onClick={() => void approveSubmission(s.id)}
                      >
                        <HiCheck className="h-4 w-4" aria-hidden />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-error btn-sm w-full gap-1"
                        onClick={() => setRejectId(s.id)}
                      >
                        <HiXMark className="h-4 w-4" aria-hidden />
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <TablePagination
              page={queueMeta?.currentPage ?? page}
              perPage={queueMeta?.perPage ?? perPage}
              total={queueMeta?.total ?? queue.length}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
            />
          </div>
        )}
      </SectionCard>
      <RejectReasonModal
        open={rejectId !== null}
        title={
          rejectId !== null ? (
            <span className="text-error">Rechazo administrativo (envio #{rejectId})</span>
          ) : (
            ''
          )
        }
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectId(null)
          setRejectReason('')
        }}
        onSubmit={(e) => void submitReject(e)}
        placeholder="Motivo institucional del rechazo (visible en auditoria)…"
      />
    </div>
  )
}
