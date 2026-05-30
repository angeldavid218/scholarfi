import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { HiCheck, HiClipboardDocumentCheck, HiXMark } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { Modal } from '../../components/ui/Modal'
import { TablePagination } from '../../components/ui/TablePagination'
import { formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

type QueueRow = {
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

function statusBadgeClass(status: string): string {
  if (status === 'validated') return 'badge badge-info badge-sm'
  if (status === 'approved') return 'badge badge-success badge-sm'
  if (status === 'rejected_by_admin' || status === 'rejected_by_teacher') return 'badge badge-error badge-sm'
  return 'badge badge-ghost badge-sm'
}

export function AdminApprovalQueuePage() {
  const { token } = useAuth()
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [queueMeta, setQueueMeta] = useState<PaginatedMeta | null>(null)
  const [queuePage, setQueuePage] = useState(1)
  const [queuePerPage, setQueuePerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const inputModalRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (rejectId === null) return
    const t = window.setTimeout(() => {
      inputModalRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(t)
  }, [rejectId])

  const loadQueue = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const q = await api.get<PaginatedPayload<QueueRow>>(
        `/submissions/admin-queue?page=${queuePage}&perPage=${queuePerPage}`,
        { token }
      )
      setQueue(Array.isArray(q?.items) ? q.items : [])
      setQueueMeta(q?.meta ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token, queuePage, queuePerPage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue()
  }, [loadQueue])

  async function approveSubmission(id: number) {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${id}/admin-decision`, {
        json: { decision: 'approve' },
        token,
      })
      setActionMsg(`Envio ${id} aprobado (Credit registrado si aplica).`)
      await loadQueue()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Accion no permitida')
    }
  }

  async function submitReject(e: FormEvent) {
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
      await loadQueue()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo rechazar')
    }
  }

  function closeRejectModal() {
    setRejectId(null)
    setRejectReason('')
  }

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
        eyebrow="Panel de administracion"
        title="Cola de aprobacion"
        subtitle="Decision final sobre envios ya validados por docencia: aprueba para acreditar Credit al estudiante o rechaza con motivo auditado."
      />
      <KpiStrip
        items={[
          {
            label: 'Pendientes',
            value: formatId(queueMeta?.total ?? queue.length),
            hint: 'Por decidir',
          },
          { label: 'SLA sugerido', value: '48h', hint: 'Objetivo institucional' },
        ]}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg && (
        <div role="status" className="alert alert-info text-sm">
          {actionMsg}
        </div>
      )}

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
            <div className="overflow-x-auto">
              <table className="table table-zebra">
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
                        <span className={statusBadgeClass(s.status)}>{s.statusLabelEs}</span>
                      </td>
                      <td className="max-w-xl align-top text-sm">
                        {s.evidenceText ? (
                          <p className="whitespace-pre-wrap break-words">{s.evidenceText}</p>
                        ) : null}
                        {s.evidenceUrl ? (
                          <a
                            href={s.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary block truncate pt-1"
                          >
                            Enlace
                          </a>
                        ) : null}
                        {!s.evidenceText && !s.evidenceUrl ? (
                          <span className="text-base-content/50">—</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap text-sm text-base-content/70">
                        <span title={s.submittedAt}>{formatRelativeDate(new Date(s.submittedAt))}</span>
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm w-full gap-1"
                          onClick={() => approveSubmission(s.id)}
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
              </table>
            </div>
            <TablePagination
              page={queueMeta?.currentPage ?? queuePage}
              perPage={queueMeta?.perPage ?? queuePerPage}
              total={queueMeta?.total ?? queue.length}
              onPageChange={(nextPage) => setQueuePage(nextPage)}
              onPerPageChange={(nextPerPage) => {
                setQueuePerPage(nextPerPage)
                setQueuePage(1)
              }}
            />
          </div>
        )}
      </SectionCard>

      <Modal
        open={rejectId !== null}
        onClose={closeRejectModal}
        title={
          rejectId !== null ? (
            <span className="text-error">Rechazo administrativo (envio #{rejectId})</span>
          ) : (
            ''
          )
        }
      >
        <form className="flex flex-col gap-4" onSubmit={submitReject}>
          <label className="form-control w-full">
            <div className="label pt-0">
              <span className="label-text">Razon</span>
            </div>
            <textarea
              ref={inputModalRef}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              minLength={2}
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Motivo institucional del rechazo (visible en auditoria)…"
            />
          </label>
          <div className="modal-action mt-0 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={closeRejectModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-error gap-1">
              <HiXMark className="h-4 w-4" aria-hidden />
              Confirmar rechazo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
