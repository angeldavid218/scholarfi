import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function HomeRedirect() {
  const { profile, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  const roles = profile?.roles ?? []
  if (roles.includes('super_admin')) return <Navigate to="/super" replace />
  if (roles.includes('school_admin')) return <Navigate to="/admin" replace />
  if (roles.includes('teacher')) return <Navigate to="/teacher" replace />
  if (roles.includes('student')) return <Navigate to="/student" replace />

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Sin rol asignado</h2>
        <p className="text-base-content/80">
          Tu cuenta no tiene un rol usable en la aplicacion. Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
