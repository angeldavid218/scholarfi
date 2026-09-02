import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HiClipboardDocumentList, HiPaperAirplane } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { FormField } from '../../components/ui/FormField'
import { LoadingButton } from '../../components/ui/LoadingButton'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { TableShell } from '../../components/ui/TableShell'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'

interface TaskRow {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
}

export const StudentTasksPage = () => {
  const { token } = useAuth()
  const { data, loading, error, reload } = useTokenResource<TaskRow[]>({
    load: async (authToken) => {
      const t = await api.get<TaskRow[]>('/tasks/available', { token: authToken })
      return Array.isArray(t) ? t : []
    },
  })

  const tasks = data ?? []
  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null)
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null)

  const onSubmit = async (e: FormEvent) => {
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
      await reload(true)
    } catch (err) {
      setSubmitMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo enviar la evidencia')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner />

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
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {lastCreatedId !== null ? (
        <AlertBanner tone="success" className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Ultimo envio:{' '}
            <Link className="link font-semibold" to={`/student/submissions/${lastCreatedId}`}>
              #{lastCreatedId}
            </Link>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLastCreatedId(null)}>
            Cerrar
          </button>
        </AlertBanner>
      ) : null}

      <SectionCard
        title="Tareas disponibles"
        subtitle="Prioriza entregas activas para mantener ritmo de avance."
        titleIcon={<HiClipboardDocumentList aria-hidden />}
      >
        {tasks.length === 0 ? (
          <EmptyState title="No hay tareas activas." detail="Cuando un docente publique tareas, apareceran aqui." />
        ) : (
          <TableShell compact>
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
          </TableShell>
        )}
      </SectionCard>

      {submitTaskId !== null ? (
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg">Nuevo envio (tarea #{submitTaskId})</h2>
            <form className="mt-2 flex max-w-lg flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
              <FormField label="Evidencia (texto)">
                <textarea
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  className="textarea textarea-bordered min-h-28 w-full"
                  required
                  minLength={2}
                />
              </FormField>
              <FormField label="URL evidencia (opcional)">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://…"
                  className="input input-bordered w-full"
                />
              </FormField>
              {submitMsg ? (
                <AlertBanner tone={submitMsg.includes('correctamente') ? 'success' : 'error'}>
                  {submitMsg}
                </AlertBanner>
              ) : null}
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
                <LoadingButton type="submit" className="btn btn-primary" loading={submitting} loadingLabel="Enviando…">
                  Enviar
                </LoadingButton>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  )
}
