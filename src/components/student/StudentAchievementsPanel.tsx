import { useCallback, useEffect, useState } from 'react'
import { HiCheckBadge, HiLockClosed, HiSparkles } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState } from '../ui/executive'
import { formatId } from '../../i18n/format'

export type StudentAchievement = {
  key: string
  title: string
  description: string
  threshold: number
  progress: number
  unlocked: boolean
  status: 'locked' | 'in_progress' | 'attested' | 'eligible' | 'failed'
  attestationPda: string | null
  attestationSignature: string | null
  explorerUrl: string | null
}

type AchievementsResponse = {
  institutionId: number
  rewardedCount: number
  achievements: StudentAchievement[]
}

/**
 * Milestone / SAS achievement cards for the student home (motivation surface).
 */
export function StudentAchievementsPanel() {
  const { token } = useAuth()
  const [data, setData] = useState<AchievementsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<AchievementsResponse>('/achievements/me', { token })
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading) {
    return (
      <section className="space-y-3" aria-labelledby="student-achievements-heading">
        <AchievementsHeader />
        <div className="flex min-h-28 items-center justify-center rounded-2xl border border-base-300 bg-base-100">
          <span className="loading loading-sm loading-spinner text-primary" aria-label="Cargando logros" />
        </div>
      </section>
    )
  }

  const achievements = data?.achievements ?? []

  return (
    <section className="space-y-3" aria-labelledby="student-achievements-heading">
      <AchievementsHeader rewardedCount={data?.rewardedCount} />

      {achievements.length === 0 ? (
        <EmptyState
          title="Sin logros todavia."
          detail="Cuando completes actividades recompensadas, veras aqui tus logros atestiguados."
        />
      ) : (
        <div className="grid gap-3">
          {achievements.map((item) => (
            <AchievementCard key={item.key} achievement={item} />
          ))}
        </div>
      )}

      <p className="text-xs text-base-content/55">
        Compite con tu colegio en el{' '}
        <Link to="/student/ranking" className="font-medium text-primary underline-offset-2 hover:underline">
          ranking de estudiantes destacados
        </Link>
        .
      </p>
    </section>
  )
}

function AchievementsHeader({ rewardedCount }: { rewardedCount?: number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl border border-primary/20 bg-primary/10 p-2" aria-hidden>
        <HiSparkles className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2
          id="student-achievements-heading"
          className="text-sm font-semibold uppercase tracking-wider text-base-content/60"
        >
          Tus logros
        </h2>
        <p className="mt-1 text-xs text-base-content/55">
          Logros academicos atestiguados en Solana cuando alcanzas hitos.
          {typeof rewardedCount === 'number' ? (
            <>
              {' '}
              Actividades recompensadas: <span className="font-medium text-base-content/80">{formatId(rewardedCount)}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: StudentAchievement }) {
  const pct = Math.min(100, Math.round((achievement.progress / achievement.threshold) * 100))
  const unlocked = achievement.unlocked

  return (
    <article
      className={[
        'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
        unlocked
          ? 'border-primary/35 bg-gradient-to-br from-primary/[0.16] via-base-100 to-base-200'
          : 'border-base-300 bg-base-100',
      ].join(' ')}
    >
      {unlocked ? (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
      ) : null}

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {unlocked ? (
              <HiCheckBadge className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            ) : (
              <HiLockClosed className="h-5 w-5 shrink-0 text-base-content/45" aria-hidden />
            )}
            <h3 className="m-0 text-base font-semibold leading-snug text-base-content">
              {achievement.title}
            </h3>
          </div>
          <p className="text-sm text-base-content/70">{achievement.description}</p>

          {!unlocked ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>
                  Progreso {formatId(achievement.progress)} / {formatId(achievement.threshold)}
                </span>
                <span className="font-medium tabular-nums">{pct}%</span>
              </div>
              <progress
                className="progress progress-primary h-2 w-full"
                value={achievement.progress}
                max={achievement.threshold}
                aria-label="Progreso del logro"
              />
              {achievement.status === 'eligible' ? (
                <p className="text-xs font-medium text-primary">
                  Ya cumpliste el hito. El atestado on-chain se emite con el proceso de logros.
                </p>
              ) : null}
              {achievement.status === 'failed' ? (
                <p className="text-xs text-error">
                  Hubo un problema al atestiguar este logro. Se reintentara en el proximo barrido.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-primary">Logro desbloqueado y atestiguado en Solana</p>
              {achievement.attestationPda ? (
                <p className="break-all font-mono text-[11px] text-base-content/55">
                  PDA: {achievement.attestationPda}
                </p>
              ) : null}
              {achievement.explorerUrl ? (
                <a
                  href={achievement.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-primary btn-sm"
                >
                  Ver attestation en Explorer
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div
          className={[
            'shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
            unlocked
              ? 'bg-primary text-primary-content'
              : achievement.status === 'eligible'
                ? 'bg-warning/20 text-warning-content'
                : 'bg-base-200 text-base-content/70',
          ].join(' ')}
        >
          {unlocked
            ? 'Desbloqueado'
            : achievement.status === 'eligible'
              ? 'Listo para atestar'
              : achievement.status === 'in_progress'
                ? 'En progreso'
                : achievement.status === 'failed'
                  ? 'Reintentar'
                  : 'Bloqueado'}
        </div>
      </div>
    </article>
  )
}
