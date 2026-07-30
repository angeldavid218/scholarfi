import { useCallback, useEffect, useState } from 'react'
import { HiTrophy } from 'react-icons/hi2'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState } from '../ui/executive'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'

export type StudentLeaderboardEntry = {
  rank: number
  studentId: number
  displayName: string
  points: number
  contributionCount: number
  isCurrentUser: boolean
}

export type StudentLeaderboardResponse = {
  institutionId: number
  entries: StudentLeaderboardEntry[]
  currentUser: {
    rank: number | null
    points: number
    contributionCount: number
  }
}

type StudentOutstandingLeaderboardProps = {
  limit?: number
}

/**
 * Institution-scoped outstanding-student ranking (student ranking page).
 */
export function StudentOutstandingLeaderboard({
  limit = 10,
}: StudentOutstandingLeaderboardProps) {
  const { token } = useAuth()
  const [board, setBoard] = useState<StudentLeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await api.get<StudentLeaderboardResponse>(
        `/leaderboard/students?limit=${limit}`,
        { token }
      )
      setBoard(data)
    } catch {
      setBoard(null)
    } finally {
      setLoading(false)
    }
  }, [token, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading) {
    return (
      <section className="space-y-3" aria-labelledby="student-leaderboard-heading">
        <StudentLeaderboardHeader currentUser={null} />
        <div className="flex min-h-24 items-center justify-center rounded-2xl border border-base-300 bg-base-100">
          <span className="loading loading-sm loading-spinner text-primary" aria-label="Cargando ranking" />
        </div>
      </section>
    )
  }

  const entries = board?.entries ?? []

  return (
    <section className="space-y-3" aria-labelledby="student-leaderboard-heading">
      <StudentLeaderboardHeader currentUser={board?.currentUser ?? null} />

      {entries.length === 0 ? (
        <EmptyState
          title="Aun no hay ranking."
          detail="Cuando se recompensen las primeras actividades, veras aqui a los estudiantes destacados de tu colegio."
        />
      ) : (
        <ol className="divide-y divide-base-300 overflow-hidden rounded-2xl border border-base-300 bg-base-100">
          {entries.map((entry) => (
            <StudentLeaderboardRow key={entry.studentId} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  )
}

function StudentLeaderboardHeader({
  currentUser,
}: {
  currentUser: StudentLeaderboardResponse['currentUser'] | null
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl border border-primary/20 bg-primary/10 p-2" aria-hidden>
        <HiTrophy className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2
          id="student-leaderboard-heading"
          className="text-sm font-semibold uppercase tracking-wider text-base-content/60"
        >
          Estudiantes destacados
        </h2>
        <p className="mt-1 text-xs text-base-content/55">
          Ranking de tu colegio por créditos ganados en actividades recompensadas.
          {currentUser?.rank != null ? (
            <>
              {' '}
              Tu puesto: <span className="font-medium text-base-content/80">#{currentUser.rank}</span>
              {' · '}
              {formatCreditsWithUnit(currentUser.points)}
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function StudentLeaderboardRow({ entry }: { entry: StudentLeaderboardEntry }) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 ${entry.isCurrentUser ? 'bg-primary/8' : ''}`}
    >
      <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-base-content/55">
        #{entry.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">
          {entry.displayName}
          {entry.isCurrentUser ? (
            <span className="ml-2 text-xs font-normal text-primary">Tu</span>
          ) : null}
        </p>
        <p className="text-xs text-base-content/55">
          {formatId(entry.contributionCount)}{' '}
          {entry.contributionCount === 1 ? 'actividad' : 'actividades'}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
        {formatCreditsWithUnit(entry.points)}
      </span>
    </li>
  )
}
