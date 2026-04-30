import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RoleGate({ allow }: { allow: string[] }) {
  const { profile } = useAuth()
  const ok = allow.some((r) => profile?.roles?.includes(r))
  if (!ok) return <Navigate to="/" replace />
  return <Outlet />
}
