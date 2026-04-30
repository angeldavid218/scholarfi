import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { formatAmount, formatId } from '../../i18n/format'

type TaskRow = {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
}

type Balance = {
  simulatedBalance: number
  institutionId: number | null
}

type SubmissionRow = {
  id: number
  taskId: number
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
  if (status === 'approved') return 'badge badge-success badge-sm'
  if (status === 'rejected_by_teacher' || status === 'rejected_by_admin') return 'badge badge-error badge-sm'
  if (status === 'validated') return 'badge badge-info badge-sm'
  return 'badge badge-warning badge-sm'
}

export function StudentHome() {
  const { token } = useAuth()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null)
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [b, t, s] = await Promise.all([
        api.get<Balance>('/rewards/balance', { token }),
        api.get<TaskRow[]>('/tasks/available', { token }),
        api.get<SubmissionRow[]>('/submissions', { token }),
      ])
      setBalance(b)
      setTasks(Array.isArray(t) ? t : [])
      setSubmissions(Array.isArray(s) ? s : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || !submitTaskId) return
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      const body: { taskId: number; evidenceText: string; evidenceUrl?: string } = {
        taskId: submitTaskId,
        evidenceText: evidenceText.trim(),
      }
      const url = evidenceUrl.trim()
      if (url) body.evidenceUrl = url
      const created = await api.post<{ id: number }>('/submissions', { json: body, token })
      setLastCreatedId(created.id)
      setSubmitMsg('Enviado correctamente.')
      setEvidenceText('')
      setEvidenceUrl('')
      setSubmitTaskId(null)
      await load()
    } catch (err) {
      setSubmitMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo enviar la evidencia'
      )
    } finally {
      setSubmitting(false)
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
      <h1 className="text-2xl font-semibold tracking-tight text-base-content">Estudiante</h1>

      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      {lastCreatedId !== null && (
        <div className="alert alert-success flex flex-wrap items-center justify-between gap-2">
          <span>
            Ultimo envio:{' '}
            <Link className="link font-semibold" to={`/student/submissions/${lastCreatedId}`}>
              #{lastCreatedId}
            </Link>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLastCreatedId(null)}>
            Cerrar
          </button>
        </div>
      )}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Saldo simulado</h2>
          <p className="text-3xl font-semibold tabular-nums text-primary">
            {formatAmount(balance?.simulatedBalance ?? 0)}
          </p>
          <p className="text-sm text-base-content/70">Puntos (economia simulada)</p>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Tareas disponibles</h2>
          {tasks.length === 0 ? (
            <p className="text-base-content/70">No hay tareas activas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titulo</th>
                    <th>Recompensa</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <th>{formatId(t.id)}</th>
                      <td>{t.title}</td>
                      <td>{formatAmount(t.rewardAmount)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSubmitTaskId(t.id)
                            setSubmitMsg(null)
                          }}
                        >
                          Enviar evidencia
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

      {submitTaskId !== null && (
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg">Nuevo envio (tarea #{submitTaskId})</h2>
            <form className="mt-2 flex max-w-lg flex-col gap-4" onSubmit={onSubmit}>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Evidencia (texto)</span>
                </div>
                <textarea
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  className="textarea textarea-bordered min-h-28 w-full"
                  required
                  minLength={2}
                />
              </label>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">URL evidencia (opcional)</span>
                </div>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://…"
                  className="input input-bordered w-full"
                />
              </label>
              {submitMsg && (
                <div
                  role="status"
                  className={
                    submitMsg.includes('correctamente') ? 'alert alert-success text-sm' : 'alert alert-error text-sm'
                  }
                >
                  {submitMsg}
                </div>
              )}
              <div className="card-actions justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSubmitTaskId(null)
                    setSubmitMsg(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Enviando…
                    </>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Mis envios</h2>
          {submissions.length === 0 ? (
            <p className="text-base-content/70">Aun no has enviado evidencias.</p>
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
                        <span title={submission.submittedAt}>{formatRelativeDate(submission.submittedAt)}</span>
                      </td>
                      <td>
                        <Link
                          className="btn btn-outline btn-sm"
                          to={`/student/submissions/${submission.id}`}
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
