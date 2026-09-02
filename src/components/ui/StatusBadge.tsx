import type { ReactNode } from 'react'
import type { StatusTone } from './statusTones'

interface StatusBadgeProps {
  tone: StatusTone
  children: ReactNode
  className?: string
}

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'badge-success',
  error: 'badge-error',
  warning: 'badge-warning',
  info: 'badge-info',
  neutral: 'badge-neutral',
  ghost: 'badge-ghost',
}

export const StatusBadge = ({ tone, children, className }: StatusBadgeProps) => {
  return (
    <span className={`badge badge-sm ${TONE_CLASS[tone]} ${className ?? ''}`.trim()}>{children}</span>
  )
}
