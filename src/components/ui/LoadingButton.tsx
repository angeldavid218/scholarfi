import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingLabel?: ReactNode
  children: ReactNode
}

export const LoadingButton = ({
  loading = false,
  loadingLabel,
  children,
  disabled,
  className,
  type = 'button',
  ...rest
}: LoadingButtonProps) => {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm" aria-hidden />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
