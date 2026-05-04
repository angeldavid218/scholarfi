type MarkProps = {
  className?: string
}

/** Primary ScholarFi wordmark from `public/scholarfi-logo-1.png`. */
export function ScholarFiWordmark({ className = 'h-8 w-auto' }: MarkProps) {
  return <img src="/scholarfi-logo-1.png" alt="ScholarFi" className={className} />
}

/** Secondary / alternate mark from `public/scholardi-logo.png`. */
export function ScholarDiWordmark({ className = 'h-6 w-auto' }: MarkProps) {
  return <img src="/scholardi-logo.png" alt="ScholarDi" className={className} />
}
