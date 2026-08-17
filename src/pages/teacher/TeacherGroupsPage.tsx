import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { HiArrowUpTray, HiLink, HiUserGroup } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { Modal } from '../../components/ui/Modal'
import {
  GROUP_IMPORT_FIELD_LABELS,
  GROUP_IMPORT_FIELDS,
  type GroupImportColumnMapping,
  type GroupImportField,
  parseCsvContentRaw,
  suggestGroupImportColumnMapping,
  validateGroupImportColumnMapping,
} from '../../utils/csvParser'

type ImportRowResult = {
  row: number
  status: 'created' | 'updated' | 'skipped' | 'error'
  studentEmail?: string
  subject?: string
  section?: string | null
  message?: string
}

type ImportSummary = {
  dryRun: boolean
  subjectsCreated: number
  groupsCreated: number
  studentsCreated: number
  enrollmentsUpserted: number
  teacherLinksUpserted: number
  rowResults: ImportRowResult[]
  errors: Array<{ row: number; field: string; message: string }>
}

const PREVIEW_SAMPLE_ROWS = 20

const ROW_STATUS_LABEL: Record<ImportRowResult['status'], string> = {
  created: 'Nuevo',
  updated: 'Existente',
  skipped: 'Omitido',
  error: 'Error',
}

type GroupRow = {
  id: number
  name: string
  section: string | null
  subjectName: string | null
  studentCount: number
  externalSource: string
}

const CSV_TEMPLATE = `student_email,student_name,registration_number,subject,section
maria@school.edu,María García,2024001,Matemáticas,3°A
juan@school.edu,Juan Pérez,2024002,Matemáticas,3°A`

const EMPTY_MAPPING: GroupImportColumnMapping = {}

function isFieldRequired(field: GroupImportField): boolean {
  return field === 'student_email' || field === 'registration_number'
}

function isFieldConditionallyRequired(field: GroupImportField): boolean {
  return field === 'subject' || field === 'class_name'
}

