import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  HiArrowPath,
  HiBanknotes,
  HiCalendarDays,
  HiCheckCircle,
  HiCurrencyDollar,
  HiDocumentText,
  HiPlay,
  HiPlusCircle,
  HiScale,
} from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import {
  FUNDING_PROGRAM_ALLOCATION_LABELS,
  FUNDING_PROGRAM_STATUS_LABELS,
} from '../../i18n/es'
import { NgoSchoolBudgetAllocationSection } from './NgoSchoolBudgetAllocationSection'

type FundingProgram = {
  id: number
  ngoInstitutionId: number
  name: string
  description: string
  totalBudget: number
  allocationType: 'equal' | 'manual'
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'completed'
  createdAt: string
  updatedAt: string | null
}

function statusBadgeClass(status: FundingProgram['status']) {
  if (status === 'active') return 'badge-success'
  if (status === 'completed') return 'badge-neutral'
  return 'badge-warning'
}

function FormSection({
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-base-content">{title}</h3>
          <p className="mt-0.5 text-sm text-base-content/65">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function FieldLabel({
  label,
  hint,
  htmlFor,
}: {
  label: string
  hint?: string
  htmlFor?: string
}) {
  return (
    <div className="label pt-0 pb-1.5">
      <span className="label-text font-medium text-base-content" id={htmlFor ? `${htmlFor}-label` : undefined}>
        {label}
      </span>
      {hint ? <span className="label-text-alt text-xs text-base-content/55">{hint}</span> : null}
    </div>
  )
}

const ALLOCATION_HINTS: Record<'equal' | 'manual', string> = {
  equal: 'El presupuesto restante se divide en partes iguales entre las escuelas seleccionadas.',
  manual: 'Tú defines el monto asignado a cada escuela en un paso posterior.',
}

export function NgoFundingProgramsPage() {
  const { token, profile } = useAuth()
  const [programs, setPrograms] = useState<FundingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [listMsg, setListMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activatingProgramId, setActivatingProgramId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [allocationType, setAllocationType] = useState<'equal' | 'manual'>('equal')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadPrograms = useCallback(
    async (showLoadingSpinner = false) => {
      if (!token) return
      if (showLoadingSpinner) setLoading(true)
      setError(null)
      try {
        const data = await api.get<FundingProgram[]>('/funding-programs', { token })
        setPrograms(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(
          err instanceof ApiError
            ? getApiErrorMessage(err.body)
            : 'Error al cargar los programas de financiamiento'
        )
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPrograms()
  }, [loadPrograms])

  async function createProgram(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    setSubmitting(true)

    const budget = Number(totalBudget)
    if (!Number.isFinite(budget) || budget <= 0) {
      setMsg('El presupuesto total debe ser un número positivo.')
      setSubmitting(false)
      return
    }
    if (!startDate || !endDate) {
      setMsg('Las fechas de inicio y fin son obligatorias.')
      setSubmitting(false)
      return
    }

    try {
      const created = await api.post<FundingProgram>('/funding-programs', {
        token,
        json: {
          name: name.trim(),
          description: description.trim(),
          totalBudget: budget,
          allocationType,
          startDate,
          endDate,
          status: 'draft',
        },
      })
      setMsg(`Programa creado: ${created.name}`)
      setName('')
      setDescription('')
      setTotalBudget('')
      setAllocationType('equal')
      setStartDate('')
      setEndDate('')
      await loadPrograms()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al crear el programa')
    } finally {
      setSubmitting(false)
    }
  }

  async function activateProgram(program: FundingProgram) {
    if (!token) return
    if (program.status !== 'draft') {
      setListMsg('Solo los programas en borrador pueden activarse.')
      return
    }

    setListMsg(null)
    setActivatingProgramId(program.id)
    try {
      await api.patch<FundingProgram>(`/funding-programs/${program.id}`, {
        token,
        json: { status: 'active' },
      })
      setListMsg(`Programa activado: ${program.name}`)
      await loadPrograms()
    } catch (err) {
      setListMsg(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al activar el programa'
      )
    } finally {
      setActivatingProgramId(null)
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
        eyebrow="Consola de Administración ONG"
        title="Programas de Financiamiento"
        subtitle="Crea y administra los programas que distribuyen presupuesto a las escuelas del ecosistema."
        actions={
          <button
            type="button"
            className="btn btn-outline btn-primary btn-sm gap-1"
            onClick={() => void loadPrograms(true)}
          >
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
      />

      {error ? (
        <div className="space-y-3">
          <div className="alert alert-error">{error}</div>
          <button type="button" className="btn btn-primary" onClick={() => void loadPrograms(true)}>
            Reintentar
          </button>
        </div>
      ) : null}

      <SectionCard
        title="Nuevo programa"
        subtitle={
          profile?.ngoInstitutionName
            ? `Registra un programa para ${profile.ngoInstitutionName}.`
            : 'Define el presupuesto, el tipo de reparto y el periodo de vigencia.'
        }
        titleIcon={<HiPlusCircle aria-hidden />}
      >
        <form
          className="mt-2 space-y-5"
          onSubmit={(e) => void createProgram(e)}
          aria-labelledby="funding-program-form-title"
        >
          <p id="funding-program-form-title" className="sr-only">
            Formulario de registro de programa de financiamiento
          </p>

          <FormSection
            title="Información general"
            description="Nombre y propósito del programa visible para tu equipo."
            icon={<HiDocumentText aria-hidden />}
          >
            <label className="form-control w-full">
              <FieldLabel label="Nombre del programa" hint="Máx. 180 caracteres" htmlFor="program-name" />
              <input
                id="program-name"
                className="input input-bordered w-full bg-base-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={180}
                placeholder="Becas STEM 2026"
              />
            </label>

            <label className="form-control w-full">
              <FieldLabel
                label="Descripción"
                hint="Objetivo, público beneficiario y criterios generales"
                htmlFor="program-description"
              />
              <textarea
                id="program-description"
                className="textarea textarea-bordered min-h-28 w-full resize-y bg-base-100 leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={2}
                placeholder="Describe el alcance del financiamiento y cómo se utilizará en las escuelas."
              />
            </label>
          </FormSection>

          <FormSection
            title="Presupuesto y reparto"
            description="Capacidad financiera total y cómo se distribuirá entre escuelas."
            icon={<HiScale aria-hidden />}
          >
            <label className="form-control w-full max-w-md">
              <FieldLabel label="Presupuesto total" hint="Monto en unidades de la plataforma" htmlFor="program-budget" />
              <div className="join w-full">
                <span className="join-item flex items-center bg-base-200 px-3 text-sm font-medium text-base-content/70">
                  <HiCurrencyDollar className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="program-budget"
                  className="input input-bordered join-item w-full bg-base-100"
                  type="number"
                  min={1}
                  step={1}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  required
                  placeholder="25000"
                  inputMode="numeric"
                />
              </div>
            </label>

            <fieldset className="space-y-3">
              <legend className="sr-only">Tipo de reparto</legend>
              <FieldLabel label="Tipo de reparto" hint="Define cómo se asignará el presupuesto a las escuelas" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(['equal', 'manual'] as const).map((type) => {
                  const selected = allocationType === type
                  return (
                    <label
                      key={type}
                      className={[
                        'relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all',
                        selected
                          ? 'border-primary bg-primary/8 shadow-sm ring-2 ring-primary/25'
                          : 'border-base-300 bg-base-100 hover:border-primary/35 hover:bg-base-200/60',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="allocationType"
                        value={type}
                        checked={selected}
                        onChange={() => setAllocationType(type)}
                        className="radio radio-primary radio-sm"
                      />
                      <span className="text-sm font-semibold text-base-content">
                        {FUNDING_PROGRAM_ALLOCATION_LABELS[type]}
                      </span>
                      <span className="text-xs leading-relaxed text-base-content/65">
                        {ALLOCATION_HINTS[type]}
                      </span>
                      {selected ? (
                        <HiCheckCircle className="absolute right-3 top-3 h-5 w-5 text-primary" aria-hidden />
                      ) : null}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </FormSection>

          <FormSection
            title="Vigencia y estado"
            description="Periodo operativo del programa y disponibilidad inicial."
            icon={<HiCalendarDays aria-hidden />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="form-control w-full">
                <FieldLabel label="Fecha de inicio" htmlFor="program-start" />
                <input
                  id="program-start"
                  className="input input-bordered w-full bg-base-100"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>

              <label className="form-control w-full">
                <FieldLabel label="Fecha de fin" htmlFor="program-end" />
                <input
                  id="program-end"
                  className="input input-bordered w-full bg-base-100"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="rounded-lg border border-base-300/80 bg-base-200/40 px-3 py-2 text-sm text-base-content/70">
              Los programas nuevos se crean en <strong>borrador</strong>. Actívalos desde el listado
              cuando estén listos; un programa activo no puede volver a borrador.
            </div>
          </FormSection>

          {msg ? (
            <div
              role="status"
              className={`alert text-sm ${msg.startsWith('Programa creado') ? 'alert-success' : 'alert-error'}`}
            >
              {msg}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-base-300/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-base-content/60">
              Después de crear el programa, asigna presupuesto a escuelas en la sección inferior.
            </p>
            <button
              type="submit"
              className="btn btn-primary w-full gap-2 sm:w-auto"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" aria-hidden />
              ) : (
                <HiPlusCircle className="h-4 w-4" aria-hidden />
              )}
              {submitting ? 'Creando programa…' : 'Crear programa'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Programas registrados"
        subtitle="Listado de programas de financiamiento de tu organización."
        titleIcon={<HiBanknotes aria-hidden />}
      >
        {programs.length === 0 ? (
          <EmptyState
            title="Sin programas aún"
            detail="Crea tu primer programa de financiamiento con el formulario superior."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {listMsg ? (
              <div
                role="status"
                className={`alert text-sm ${
                  listMsg.startsWith('Programa activado') ? 'alert-success' : 'alert-error'
                }`}
              >
                {listMsg}
              </div>
            ) : null}

            <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Presupuesto</th>
                  <th>Reparto</th>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id}>
                    <th>{formatId(program.id)}</th>
                    <td>
                      <div className="font-medium">{program.name}</div>
                      <div className="max-w-xs truncate text-xs text-base-content/60">
                        {program.description}
                      </div>
                    </td>
                    <td>{program.totalBudget.toLocaleString('es-MX')}</td>
                    <td>{FUNDING_PROGRAM_ALLOCATION_LABELS[program.allocationType]}</td>
                    <td className="whitespace-nowrap text-sm">
                      {program.startDate} — {program.endDate}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${statusBadgeClass(program.status)}`}>
                        {FUNDING_PROGRAM_STATUS_LABELS[program.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      {program.status === 'draft' ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs gap-1"
                          disabled={activatingProgramId === program.id}
                          onClick={() => void activateProgram(program)}
                        >
                          {activatingProgramId === program.id ? (
                            <span className="loading loading-spinner loading-xs" aria-hidden />
                          ) : (
                            <HiPlay className="h-3.5 w-3.5" aria-hidden />
                          )}
                          Activar
                        </button>
                      ) : program.status === 'active' ? (
                        <span className="text-xs text-base-content/50">Activo</span>
                      ) : (
                        <span className="text-xs text-base-content/50">Completado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </SectionCard>

      <NgoSchoolBudgetAllocationSection programs={programs} onAllocated={() => void loadPrograms()} />
    </div>
  )
}
