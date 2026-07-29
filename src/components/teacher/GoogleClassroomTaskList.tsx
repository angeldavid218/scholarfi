import { EmptyState } from '../ui/executive'

export type GoogleClassroomCourseWork = {
  id: string
  title: string
  description: string | null
  maxPoints: number | null
  state: string | null
  dueDate: string | null
  dueTime: string | null
}

type GoogleClassroomTaskListProps = {
  courseSelected: boolean
  loading?: boolean
  tasks: GoogleClassroomCourseWork[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
}

export function GoogleClassroomTaskList({
  courseSelected,
  loading = false,
  tasks,
  selectedIds,
  onSelectedIdsChange,
}: GoogleClassroomTaskListProps) {
  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length

  function toggleTask(taskId: string) {
    onSelectedIdsChange(
      selectedIds.includes(taskId)
        ? selectedIds.filter((id) => id !== taskId)
        : [...selectedIds, taskId]
    )
  }

  function toggleSelectAll() {
    onSelectedIdsChange(allSelected ? [] : tasks.map((task) => task.id))
  }

  return (
    <div className="form-control w-full">
      <div className="label pt-0">
        <span className="label-text">Tareas de Classroom</span>
        {courseSelected && tasks.length > 0 ? (
          <span className="label-text-alt">
            {selectedIds.length} de {tasks.length} seleccionadas
          </span>
        ) : null}
      </div>

      {!courseSelected ? (
        <p className="text-sm text-base-content/60">Selecciona un curso para ver sus tareas.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-base-content/70">
          <span className="loading loading-sm loading-spinner text-primary" aria-hidden />
          Cargando tareas...
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Sin tareas en este curso"
          detail="No hay coursework publicado en Google Classroom para este curso."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-base-300">
          <div className="flex items-center justify-between gap-2 border-b border-base-300 bg-base-200/50 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Seleccionar todas las tareas"
              />
              Seleccionar todas
            </label>
          </div>
          <ul
            className="max-h-72 divide-y divide-base-300 overflow-y-auto"
            role="listbox"
            aria-multiselectable="true"
          >
            {tasks.map((task) => {
              const checked = selectedIds.includes(task.id)
              return (
                <li key={task.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-base-200/40">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary mt-0.5"
                      checked={checked}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Seleccionar ${task.title}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-base-content">
                        {task.title}
                        {task.maxPoints != null ? (
                          <span className="ml-1 font-normal text-base-content/60">
                            ({task.maxPoints} pts)
                          </span>
                        ) : null}
                      </span>
                      {task.description ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-base-content/60">
                          {task.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
