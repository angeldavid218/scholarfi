import { useEffect, useState } from 'react'
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiBuildingOffice2,
  HiChevronDown,
  HiKey,
} from 'react-icons/hi2'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { loadDemoConfig } from '../demo/demoConfig'
import { AppSidebar } from './app-shell/AppSidebar'
import { ChangePasswordModal } from './app-shell/ChangePasswordModal'
import { ScholarFiWordmark } from './BrandLogos'
import { FeatureErrorBoundary } from './ui/FeatureErrorBoundary'

const tokenModeLabel = (import.meta.env.VITE_TOKEN_MODE_LABEL as string | undefined)?.trim() ?? ''

export const AppShell = () => {
  const { profile, logout } = useAuth()
  const roles = profile?.roles ?? []
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [classroomDemoNav, setClassroomDemoNav] = useState(false)
  const showInternalModeBadge = tokenModeLabel.length > 0 && !roles.includes('student')

  useEffect(() => {
    let cancelled = false
    void loadDemoConfig().then((config) => {
      if (!cancelled) setClassroomDemoNav(config.enabled === true && config.classroomMock)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col sf-present">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="btn btn-square btn-ghost btn-sm lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="app-sidebar"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <HiBars3 className="h-5 w-5" aria-hidden />
              <span className="sr-only">Abrir menu</span>
            </button>
            <NavLink to="/" className="btn btn-ghost h-auto min-w-0 shrink-0 px-2 py-1.5">
              <ScholarFiWordmark className="h-7 w-auto max-w-[9.5rem] object-left object-contain sm:h-8" />
              <span className="sr-only">ScholarFi — inicio</span>
            </NavLink>
            {profile?.institutionName ? (
              <div
                className="ml-0.5 flex min-w-0 max-w-[min(48vw,12rem)] items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.09] py-1 pl-2 pr-2 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-primary)_18%,transparent)] sm:max-w-[14rem] md:max-w-[18rem]"
                title={profile.institutionName}
              >
                <HiBuildingOffice2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 leading-tight">
                  <p className="text-[0.65rem] font-bold uppercase leading-none tracking-wide text-primary/80">
                    Institución
                  </p>
                  <p className="truncate text-sm font-semibold text-primary">{profile.institutionName}</p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {roles.length > 0 ? (
              <span className="badge badge-outline badge-sm hidden md:inline-flex">
                {roles[0].replace('_', ' ')}
              </span>
            ) : null}
            {showInternalModeBadge ? (
              <span
                className="badge badge-ghost badge-sm hidden md:inline-flex max-w-[10rem] truncate"
                title="Modo de ejecucion (solo equipo interno)"
              >
                {tokenModeLabel}
              </span>
            ) : null}
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost btn-sm gap-1.5" aria-haspopup="menu">
                <span className="max-w-[9rem] truncate sm:max-w-[12rem]">{profile?.fullName ?? '…'}</span>
                <HiChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                role="menu"
              >
                {profile?.email ? (
                  <li className="menu-title px-3 py-1">
                    <span className="truncate text-xs font-normal normal-case text-base-content/60">
                      {profile.email}
                    </span>
                  </li>
                ) : null}
                <li role="none">
                  <button type="button" role="menuitem" onClick={() => setPasswordModalOpen(true)}>
                    <HiKey className="h-4 w-4" aria-hidden />
                    Cambiar contraseña
                  </button>
                </li>
                <li role="none">
                  <button type="button" role="menuitem" onClick={() => void logout()}>
                    <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                    Salir
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-base-content/20 backdrop-blur-[1px] lg:hidden"
            aria-label="Cerrar menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <AppSidebar
          roles={roles}
          classroomDemoNav={classroomDemoNav}
          mobileNavOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-x-auto px-4 py-6 text-left lg:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <FeatureErrorBoundary>
              <Outlet />
            </FeatureErrorBoundary>
          </div>
        </main>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  )
}
