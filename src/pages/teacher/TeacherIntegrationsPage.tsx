import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { HiArrowPath, HiLink, HiXMark } from 'react-icons/hi2'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { CREDIT_TOKEN_NAME } from '../../i18n/es'

type IntegrationStatus = {
  connected: boolean
  provider: string
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

type ClassroomCourseWork = {
  id: string
  title: string
  description: string | null
  maxPoints: number | null
  state: string | null
  dueDate: string | null
  dueTime: string | null
}

export function TeacherIntegrationsPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [courses, setCourses] = useState<ClassroomCourse[]>([])
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourseWorkId, setSelectedCourseWorkId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingCourseWork, setLoadingCourseWork] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const oauthConnected = searchParams.get('connected')
  const oauthError = searchParams.get('error')

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
    try {
      const data = await api.post<{ authUrl: string }>('/integrations/google-classroom/connect', {
        token,
      })
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (e) {
      setActionMsg(
        e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo iniciar la conexion'
      )
    }
  }

  async function disconnectClassroom() {
    if (!token) return
    setActionMsg(null)
    try {
      await api.delete('/integrations/google-classroom/disconnect', { token })
      setSelectedCourseId('')
      setSelectedCourseWorkId('')
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
    setSelectedCourseWorkId('')
    setCourseWork([])
    if (!token || !courseId) return

    setLoadingCourseWork(true)
    try {
      const rows = await api.get<ClassroomCourseWork[]>(
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

  async function importTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token || !selectedCourseId || !selectedCourseWorkId) return

    const course = courses.find((c) => c.id === selectedCourseId)
    const work = courseWork.find((w) => w.id === selectedCourseWorkId)
    if (!course || !work) return

    setImportMsg(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const rewardAmount = Number(String(fd.get('rewardAmount') ?? ''))
    const minGrade = Number(String(fd.get('minGrade') ?? ''))

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
      setImportMsg('Tarea importada desde Google Classroom. Los estudiantes pueden enviar evidencia en ScholarFi.')
      form.reset()
      setSelectedCourseWorkId('')
    } catch (err) {
      console.error(err);
      setImportMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo importar la tarea'
      )
    }
  }

  const selectedWork = courseWork.find((w) => w.id === selectedCourseWorkId)

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
        title="Google Classroom"
        subtitle="Conecta tu cuenta, importa tareas con recompensa y sincroniza calificaciones cuando los estudiantes completen en ScholarFi."
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

      <SectionCard
        title="Conexion"
        subtitle="Autoriza ScholarFi para leer cursos, tareas y calificaciones (solo lectura)."
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
              Necesitas una cuenta de Google Workspace de tu institucion. Los estudiantes deben usar el mismo correo en
              ScholarFi que en Classroom.
            </p>
            <button type="button" className="btn btn-primary gap-1" onClick={() => void connectClassroom()}>
              <HiLink className="h-4 w-4" aria-hidden />
              Conectar Google Classroom
            </button>
          </div>
        )}
      </SectionCard>

      {status?.connected ? (
        <SectionCard
          title="Importar tarea con recompensa"
          subtitle="Selecciona una tarea de Classroom y define la nota minima absoluta para obtener la recompensa."
          titleIcon={<HiArrowPath aria-hidden />}
        >
          {courses.length === 0 ? (
            <EmptyState
              title="No hay cursos disponibles"
              detail="Verifica que tengas clases activas en Google Classroom."
            />
          ) : (
            <form className="mt-2 grid max-w-xl gap-4" onSubmit={importTask}>
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

              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Tarea de Classroom</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={selectedCourseWorkId}
                  onChange={(e) => setSelectedCourseWorkId(e.target.value)}
                  required
                  disabled={!selectedCourseId || loadingCourseWork}
                >
                  <option value="">
                    {loadingCourseWork ? 'Cargando tareas...' : 'Selecciona una tarea'}
                  </option>
                  {courseWork.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.title}
                      {work.maxPoints != null ? ` (${work.maxPoints} pts)` : ''}
                    </option>
                  ))}
                </select>
              </label>

              {selectedWork ? (
                <p className="text-sm text-base-content/70">
                  {selectedWork.description ?? 'Sin descripcion en Classroom.'}
                </p>
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
                    Ejemplo: 6 significa assignedGrade &gt;= 6 en Classroom.
                  </span>
                </div>
              </label>

              {importMsg && (
                <div
                  role="status"
                  className={
                    importMsg.includes('importada')
                      ? 'alert alert-success text-sm'
                      : 'alert alert-error text-sm'
                  }
                >
                  {importMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn btn-primary" disabled={!selectedCourseWorkId}>
                  Importar tarea
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
