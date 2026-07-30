import { StudentOutstandingLeaderboard } from '../../components/student/StudentOutstandingLeaderboard'

/**
 * Dedicated student ranking page (outstanding students within the school).
 */
export function StudentRankingPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="sf-eyebrow m-0">Competencia escolar</p>
        <h1 className="m-0 text-xl font-semibold tracking-tight text-base-content md:text-2xl">
          Ranking de estudiantes
        </h1>
        <p className="max-w-prose text-sm text-base-content/70">
          Quien mas destaca en tu colegio por creditos ganados en actividades recompensadas.
          Completa tareas y sube en el tablero.
        </p>
      </header>

      <StudentOutstandingLeaderboard limit={20} />
    </div>
  )
}
