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

const API_ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Credenciales invalidas.',
  VALIDATION_ERROR: 'Revisa los campos y vuelve a intentar.',
  INSTITUTION_CODE_TAKEN: 'Ese codigo de institucion ya existe.',
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
