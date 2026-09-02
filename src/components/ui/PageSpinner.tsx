interface PageSpinnerProps {
  label?: string
  fullscreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
} as const

export const PageSpinner = ({
  label = 'Cargando',
  fullscreen = false,
  size = 'md',
}: PageSpinnerProps) => {
  return (
    <div
      className={
        fullscreen
          ? 'flex min-h-svh items-center justify-center bg-base-200'
          : 'flex min-h-[40vh] items-center justify-center'
      }
    >
      <span
        className={`loading loading-spinner text-primary ${SIZE_CLASS[size]}`}
        aria-label={label}
      />
    </div>
  )
}
