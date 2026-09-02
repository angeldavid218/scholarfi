import type { ReactNode } from 'react'

export type AlertTone = 'error' | 'success' | 'info' | 'warning'

interface AlertBannerProps {
  tone: AlertTone
  children: ReactNode
  role?: 'alert' | 'status'
  className?: string
}

const TONE_CLASS: Record<AlertTone, string> = {
  error: 'alert-error',
  success: 'alert-success',
  info: 'alert-info',
  warning: 'alert-warning',
}

export const AlertBanner = ({
  tone,
  children,
  role,
  className,
}: AlertBannerProps) => {
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status')
  return (
    <div
      role={resolvedRole}
      className={`alert ${TONE_CLASS[tone]} text-sm ${className ?? ''}`.trim()}
    >
      {children}
    </div>
  )
}
