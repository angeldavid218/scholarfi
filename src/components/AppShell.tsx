import { useState } from 'react'
import type { IconType } from 'react-icons'
import {
  HiAcademicCap,
  HiArrowRightOnRectangle,
  HiBars3,
  HiBuildingOffice2,
  HiClipboardDocumentCheck,
  HiClipboardDocumentList,
  HiDocumentText,
  HiGlobeAlt,
  HiInboxStack,
  HiQueueList,
} from 'react-icons/hi2'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ScholarFiWordmark } from './BrandLogos'

function sidebarItemClass(isActive: boolean) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
    isActive
      ? 'bg-primary/12 font-semibold text-primary'
      : 'text-base-content/80 hover:bg-base-200',
  ].join(' ')
}

type NavItem = { to: string; label: string; end?: boolean; Icon: IconType }

const tokenModeLabel = (import.meta.env.VITE_TOKEN_MODE_LABEL as string | undefined)?.trim() ?? ''

export function AppShell() {
  const { profile, logout } = useAuth()
  const roles = profile?.roles ?? []
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const showInternalModeBadge =
    tokenModeLabel.length > 0 && !roles.includes('student')

  // const principalItems: NavItem[] = [{ to: '/', label: 'Inicio', end: true, Icon: HiHome }]

  const panelItems: NavItem[] = [
    ...(roles.includes('student')
      ? ([
        { to: '/student', end: true, label: 'Resumen', Icon: HiAcademicCap },
        { to: '/student/tareas', label: 'Tareas disponibles', Icon: HiClipboardDocumentList },
        { to: '/student/envios', label: 'Mis envios', Icon: HiQueueList },
      ] as NavItem[])
      : []),
    ...(roles.includes('teacher')
      ? ([
        { to: '/teacher', end: true, label: 'Docente', Icon: HiClipboardDocumentList },
        { to: '/teacher/cola-validacion', label: 'Cola de validacion', Icon: HiInboxStack },
      ] as NavItem[])
      : []),
    ...(roles.includes('school_admin')
      ? ([
        { to: '/admin', end: true, label: 'Admin escolar', Icon: HiBuildingOffice2 },
        { to: '/admin/cola-aprobacion', label: 'Cola de aprobacion', Icon: HiClipboardDocumentCheck },
      ] as NavItem[])
      : []),
    ...(roles.includes('ngo_admin')
      ? ([
        { to: '/ngo', end: true, label: 'Dashboard ONG', Icon: HiGlobeAlt },
      ] as NavItem[])
      : []),
    ...(roles.includes('super_admin') ? [{ to: '/super', label: 'Super admin', Icon: HiGlobeAlt } as NavItem] : []),
  ]

  // const resourceItems: NavItem[] = [{ to: '/demo', label: 'Demo UI', Icon: HiRectangleGroup }]

  const schoolAdminBitacoraItems: NavItem[] = roles.includes('school_admin')
    ? [
      {
        to: '/admin/bitacora-aprobacion',
        label: 'Bitácora de aprobación',
        Icon: HiDocumentText,
      },
    ]
    : []

  function renderNavLink(item: NavItem) {
    const Icon = item.Icon
    return (
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => sidebarItemClass(isActive)}
        onClick={() => setMobileNavOpen(false)}
      >
        <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
        {item.label}
      </NavLink>
    )
  }

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
            <NavLink
              to="/"
              className="btn btn-ghost h-auto min-w-0 shrink-0 px-2 py-1.5"
            >
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
            <span className="hidden max-w-[10rem] truncate text-sm text-base-content/70 sm:inline">
              {profile?.fullName ?? '…'}
            </span>
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
            <button
              type="button"
              className="btn btn-outline btn-primary btn-sm gap-1"
              onClick={() => void logout()}
            >
              <HiArrowRightOnRectangle className="h-4 w-4 shrink-0" aria-hidden />
              Salir
            </button>
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

        <aside
          id="app-sidebar"
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-base-300 bg-base-100 pt-4 shadow-lg transition-transform duration-200 ease-out lg:static lg:z-0 lg:max-w-none lg:shadow-none',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
            <div className="border-b border-base-200 pb-4">
              <NavLink
                to="/"
                end
                onClick={() => setMobileNavOpen(false)}
                className="flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-base-content transition-colors hover:bg-base-200/80"
              >
                <span className="badge badge-primary badge-sm shrink-0 border-none">SF</span>
                <span className="truncate">ScholarFi</span>
              </NavLink>
            </div>
            {/*        <nav aria-label="Resumen">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Resumen
              </p>
              <ul className="space-y-0.5">
                {principalItems.map((item) => (
                  <li key={item.to}>{renderNavLink(item)}</li>
                ))}
              </ul>
            </nav> */}

            {panelItems.length > 0 ? (
              <nav aria-label="Paneles">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Paneles
                </p>
                <ul className="space-y-0.5">
                  {panelItems.map((item) => (
                    <li key={item.to}>{renderNavLink(item)}</li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {schoolAdminBitacoraItems.length > 0 ? (
              <nav aria-label="Bitácora de aprobación">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Bitácora de aprobación
                </p>
                <ul className="space-y-0.5">
                  {schoolAdminBitacoraItems.map((item) => (
                    <li key={item.to}>{renderNavLink(item)}</li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {/*      <nav aria-label="Recursos">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Recursos
              </p>
              <ul className="space-y-0.5">
                {resourceItems.map((item) => (
                  <li key={item.to}>{renderNavLink(item)}</li>
                ))}
              </ul>
            </nav> */}
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-auto px-4 py-6 text-left lg:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
