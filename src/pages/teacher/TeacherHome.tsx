import { useCallback, useEffect, useState } from 'react'
import {
  HiArrowPath,
  HiClipboardDocumentList,
  HiLockClosed,
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { TablePagination } from '../../components/ui/TablePagination'
import { TASK_STATUS_LABELS } from '../../i18n/es'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

type TaskRow = {
  id: number
  title: string
  description: string
  rewardAmount: number
  dueAt: string | null
  status: string
  externalSource?: string
  syncMetadata?: {
    minGrade?: number
    maxPoints?: number | null
    lastSyncAt?: string | null
    lastSyncSummary?: {
      rewarded: number
      budgetRemaining: number
    } | null
  } | null
}

type TeacherTaskSummary = {
  total: number
  closed: number
}

type TeacherCreditPool = {
  teacherId: number
  allocatedCredits: number
  utilizedCredits: number
  remainingCredits: number
  hasPool: boolean
}

type ClassroomSyncResult = {
  rewarded: number
  skippedLowGrade: number
  skippedNoGrade: number
  skippedAlreadyRewarded: number
  skippedBudgetExhausted: number
  budgetRemaining: number
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'badge badge-success badge-sm'
  if (status === 'closed') return 'badge badge-neutral badge-sm'
  return 'badge badge-ghost badge-sm'
}

function formatTaskDueLine(dueAt: string | null): string | null {
  if (!dueAt) return null
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  const formatted = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(due)
  return `Vence: ${formatted}`
}

function isSyncableClassroomTask(task: TaskRow): boolean {
  return task.externalSource === 'google_classroom' && task.status === 'active'
}

export function TeacherHome() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [tasksMeta, setTasksMeta] = useState<PaginatedMeta | null>(null)
  const [summary, setSummary] = useState<TeacherTaskSummary | null>(null)
  const [creditPool, setCreditPool] = useState<TeacherCreditPool | null>(null)
  const [tasksPage, setTasksPage] = useState(1)
  const [tasksPerPage, setTasksPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionMsgTone, setActionMsgTone] = useState<'info' | 'success' | 'error'>('info')
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return
    setError(null)
    if (!options?.silent) setLoading(true)
    try {
      const [s, t, pool] = await Promise.all([
        api.get<TeacherTaskSummary>('/tasks/summary', { token }),
        api.get<PaginatedPayload<TaskRow>>(`/tasks?page=${tasksPage}&perPage=${tasksPerPage}`, { token }),
        api.get<TeacherCreditPool>('/teachers/credit-pool', { token }).catch(() => null),
      ])
      setSummary(s)
      setTasks(Array.isArray(t?.items) ? t.items : [])
      setTasksMeta(t?.meta ?? null)
      setCreditPool(pool)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [token, tasksPage, tasksPerPage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function postClassroomSync(id: number): Promise<ClassroomSyncResult> {
    if (!token) throw new Error('No autenticado')
    return api.post<ClassroomSyncResult>(`/tasks/${id}/sync-classroom`, { json: {}, token })
  }

  function summarizeSyncResult(result: ClassroomSyncResult): string {
    const skippedTotal =
      result.skippedLowGrade +
      result.skippedNoGrade +
      result.skippedAlreadyRewarded +
      result.skippedBudgetExhausted
    return `${result.rewarded} recompensa(s) emitida(s), ${skippedTotal} omitida(s). Presupuesto restante: ${result.budgetRemaining}.`
  }

  async function syncClassroomTask(id: number) {
    if (!token || syncingTaskId != null || syncingAll) return
    setSyncingTaskId(id)
    setActionMsg(null)
    setActionMsgTone('info')
    try {
      const result = await postClassroomSync(id)
      setActionMsgTone(result.rewarded > 0 ? 'success' : 'info')
      setActionMsg(`Sincronizacion completada: ${summarizeSyncResult(result)}`)
      await load({ silent: true })
    } catch (err) {
      setActionMsgTone('error')
      setActionMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo sincronizar con Classroom'
      )
    } finally {
      setSyncingTaskId(null)
    }
  }

  async function syncAllClassroomTasks() {
    if (!token || syncingTaskId != null || syncingAll) return
    const syncable = tasks.filter(isSyncableClassroomTask)
    if (syncable.length === 0) {
      setActionMsgTone('info')
      setActionMsg('No hay tareas activas de Google Classroom para sincronizar en esta pagina.')
      return
    }

    setSyncingAll(true)
    setActionMsg(null)
    setActionMsgTone('info')
    let rewardedTotal = 0
    let skippedTotal = 0
    let lastBudgetRemaining: number | null = null
    let failed = 0

    try {
      for (const task of syncable) {
        setSyncingTaskId(task.id)
        try {
          const result = await postClassroomSync(task.id)
          rewardedTotal += result.rewarded
          skippedTotal +=
            result.skippedLowGrade +
            result.skippedNoGrade +
            result.skippedAlreadyRewarded +
            result.skippedBudgetExhausted
          lastBudgetRemaining = result.budgetRemaining
        } catch {
          failed += 1
        }
      }

      if (failed === syncable.length) {
        setActionMsgTone('error')
        setActionMsg('No se pudo sincronizar ninguna tarea con Classroom.')
      } else {
        setActionMsgTone(rewardedTotal > 0 ? 'success' : failed > 0 ? 'error' : 'info')
        const budgetPart =
          lastBudgetRemaining != null ? ` Presupuesto restante: ${lastBudgetRemaining}.` : ''
        setActionMsg(
          `Sincronizacion masiva: ${syncable.length - failed}/${syncable.length} tarea(s) OK. ${rewardedTotal} recompensa(s), ${skippedTotal} omitida(s).${budgetPart}`
        )
      }
      await load({ silent: true })
    } finally {
      setSyncingTaskId(null)
      setSyncingAll(false)
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
        title="Mis tareas de Classroom"
        subtitle="Importa actividades desde Google Classroom, sincroniza calificaciones y administra el portafolio de tareas de tu clase."
      />
      <KpiStrip
        items={[
          { label: 'Tareas propias', value: formatId(totalTasks), hint: 'Inventario actual' },
          {
            label: 'Tasa de cierre',
            value: `${closeRatePct}%`,
            hint: 'Tareas finalizadas',
          },
          ...(creditPool?.hasPool
            ? [
                {
                  label: 'Presupuesto docente',
                  value: formatCreditsWithUnit(creditPool.remainingCredits),
                  hint: 'Disponible para recompensas autonomas',
                },
              ]
            : []),
        ]}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {syncingTaskId != null || syncingAll ? (
        <div role="status" aria-live="polite" className="alert alert-info text-sm">
          <span className="loading loading-spinner loading-sm" aria-hidden />
          {syncingAll
            ? 'Sincronizando todas las tareas de Google Classroom. Esto puede tardar unos segundos.'
            : 'Sincronizando con Google Classroom: cargando calificaciones, revisando entregas y emitiendo recompensas. Esto puede tardar unos segundos.'}
        </div>
      ) : null}
      {actionMsg && syncingTaskId == null && !syncingAll ? (
        <div
          role="status"
          aria-live="polite"
          className={
            actionMsgTone === 'success'
              ? 'alert alert-success text-sm'
              : actionMsgTone === 'error'
                ? 'alert alert-error text-sm'
                : 'alert alert-info text-sm'
          }
        >
          {actionMsg}
        </div>
      ) : null}

      <SectionCard
        title="Mis tareas"
        subtitle="Portafolio de actividades importadas desde Google Classroom."
        titleIcon={<HiClipboardDocumentList aria-hidden />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-ghost badge-sm">
              {formatId(tasksMeta?.total ?? tasks.length)} registros
            </span>
            <Link to="/teacher/integraciones" className="btn btn-outline btn-sm">
              Importar de Classroom
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm gap-1"
              disabled={syncingTaskId != null || syncingAll || !tasks.some(isSyncableClassroomTask)}
              aria-busy={syncingAll}
              onClick={() => void syncAllClassroomTasks()}
            >
              {syncingAll ? (
                <>
                  <span className="loading loading-spinner loading-sm" aria-hidden />
                  Sincronizando…
                </>
              ) : (
                <>
                  <HiArrowPath className="h-4 w-4" aria-hidden />
                  Sincronizar todo
                </>
              )}
            </button>
          </div>
        }
      >
        {(tasksMeta?.total ?? 0) === 0 ? (
          <EmptyState
            title="Aun no tienes tareas importadas."
            detail="Conecta Google Classroom e importa tareas para iniciar el ciclo de recompensas."
          />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titulo</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const dueLine = formatTaskDueLine(t.dueAt)
                    return (
                      <tr key={t.id}>
                        <th>{formatId(t.id)}</th>
                        <td>
                          <div>{t.title}</div>
                          {dueLine ? (
                            <div className="text-xs text-base-content/60">{dueLine}</div>
                          ) : null}
                        </td>
                        <td>
                          {t.externalSource === 'google_classroom' ? (
                            <span className="badge badge-info badge-sm">Classroom</span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">Manual</span>
                          )}
                        </td>
                        <td>
                          <span className={statusBadgeClass(t.status)}>
                            {TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}
                          </span>
                        </td>
                        <td className="flex flex-wrap gap-1">
                          {isSyncableClassroomTask(t) ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm gap-1"
                              disabled={syncingTaskId != null || syncingAll}
                              aria-busy={syncingTaskId === t.id}
                              onClick={() => void syncClassroomTask(t.id)}
                              title={
                                t.syncMetadata?.minGrade != null
                                  ? `Nota minima: ${t.syncMetadata.minGrade}`
                                  : undefined
                              }
                            >
                              {syncingTaskId === t.id ? (
                                <>
                                  <span className="loading loading-spinner loading-sm" aria-hidden />
                                  Sincronizando…
                                </>
                              ) : (
                                <>
                                  <HiArrowPath className="h-4 w-4" aria-hidden />
                                  Sincronizar
                                </>
                              )}
                            </button>
                          ) : null}
                          {t.status === 'active' ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm gap-1"
                              disabled={syncingTaskId != null || syncingAll}
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
                    )
                  })}
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
