export const SUBMISSION_STATUS_KEYS = [
  'pending',
  'validated',
  'rejected_by_teacher',
  'approved',
  'rejected_by_admin',
] as const

export type SubmissionStatusKey = (typeof SUBMISSION_STATUS_KEYS)[number]
export type TaskStatusKey = 'active' | 'closed'
export type InstitutionStatusKey = 'draft' | 'active' | 'inactive'
export type FundingProgramStatusKey = 'draft' | 'active' | 'completed'
export type FundingProgramAllocationKey = 'equal' | 'manual'

/** English name of the program unit of account (students earn Credits). */
export const CREDIT_TOKEN_NAME = 'Credit'

export const CREDITS_COPY = {
  unitLower: 'créditos',
  unitTitle: 'Créditos',
} as const

export const CANONICAL_ES_COPY: {
  governanceTitle: string
  governanceHint: string
  statusLabels: Record<SubmissionStatusKey, string>
  statusHints: Record<SubmissionStatusKey, string>
  statusIcons: Record<SubmissionStatusKey, string>
} = {
  governanceTitle: 'Flujo unificado de decisiones para estudiante, docente y administracion.',
  governanceHint: 'Todos los estados usan etiquetas canonicas centralizadas en src/i18n/es.ts.',
  statusLabels: {
    pending: 'Pendiente de validacion docente',
    validated: 'Validada por docente',
    rejected_by_teacher: 'Rechazada por docente',
    approved: 'Aprobada por administracion escolar',
    rejected_by_admin: 'Rechazada por administracion escolar',
  },
  statusHints: {
    pending: 'Esperando revision inicial del docente asignado.',
    validated: 'Lista para decision final de administracion escolar.',
    rejected_by_teacher: 'La evidencia fue rechazada por docente con comentario.',
    approved: 'Aprobada: listo para acreditar Credit en la cuenta del estudiante.',
    rejected_by_admin: 'Rechazada en control final de administracion escolar.',
  },
  statusIcons: {
    pending: '⏳',
    validated: '✅',
    rejected_by_teacher: '⚠️',
    approved: '🎉',
    rejected_by_admin: '⛔',
  },
}

export const TASK_STATUS_LABELS: Record<TaskStatusKey, string> = {
  active: 'Activa',
  closed: 'Cerrada',
}

export const INSTITUTION_STATUS_LABELS: Record<InstitutionStatusKey, string> = {
  draft: 'Borrador',
  active: 'Activa',
  inactive: 'Inactiva',
}

export const FUNDING_PROGRAM_STATUS_LABELS: Record<FundingProgramStatusKey, string> = {
  draft: 'Borrador',
  active: 'Activo',
  completed: 'Completado',
}

export const FUNDING_PROGRAM_ALLOCATION_LABELS: Record<FundingProgramAllocationKey, string> = {
  equal: 'Reparto igualitario',
  manual: 'Reparto manual',
}

export type BudgetAllocationStatusKey = 'active' | 'suspended' | 'closed'

export const BUDGET_ALLOCATION_STATUS_LABELS: Record<BudgetAllocationStatusKey, string> = {
  active: 'Activa',
  suspended: 'Suspendida',
  closed: 'Cerrada',
}

const API_ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Credenciales invalidas.',
  VALIDATION_ERROR: 'Revisa los campos y vuelve a intentar.',
  INSTITUTION_CODE_TAKEN: 'Ese codigo de institucion ya existe.',
  NGO_INSTITUTION_CODE_TAKEN: 'Ese codigo de ONG ya existe.',
  NGO_SCOPE_REQUIRED: 'Tu usuario no esta asignado a una ONG.',
  NGO_INSTITUTION_INACTIVE: 'La ONG no esta activa.',
  INVALID_DATE_RANGE: 'La fecha de fin debe ser posterior o igual a la de inicio.',
  FUNDING_PROGRAM_NOT_FOUND: 'Programa de financiamiento no encontrado.',
  BUDGET_EXCEEDS_PROGRAM_TOTAL: 'El total asignado supera el presupuesto del programa.',
  ALLOCATION_ALREADY_EXISTS: 'Una o más escuelas ya tienen asignación en este programa.',
  FUNDING_PROGRAM_COMPLETED: 'Los programas completados no admiten cambios.',
  ALLOCATED_BELOW_UTILIZED: 'El presupuesto asignado no puede ser menor al utilizado.',
  BUDGET_ALLOCATION_NOT_FOUND: 'Asignación de presupuesto no encontrada.',
  BUDGET_ALLOCATION_CLOSED: 'Las asignaciones cerradas no pueden editarse.',
  NO_ALLOCATIONS: 'Debes asignar al menos una escuela antes de activar el programa.',
  INCOMPLETE_ALLOCATION: 'Debes asignar todo el presupuesto del programa antes de activarlo.',
  FUNDING_PROGRAM_STATUS_LOCKED: 'Un programa activo no puede volver a borrador.',
  INSUFFICIENT_FUNDING_BALANCE:
    'No hay presupuesto ONG disponible para otorgar esta recompensa.',
  INVALID_ALLOCATION_PAYLOAD: 'Revisa los datos de asignación enviados.',
  DUPLICATE_INSTITUTION: 'Cada escuela solo puede asignarse una vez por programa.',
  INSTITUTION_NOT_FOUND: 'La institucion no existe.',
  INSTITUTION_INACTIVE: 'La institucion no esta activa.',
  TENANT_SCOPE_VIOLATION: 'No tienes permiso para acceder a ese recurso.',
  DUPLICATE_SUBMISSION: 'Ya existe un envio para esa tarea.',
  REJECTION_REASON_REQUIRED: 'Debes indicar una razon de rechazo.',
  TRANSITION_NOT_ALLOWED: 'La accion no es valida para el estado actual.',
  AUTHENTICATION_REQUIRED: 'Tu sesion no es valida. Inicia sesion de nuevo.',
  EMAIL_TAKEN: 'Ese correo ya esta registrado.',
}

export function getApiErrorEsMessage(code?: string | null): string | null {
  if (!code) return null
  return API_ERROR_CODE_MESSAGES[code] ?? null
}
