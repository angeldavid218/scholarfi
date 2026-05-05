import { useCallback, useEffect, useState } from 'react'
import { HiWallet } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { KpiStrip } from '../../components/ui/executive'
import { CREDIT_TOKEN_NAME } from '../../i18n/es'
import { formatAmount, formatId } from '../../i18n/format'

type TaskRow = { id: number }
type SubmissionRow = { id: number }

type Balance = {
  simulatedBalance: number
  institutionId: number | null
}

/**
 * Resumen del estudiante: metricas (KPI) y saldo en Credit (créditos). Tareas y envios en rutas dedicadas.
 */
export function StudentHome() {
  const { token } = useAuth()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [b, t, s] = await Promise.all([
        api.get<Balance>('/rewards/balance', { token }),
        api.get<TaskRow[]>('/tasks/available', { token }),
        api.get<SubmissionRow[]>('/submissions', { token }),
      ])
      setBalance(b)
      setTaskCount(Array.isArray(t) ? t.length : 0)
      setSubmissionCount(Array.isArray(s) ? s.length : 0)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  const creditsBalance = balance?.simulatedBalance ?? 0

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-base-100 to-base-200 p-6 shadow-[0_18px_42px_-14px_color-mix(in_oklab,var(--color-primary)_38%,transparent)] md:p-8"
        aria-labelledby="student-credits-heading"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="sf-eyebrow m-0">Panel estudiantil</p>
            <div>
              <h1 id="student-credits-heading" className="m-0 text-lg font-semibold tracking-tight text-base-content md:text-xl">
                Tus créditos
              </h1>
              <p className="mt-1 max-w-prose text-sm text-base-content/75">
                Ganas <span className="font-semibold text-primary">{CREDIT_TOKEN_NAME}</span> al completar tareas y recibir
                la aprobación final; aquí ves tu acumulado en la institución.
              </p>
            </div>
            <p
              className="break-words text-4xl font-bold tabular-nums tracking-tight text-primary md:text-5xl"
              aria-live="polite"
            >
              {formatAmount(creditsBalance)}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/55">
              Unidad <span className="text-primary">{CREDIT_TOKEN_NAME}</span>
              <span className="mx-1.5 font-normal text-base-content/45">·</span>
              <span className="font-normal normal-case tracking-normal text-sm text-base-content/70">
                Créditos disponibles en tu cuenta
              </span>
            </p>
          </div>
          <div
            className="flex shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-base-100/80 p-5 shadow-inner md:self-stretch"
            aria-hidden
          >
            <HiWallet className="h-14 w-14 text-primary md:h-16 md:w-16" />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/60">Actividad</h2>
        <KpiStrip
          items={[
            { label: 'Tareas activas', value: formatId(taskCount), hint: 'Pendientes por completar' },
            { label: 'Envios registrados', value: formatId(submissionCount), hint: 'Historial auditado' },
          ]}
        />
        <p className="text-xs text-base-content/55">
          Para sumar créditos, entrega evidencias en <span className="font-medium text-base-content/70">Tareas disponibles</span>
          . Consulta resultados en <span className="font-medium text-base-content/70">Mis envios</span>.
        </p>
      </div>
    </div>
  )
}
