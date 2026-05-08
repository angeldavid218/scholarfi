import { useId } from 'react'

type MarkProps = {
  className?: string
}

/** Solana logomark (gradient bars). */
export function SolanaMark({ className = 'h-6 w-6' }: MarkProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `solana-grad-${rawId}`

  return (
    <svg
      className={className}
      viewBox="0 0 397.7 311.7"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M64.9 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.7c-5.8 0-8.7-7-4.6-11.1l62.8-62.7z"
      />
      <path
        fill={`url(#${gradId})`}
        d="M64.9 3.8C67.3 1.4 70.6 0 74.1 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.7c-5.8 0-8.7-7-4.6-11.1L64.9 3.8z"
      />
      <path
        fill={`url(#${gradId})`}
        d="M333.2 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.7c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.8-62.7z"
      />
    </svg>
  )
}

/** Primary ScholarFi wordmark from `public/scholarfi-logo-1.png`. */
export function ScholarFiWordmark({ className = 'h-8 w-auto' }: MarkProps) {
  return <img src="/scholarfi-logo-1.png" alt="ScholarFi" className={className} />
}

/** Secondary / alternate mark from `public/scholardi-logo.png`. */
export function ScholarDiWordmark({ className = 'h-6 w-auto' }: MarkProps) {
  return <img src="/scholardi-logo.png" alt="ScholarDi" className={className} />
}
