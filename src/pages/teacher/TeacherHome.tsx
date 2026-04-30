import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { formatId } from '../../i18n/format'
import { TASK_STATUS_LABELS } from '../../i18n/es'

type TaskRow = {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
}

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

function formatRelativeDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = date.getTime() - Date.now()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  if (Math.abs(diffMs) < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
  if (Math.abs(diffMs) < day) return rtf.format(Math.round(diffMs / hour), 'hour')
  return rtf.format(Math.round(diffMs / day), 'day')
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'badge badge-success badge-sm'
  if (status === 'closed') return 'badge badge-neutral badge-sm'
  return 'badge badge-ghost badge-sm'
}

export function TeacherHome() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardAmount, setRewardAmount] = useState('10')
  const [dueAt, setDueAt] = useState('')
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [t, q] = await Promise.all([
        api.get<TaskRow[]>('/tasks', { token }),
        api.get<QueueRow[]>('/submissions/teacher-queue', { token }),
      ])
      setTasks(Array.isArray(t) ? t : [])
      setQueue(Array.isArray(q) ? q : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function createTask(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setCreateMsg(null)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        rewardAmount: Number(rewardAmount),
      }
      if (dueAt.trim()) body.dueAt = new Date(dueAt).toISOString()
      await api.post('/tasks', { json: body, token })
      setCreateMsg('Tarea creada.')
      setTitle('')
      setDescription('')
      setRewardAmount('10')
      setDueAt('')
      await load()
    } catch (err) {
      setCreateMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo crear la tarea'
      )
    }
  }

  async function closeTask(id: number) {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/tasks/${id}/close`, { json: {}, token })
      setActionMsg(`Tarea ${id} cerrada.`)
      await load()
    } catch (err) {
      setActionMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cerrar la tarea'
      )
    }
  }

  async function validateSubmission(id: number) {
    if (!token) return
    setActionMsg(null)
    try {
      await api.patch(`/submissions/${id}/teacher-action`, {
        json: { action: 'validate' },
        token,
      })
      setActionMsg(`Envio ${id} validado.`)
      await load()
    } catch (err) {
      setActionMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'Accion no permitida'
      )
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
      await load()
    } catch (err) {
      setActionMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo rechazar'
      )
    }
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
      <h1 className="text-2xl font-semibold tracking-tight">Docente</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg && (
        <div role="status" className="alert alert-info text-sm">
          {actionMsg}
        </div>
      )}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Nueva tarea</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={createTask}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Titulo</span>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Descripcion</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={2}
                rows={3}
                className="textarea textarea-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Recompensa (positiva)</span>
              </div>
              <input
                type="number"
                min={0.01}
                step="any"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Fecha limite (opcional)</span>
              </div>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
            {createMsg && (
              <div
                role="status"
                className={
                  createMsg.includes('creada') ? 'alert alert-success text-sm' : 'alert alert-error text-sm'
                }
              >
                {createMsg}
              </div>
            )}
            <button type="submit" className="btn btn-primary w-fit">
              Crear
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Mis tareas</h2>
          {tasks.length === 0 ? (
            <p className="text-base-content/70">Ninguna.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titulo</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <th>{formatId(t.id)}</th>
                      <td>{t.title}</td>
                      <td>
                        <span className={statusBadgeClass(t.status)}>
                          {TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}
                        </span>
                      </td>
                      <td>
                        {t.status === 'active' ? (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => closeTask(t.id)}>
                            Cerrar
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Cola de validacion</h2>
          {queue.length === 0 ? (
            <p className="text-base-content/70">Sin envios pendientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
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
                      <td className="max-w-xs align-top text-xs">
                        {s.evidenceText ? (
                          <p className="line-clamp-3 whitespace-pre-wrap break-words">{s.evidenceText}</p>
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
                        {!s.evidenceText && !s.evidenceUrl ? <span className="text-base-content/50">—</span> : null}
                      </td>
                      <td className="whitespace-nowrap text-xs text-base-content/70">
                        <span title={s.submittedAt}>{formatRelativeDate(s.submittedAt)}</span>
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => validateSubmission(s.id)}
                        >
                          Validar
                        </button>
                        <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setRejectId(s.id)}>
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {rejectId !== null && (
        <section className="card border border-error/30 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg text-error">Motivo de rechazo (envio #{rejectId})</h2>
            <form className="mt-2 flex max-w-xl flex-col gap-4" onSubmit={submitReject}>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Razon</span>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  minLength={2}
                  rows={3}
                  className="textarea textarea-bordered w-full"
                />
              </label>
              <div className="card-actions justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setRejectId(null)
                    setRejectReason('')
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-error">
                  Confirmar rechazo
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  )
}
