import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ScholarfiRoleContext, type ScholarfiRole } from './scholarfiRoleContext.ts'

const STORAGE_KEY = 'scholarfi_role'

function readStoredRole(): ScholarfiRole | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'student' || raw === 'teacher') return raw
  } catch {
    /* ignore */
  }
  return null
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<ScholarfiRole | null>(() =>
    typeof window === 'undefined' ? null : readStoredRole(),
  )

  const setRole = useCallback((next: ScholarfiRole | null) => {
    setRoleState(next)
    try {
      if (next === null) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setRoleState(readStoredRole())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ role, setRole }), [role, setRole])

  return (
    <ScholarfiRoleContext.Provider value={value}>
      {children}
    </ScholarfiRoleContext.Provider>
  )
}
