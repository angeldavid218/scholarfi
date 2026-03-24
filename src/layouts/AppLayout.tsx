import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { WalletCta } from '../components/WalletCta.tsx'
import type { ScholarfiRole } from '../context/scholarfiRoleContext.ts'
import { useScholarfiRole } from '../hooks/useScholarfiRole.ts'
import { truncateAddress } from '../utils/truncateAddress.ts'

function RoleRouteSync() {
  const { pathname } = useLocation()
  const { setRole } = useScholarfiRole()
  useEffect(() => {
    if (pathname.startsWith('/student')) setRole('student')
    else if (pathname.startsWith('/teacher')) setRole('teacher')
  }, [pathname, setRole])
  return null
}

export function AppLayout() {
  const { connected, publicKey } = useWallet()
  const { role, setRole } = useScholarfiRole()
  const navigate = useNavigate()

  const goRole = useCallback(
    (next: ScholarfiRole) => {
      setRole(next)
      navigate(next === 'student' ? '/student' : '/teacher')
    },
    [navigate, setRole],
  )

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `btn btn-ghost btn-sm normal-case ${isActive ? 'btn-active' : ''}`

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <RoleRouteSync />
      <header className="navbar sticky top-0 z-50 border-b border-base-content/10 bg-base-100/80 backdrop-blur-md">
        <div className="navbar-start gap-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 text-xl font-bold normal-case"
          >
            <img
              src="/sholarfi.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
              decoding="async"
            />
            <span>Scholarfi</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/student" className={linkClass}>
              Student
            </NavLink>
            <NavLink to="/teacher" className={linkClass}>
              Teacher
            </NavLink>
          </div>
        </div>
        <div className="navbar-center md:hidden">
          <div className="join">
            <button
              type="button"
              className={`btn join-item btn-xs ${role === 'student' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => goRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`btn join-item btn-xs ${role === 'teacher' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => goRole('teacher')}
            >
              Teacher
            </button>
          </div>
        </div>
        <div className="navbar-end flex-wrap gap-2">
          <div className="dropdown dropdown-end hidden md:block">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm gap-1 normal-case"
            >
              Role: {role ?? '—'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu z-50 mt-2 w-44 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
            >
              <li>
                <button type="button" onClick={() => goRole('student')}>
                  Student
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goRole('teacher')}>
                  Teacher
                </button>
              </li>
            </ul>
          </div>
          {connected && publicKey && (
            <span className="hidden max-w-40 truncate font-mono text-xs text-base-content/70 lg:inline" title={publicKey.toBase58()}>
              {truncateAddress(publicKey.toBase58(), 6, 4)}
            </span>
          )}
          <WalletCta size="sm" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="footer footer-center bg-base-300 p-10 text-base-content">
        <aside className="gap-2">
          <p className="font-medium">© {new Date().getFullYear()} Scholarfi</p>
          <p className="text-sm opacity-70">Built on Solana</p>
        </aside>
      </footer>
    </div>
  )
}
