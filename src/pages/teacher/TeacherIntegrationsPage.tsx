import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { HiArrowPath, HiLink, HiXMark } from 'react-icons/hi2'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  GoogleClassroomTaskList,
  type GoogleClassroomCourseWork,
} from '../../components/teacher/GoogleClassroomTaskList'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { CREDIT_TOKEN_NAME } from '../../i18n/es'

type IntegrationStatus = {
  connected: boolean
  provider: string
  mockMode?: boolean
  externalEmail: string | null
  connectedAt: string | null
  lastSyncAt: string | null
}

type ClassroomCourse = {
  id: string
  name: string
  section: string | null
  courseState: string | null
}

export function TeacherIntegrationsPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [courses, setCourses] = useState<ClassroomCourse[]>([])
  const [courseWork, setCourseWork] = useState<GoogleClassroomCourseWork[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourseWorkIds, setSelectedCourseWorkIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCourseWork, setLoadingCourseWork] = useState(false)
  const [importing, setImporting] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const oauthConnected = searchParams.get('connected')
  const oauthError = searchParams.get('error')

  const selectedWorks = useMemo(
    () => courseWork.filter((work) => selectedCourseWorkIds.includes(work.id)),
    [courseWork, selectedCourseWorkIds]
  )

  const loadStatus = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const data = await api.get<IntegrationStatus>('/integrations/google-classroom/status', { token })
      setStatus(data)
      if (data.connected) {
        const courseRows = await api.get<ClassroomCourse[]>('/integrations/google-classroom/courses', {
          token,
        })
        setCourses(Array.isArray(courseRows) ? courseRows : [])
      } else {
        setCourses([])
        setCourseWork([])
        setSelectedCourseWorkIds([])
      }
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar integracion')
    }
  }, [token])

  useEffect(() => {
    setLoading(true)
    void loadStatus().finally(() => setLoading(false))
  }, [loadStatus])

  useEffect(() => {
    if (oauthConnected || oauthError) {
      const msg = oauthConnected
        ? 'Google Classroom conectado correctamente.'
        : `No se pudo conectar Google Classroom: ${oauthError}`
      setActionMsg(msg)
      setSearchParams({}, { replace: true })
    }
  }, [oauthConnected, oauthError, setSearchParams])

  async function connectClassroom() {
    if (!token) return
    setActionMsg(null)
    setConnecting(true)
    try {
      const data = await api.post<{ authUrl: string | null; connected?: boolean; mockMode?: boolean }>(
        '/integrations/google-classroom/connect',
        {
          token,
        }
      )
      if (data.authUrl) {
        window.location.href = data.authUrl
        return
      }
      await loadStatus()
      setActionMsg(
        data.mockMode || data.connected
          ? 'Classroom de demo conectado. Importa Matematicas 3A (2 tareas) para sincronizar.'
          : 'Google Classroom conectado correctamente.'
      )
    } catch (e) {
      setActionMsg(
        e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo iniciar la conexion'
      )
    } finally {
      setConnecting(false)
    }
  }

  async function disconnectClassroom() {
    if (!token) return
    setActionMsg(null)
    try {
      await api.delete('/integrations/google-classroom/disconnect', { token })
      setSelectedCourseId('')
      setSelectedCourseWorkIds([])
      setCourseWork([])
      await loadStatus()
      setActionMsg('Google Classroom desconectado.')
    } catch (e) {
      setActionMsg(
        e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo desconectar'
      )
    }
  }

  async function onCourseChange(courseId: string) {
    setSelectedCourseId(courseId)
    setSelectedCourseWorkIds([])
    setCourseWork([])
    setImportMsg(null)
    if (!token || !courseId) return

    setLoadingCourseWork(true)
    try {
      const rows = await api.get<GoogleClassroomCourseWork[]>(
        `/integrations/google-classroom/courses/${encodeURIComponent(courseId)}/coursework`,
        { token }
      )
      setCourseWork(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setImportMsg(
        e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo cargar las tareas'
      )
    } finally {
      setLoadingCourseWork(false)
    }
  }

  async function runImport(form: HTMLFormElement, mode: 'selected' | 'all') {
    if (!token || !selectedCourseId) return

    const course = courses.find((c) => c.id === selectedCourseId)
    if (!course) return

    const worksToImport =
      mode === 'all' ? courseWork : courseWork.filter((w) => selectedCourseWorkIds.includes(w.id))
    if (worksToImport.length === 0) return

    setImportMsg(null)
    setImporting(true)

    const fd = new FormData(form)
    const rewardAmount = Number(String(fd.get('rewardAmount') ?? ''))
    const minGrade = Number(String(fd.get('minGrade') ?? ''))

    let imported = 0
    let skipped = 0
    const failures: string[] = []

    try {
      for (const work of worksToImport) {
        try {
          await api.post('/tasks/from-classroom', {
            token,
            json: {
              courseId: course.id,
              courseWorkId: work.id,
              courseName: course.name,
              section: course.section,
              title: work.title,
              description: work.description ?? work.title,
              rewardAmount,
              minGrade,
              maxPoints: work.maxPoints ?? undefined,
            },
          })
          imported += 1
        } catch (err) {
          const alreadyImported =
            err instanceof ApiError &&
            (err.status === 409 ||
              String(getApiErrorMessage(err.body)).toLowerCase().includes('already'))
          if (alreadyImported) {
            skipped += 1
          } else {
            failures.push(
              `${work.title}: ${
                err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error desconocido'
              }`
            )
          }
        }
      }

      const parts: string[] = []
      if (imported > 0) {
        parts.push(
          imported === 1
            ? '1 tarea importada desde Google Classroom'
            : `${imported} tareas importadas desde Google Classroom`
        )
      }
      if (skipped > 0) {
        parts.push(
          skipped === 1 ? '1 ya estaba importada' : `${skipped} ya estaban importadas`
        )
      }
      if (failures.length > 0) {
        parts.push(
          failures.length === 1
            ? `1 fallo: ${failures[0]}`
            : `${failures.length} fallos. Primero: ${failures[0]}`
        )
      }

      setImportMsg(
        parts.length > 0
          ? `${parts.join('. ')}. Los estudiantes pueden enviar evidencia en ScholarFi.`
          : 'No se importaron tareas.'
      )

      if (imported > 0 || skipped > 0) {
        setSelectedCourseWorkIds([])
      }
    } finally {
      setImporting(false)
    }
  }

  function onImportSelected(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void runImport(e.currentTarget, 'selected')
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
        eyebrow="Integraciones"
        title={status?.mockMode ? 'Classroom (demo)' : 'Google Classroom'}
        subtitle={
          status?.mockMode
            ? 'Usa el Classroom de fixtures: importa Matematicas 3A (2 tareas) y sincroniza calificaciones de demo. No se necesita cuenta de Google.'
            : 'Conecta tu cuenta, importa tareas con recompensa y sincroniza calificaciones cuando los estudiantes completen en ScholarFi.'
        }
      />

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg && (
        <div
          role="status"
          className={
            actionMsg.includes('correctamente') || actionMsg.includes('desconectado')
              ? 'alert alert-success text-sm'
              : 'alert alert-warning text-sm'
          }
        >
          {actionMsg}
        </div>
      )}

      {status?.mockMode ? (
        <div role="status" className="alert alert-info text-sm">
          Las tareas y calificaciones salen de fixtures (Matematicas 3A tiene 2 items; Sofia y
          Valentina tienen nota 8). No hay conexion a Google.
        </div>
      ) : null}

      <SectionCard
        title="Conexion"
        subtitle={
          status?.mockMode
            ? 'Activa el Classroom de demo para listar cursos y tareas de fixtures.'
            : 'Autoriza ScholarFi para leer cursos, tareas y calificaciones (solo lectura).'
        }
        titleIcon={<HiLink aria-hidden />}
      >
        {status?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-base-content/80">
              Conectado como <strong>{status.externalEmail}</strong>
              {status.lastSyncAt ? (
                <span className="block text-base-content/60">
                  Ultima sincronizacion: {new Date(status.lastSyncAt).toLocaleString()}
                </span>
              ) : null}
            </p>
            <button type="button" className="btn btn-outline btn-sm gap-1" onClick={() => void disconnectClassroom()}>
              <HiXMark className="h-4 w-4" aria-hidden />
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-base-content/70">
              {status?.mockMode
                ? 'Un clic conecta el Classroom de demo. Luego importa Matematicas 3A (todas las tareas) con recompensa y nota minima.'
                : 'Necesitas una cuenta de Google Workspace de tu institucion. Los estudiantes deben usar el mismo correo en ScholarFi que en Classroom.'}
            </p>
            <button
              type="button"
              className="btn btn-primary gap-1"
              disabled={connecting}
              onClick={() => void connectClassroom()}
            >
              {connecting ? (
                <span className="loading loading-sm loading-spinner" aria-hidden />
              ) : (
                <HiLink className="h-4 w-4" aria-hidden />
              )}
              {status?.mockMode ? 'Usar Classroom de demo' : 'Conectar Google Classroom'}
            </button>
          </div>
        )}
      </SectionCard>

      {status?.connected ? (
        <SectionCard
          title="Importar tareas con recompensa"
          subtitle="Elige un curso, selecciona una o varias tareas de Classroom y define la nota minima absoluta para obtener la recompensa."
          titleIcon={<HiArrowPath aria-hidden />}
        >
          {courses.length === 0 ? (
            <EmptyState
              title="No hay cursos disponibles"
              detail="Verifica que tengas clases activas en Google Classroom."
            />
          ) : (
            <form className="mt-2 grid max-w-2xl gap-4" onSubmit={onImportSelected}>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Curso</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={selectedCourseId}
                  onChange={(e) => void onCourseChange(e.target.value)}
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                      {course.section ? ` (${course.section})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <GoogleClassroomTaskList
                courseSelected={Boolean(selectedCourseId)}
                loading={loadingCourseWork}
                tasks={courseWork}
                selectedIds={selectedCourseWorkIds}
                onSelectedIdsChange={setSelectedCourseWorkIds}
              />

              {selectedWorks.length === 1 && selectedWorks[0]?.description ? (
                <p className="text-sm text-base-content/70">{selectedWorks[0].description}</p>
              ) : null}

              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">{CREDIT_TOKEN_NAME} por estudiante recompensado</span>
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
                  <span className="label-text">Nota minima (absoluta)</span>
                </div>
                <input
                  name="minGrade"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={6}
                  required
                  className="input input-bordered w-full"
                />
                <div className="label">
                  <span className="label-text-alt">
                    Se aplica a todas las tareas importadas. Ejemplo: 6 significa assignedGrade &gt;= 6 en Classroom.
                  </span>
                </div>
              </label>

              {importMsg && (
                <div
                  role="status"
                  className={
                    importMsg.includes('importada') || importMsg.includes('importadas')
                      ? 'alert alert-success text-sm'
                      : 'alert alert-error text-sm'
                  }
                >
                  {importMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importing || selectedCourseWorkIds.length === 0}
                >
                  {importing ? (
                    <span className="loading loading-sm loading-spinner" aria-hidden />
                  ) : null}
                  Importar seleccionadas
                  {selectedCourseWorkIds.length > 0 ? ` (${selectedCourseWorkIds.length})` : ''}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={importing || !selectedCourseId || courseWork.length === 0}
                  onClick={(e) => {
                    const form = e.currentTarget.form
                    if (!form) return
                    if (!form.reportValidity()) return
                    void runImport(form, 'all')
                  }}
                >
                  Importar todas
                  {courseWork.length > 0 ? ` (${courseWork.length})` : ''}
                </button>
                <Link to="/teacher" className="btn btn-ghost">
                  Ir a mis tareas
                </Link>
              </div>
            </form>
          )}
        </SectionCard>
      ) : null}
    </div>
  )
}
