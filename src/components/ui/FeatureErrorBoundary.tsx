import { type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

interface FeatureErrorBoundaryProps {
  children: ReactNode
  /** When this value changes, a caught error state is cleared (e.g. route pathname). */
  resetKey?: string
}

const FeatureErrorFallback = ({ resetErrorBoundary }: FallbackProps) => (
  <div role="alert" className="rounded-box border border-error/30 bg-error/10 p-6">
    <h2 className="text-lg font-semibold">No se pudo mostrar esta seccion</h2>
    <p className="mt-1 text-sm text-base-content/70">
      Recarga la pagina. Si el problema continua, vuelve a iniciar sesion.
    </p>
    <button type="button" className="btn btn-outline btn-sm mt-4" onClick={resetErrorBoundary}>
      Reintentar
    </button>
  </div>
)

export const FeatureErrorBoundary = ({ children, resetKey }: FeatureErrorBoundaryProps) => (
  <ErrorBoundary
    FallbackComponent={FeatureErrorFallback}
    resetKeys={resetKey !== undefined ? [resetKey] : undefined}
    onError={(error, info) => {
      console.error('FeatureErrorBoundary', error, info.componentStack)
    }}
  >
    {children}
  </ErrorBoundary>
)
