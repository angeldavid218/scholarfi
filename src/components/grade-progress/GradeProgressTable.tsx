import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { AlertBanner } from '../ui/AlertBanner'
import { EmptyState, KpiStrip, SectionCard } from '../ui/executive'
import { PageSpinner } from '../ui/PageSpinner'

export interface GradeProgressRow {
  studentId: number
  displayName: string
  category: string
  gradedCount: number
  earlyAvg: number | null
  lateAvg: number | null
  delta: number | null
  analyzedAt: string | null
  diplomaStatus: string | null
  diplomaId: number | null
}

export interface GradeProgressSummary {
  total: number
  improving: number
  maintaining: number
  insufficientData: number
  none: number
  avgDelta: number | null
}

type GradeProgressResponse = {
  summary?: GradeProgressSummary
  students: GradeProgressRow[]
}

const CATEGORY_LABEL: Record<string, string> = {
  improving: 'Mejorando',
  maintaining: 'Mantiene',
  insufficient_data: 'Datos insuficientes',
  none: 'Sin tendencia',
}

function formatAvg(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

function formatDelta(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}`
}

function diplomaLabel(status: string | null): string {
  if (!status) return '—'
  if (status === 'confirmed') return 'Emitido'
  if (status === 'pending' || status === 'processing') return 'En cola'
  if (status === 'failed') return 'Fallido'
  return status
}

/**
 * Grade-progress KPIs + student table (scoped by API role: teacher groups or institution).
 */
export function GradeProgressTable() {
  const { token } = useAuth()
  const [rows, setRows] = useState<GradeProgressRow[]>([])
  const [summary, setSummary] = useState<GradeProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<GradeProgressResponse>('/grade-progress', { token })
      const students = data.students ?? []
      setRows(students)
      setSummary(
        data.summary ?? {
          total: students.length,
          improving: students.filter((s) => s.category === 'improving').length,
          maintaining: students.filter((s) => s.category === 'maintaining').length,
          insufficientData: students.filter((s) => s.category === 'insufficient_data').length,
          none: students.filter((s) => s.category === 'none').length,
          avgDelta: null,
        }
      )
    } catch (e) {
      setRows([])
      setSummary(null)
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar progreso')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-4">
      {summary ? (
        <KpiStrip
          items={[
            { label: 'Mejorando', value: summary.improving },
            { label: 'Mantiene', value: summary.maintaining },
            { label: 'Datos insuficientes', value: summary.insufficientData },
            {
              label: 'Δ promedio',
              value: formatDelta(summary.avgDelta),
              hint: 'Puntos porcentuales',
            },
            { label: 'Total', value: summary.total },
          ]}
        />
      ) : null}

      <SectionCard
        title="Progreso por estudiante"
        subtitle="Comparación de la primera vs segunda mitad de calificaciones sincronizadas (normalizadas). Los estudiantes en Mejorando son elegibles para el NFT Progreso Académico vía cron."
      >
        {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
        {rows.length === 0 ? (
          <EmptyState
            title="Aún no hay análisis de progreso."
            detail="Tras sincronizar Classroom, el cron grades:analyze-progress llena esta tabla."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Categoría</th>
                  <th className="text-right">Notas</th>
                  <th className="text-right">Inicio</th>
                  <th className="text-right">Reciente</th>
                  <th className="text-right">Δ</th>
                  <th>NFT Progreso</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="font-medium">{row.displayName}</td>
                    <td>
                      <span
                        className={[
                          'badge badge-sm',
                          row.category === 'improving'
                            ? 'badge-success'
                            : row.category === 'maintaining'
                              ? 'badge-info'
                              : 'badge-ghost',
                        ].join(' ')}
                      >
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{row.gradedCount}</td>
                    <td className="text-right tabular-nums">{formatAvg(row.earlyAvg)}</td>
                    <td className="text-right tabular-nums">{formatAvg(row.lateAvg)}</td>
                    <td className="text-right tabular-nums">{formatDelta(row.delta)}</td>
                    <td>{diplomaLabel(row.diplomaStatus)}</td>
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
