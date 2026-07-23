import { useCallback, useEffect, useState } from 'react'
import { HiGift, HiWallet } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, KpiStrip } from '../../components/ui/executive'
import { CREDIT_TOKEN_NAME } from '../../i18n/es'
import { formatAmount, formatCreditsWithUnit, formatId } from '../../i18n/format'

type TaskRow = { id: number }
type SubmissionRow = { id: number }

type Balance = {
  simulatedBalance: number
  institutionId: number | null
}

type CatalogReward = {
  id: number
  title: string
  description: string | null
  creditCost: number
  isActive: boolean
}

/**
 * Student summary route: KPIs only; tasks and submissions use dedicated routes.
 */
export function StudentHome() {
  const { token } = useAuth()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [catalog, setCatalog] = useState<CatalogReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null)
  const [redeemTone, setRedeemTone] = useState<'info' | 'success' | 'error'>('info')
  const [redeemBusyId, setRedeemBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [b, t, s, rewards] = await Promise.all([
        api.get<Balance>('/rewards/balance', { token }),
        api.get<TaskRow[]>('/tasks/available', { token }),
        api.get<SubmissionRow[]>('/submissions', { token }),
        api.get<CatalogReward[]>('/rewards/catalog', { token }),
      ])
      setBalance(b)
      setTaskCount(Array.isArray(t) ? t.length : 0)
      setSubmissionCount(Array.isArray(s) ? s.length : 0)
      setCatalog(Array.isArray(rewards) ? rewards : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function redeemReward(reward: CatalogReward) {
    if (!token) return
    setRedeemMsg(null)
    setRedeemBusyId(reward.id)
    try {
      await api.post('/redemptions', {
        token,
        json: { rewardId: reward.id },
      })
      setRedeemTone('success')
      setRedeemMsg(
        `Solicitud de canje enviada para "${reward.title}". Un admin escolar la revisara.`
      )
      const b = await api.get<Balance>('/rewards/balance', { token })
      setBalance(b)
    } catch (e) {
      setRedeemTone('error')
      setRedeemMsg(e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo solicitar el canje')
    } finally {
      setRedeemBusyId(null)
    }
  }

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
      <div className="divider"></div>
      <section className="space-y-3" aria-labelledby="student-marketplace-heading">
        <div>
          <h2
            id="student-marketplace-heading"
            className="text-sm font-semibold uppercase tracking-wider text-base-content/60"
          >
            Marketplace
          </h2>
          <p className="mt-1 text-xs text-base-content/55">
            Recompensas internas de tu colegio. Al canjear, un admin escolar aprueba y se debitan tus creditos.
          </p>
        </div>

        {redeemMsg && (
          <div
            role="status"
            className={`alert text-sm ${
              redeemTone === 'success'
                ? 'alert-success'
                : redeemTone === 'error'
                  ? 'alert-error'
                  : 'alert-info'
            }`}
          >
            {redeemMsg}
          </div>
        )}

        {catalog.length === 0 ? (
          <EmptyState
            title="Sin recompensas disponibles."
            detail="Cuando tu colegio publique recompensas internas, las veras aqui."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item) => {
              const canAfford = creditsBalance >= item.creditCost
              const busy = redeemBusyId === item.id
              return (
                <article
                  key={item.id}
                  className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition-shadow hover:shadow-md"
                >
                  <figure className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-base-300">
                    <HiGift className="h-14 w-14 text-primary/70" aria-hidden />
                  </figure>
                  <div className="card-body gap-2 p-4">
                    <h3 className="card-title text-base leading-snug">{item.title}</h3>
                    {item.description ? (
                      <p className="line-clamp-2 text-sm text-base-content/70">{item.description}</p>
                    ) : null}
                    <p className="text-lg font-semibold tabular-nums text-primary">
                      {formatCreditsWithUnit(item.creditCost)}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm w-full"
                      disabled={busy || !canAfford}
                      onClick={() => redeemReward(item)}
                      title={!canAfford ? 'Creditos insuficientes' : undefined}
                    >
                      {busy ? (
                        <span className="loading loading-spinner loading-sm" aria-label="Canjeando" />
                      ) : canAfford ? (
                        'Canjear'
                      ) : (
                        'Creditos insuficientes'
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
