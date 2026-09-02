import { NavLink } from 'react-router-dom'
import { buildBitacoraNavItems, buildPanelNavItems, type NavItem } from './navItems'

interface AppSidebarProps {
  roles: string[]
  classroomDemoNav: boolean
  mobileNavOpen: boolean
  onNavigate: () => void
}

const sidebarItemClass = (isActive: boolean) => {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
    isActive
      ? 'bg-primary/12 font-semibold text-primary'
      : 'text-base-content/80 hover:bg-base-200',
  ].join(' ')
}

const NavItemLink = ({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) => {
  const Icon = item.Icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => sidebarItemClass(isActive)}
      onClick={onNavigate}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
      {item.label}
    </NavLink>
  )
}

export const AppSidebar = ({
  roles,
  classroomDemoNav,
  mobileNavOpen,
  onNavigate,
}: AppSidebarProps) => {
  const panelItems = buildPanelNavItems(roles, classroomDemoNav)
  const bitacoraItems = buildBitacoraNavItems(roles)

  return (
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
            onClick={onNavigate}
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
                <li key={item.to}>
                  <NavItemLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {bitacoraItems.length > 0 ? (
          <nav aria-label="Bitácora de aprobación">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Bitácora de aprobación
            </p>
            <ul className="space-y-0.5">
              {bitacoraItems.map((item) => (
                <li key={item.to}>
                  <NavItemLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </aside>
  )
}
