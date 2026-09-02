export type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'ghost'

export const submissionStatusTone = (status: string): StatusTone => {
  if (status === 'approved') return 'success'
  if (status === 'rejected_by_teacher' || status === 'rejected_by_admin') return 'error'
  if (status === 'validated') return 'info'
  if (status === 'pending') return 'warning'
  return 'ghost'
}

export const taskStatusTone = (status: string): StatusTone => {
  if (status === 'active') return 'success'
  if (status === 'closed') return 'neutral'
  return 'ghost'
}

export const redemptionStatusTone = (status: string): StatusTone => {
  if (status === 'pending') return 'warning'
  if (status === 'completed') return 'success'
  if (status === 'rejected' || status === 'failed') return 'error'
  return 'ghost'
}
