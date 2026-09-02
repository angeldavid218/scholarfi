import { useState, type FormEvent } from 'react'
import { HiCheck, HiInboxStack, HiXMark } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { RejectReasonModal } from '../../components/submissions/RejectReasonModal'
import { SubmissionEvidenceCell } from '../../components/submissions/SubmissionEvidenceCell'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
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

export const TeacherValidationQueuePage = () => {
  const { token } = useAuth()
  const { page, perPage, onPageChange, onPerPageChange } = usePagination()
  const { data, loading, error, reload } = useTokenResource<QueueData>({
    load: async (authToken) => {
      const q = await api.get<PaginatedPayload<QueueRow>>(
        `/submissions/teacher-queue?page=${page}&perPage=${perPage}`,
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

  const validateSubmission = async (id: number) => {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${id}/teacher-action`, { json: { action: 'validate' }, token })
      setActionMsg(`Envio ${id} validado.`)
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
      await api.patch(`/submissions/${rejectId}/teacher-reject`, {
        json: { reason: rejectReason.trim() },
        token,
      })
      setActionMsg(`Envio ${rejectId} rechazado.`)
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
        eyebrow="Panel docente"
        title="Cola de validacion"
        subtitle="Revisa evidencia con mayor contexto y emite dictamen con trazabilidad completa."
      />
      <KpiStrip
        items={[
          { label: 'Pendientes', value: formatId(queueMeta?.total ?? queue.length), hint: 'Envios por revisar' },
          { label: 'SLA sugerido', value: '24h', hint: 'Objetivo de respuesta' },
        ]}
      />
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {actionMsg ? <AlertBanner tone="info">{actionMsg}</AlertBanner> : null}
      <SectionCard
        title="Cola de validacion"
        subtitle="Espacio dedicado para revisar evidencia y decidir validacion o rechazo."
        titleIcon={<HiInboxStack aria-hidden />}
      >
        {(queueMeta?.total ?? 0) === 0 ? (
          <EmptyState title="Sin envios pendientes." detail="Cuando estudiantes envien evidencia, apareceran aqui." />
        ) : (
          <div className="space-y-3">
            <TableShell>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tarea</th>
                  <th>Estudiante</th>
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
                    <td>{formatId(s.studentId)}</td>
                    <SubmissionEvidenceCell evidenceText={s.evidenceText} evidenceUrl={s.evidenceUrl} />
                    <td className="whitespace-nowrap text-sm text-base-content/70">
                      <span title={s.submittedAt}>{formatRelativeDate(new Date(s.submittedAt))}</span>
                    </td>
                    <td className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm gap-1 w-full"
                        onClick={() => void validateSubmission(s.id)}
                      >
                        <HiCheck className="h-4 w-4" aria-hidden />
                        Validar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-error btn-sm gap-1 w-full"
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
            <span className="text-error">Motivo de rechazo (envio #{rejectId})</span>
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
        placeholder="Describe brevemente por que no cumple criterios…"
      />
    </div>
  )
}
