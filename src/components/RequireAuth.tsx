import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RequireAuth() {
  const { token, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-3 text-base-content/70">
          <span className="loading loading-lg loading-spinner text-primary" aria-hidden />
          <p>Cargando sesion…</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
