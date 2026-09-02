import { useState, type ChangeEvent, type FormEvent } from 'react'
import { HiLink } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  GroupCsvImportPanel,
  GroupsListTable,
  type ImportSummary,
} from '../../components/teacher/GroupCsvImportPanel'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { useTokenResource } from '../../hooks/useTokenResource'
import {
  type GroupImportColumnMapping,
  type GroupImportField,
  parseCsvContentRaw,
  suggestGroupImportColumnMapping,
  validateGroupImportColumnMapping,
} from '../../utils/csvParser'

interface GroupRow {
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

export const TeacherGroupsPage = () => {
  const { token } = useAuth()
  const { data, loading, error, reload } = useTokenResource<GroupRow[]>({
    load: async (authToken) => {
      const rows = await api.get<GroupRow[]>('/groups/mine', { token: authToken })
      return Array.isArray(rows) ? rows : []
    },
    fallbackMessage: 'Error al cargar clases',
  })

  const groups = data ?? []
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

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

  const onMappingChange = (field: GroupImportField, csvColumn: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev }
      if (!csvColumn) delete next[field]
      else next[field] = csvColumn
      return next
    })
    setImportMsg(null)
    setImportSummary(null)
    setPreviewOpen(false)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'scholarfi-clases-template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const runImport = async (dryRun: boolean, e?: FormEvent) => {
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
        await reload(false)
      }
    } catch (err) {
      setPreviewOpen(false)
      setImportMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo importar el CSV')
    } finally {
      setImportingAction(null)
    }
  }

  if (loading) return <PageSpinner />

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
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      <GroupCsvImportPanel
        fileError={fileError}
        csvHeaders={csvHeaders}
        columnMapping={columnMapping}
        mappingError={mappingError}
        canImport={canImport}
        importingAction={importingAction}
        importMsg={importMsg}
        importSummary={importSummary}
        previewOpen={previewOpen}
        onFileChange={(e) => void onFileChange(e)}
        onMappingChange={onMappingChange}
        onDownloadTemplate={downloadTemplate}
        onPreview={() => void runImport(true)}
        onImport={(e) => void runImport(false, e)}
        onClosePreview={() => setPreviewOpen(false)}
      />
      <GroupsListTable groups={groups} />
    </div>
  )
}
