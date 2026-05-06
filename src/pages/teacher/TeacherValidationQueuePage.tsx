import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { HiCheck, HiInboxStack, HiXMark } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { Modal } from '../../components/ui/Modal'
import { TablePagination } from '../../components/ui/TablePagination'
import { formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'

type QueueRow = {
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

type PaginatedMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string | null
  lastPageUrl: string | null
  nextPageUrl: string | null
  previousPageUrl: string | null
}

type PaginatedQueueResponse = {
  items: QueueRow[]
  meta: PaginatedMeta
}

export function TeacherValidationQueuePage() {
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

  /** Focus reason field after `<dialog>` opens — `showModal()` runs in Modal; defer one tick so focus wins over dialog default. */
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
      const q = await api.get<PaginatedQueueResponse>(
        `/submissions/teacher-queue?page=${queuePage}&perPage=${queuePerPage}`,
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
    loadQueue()
  }, [loadQueue])

  async function validateSubmission(id: number) {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${id}/teacher-action`, {
        json: { action: 'validate' },
        token,
      })
      setActionMsg(`Envio ${id} validado.`)
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
      await api.patch(`/submissions/${rejectId}/teacher-reject`, {
        json: { reason: rejectReason.trim() },
        token,
      })
      setActionMsg(`Envio ${rejectId} rechazado.`)
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
        eyebrow="Panel docente"
        title="Cola de validacion"
        subtitle="Revisa evidencia con mayor contexto y emite dictamen con trazabilidad completa."
      />
      <KpiStrip
        items={[
          {
            label: 'Pendientes',
            value: formatId(queueMeta?.total ?? queue.length),
            hint: 'Envios por revisar',
          },
          { label: 'SLA sugerido', value: '24h', hint: 'Objetivo de respuesta' },
        ]}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg && (
        <div role="status" className="alert alert-info text-sm">
          {actionMsg}
        </div>
      )}

      <SectionCard
        title="Cola de validacion"
        subtitle="Espacio dedicado para revisar evidencia y decidir validacion o rechazo."
        titleIcon={<HiInboxStack aria-hidden />}
      >
        {(queueMeta?.total ?? 0) === 0 ? (
          <EmptyState title="Sin envios pendientes." detail="Cuando estudiantes envien evidencia, apareceran aqui." />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
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
                          className="btn btn-primary btn-sm gap-1 w-full"
                          onClick={() => validateSubmission(s.id)}
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
            <span className="text-error">Motivo de rechazo (envio #{rejectId})</span>
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
              placeholder="Describe brevemente por que no cumple criterios…"
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
