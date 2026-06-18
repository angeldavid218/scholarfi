import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiBanknotes, HiBuildingOffice2 } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import {
  BUDGET_ALLOCATION_STATUS_LABELS,
  FUNDING_PROGRAM_STATUS_LABELS,
  type BudgetAllocationStatusKey,
} from '../../i18n/es'

type FundingProgram = {
  id: number
  name: string
  totalBudget: number
  status: 'draft' | 'active' | 'completed'
}

type BudgetAllocation = {
  id: number
  institutionId: number
  institutionName: string
  institutionCode: string
  allocatedBudget: number
  utilizedBudget: number
  remainingBudget: number
  status: BudgetAllocationStatusKey
}

type AllocationsResponse = {
  data: BudgetAllocation[]
  summary: {
    totalBudget: number
    totalAllocated: number
    totalUtilized: number
    remainingToAllocate: number
  }
}

export type BudgetDistributionRow = BudgetAllocation & {
  programId: number
  programName: string
  programStatus: FundingProgram['status']
}

export type BudgetDistributionSummary = {
  programCount: number
  totalBudget: number
  totalAllocated: number
  totalUtilized: number
  remainingToAllocate: number
  schoolCount: number
}

function allocationStatusBadge(status: BudgetAllocationStatusKey) {
  if (status === 'active') return 'badge-success'
  if (status === 'suspended') return 'badge-warning'
  return 'badge-neutral'
}

function programStatusBadge(status: FundingProgram['status']) {
  if (status === 'active') return 'badge-success'
  if (status === 'completed') return 'badge-neutral'
  return 'badge-warning'
}

export function NgoBudgetDistributionOverview() {
  const { token } = useAuth()
  const [rows, setRows] = useState<BudgetDistributionRow[]>([])
  const [summary, setSummary] = useState<BudgetDistributionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDistribution = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const programs = await api.get<FundingProgram[]>('/funding-programs', { token })
      const programList = Array.isArray(programs) ? programs : []

      if (programList.length === 0) {
        setRows([])
        setSummary({
          programCount: 0,
          totalBudget: 0,
          totalAllocated: 0,
          totalUtilized: 0,
          remainingToAllocate: 0,
          schoolCount: 0,
        })
        return
      }

      const allocationResponses = await Promise.all(
        programList.map((program) =>
          api.getRaw<AllocationsResponse>(`/funding-programs/${program.id}/budget-allocations`, {
            token,
          })
        )
      )

      const flatRows: BudgetDistributionRow[] = programList.flatMap((program, index) => {
        const response = allocationResponses[index]
        const allocations = Array.isArray(response?.data) ? response.data : []
        return allocations.map((allocation) => ({
          ...allocation,
          programId: program.id,
          programName: program.name,
          programStatus: program.status,
        }))
      })

      const totalBudget = programList.reduce((sum, program) => sum + program.totalBudget, 0)
      const totalAllocated = flatRows.reduce((sum, row) => sum + row.allocatedBudget, 0)
      const totalUtilized = flatRows.reduce((sum, row) => sum + row.utilizedBudget, 0)
      const schoolCount = new Set(flatRows.map((row) => row.institutionId)).size

      setRows(flatRows)
      setSummary({
        programCount: programList.length,
        totalBudget,
        totalAllocated,
        totalUtilized,
        remainingToAllocate: totalBudget - totalAllocated,
        schoolCount,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessage(err.body)
          : 'Error al cargar la distribución de presupuesto'
      )
      setRows([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDistribution()
  }, [loadDistribution])

  const kpiItems = summary
    ? [
        {
          label: 'Presupuesto total',
          value: summary.totalBudget.toLocaleString('es-MX'),
          hint: `${formatId(summary.programCount)} programa(s)`,
        },
        {
          label: 'Asignado a escuelas',
          value: summary.totalAllocated.toLocaleString('es-MX'),
          hint: `${formatId(summary.schoolCount)} escuela(s)`,
        },
        {
          label: 'Utilizado',
          value: summary.totalUtilized.toLocaleString('es-MX'),
          hint: 'Consumido en operación',
        },
        {
          label: 'Por asignar',
          value: summary.remainingToAllocate.toLocaleString('es-MX'),
          hint: 'Disponible en programas',
        },
      ]
    : []

  return (
    <SectionCard
      title="Distribución de presupuesto"
      subtitle="Trazabilidad del financiamiento asignado a escuelas en tus programas activos."
      titleIcon={<HiBanknotes aria-hidden />}
      actions={
        <Link to="/ngo/programas" className="btn btn-outline btn-primary btn-sm">
          Gestionar programas
        </Link>
      }
    >
      {loading ? (
        <div className="mt-4 flex min-h-32 items-center justify-center">
          <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
        </div>
      ) : error ? (
        <div className="mt-4 space-y-3">
          <div className="alert alert-error">{error}</div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void loadDistribution()}>
            Reintentar
          </button>
        </div>
      ) : summary && summary.programCount === 0 ? (
        <div className="mt-2">
          <EmptyState
            title="Sin programas de financiamiento"
            detail="Crea un programa y asigna presupuesto a escuelas para ver la distribución aquí."
          />
        </div>
      ) : summary && rows.length === 0 ? (
        <div className="mt-2 space-y-4">
          <KpiStrip items={kpiItems} />
          <EmptyState
            title="Sin asignaciones a escuelas"
            detail="Aún no has distribuido presupuesto. Ve a Programas de financiamiento para asignar montos."
          />
        </div>
      ) : (
        <div className="mt-2 space-y-4">
          <KpiStrip items={kpiItems} />

          <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Programa</th>
                  <th>Escuela</th>
                  <th>Asignado</th>
                  <th>Utilizado</th>
                  <th>Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.programId}-${row.id}`}>
                    <td>
                      <div className="font-medium">{row.programName}</div>
                      <span className={`badge badge-xs mt-1 ${programStatusBadge(row.programStatus)}`}>
                        {FUNDING_PROGRAM_STATUS_LABELS[row.programStatus]}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <HiBuildingOffice2 className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
                        <span>
                          <span className="block font-medium">{row.institutionName}</span>
                          <span className="text-xs text-base-content/60">{row.institutionCode}</span>
                        </span>
                      </div>
                    </td>
                    <td>{row.allocatedBudget.toLocaleString('es-MX')}</td>
                    <td>{row.utilizedBudget.toLocaleString('es-MX')}</td>
                    <td>{row.remainingBudget.toLocaleString('es-MX')}</td>
                    <td>
                      <span className={`badge badge-sm ${allocationStatusBadge(row.status)}`}>
                        {BUDGET_ALLOCATION_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
