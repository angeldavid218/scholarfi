import { useCallback, useEffect, useState } from 'react'
import { HiBuildingOffice2, HiClipboardDocumentList, HiArrowPath } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import { NgoBudgetDistributionOverview } from './NgoBudgetDistributionOverview'

type DashboardSummary = {
  totalSchools: number
  totalTeachers: number
  totalStudents: number
  totalTasksRedeemed: number
  completedTasks: number
  validatedTasks: number
  pendingValidations: number
}

export function NgoHome() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadSummary = useCallback(async (showLoadingSpinner = false) => {
    if (!token) return
    if (showLoadingSpinner) {
      setLoading(true)
    }
    setError(null)
    try {
      const data = await api.get<DashboardSummary>('/dashboard/summary', { token })
      setSummary(data)
    } catch (err) {
      setError(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al cargar el resumen de ONG')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary()
  }, [loadSummary])

  function handleRefresh() {
    setRefreshKey((current) => current + 1)
    void loadSummary(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ExecutiveHero
          eyebrow="Consola de Administración ONG"
          title="Consolidado de Ecosistema"
          subtitle="Monitoreo consolidado del avance y gobernanza institucional del programa ScholarFi."
        />
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-primary" onClick={handleRefresh}>
          Reintentar
        </button>
      </div>
    )
  }

  const ecosystemItems = summary
    ? [
        {
          label: 'Escuelas Asociadas',
          value: formatId(summary.totalSchools),
          hint: 'Planteles integrados',
        },
        {
          label: 'Docentes Activos',
          value: formatId(summary.totalTeachers),
          hint: 'Supervisores de tareas',
        },
        {
          label: 'Estudiantes Registrados',
          value: formatId(summary.totalStudents),
          hint: 'Beneficiarios del programa',
        },
      ]
    : []

  const taskActivityItems = summary
    ? [
        {
          label: 'Pendientes de Validación',
          value: formatId(summary.pendingValidations),
          hint: 'En revisión docente',
        },
        {
          label: 'Validadas por Docente',
          value: formatId(summary.validatedTasks),
          hint: 'Esperando aprobación escolar',
        },
        {
          label: 'Aprobadas / Completadas',
          value: formatId(summary.completedTasks),
          hint: 'Ciclo completo finalizado',
        },
        {
          label: 'Créditos Canjeados',
          value: formatId(summary.totalTasksRedeemed),
          hint: 'Total transacciones de mérito',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Consola de Administración ONG"
        title="Dashboard de Impacto Ecosistémico"
        subtitle="Monitoreo consolidado del avance y gobernanza institucional del programa ScholarFi."
        actions={
          <button
            type="button"
            className="btn btn-outline btn-primary btn-sm gap-1"
            onClick={handleRefresh}
          >
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Estructura del Ecosistema"
          subtitle="Participación agregada de comunidades escolares bajo el programa."
          titleIcon={<HiBuildingOffice2 aria-hidden />}
        >
          <div className="mt-2">
            <KpiStrip items={ecosystemItems} />
          </div>
        </SectionCard>

        <SectionCard
          title="Actividad y Estado de Tareas"
          subtitle="Seguimiento en tiempo real de evidencias y validación pedagógica."
          titleIcon={<HiClipboardDocumentList aria-hidden />}
        >
          <div className="mt-2">
            <KpiStrip items={taskActivityItems} />
          </div>
        </SectionCard>
      </div>

      <NgoBudgetDistributionOverview key={refreshKey} />
    </div>
  )
}
