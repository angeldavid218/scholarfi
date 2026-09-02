import { Component, type ErrorInfo, type ReactNode } from 'react'

interface FeatureErrorBoundaryProps {
  children: ReactNode
}

interface FeatureErrorBoundaryState {
  hasError: boolean
}

export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  state: FeatureErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): FeatureErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FeatureErrorBoundary', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-box border border-error/30 bg-error/10 p-6">
          <h2 className="text-lg font-semibold">No se pudo mostrar esta seccion</h2>
          <p className="mt-1 text-sm text-base-content/70">
            Recarga la pagina. Si el problema continua, vuelve a iniciar sesion.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
