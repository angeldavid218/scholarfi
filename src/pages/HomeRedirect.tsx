import { HiExclamationTriangle } from 'react-icons/hi2'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageSpinner } from '../components/ui/PageSpinner'

export const HomeRedirect = () => {
  const { profile, bootstrapping } = useAuth()

  if (bootstrapping) return <PageSpinner />

  const roles = profile?.roles ?? []
  if (roles.includes('super_admin')) return <Navigate to="/super" replace />
  if (roles.includes('ngo_admin')) return <Navigate to="/ngo" replace />
  if (roles.includes('school_admin')) return <Navigate to="/admin" replace />
  if (roles.includes('teacher')) return <Navigate to="/teacher" replace />
  if (roles.includes('student')) return <Navigate to="/student" replace />

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <HiExclamationTriangle className="h-6 w-6 text-warning" aria-hidden />
          Sin rol asignado
        </h2>
        <p className="text-base-content/80">
          Tu cuenta no tiene un rol usable en la aplicacion. Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
