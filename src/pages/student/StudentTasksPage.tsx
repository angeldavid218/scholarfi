import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HiClipboardDocumentList, HiPaperAirplane } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'

type TaskRow = {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
}

export function StudentTasksPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
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
      const t = await api.get<TaskRow[]>('/tasks/available', { token })
      setTasks(Array.isArray(t) ? t : [])
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
      <ExecutiveHero
        eyebrow="Panel estudiantil"
        title="Tareas disponibles"
        subtitle="Elige una tarea activa, entrega evidencia y suma Credit cuando el envío llegue a la aprobación final."
      />
      <KpiStrip
        items={[
          { label: 'Tareas activas', value: formatId(tasks.length), hint: 'Disponibles para entregar evidencia' },
        ]}
      />

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

      <SectionCard
        title="Tareas disponibles"
        subtitle="Prioriza entregas activas para mantener ritmo de avance."
        titleIcon={<HiClipboardDocumentList aria-hidden />}
      >
        {tasks.length === 0 ? (
          <EmptyState title="No hay tareas activas." detail="Cuando un docente publique tareas, apareceran aqui." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titulo</th>
                  <th>Créditos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <th>{formatId(t.id)}</th>
                    <td>{t.title}</td>
                    <td>{formatCreditsWithUnit(t.rewardAmount)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm gap-1"
                        onClick={() => {
                          setSubmitTaskId(t.id)
                          setSubmitMsg(null)
                        }}
                      >
                        <HiPaperAirplane className="h-4 w-4" aria-hidden />
                        Enviar evidencia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

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
    </div>
  )
}
