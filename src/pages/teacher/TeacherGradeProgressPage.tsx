import { HiChartBar } from 'react-icons/hi2'
import { GradeProgressTable } from '../../components/grade-progress/GradeProgressTable'
import { ExecutiveHero } from '../../components/ui/executive'

/**
 * Teacher view of Classroom grade progress analytics.
 */
export function TeacherGradeProgressPage() {
  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Analytics"
        title="Progreso de calificaciones"
        subtitle="Estudiantes de tus clases: quién mejora y quién mantiene rendimiento a partir de las notas sincronizadas de Google Classroom."
        leadingIcon={<HiChartBar />}
      />
      <GradeProgressTable />
    </div>
  )
}
