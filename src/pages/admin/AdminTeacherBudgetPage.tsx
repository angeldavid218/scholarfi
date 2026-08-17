import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { HiBanknotes, HiUserGroup, HiUsers } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'

type BudgetBreakdown = {
  institutionId: number
  allocatedCredits: number
  utilizedCredits: number
  delegatedCredits: number
  availableToAssign: number
  teacherCount: number
}

type TeacherPoolRow = {
  teacherId: number
  email: string
  fullName: string | null
  institutionId: number
  allocatedCredits: number
  utilizedCredits: number
  remainingCredits: number
  hasPool: boolean
  lastAllocationAt: string | null
}

type TeacherPoolsResponse = {
  breakdown: BudgetBreakdown
  teachers: TeacherPoolRow[]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function teacherLabel(row: TeacherPoolRow): string {
  const name = row.fullName?.trim()
  if (name) return `${name} (${row.email})`
  return row.email
}

export function AdminTeacherBudgetPage() {
  const { token } = useAuth()
  const [data, setData] = useState<TeacherPoolsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [equalAmount, setEqualAmount] = useState('')
  const [equalNotes, setEqualNotes] = useState('')

  const [manualTeacherId, setManualTeacherId] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await api.get<TeacherPoolsResponse>('/institutions/teacher-credit-pools', {
        token,
      })
      setData(response)
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al cargar presupuesto')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const breakdown = data?.breakdown ?? null
  const teachers = data?.teachers ?? []

  const equalPreview = useMemo(() => {
    const total = Number(equalAmount)
    const count = breakdown?.teacherCount ?? 0
    if (!Number.isFinite(total) || total <= 0 || count <= 0) return null
    const perTeacher = Math.floor(total / count)
    const remainder = total - perTeacher * count
    return { perTeacher, remainder, count }
  }, [equalAmount, breakdown?.teacherCount])

  async function submitEqualSplit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    setBusy(true)
    try {
      const totalAmount = Number(equalAmount)
      const response = await api.post<TeacherPoolsResponse & {
        perTeacherAmount: number
        teachersAffected: number
        remainder: number
      }>('/institutions/teacher-credit-pools/allocate-equal', {
        token,
        json: {
          totalAmount,
          notes: equalNotes.trim() || undefined,
        },
      })
      setData({
        breakdown: response.breakdown,
        teachers: response.teachers,
      })
      setEqualAmount('')
      setEqualNotes('')
      setMsg(
        `Reparto aplicado: ${formatCreditsWithUnit(response.perTeacherAmount)} × ${response.teachersAffected} docentes` +
          (response.remainder > 0 ? ` (${formatCreditsWithUnit(response.remainder)} sin asignar por redondeo).` : '.')
      )
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al repartir presupuesto')
    } finally {
      setBusy(false)
    }
  }

  async function submitManualAssign(e: FormEvent) {
    e.preventDefault()
    if (!token || !manualTeacherId) return
    setMsg(null)
    setBusy(true)
    try {
      const response = await api.post<{ teacher: TeacherPoolRow; breakdown: BudgetBreakdown }>(
        `/institutions/teacher-credit-pools/${manualTeacherId}/allocate`,
        {
          token,
          json: {
            amount: Number(manualAmount),
            notes: manualNotes.trim() || undefined,
          },
        }
      )
      setData((prev) => {
        if (!prev) {
          return {
            breakdown: response.breakdown,
            teachers: [response.teacher],
          }
        }
        return {
          breakdown: response.breakdown,
          teachers: prev.teachers.map((row) =>
            row.teacherId === response.teacher.teacherId ? { ...row, ...response.teacher } : row
          ),
        }
      })
      setManualAmount('')
      setManualNotes('')
      setMsg(`Presupuesto asignado a ${teacherLabel(response.teacher)}.`)
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al asignar presupuesto')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ExecutiveHero
        eyebrow="Admin escolar"
        title="Presupuesto docentes"
        subtitle="Distribuye créditos a docentes para que validen y aprueben recompensas sin pasar por la cola de administración."
        leadingIcon={<HiBanknotes aria-hidden />}
      />

      <KpiStrip
        items={[
          {
            label: 'Disponible para asignar',
            value: formatCreditsWithUnit(breakdown?.availableToAssign),
            hint: 'Desde el presupuesto institucional',
          },
          {
            label: 'Delegado a docentes',
            value: formatCreditsWithUnit(breakdown?.delegatedCredits),
            hint: 'Asignado pero no necesariamente gastado',
          },
          {
            label: 'Utilizado (institución)',
            value: formatCreditsWithUnit(breakdown?.utilizedCredits),
            hint: 'Recompensas sin presupuesto docente',
          },
          {
            label: 'Docentes',
            value: formatId(breakdown?.teacherCount),
            hint: 'En la institución',
          },
        ]}
      />

      {msg && (
        <div role="status" className="alert alert-info text-sm">
          {msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Reparto equitativo"
          subtitle="Divide un monto total en partes iguales entre todos los docentes."
          titleIcon={<HiUsers aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={submitEqualSplit}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Monto total a repartir</span>
              </div>
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={equalAmount}
                onChange={(e) => setEqualAmount(e.target.value)}
              />
            </label>
            {equalPreview && (
              <p className="text-sm text-base-content/70">
                Vista previa: {formatCreditsWithUnit(equalPreview.perTeacher)} × {equalPreview.count}{' '}
                docentes
                {equalPreview.remainder > 0
                  ? ` (${formatCreditsWithUnit(equalPreview.remainder)} quedarán sin asignar).`
                  : '.'}
              </p>
            )}
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Notas (opcional)</span>
              </div>
              <input
                className="input input-bordered w-full"
                value={equalNotes}
                onChange={(e) => setEqualNotes(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit" disabled={busy || loading}>
              Repartir equitativamente
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Asignación manual"
          subtitle="Asigna créditos a un docente específico."
          titleIcon={<HiUserGroup aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={submitManualAssign}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Docente</span>
              </div>
              <select
                className="select select-bordered w-full"
                required
                value={manualTeacherId}
                onChange={(e) => setManualTeacherId(e.target.value)}
              >
                <option value="">Seleccionar docente</option>
                {teachers.map((row) => (
                  <option key={row.teacherId} value={row.teacherId}>
                    {teacherLabel(row)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Monto</span>
              </div>
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Notas (opcional)</span>
              </div>
              <input
                className="input input-bordered w-full"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit" disabled={busy || loading}>
              Asignar presupuesto
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        title="Presupuesto por docente"
        subtitle="Saldo asignado, utilizado y disponible de cada docente."
        titleIcon={<HiBanknotes aria-hidden />}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : teachers.length === 0 ? (
          <EmptyState
            title="Sin docentes"
            detail="No hay docentes registrados en la institución para asignar presupuesto."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Asignado</th>
                  <th>Utilizado</th>
                  <th>Disponible</th>
                  <th>Última asignación</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((row) => (
                  <tr key={row.teacherId}>
                    <td>{teacherLabel(row)}</td>
                    <td>{formatCreditsWithUnit(row.allocatedCredits)}</td>
                    <td>{formatCreditsWithUnit(row.utilizedCredits)}</td>
                    <td>{formatCreditsWithUnit(row.remainingCredits)}</td>
                    <td>{formatDate(row.lastAllocationAt)}</td>
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
