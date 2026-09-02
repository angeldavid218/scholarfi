import { useEffect, useState } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { TeacherTasksTable, type TeacherTaskRow } from '../../components/teacher/TeacherTasksTable'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero, KpiStrip } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { loadDemoConfig } from '../../demo/demoConfig'
import { useClassroomSync } from '../../hooks/useClassroomSync'
import { usePagination } from '../../hooks/usePagination'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

interface TeacherTaskSummary {
  total: number
  closed: number
}

interface TeacherCreditPool {
  teacherId: number
  allocatedCredits: number
  utilizedCredits: number
  remainingCredits: number
  hasPool: boolean
}

interface TeacherHomeData {
  summary: TeacherTaskSummary
  tasks: TeacherTaskRow[]
  tasksMeta: PaginatedMeta | null
  creditPool: TeacherCreditPool | null
}

export const TeacherHome = () => {
  const { token } = useAuth()
  const { page, perPage, onPageChange, onPerPageChange } = usePagination()
  const [classroomDemo, setClassroomDemo] = useState(false)

  const { data, loading, error, reload } = useTokenResource<TeacherHomeData>({
    load: async (authToken) => {
      const [s, t, pool] = await Promise.all([
        api.get<TeacherTaskSummary>('/tasks/summary', { token: authToken }),
        api.get<PaginatedPayload<TeacherTaskRow>>(`/tasks?page=${page}&perPage=${perPage}`, {
          token: authToken,
        }),
        api.get<TeacherCreditPool>('/teachers/credit-pool', { token: authToken }).catch(() => null),
      ])
      return {
        summary: s,
        tasks: Array.isArray(t?.items) ? t.items : [],
        tasksMeta: t?.meta ?? null,
        creditPool: pool,
      }
    },
    deps: [page, perPage],
  })

  const reloadSilent = async (options?: { silent?: boolean }) => {
    await reload(!options?.silent)
  }

  const sync = useClassroomSync({ onSynced: reloadSilent })

  useEffect(() => {
    let cancelled = false
    void loadDemoConfig().then((config) => {
      if (!cancelled) setClassroomDemo(config.enabled === true && config.classroomMock)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const closeTask = async (id: number) => {
    if (!token) return
    sync.setActionMsg(null)
    sync.setActionMsgTone('info')
    try {
      await api.patch(`/tasks/${id}/close`, { json: {}, token })
      sync.setActionMsgTone('success')
      sync.setActionMsg(`Tarea ${id} cerrada.`)
      await reload(true)
    } catch (err) {
      sync.setActionMsgTone('error')
      sync.setActionMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cerrar la tarea'
      )
    }
  }

  if (loading) return <PageSpinner />

  const totalTasks = data?.summary.total ?? 0
  const creditPool = data?.creditPool ?? null

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

      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {sync.busy ? (
        <AlertBanner tone="info">
          <span className="loading loading-spinner loading-sm" aria-hidden />
          {sync.syncingStudents
            ? 'Sincronizando estudiantes desde Google Classroom…'
            : sync.syncingAll
              ? 'Sincronizacion en segundo plano: procesando tareas de Google Classroom…'
              : 'Sincronizacion en segundo plano: cargando calificaciones, revisando entregas y emitiendo recompensas…'}
        </AlertBanner>
      ) : null}
      {sync.actionMsg && !sync.busy ? (
        <AlertBanner tone={sync.actionMsgTone}>{sync.actionMsg}</AlertBanner>
      ) : null}

      <TeacherTasksTable
        tasks={data?.tasks ?? []}
        tasksMeta={data?.tasksMeta ?? null}
        page={page}
        perPage={perPage}
        classroomDemo={classroomDemo}
        busy={sync.busy}
        syncingTaskId={sync.syncingTaskId}
        syncingAll={sync.syncingAll}
        syncingStudents={sync.syncingStudents}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        onSyncTask={(id) => void sync.syncClassroomTask(id)}
        onSyncAll={() => void sync.syncAllClassroomTasks()}
        onSyncStudents={() => void sync.syncClassroomStudents()}
        onCloseTask={(id) => void closeTask(id)}
      />
    </div>
  )
}