export function TeacherGroupsPage() {
  const { token } = useAuth()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<GroupImportColumnMapping>(EMPTY_MAPPING)
  const [fileError, setFileError] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [importingAction, setImportingAction] = useState<'preview' | 'import' | null>(null)

  const mappingError = validateGroupImportColumnMapping(columnMapping)
  const canImport = Boolean(file && !fileError && !mappingError && csvHeaders.length > 0)

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

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setFileError(null)
    setImportMsg(null)
    setImportSummary(null)
    setPreviewOpen(false)
    setCsvHeaders([])
    setColumnMapping(EMPTY_MAPPING)

    if (!selected) return

    try {
      const parsed = parseCsvContentRaw(await selected.text())
      if (parsed.headers.length === 0) {
        setFileError('El archivo CSV no tiene encabezados de columna')
        return
      }
      if (parsed.rows.length === 0) {
        setFileError('El archivo CSV está vacío o no tiene filas de datos')
        return
      }
      setCsvHeaders(parsed.headers)
      setColumnMapping(suggestGroupImportColumnMapping(parsed.headers))
    } catch {
      setFileError('No se pudo leer el archivo CSV')
    }
  }

  function onMappingChange(field: GroupImportField, csvColumn: string) {
    setColumnMapping((prev) => {
      const next = { ...prev }
      if (!csvColumn) {
        delete next[field]
      } else {
        next[field] = csvColumn
      }
      return next
    })
    setImportMsg(null)
    setImportSummary(null)
    setPreviewOpen(false)
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
    if (!token || !file || !canImport) return
    setImportingAction(dryRun ? 'preview' : 'import')
    if (dryRun) {
      setImportMsg(null)
      setImportSummary(null)
      setPreviewOpen(false)
    } else if (!previewOpen) {
      setImportMsg(null)
      setImportSummary(null)
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('columnMapping', JSON.stringify(columnMapping))
      const path = dryRun ? '/groups/import-csv?dryRun=true' : '/groups/import-csv'
      const result = await api.postForm<{ dryRun: boolean; summary: ImportSummary }>(path, {
        formData,
        token,
      })
      setImportSummary(result.summary)
      if (dryRun) {
        setPreviewOpen(true)
      } else {
        setPreviewOpen(false)
        setImportMsg(
          `Importación completada: ${result.summary.studentsCreated} estudiante(s) nuevo(s), ${result.summary.groupsCreated} clase(s) nueva(s), ${result.summary.enrollmentsUpserted} inscripción(es).`
        )
        setFile(null)
        setCsvHeaders([])
        setColumnMapping(EMPTY_MAPPING)
        await load()
      }
    } catch (err) {
      setPreviewOpen(false)
      setImportMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo importar el CSV'
      )
    } finally {
      setImportingAction(null)
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
        subtitle="Organiza estudiantes por materia y sección. Importa tu roster desde CSV o conecta Google Classroom."
      />

      <div className="flex justify-end">
        <Link to="/teacher/integraciones" className="btn btn-outline btn-sm gap-1">
          <HiLink className="h-4 w-4" aria-hidden />
          Conectar Google Classroom
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <SectionCard
        title="Importar clases (CSV)"
        subtitle="Sube tu archivo y elige qué columnas corresponden a cada campo. Las columnas extra se ignoran."
        titleIcon={<HiArrowUpTray aria-hidden />}
      >
        <form className="mt-2 grid max-w-3xl gap-4" onSubmit={(e) => runImport(false, e)}>
          <p className="text-sm text-base-content/70">
            Puedes usar exportaciones de Excel, Classroom o tu sistema escolar. Solo necesitas mapear
            al menos <strong>correo</strong> y <strong>materia</strong> (o nombre de clase).
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
          {fileError && <div className="alert alert-error text-sm">{fileError}</div>}

          {csvHeaders.length > 0 ? (
            <div className="space-y-3 rounded-box border border-base-300 bg-base-200/40 p-4">
              <div>
                <p className="text-sm font-medium">Asignación de columnas</p>
                <p className="mt-1 text-sm text-base-content/70">
                  Columnas detectadas en tu archivo: {csvHeaders.join(', ')}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GROUP_IMPORT_FIELDS.map((field) => (
                  <label key={field} className="form-control w-full">
                    <span className="label py-0">
                      <span className="label-text">
                        {GROUP_IMPORT_FIELD_LABELS[field]}
                        {isFieldRequired(field) ? (
                          <span className="ml-1 text-error">*</span>
                        ) : isFieldConditionallyRequired(field) ? (
                          <span className="ml-1 text-base-content/50">(una de dos)</span>
                        ) : (
                          <span className="ml-1 text-base-content/50">(opcional)</span>
                        )}
                      </span>
                    </span>
                    <select
                      className="select select-bordered select-sm w-full"
                      value={columnMapping[field] ?? ''}
                      onChange={(e) => onMappingChange(field, e.target.value)}
                    >
                      <option value="">— No importar —</option>
                      {csvHeaders.map((header) => (
                        <option key={`${field}-${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {mappingError ? (
                <div className="alert alert-warning py-2 text-sm">{mappingError}</div>
              ) : (
                <p className="text-sm text-success">Asignación válida. Puedes continuar con la vista previa.</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline gap-1"
              disabled={!canImport || importingAction !== null}
              onClick={() => runImport(true)}
            >
              {importingAction === 'preview' ? (
                <>
                  <span className="loading loading-spinner loading-sm" aria-hidden />
                  Generando vista previa…
                </>
              ) : (
                'Vista previa'
              )}
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-1"
              disabled={!canImport || importingAction !== null}
            >
              {importingAction === 'import' ? (
                <>
                  <span className="loading loading-spinner loading-sm" aria-hidden />
                  Importando…
                </>
              ) : (
                'Importar'
              )}
            </button>
          </div>
          {importMsg && !previewOpen && (
            <div
              role="status"
              className={
                importSummary && importSummary.errors.length > 0
                  ? 'alert alert-warning text-sm'
                  : 'alert alert-success text-sm'
              }
            >
              {importMsg}
            </div>
          )}
          {importSummary && importSummary.errors.length > 0 && !previewOpen && (
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

      <Modal
        open={previewOpen && importSummary !== null}
        onClose={() => setPreviewOpen(false)}
        title="Vista previa de importación"
        size="4xl"
      >
        {importSummary ? (
          <div className="space-y-4">
            <p className="text-sm text-base-content/70">
              Revisa el resumen antes de confirmar. No se guardará nada hasta que pulses{' '}
              <strong>Confirmar importación</strong>.
            </p>

            <KpiStrip
              items={[
                { label: 'Estudiantes nuevos', value: importSummary.studentsCreated },
                { label: 'Clases nuevas', value: importSummary.groupsCreated },
                { label: 'Materias nuevas', value: importSummary.subjectsCreated },
                { label: 'Inscripciones', value: importSummary.enrollmentsUpserted },
              ]}
            />

            {importSummary.errors.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-warning">
                  {importSummary.errors.length} fila(s) con error — revisa antes de importar.
                </p>
                <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-lg border border-base-300">
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
              </div>
            ) : null}

            {importSummary.rowResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Muestra de filas
                  {importSummary.rowResults.length > PREVIEW_SAMPLE_ROWS
                    ? ` (primeras ${PREVIEW_SAMPLE_ROWS} de ${importSummary.rowResults.length})`
                    : ` (${importSummary.rowResults.length})`}
                </p>
                <div className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-base-300">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Estudiante</th>
                        <th>Materia</th>
                        <th>Sección</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importSummary.rowResults.slice(0, PREVIEW_SAMPLE_ROWS).map((row) => (
                        <tr key={row.row}>
                          <td>{row.row}</td>
                          <td>{row.studentEmail ?? '—'}</td>
                          <td>{row.subject ?? '—'}</td>
                          <td>{row.section ?? '—'}</td>
                          <td>
                            <span
                              className={
                                row.status === 'error' ? 'text-error' : 'text-base-content/80'
                              }
                            >
                              {ROW_STATUS_LABEL[row.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="modal-action mt-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={importingAction !== null}
                onClick={() => setPreviewOpen(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary gap-1"
                disabled={importingAction !== null}
                onClick={() => runImport(false)}
              >
                {importingAction === 'import' ? (
                  <>
                    <span className="loading loading-spinner loading-sm" aria-hidden />
                    Importando…
                  </>
                ) : (
                  'Confirmar importación'
                )}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

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
