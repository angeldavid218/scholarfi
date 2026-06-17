import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  HiBuildingOffice2,
  HiCheckCircle,
  HiCurrencyDollar,
  HiPlusCircle,
  HiUserGroup,
} from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import {
  BUDGET_ALLOCATION_STATUS_LABELS,
  FUNDING_PROGRAM_ALLOCATION_LABELS,
  FUNDING_PROGRAM_STATUS_LABELS,
  type BudgetAllocationStatusKey,
} from '../../i18n/es'

type FundingProgram = {
  id: number
  name: string
  totalBudget: number
  allocationType: 'equal' | 'manual'
  status: 'draft' | 'active' | 'completed'
}

type SchoolOption = {
  id: number
  name: string
  code: string
  status: string
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

type AllocationSummary = {
  totalBudget: number
  totalAllocated: number
  totalUtilized: number
  remainingToAllocate: number
}

type AllocationsResponse = {
  data: BudgetAllocation[]
  summary: AllocationSummary
}

function splitBudgetEvenly(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}

function allocationStatusBadge(status: BudgetAllocationStatusKey) {
  if (status === 'active') return 'badge-success'
  if (status === 'suspended') return 'badge-warning'
  return 'badge-neutral'
}

function PanelBlock({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-base-300/80 bg-gradient-to-br from-base-200/50 to-base-100 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-base-content">{title}</h3>
          <p className="mt-0.5 text-sm text-base-content/65">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

type NgoSchoolBudgetAllocationSectionProps = {
  programs: FundingProgram[]
  onAllocated?: () => void
}

export function NgoSchoolBudgetAllocationSection({
  programs,
  onAllocated,
}: NgoSchoolBudgetAllocationSectionProps) {
  const { token } = useAuth()
  const assignablePrograms = useMemo(
    () => programs.filter((program) => program.status !== 'completed'),
    [programs]
  )

  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [summary, setSummary] = useState<AllocationSummary | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)
  const [allocationMsg, setAllocationMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [selectedSchoolIds, setSelectedSchoolIds] = useState<number[]>([])
  const [manualAmounts, setManualAmounts] = useState<Record<number, string>>({})

  const selectedProgram = useMemo(
    () => assignablePrograms.find((program) => String(program.id) === selectedProgramId) ?? null,
    [assignablePrograms, selectedProgramId]
  )

  const allocatedSchoolIds = useMemo(
    () => new Set(allocations.map((row) => row.institutionId)),
    [allocations]
  )

  const availableSchools = useMemo(
    () => schools.filter((school) => !allocatedSchoolIds.has(school.id)),
    [schools, allocatedSchoolIds]
  )

  const remainingBudget = summary?.remainingToAllocate ?? selectedProgram?.totalBudget ?? 0

  const equalPreview = useMemo(() => {
    if (!selectedProgram || selectedProgram.allocationType !== 'equal' || selectedSchoolIds.length === 0) {
      return null
    }
    const amounts = splitBudgetEvenly(remainingBudget, selectedSchoolIds.length)
    const perSchool = amounts[0] ?? 0
    const hasUnevenSplit = amounts.some((amount) => amount !== perSchool)
    return { amounts, perSchool, hasUnevenSplit, total: amounts.reduce((sum, n) => sum + n, 0) }
  }, [selectedProgram, selectedSchoolIds.length, remainingBudget])

  const manualTotal = useMemo(() => {
    return selectedSchoolIds.reduce((sum, schoolId) => {
      const value = Number(manualAmounts[schoolId] ?? 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)
  }, [manualAmounts, selectedSchoolIds])

  const loadAllocationContext = useCallback(async () => {
    if (!token || !selectedProgramId) return
    setLoadingContext(true)
    setContextError(null)
    try {
      const [schoolRows, allocationResponse] = await Promise.all([
        api.get<SchoolOption[]>('/funding-programs/institutions/available', { token }),
        api.getRaw<AllocationsResponse>(`/funding-programs/${selectedProgramId}/budget-allocations`, {
          token,
        }),
      ])
      setSchools(Array.isArray(schoolRows) ? schoolRows : [])
      setAllocations(Array.isArray(allocationResponse.data) ? allocationResponse.data : [])
      setSummary(allocationResponse.summary ?? null)
    } catch (err) {
      setContextError(
        err instanceof ApiError
          ? getApiErrorMessage(err.body)
          : 'Error al cargar escuelas y asignaciones del programa'
      )
      setSchools([])
      setAllocations([])
      setSummary(null)
    } finally {
      setLoadingContext(false)
    }
  }, [selectedProgramId, token])

  useEffect(() => {
    if (!selectedProgramId) {
      setSchools([])
      setAllocations([])
      setSummary(null)
      setSelectedSchoolIds([])
      setManualAmounts({})
      return
    }
    setSelectedSchoolIds([])
    setManualAmounts({})
    setAllocationMsg(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAllocationContext()
  }, [loadAllocationContext, selectedProgramId])

  function toggleSchool(schoolId: number) {
    setSelectedSchoolIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((id) => id !== schoolId)
      }
      return [...current, schoolId]
    })
  }

  function updateManualAmount(schoolId: number, value: string) {
    setManualAmounts((current) => ({ ...current, [schoolId]: value }))
  }

  async function submitAllocation(e: FormEvent) {
    e.preventDefault()
    if (!token || !selectedProgram) return

    setAllocationMsg(null)
    setSubmitting(true)

    try {
      if (selectedSchoolIds.length === 0) {
        setAllocationMsg('Selecciona al menos una escuela para asignar presupuesto.')
        return
      }

      if (selectedProgram.allocationType === 'equal') {
        await api.post(`/funding-programs/${selectedProgram.id}/budget-allocations`, {
          token,
          json: { institutionIds: selectedSchoolIds },
        })
      } else {
        const allocationsPayload = selectedSchoolIds.map((institutionId) => {
          const amount = Number(manualAmounts[institutionId])
          return { institutionId, allocatedBudget: amount }
        })

        const invalid = allocationsPayload.find(
          (row) => !Number.isFinite(row.allocatedBudget) || row.allocatedBudget <= 0
        )
        if (invalid) {
          setAllocationMsg('Cada escuela seleccionada debe tener un monto positivo.')
          return
        }

        if (manualTotal > remainingBudget) {
          setAllocationMsg('La suma de montos supera el presupuesto disponible del programa.')
          return
        }

        await api.post(`/funding-programs/${selectedProgram.id}/budget-allocations`, {
          token,
          json: { allocations: allocationsPayload },
        })
      }

      setAllocationMsg('Presupuesto asignado correctamente a las escuelas seleccionadas.')
      setSelectedSchoolIds([])
      setManualAmounts({})
      await loadAllocationContext()
      onAllocated?.()
    } catch (err) {
      setAllocationMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al asignar presupuesto'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (assignablePrograms.length === 0) {
    return (
      <SectionCard
        title="Asignar presupuesto a escuelas"
        subtitle="Distribuye el presupuesto de un programa entre las escuelas registradas."
        titleIcon={<HiBuildingOffice2 aria-hidden />}
      >
        <EmptyState
          title="No hay programas disponibles"
          detail="Crea un programa en borrador o activo para poder asignar presupuesto a escuelas."
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Asignar presupuesto a escuelas"
      subtitle="Selecciona un programa y distribuye su presupuesto entre escuelas activas del ecosistema."
      titleIcon={<HiBuildingOffice2 aria-hidden />}
    >
      <div className="mt-2 space-y-5">
        <label className="form-control w-full max-w-xl">
          <div className="label pt-0 pb-1.5">
            <span className="label-text font-medium">Programa de financiamiento</span>
            <span className="label-text-alt text-xs text-base-content/55">
              Solo programas en borrador o activos
            </span>
          </div>
          <select
            className="select select-bordered w-full bg-base-100"
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
          >
            <option value="">Selecciona un programa…</option>
            {assignablePrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} — {FUNDING_PROGRAM_STATUS_LABELS[program.status]} (
                {FUNDING_PROGRAM_ALLOCATION_LABELS[program.allocationType]})
              </option>
            ))}
          </select>
        </label>

        {!selectedProgram ? (
          <EmptyState
            title="Selecciona un programa"
            detail="Elige un programa para ver escuelas disponibles y asignar presupuesto."
          />
        ) : loadingContext ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
          </div>
        ) : contextError ? (
          <div className="space-y-3">
            <div className="alert alert-error">{contextError}</div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void loadAllocationContext()}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {summary ? (
              <KpiStrip
                items={[
                  {
                    label: 'Presupuesto total',
                    value: summary.totalBudget.toLocaleString('es-MX'),
                    hint: 'Capacidad del programa',
                  },
                  {
                    label: 'Asignado',
                    value: summary.totalAllocated.toLocaleString('es-MX'),
                    hint: 'Distribuido a escuelas',
                  },
                  {
                    label: 'Utilizado',
                    value: summary.totalUtilized.toLocaleString('es-MX'),
                    hint: 'Consumido por escuelas',
                  },
                  {
                    label: 'Disponible',
                    value: summary.remainingToAllocate.toLocaleString('es-MX'),
                    hint: 'Por asignar',
                  },
                ]}
              />
            ) : null}

            {allocations.length > 0 ? (
              <PanelBlock
                title="Asignaciones actuales"
                description="Escuelas que ya recibieron presupuesto de este programa."
                icon={<HiCheckCircle aria-hidden />}
              >
                <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
                  <table className="table table-sm table-zebra">
                    <thead>
                      <tr>
                        <th>Escuela</th>
                        <th>Asignado</th>
                        <th>Utilizado</th>
                        <th>Disponible</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="font-medium">{row.institutionName}</div>
                            <div className="text-xs text-base-content/60">{row.institutionCode}</div>
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
              </PanelBlock>
            ) : null}

            {remainingBudget <= 0 ? (
              <div className="alert alert-info text-sm">
                El presupuesto de este programa ya está completamente asignado.
              </div>
            ) : availableSchools.length === 0 ? (
              <EmptyState
                title="Sin escuelas disponibles"
                detail="Todas las escuelas activas ya tienen asignación en este programa."
              />
            ) : (
              <form className="space-y-5" onSubmit={(e) => void submitAllocation(e)}>
                <PanelBlock
                  title={
                    selectedProgram.allocationType === 'equal'
                      ? 'Seleccionar escuelas (reparto igualitario)'
                      : 'Seleccionar escuelas y montos (reparto manual)'
                  }
                  description={
                    selectedProgram.allocationType === 'equal'
                      ? `El presupuesto disponible (${remainingBudget.toLocaleString('es-MX')}) se dividirá en partes iguales.`
                      : `Define el monto para cada escuela. Disponible: ${remainingBudget.toLocaleString('es-MX')}.`
                  }
                  icon={<HiUserGroup aria-hidden />}
                >
                  <div className="space-y-3">
                    {availableSchools.map((school) => {
                      const checked = selectedSchoolIds.includes(school.id)
                      return (
                        <div
                          key={school.id}
                          className={[
                            'rounded-xl border p-3 transition-colors sm:p-4',
                            checked
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-base-300 bg-base-100',
                          ].join(' ')}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary mt-0.5"
                                checked={checked}
                                onChange={() => toggleSchool(school.id)}
                              />
                              <span>
                                <span className="block text-sm font-semibold">{school.name}</span>
                                <span className="text-xs text-base-content/60">
                                  {school.code} · ID {formatId(school.id)}
                                </span>
                              </span>
                            </label>

                            {selectedProgram.allocationType === 'manual' && checked ? (
                              <label className="form-control w-full max-w-xs sm:w-44">
                                <div className="label py-0">
                                  <span className="label-text text-xs">Monto asignado</span>
                                </div>
                                <div className="join w-full">
                                  <span className="join-item flex items-center bg-base-200 px-2.5">
                                    <HiCurrencyDollar className="h-4 w-4 text-base-content/60" aria-hidden />
                                  </span>
                                  <input
                                    className="input input-bordered join-item w-full input-sm bg-base-100"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={manualAmounts[school.id] ?? ''}
                                    onChange={(e) => updateManualAmount(school.id, e.target.value)}
                                    placeholder="0"
                                    required
                                  />
                                </div>
                              </label>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedProgram.allocationType === 'equal' && equalPreview ? (
                    <div className="alert alert-info text-sm">
                      <div>
                        <p className="font-medium">Vista previa del reparto</p>
                        <p className="mt-1">
                          {equalPreview.hasUnevenSplit
                            ? `Se asignarán montos de ${equalPreview.amounts.map((n) => n.toLocaleString('es-MX')).join(', ')} (total ${equalPreview.total.toLocaleString('es-MX')}).`
                            : `Cada escuela recibirá ${equalPreview.perSchool.toLocaleString('es-MX')} (${selectedSchoolIds.length} escuelas).`}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {selectedProgram.allocationType === 'manual' && selectedSchoolIds.length > 0 ? (
                    <div
                      className={[
                        'rounded-lg border px-3 py-2 text-sm',
                        manualTotal > remainingBudget
                          ? 'border-error/40 bg-error/10 text-error'
                          : 'border-base-300 bg-base-200/60 text-base-content/80',
                      ].join(' ')}
                    >
                      Total a asignar: <strong>{manualTotal.toLocaleString('es-MX')}</strong> /{' '}
                      {remainingBudget.toLocaleString('es-MX')} disponible
                    </div>
                  ) : null}
                </PanelBlock>

                {allocationMsg ? (
                  <div
                    role="status"
                    className={`alert text-sm ${
                      allocationMsg.includes('correctamente') ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    {allocationMsg}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-base-300/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-base-content/60">
                    {selectedSchoolIds.length} escuela(s) seleccionada(s)
                  </p>
                  <button
                    type="submit"
                    className="btn btn-secondary w-full gap-2 sm:w-auto"
                    disabled={submitting || selectedSchoolIds.length === 0}
                  >
                    {submitting ? (
                      <span className="loading loading-spinner loading-sm" aria-hidden />
                    ) : (
                      <HiPlusCircle className="h-4 w-4" aria-hidden />
                    )}
                    {submitting ? 'Asignando…' : 'Asignar presupuesto'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}
