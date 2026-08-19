export const DIPLOMA_ACHIEVEMENT_LABELS = {
  excelencia_academica: 'Excelencia Académica',
  progreso_academico: 'Progreso Académico',
  constancia_academica: 'Constancia Académica',
  merito_academico: 'Mérito Académico',
  participacion_destacada: 'Participación Destacada',
  logro_extraordinario: 'Logro Extraordinario',
} as const

export type DiplomaAchievementTypeKey = keyof typeof DIPLOMA_ACHIEVEMENT_LABELS

export const DIPLOMA_CATEGORY_HINTS: { key: DiplomaAchievementTypeKey; description: string }[] = [
  {
    key: 'excelencia_academica',
    description: 'Desempeño académico sobresaliente (MVP: estudiante #1 del ranking).',
  },
  { key: 'progreso_academico', description: 'Mejora significativa de calificaciones.' },
  { key: 'constancia_academica', description: 'Rendimiento consistente durante un período.' },
  { key: 'merito_academico', description: 'Cumplimiento destacado de objetivos académicos.' },
  { key: 'participacion_destacada', description: 'Compromiso con actividades o proyectos.' },
  { key: 'logro_extraordinario', description: 'Proyecto, competencia o actividad específica.' },
]

export function achievementLabel(key: string): string {
  return DIPLOMA_ACHIEVEMENT_LABELS[key as DiplomaAchievementTypeKey] ?? 'Reconocimiento Académico'
}
