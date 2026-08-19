import { useState, type FormEvent } from 'react'
import type { IconType } from 'react-icons'
import {
  HiAcademicCap,
  HiArrowRightOnRectangle,
  HiBars3,
  HiBanknotes,
  HiBuildingOffice2,
  HiChevronDown,
  HiClipboardDocumentCheck,
  HiClipboardDocumentList,
  HiDocumentText,
  HiGift,
  HiGlobeAlt,
  HiKey,
  HiLink,
  HiTrophy,
  HiUserGroup,
} from 'react-icons/hi2'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError, getApiErrorMessage } from '../api/client'
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
  const { profile, logout, changePassword } = useAuth()
  const roles = profile?.roles ?? []
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const showInternalModeBadge =
    tokenModeLabel.length > 0 && !roles.includes('student')

  const panelItems: NavItem[] = [
    ...(roles.includes('student')
      ? ([
          { to: '/student', end: true, label: 'Resumen', Icon: HiAcademicCap },
          { to: '/student/ranking', label: 'Ranking', Icon: HiTrophy },
        ] as NavItem[])
      : []),
    ...(roles.includes('teacher')
      ? ([
          { to: '/teacher', end: true, label: 'Docente', Icon: HiClipboardDocumentList },
          { to: '/teacher/clases', label: 'Mis clases', Icon: HiUserGroup },
          { to: '/teacher/integraciones', label: 'Google Classroom', Icon: HiLink },
        ] as NavItem[])
      : []),
    ...(roles.includes('school_admin')
      ? ([
          { to: '/admin', end: true, label: 'Admin escolar', Icon: HiBuildingOffice2 },
          { to: '/admin/presupuesto-docentes', label: 'Presupuesto docentes', Icon: HiBanknotes },
          { to: '/admin/recompensas-internas', label: 'Recompensas internas', Icon: HiGift },
          { to: '/admin/cola-aprobacion', label: 'Cola de aprobacion', Icon: HiClipboardDocumentCheck },
          { to: '/admin/diploma', label: 'Reconocimiento académico', Icon: HiAcademicCap },
        ] as NavItem[])
      : []),
    ...(roles.includes('ngo_admin')
      ? ([
          { to: '/ngo', end: true, label: 'Dashboard ONG', Icon: HiGlobeAlt },
        ] as NavItem[])
      : []),
    ...(roles.includes('super_admin')
      ? [{ to: '/super', label: 'Super admin', Icon: HiGlobeAlt } as NavItem]
      : []),
  ]

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

  function openPasswordModal() {
    setPasswordError(null)
    setPasswordSuccess(null)
    setCurrentPassword('')
    setNewPassword('')
    setPasswordConfirmation('')
    setPasswordModalOpen(true)
  }

  function closePasswordModal() {
    if (passwordSubmitting) return
    setPasswordModalOpen(false)
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword !== passwordConfirmation) {
      setPasswordError('La confirmacion no coincide')
      return
    }
    setPasswordSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword, passwordConfirmation)
      setPasswordSuccess('Contrasena actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cambiar la contrasena'
      )
    } finally {
      setPasswordSubmitting(false)
    }
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
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-sm gap-1.5"
                aria-haspopup="menu"
              >
                <span className="max-w-[9rem] truncate sm:max-w-[12rem]">
                  {profile?.fullName ?? '…'}
                </span>
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
                  <button type="button" role="menuitem" onClick={openPasswordModal}>
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
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-auto px-4 py-6 text-left lg:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {passwordModalOpen ? (
        <dialog className="modal modal-open" aria-labelledby="change-password-title">
          <div className="modal-box">
            <h3 id="change-password-title" className="text-lg font-semibold">
              Cambiar contraseña
            </h3>
            <p className="mt-1 text-sm text-base-content/70">
              Usa tu contraseña actual y elige una nueva de al menos 8 caracteres.
            </p>

            {passwordError ? (
              <div role="alert" className="alert alert-error mt-4 text-sm">
                {passwordError}
              </div>
            ) : null}
            {passwordSuccess ? (
              <div role="status" className="alert alert-success mt-4 text-sm">
                {passwordSuccess}
              </div>
            ) : null}

            <form className="mt-4 flex flex-col gap-3" onSubmit={(e) => void onChangePassword(e)}>
              <label className="form-control w-full">
                <span className="label-text mb-1">Contraseña actual</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input input-bordered w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Nueva contraseña</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  maxLength={32}
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Confirmar contraseña</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input input-bordered w-full"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  minLength={8}
                  maxLength={32}
                  required
                />
              </label>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closePasswordModal}
                  disabled={passwordSubmitting}
                >
                  Cerrar
                </button>
                <button type="submit" className="btn btn-primary" disabled={passwordSubmitting}>
                  {passwordSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" aria-hidden />
                      Guardando…
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-base-content/40"
            aria-label="Cerrar"
            onClick={closePasswordModal}
          />
        </dialog>
      ) : null}
    </div>
  )
}
