import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  HiClipboardDocumentList,
  HiLockClosed,
  HiPlusCircle,
} from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { TablePagination } from '../../components/ui/TablePagination'
import { CREDIT_TOKEN_NAME, TASK_STATUS_LABELS } from '../../i18n/es'
import { formatId } from '../../i18n/format'

type TaskRow = {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
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

type TasksPageResponse = {
  items: TaskRow[]
  meta: PaginatedMeta
}

type TeacherTaskSummary = {
  total: number
  closed: number
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'badge badge-success badge-sm'
  if (status === 'closed') return 'badge badge-neutral badge-sm'
  return 'badge badge-ghost badge-sm'
}

export function TeacherHome() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [tasksMeta, setTasksMeta] = useState<PaginatedMeta | null>(null)
  const [summary, setSummary] = useState<TeacherTaskSummary | null>(null)
  const [tasksPage, setTasksPage] = useState(1)
  const [tasksPerPage, setTasksPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createMsg, setCreateMsg] = useState<string | null>(null)

  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [s, t] = await Promise.all([
        api.get<TeacherTaskSummary>('/tasks/summary', { token }),
        api.get<TasksPageResponse>(`/tasks?page=${tasksPage}&perPage=${tasksPerPage}`, { token }),
      ])
      setSummary(s)
      setTasks(Array.isArray(t?.items) ? t.items : [])
      setTasksMeta(t?.meta ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token, tasksPage, tasksPerPage])

  useEffect(() => {
    load()
  }, [load])

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) return
    setCreateMsg(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const title = String(fd.get('title') ?? '').trim()
    const description = String(fd.get('description') ?? '').trim()
    const rewardAmount = Number(String(fd.get('rewardAmount') ?? ''))
    const dueAtRaw = String(fd.get('dueAt') ?? '').trim()
    try {
      const body: Record<string, unknown> = {
        title,
        description,
        rewardAmount,
      }
      if (dueAtRaw) body.dueAt = new Date(dueAtRaw).toISOString()
      await api.post('/tasks', { json: body, token })
      setCreateMsg('Tarea creada.')
      form.reset()
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  const totalTasks = summary?.total ?? 0
  const closedTasks = summary?.closed ?? 0
  const closeRatePct =
    totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel docente"
        title="Operacion de validacion"
        subtitle="Crea retos, revisa evidencia estudiantil y asegura trazabilidad de cada decision pedagogica."
      />
      <KpiStrip
        items={[
          { label: 'Tareas propias', value: formatId(totalTasks), hint: 'Inventario actual' },
          { label: 'Cola pendiente', value: 'Ver modulo', hint: 'Seccion dedicada en sidebar' },
          {
            label: 'Tasa de cierre',
            value: `${closeRatePct}%`,
            hint: 'Tareas finalizadas',
          },
        ]}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg && (
        <div role="status" className="alert alert-info text-sm">
          {actionMsg}
        </div>
      )}

      <SectionCard
        title="Nueva tarea"
        subtitle="Define actividades con impacto medible y reglas claras de evaluacion."
        titleIcon={<HiPlusCircle aria-hidden />}
      >
        <form className="mt-2 grid max-w-xl gap-4" onSubmit={createTask}>
          <label className="form-control w-full">
            <div className="label pt-0">
              <span className="label-text">Titulo</span>
            </div>
            <input
              name="title"
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
              name="description"
              required
              minLength={2}
              rows={3}
              className="textarea textarea-bordered w-full"
            />
          </label>
          <label className="form-control w-full">
            <div className="label pt-0">
              <span className="label-text">
                {CREDIT_TOKEN_NAME} (por tarea, &gt; 0)
              </span>
            </div>
            <input
              name="rewardAmount"
              type="number"
              min={0.01}
              step="any"
              defaultValue={10}
              required
              className="input input-bordered w-full"
            />
          </label>
          <label className="form-control w-full">
            <div className="label pt-0">
              <span className="label-text">Fecha limite (opcional)</span>
            </div>
            <input name="dueAt" type="datetime-local" className="input input-bordered w-full" />
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
      </SectionCard>

      <SectionCard
        title="Mis tareas"
        subtitle="Portafolio de actividades bajo tu responsabilidad."
        titleIcon={<HiClipboardDocumentList aria-hidden />}
      >
        {(tasksMeta?.total ?? 0) === 0 ? (
          <EmptyState title="Aun no registras tareas." detail="Crea una tarea para iniciar el ciclo de evidencia." />
        ) : (
          <div className="space-y-3">
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
                          <button
                            type="button"
                            className="btn btn-outline btn-sm gap-1"
                            onClick={() => closeTask(t.id)}
                          >
                            <HiLockClosed className="h-4 w-4" aria-hidden />
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
            <TablePagination
              page={tasksMeta?.currentPage ?? tasksPage}
              perPage={tasksMeta?.perPage ?? tasksPerPage}
              total={tasksMeta?.total ?? tasks.length}
              onPageChange={(nextPage) => setTasksPage(nextPage)}
              onPerPageChange={(nextPerPage) => {
                setTasksPerPage(nextPerPage)
                setTasksPage(1)
              }}
            />
          </div>
        )}
      </SectionCard>

    </div>
  )
}
