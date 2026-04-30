import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function navClass(isActive: boolean) {
  return [
    'btn btn-ghost btn-sm',
    isActive ? 'bg-primary/15 text-primary font-semibold' : 'text-base-content/80',
  ].join(' ')
}

export function AppShell() {
  const { profile, logout } = useAuth()
  const roles = profile?.roles ?? []

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-base-300 bg-base-100 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <NavLink
            to="/"
            className="btn btn-ghost shrink-0 px-2 text-base font-semibold text-primary sm:text-lg"
          >
            ScholarFi
          </NavLink>
          <nav className="order-last flex w-full flex-wrap items-center justify-center gap-1 lg:order-none lg:flex-1 lg:justify-center" aria-label="Principal">
            {roles.includes('student') && (
              <NavLink to="/student" className={({ isActive }) => navClass(isActive)}>
                Estudiante
              </NavLink>
            )}
            {roles.includes('teacher') && (
              <NavLink to="/teacher" className={({ isActive }) => navClass(isActive)}>
                Docente
              </NavLink>
            )}
            {roles.includes('school_admin') && (
              <NavLink to="/admin" className={({ isActive }) => navClass(isActive)}>
                Admin escolar
              </NavLink>
            )}
            {roles.includes('super_admin') && (
              <NavLink to="/super" className={({ isActive }) => navClass(isActive)}>
                Super admin
              </NavLink>
            )}
            <NavLink to="/demo" className={({ isActive }) => navClass(isActive)}>
              Demo UI
            </NavLink>
            <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
              Inicio
            </NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-[10rem] truncate text-sm text-base-content/70 sm:inline">
              {profile?.fullName ?? '…'}
            </span>
            <button type="button" className="btn btn-outline btn-primary btn-sm" onClick={() => void logout()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 text-left">
        <Outlet />
      </main>
    </div>
  )
}
