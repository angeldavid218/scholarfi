import { type ChangeEvent, type FormEvent } from 'react'
import { HiArrowUpTray, HiUserGroup } from 'react-icons/hi2'
import {
  GROUP_IMPORT_FIELD_LABELS,
  GROUP_IMPORT_FIELDS,
  type GroupImportColumnMapping,
  type GroupImportField,
} from '../../utils/csvParser'
import { AlertBanner } from '../ui/AlertBanner'
import { EmptyState, KpiStrip, SectionCard } from '../ui/executive'
import { FormField } from '../ui/FormField'
import { LoadingButton } from '../ui/LoadingButton'
import { Modal } from '../ui/Modal'
import { TableShell } from '../ui/TableShell'

export interface ImportRowResult {
  row: number
  status: 'created' | 'updated' | 'skipped' | 'error'
  studentEmail?: string
  subject?: string
  section?: string | null
  message?: string
}

export interface ImportSummary {
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

const isFieldRequired = (field: GroupImportField): boolean =>
  field === 'student_email' || field === 'registration_number'

const isFieldConditionallyRequired = (field: GroupImportField): boolean =>
  field === 'subject' || field === 'class_name'

interface GroupCsvImportPanelProps {
  fileError: string | null
  csvHeaders: string[]
  columnMapping: GroupImportColumnMapping
  mappingError: string | null
  canImport: boolean
  importingAction: 'preview' | 'import' | null
  importMsg: string | null
  importSummary: ImportSummary | null
  previewOpen: boolean
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onMappingChange: (field: GroupImportField, csvColumn: string) => void
  onDownloadTemplate: () => void
  onPreview: () => void
  onImport: (e?: FormEvent) => void
  onClosePreview: () => void
}

export const GroupCsvImportPanel = ({
  fileError,
  csvHeaders,
  columnMapping,
  mappingError,
  canImport,
  importingAction,
  importMsg,
  importSummary,
  previewOpen,
  onFileChange,
  onMappingChange,
  onDownloadTemplate,
  onPreview,
  onImport,
  onClosePreview,
}: GroupCsvImportPanelProps) => {
  return (
    <>
      <SectionCard
        title="Importar clases (CSV)"
        subtitle="Sube tu archivo y elige qué columnas corresponden a cada campo. Las columnas extra se ignoran."
        titleIcon={<HiArrowUpTray aria-hidden />}
      >
        <form className="mt-2 grid max-w-3xl gap-4" onSubmit={(e) => onImport(e)}>
          <p className="text-sm text-base-content/70">
            Puedes usar exportaciones de Excel, Classroom o tu sistema escolar. Solo necesitas mapear al
            menos <strong>correo</strong> y <strong>materia</strong> (o nombre de clase).
          </p>
          <button type="button" className="btn btn-ghost btn-sm w-fit" onClick={onDownloadTemplate}>
            Descargar plantilla CSV
          </button>
          <input
            type="file"
            accept=".csv,text/csv"
            className="file-input file-input-bordered w-full max-w-md"
            onChange={onFileChange}
          />
          {fileError ? <AlertBanner tone="error">{fileError}</AlertBanner> : null}

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
                  <FormField
                    key={field}
                    label={
                      <>
                        {GROUP_IMPORT_FIELD_LABELS[field]}
                        {isFieldRequired(field) ? (
                          <span className="ml-1 text-error">*</span>
                        ) : isFieldConditionallyRequired(field) ? (
                          <span className="ml-1 text-base-content/50">(una de dos)</span>
                        ) : (
                          <span className="ml-1 text-base-content/50">(opcional)</span>
                        )}
                      </>
                    }
                  >
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
                  </FormField>
                ))}
              </div>
              {mappingError ? (
                <AlertBanner tone="warning">{mappingError}</AlertBanner>
              ) : (
                <p className="text-sm text-success">
                  Asignación válida. Puedes continuar con la vista previa.
                </p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <LoadingButton
              className="btn btn-outline gap-1"
              disabled={!canImport || importingAction !== null}
              loading={importingAction === 'preview'}
              loadingLabel="Generando vista previa…"
              onClick={onPreview}
            >
              Vista previa
            </LoadingButton>
            <LoadingButton
              type="submit"
              className="btn btn-primary gap-1"
              disabled={!canImport || importingAction !== null}
              loading={importingAction === 'import'}
              loadingLabel="Importando…"
            >
              Importar
            </LoadingButton>
          </div>
          {importMsg && !previewOpen ? (
            <AlertBanner
              tone={importSummary && importSummary.errors.length > 0 ? 'warning' : 'success'}
            >
              {importMsg}
            </AlertBanner>
          ) : null}
          {importSummary && importSummary.errors.length > 0 && !previewOpen ? (
            <TableShell compact>
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
            </TableShell>
          ) : null}
        </form>
      </SectionCard>

      <Modal
        open={previewOpen && importSummary !== null}
        onClose={onClosePreview}
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
                            <span className={row.status === 'error' ? 'text-error' : 'text-base-content/80'}>
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
                onClick={onClosePreview}
              >
                Cerrar
              </button>
              <LoadingButton
                className="btn btn-primary gap-1"
                disabled={importingAction !== null}
                loading={importingAction === 'import'}
                loadingLabel="Importando…"
                onClick={() => onImport()}
              >
                Confirmar importación
              </LoadingButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

interface GroupRow {
  id: number
  name: string
  section: string | null
  subjectName: string | null
  studentCount: number
  externalSource: string
}

interface GroupsListTableProps {
  groups: GroupRow[]
}

export const GroupsListTable = ({ groups }: GroupsListTableProps) => {
  return (
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
        <TableShell compact>
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
        </TableShell>
      )}
    </SectionCard>
  )
}
