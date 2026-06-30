import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { HiArrowUpTray, HiUserGroup } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'

type GroupRow = {
  id: number
  name: string
  section: string | null
  subjectName: string | null
  studentCount: number
  externalSource: string
}

type ImportSummary = {
  dryRun: boolean
  subjectsCreated: number
  groupsCreated: number
  enrollmentsUpserted: number
  teacherLinksUpserted: number
  errors: Array<{ row: number; field: string; message: string }>
}

const CSV_TEMPLATE = `student_email,student_name,subject,section
maria@school.edu,María García,Matemáticas,3°A
juan@school.edu,Juan Pérez,Matemáticas,3°A`

export function TeacherGroupsPage() {
  const { token } = useAuth()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const rows = await api.get<GroupRow[]>('/groups/mine', { token })
      setGroups(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar clases')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
    setImportMsg(null)
    setImportSummary(null)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'scholarfi-clases-template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function runImport(dryRun: boolean, e?: FormEvent) {
    e?.preventDefault()
    if (!token || !file) return
    setImporting(true)
    setImportMsg(null)
    setImportSummary(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const path = dryRun ? '/groups/import-csv?dryRun=true' : '/groups/import-csv'
      const result = await api.postForm<{ dryRun: boolean; summary: ImportSummary }>(path, {
        formData,
        token,
      })
      setImportSummary(result.summary)
      setImportMsg(
        dryRun
          ? `Vista previa: ${result.summary.groupsCreated} clase(s) nueva(s), ${result.summary.enrollmentsUpserted} inscripción(es).`
          : `Importación completada: ${result.summary.groupsCreated} clase(s) nueva(s), ${result.summary.enrollmentsUpserted} inscripción(es).`
      )
      if (!dryRun) {
        setFile(null)
        await load()
      }
    } catch (err) {
      setImportMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo importar el CSV'
      )
    } finally {
      setImporting(false)
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
        eyebrow="Panel docente"
        title="Mis clases"
        subtitle="Organiza estudiantes por materia y sección. Importa tu roster desde CSV antes de conectar Google Classroom."
      />

      {error && <div className="alert alert-error">{error}</div>}

      <SectionCard
        title="Importar clases (CSV)"
        subtitle="Una fila por estudiante y clase. Los estudiantes deben existir en la escuela."
        titleIcon={<HiArrowUpTray aria-hidden />}
      >
        <form className="mt-2 grid max-w-xl gap-4" onSubmit={(e) => runImport(false, e)}>
          <p className="text-sm text-base-content/70">
            Columnas: <code>student_email</code>, <code>subject</code>, <code>section</code>{' '}
            (opcional <code>student_name</code>, <code>class_name</code>).
          </p>
          <button type="button" className="btn btn-ghost btn-sm w-fit" onClick={downloadTemplate}>
            Descargar plantilla CSV
          </button>
          <input
            type="file"
            accept=".csv,text/csv"
            className="file-input file-input-bordered w-full max-w-md"
            onChange={onFileChange}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={!file || importing}
              onClick={() => runImport(true)}
            >
              Vista previa
            </button>
            <button type="submit" className="btn btn-primary" disabled={!file || importing}>
              {importing ? 'Importando…' : 'Importar'}
            </button>
          </div>
          {importMsg && (
            <div
              role="status"
              className={
                importSummary && importSummary.errors.length > 0
                  ? 'alert alert-warning text-sm'
                  : 'alert alert-info text-sm'
              }
            >
              {importMsg}
            </div>
          )}
          {importSummary && importSummary.errors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Campo</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importSummary.errors.map((rowErr) => (
                    <tr key={`${rowErr.row}-${rowErr.field}`}>
                      <td>{rowErr.row}</td>
                      <td>{rowErr.field}</td>
                      <td>{rowErr.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>
      </SectionCard>

      <SectionCard
        title="Clases asignadas"
        subtitle="Grupos donde eres docente."
        titleIcon={<HiUserGroup aria-hidden />}
      >
        {groups.length === 0 ? (
          <EmptyState
            title="Aún no tienes clases."
            detail="Importa un CSV o pide al administrador que te asigne clases."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Sección</th>
                  <th>Clase</th>
                  <th>Estudiantes</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.subjectName ?? '—'}</td>
                    <td>{group.section ?? '—'}</td>
                    <td>{group.name}</td>
                    <td>{group.studentCount}</td>
                    <td>{group.externalSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
