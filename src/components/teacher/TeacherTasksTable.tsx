import { HiArrowPath, HiClipboardDocumentList, HiLockClosed, HiUserGroup } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { TASK_STATUS_LABELS } from '../../i18n/es'
import { formatId } from '../../i18n/format'
import type { PaginatedMeta } from '../../types'
import { EmptyState, SectionCard } from '../ui/executive'
import { LoadingButton } from '../ui/LoadingButton'
import { StatusBadge } from '../ui/StatusBadge'
import { taskStatusTone } from '../ui/statusTones'
import { TablePagination } from '../ui/TablePagination'
import { TableShell } from '../ui/TableShell'

export interface TeacherTaskRow {
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

const formatTaskDueLine = (dueAt: string | null): string | null => {
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

const isSyncableClassroomTask = (task: TeacherTaskRow): boolean =>
  task.externalSource === 'google_classroom' && task.status === 'active'

interface TeacherTasksTableProps {
  tasks: TeacherTaskRow[]
  tasksMeta: PaginatedMeta | null
  page: number
  perPage: number
  classroomDemo: boolean
  busy: boolean
  syncingTaskId: number | null
  syncingAll: boolean
  syncingStudents: boolean
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onSyncTask: (id: number) => void
  onSyncAll: () => void
  onSyncStudents: () => void
  onCloseTask: (id: number) => void
}

export const TeacherTasksTable = ({
  tasks,
  tasksMeta,
  page,
  perPage,
  classroomDemo,
  busy,
  syncingTaskId,
  syncingAll,
  syncingStudents,
  onPageChange,
  onPerPageChange,
  onSyncTask,
  onSyncAll,
  onSyncStudents,
  onCloseTask,
}: TeacherTasksTableProps) => {
  return (
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
          <LoadingButton
            className="btn btn-outline btn-sm gap-1"
            disabled={busy}
            loading={syncingStudents}
            loadingLabel="Sincronizando…"
            onClick={onSyncStudents}
          >
            <HiUserGroup className="h-4 w-4" aria-hidden />
            Sincronizar estudiantes
          </LoadingButton>
          <LoadingButton
            className="btn btn-outline btn-sm gap-1"
            disabled={busy}
            loading={syncingAll}
            loadingLabel="Sincronizando…"
            onClick={onSyncAll}
          >
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Sincronizar todo
          </LoadingButton>
        </div>
      }
    >
      {(tasksMeta?.total ?? 0) === 0 ? (
        <EmptyState
          title="Aun no tienes tareas importadas."
          detail={
            classroomDemo
              ? 'Importa las tareas de demo en Integraciones (Matematicas 3A, las 2 actividades).'
              : 'Conecta Google Classroom e importa tareas para iniciar el ciclo de recompensas.'
          }
        />
      ) : (
        <div className="space-y-3">
          <TableShell compact>
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
                      {dueLine ? <div className="text-xs text-base-content/60">{dueLine}</div> : null}
                    </td>
                    <td>
                      {t.externalSource === 'google_classroom' ? (
                        <StatusBadge tone="info">Classroom</StatusBadge>
                      ) : (
                        <StatusBadge tone="ghost">Manual</StatusBadge>
                      )}
                    </td>
                    <td>
                      <StatusBadge tone={taskStatusTone(t.status)}>
                        {TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}
                      </StatusBadge>
                    </td>
                    <td className="flex flex-wrap gap-1">
                      {isSyncableClassroomTask(t) ? (
                        <LoadingButton
                          className="btn btn-primary btn-sm gap-1"
                          disabled={busy}
                          loading={syncingTaskId === t.id}
                          loadingLabel="Sincronizando…"
                          onClick={() => onSyncTask(t.id)}
                          title={
                            t.syncMetadata?.minGrade != null
                              ? `Nota minima: ${t.syncMetadata.minGrade}`
                              : undefined
                          }
                        >
                          <HiArrowPath className="h-4 w-4" aria-hidden />
                          Sincronizar
                        </LoadingButton>
                      ) : null}
                      {t.status === 'active' ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm gap-1"
                          disabled={busy}
                          onClick={() => onCloseTask(t.id)}
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
          </TableShell>
          <TablePagination
            page={tasksMeta?.currentPage ?? page}
            perPage={tasksMeta?.perPage ?? perPage}
            total={tasksMeta?.total ?? tasks.length}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </div>
      )}
    </SectionCard>
  )
}
