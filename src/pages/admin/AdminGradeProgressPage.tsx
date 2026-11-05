import { HiChartBar } from 'react-icons/hi2'
import { GradeProgressTable } from '../../components/grade-progress/GradeProgressTable'
import { ExecutiveHero } from '../../components/ui/executive'

/**
 * School admin: institution-wide Classroom grade progress analytics.
 */
export function AdminGradeProgressPage() {
  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Analytics institucional"
        title="Progreso de calificaciones"
        subtitle="Resumen y detalle por estudiante a partir de las notas sincronizadas de Google Classroom en toda la institución."
        leadingIcon={<HiChartBar />}
      />
      <GradeProgressTable />
    </div>
  )
}
