import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, getApiErrorMessage } from '../api/client'
import { clearStoredToken, getStoredToken, setStoredToken } from './tokenStorage'

export type Profile = {
  id: number
  fullName: string
  email: string
  createdAt: string
  updatedAt: string
  initials: string | null
  institutionId: number | null
  roles: string[]
}

type AuthContextValue = {
  token: string | null
  profile: Profile | null
  bootstrapping: boolean
  loginError: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bootstrapping, setBootstrapping] = useState(() => !!getStoredToken())
  const [loginError, setLoginError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    const t = token ?? getStoredToken()
    if (!t) {
      setProfile(null)
      return
    }
    const data = await api.get<Profile>('/account/profile', { token: t })
    setProfile(data)
  }, [token])

  useEffect(() => {
    if (!token) {
      setProfile(null)
      setBootstrapping(false)
      return
    }

    let cancelled = false
    setBootstrapping(true)
    ;(async () => {
      try {
        const data = await api.get<Profile>('/account/profile', { token })
        if (!cancelled) setProfile(data)
      } catch {
        if (!cancelled) {
          clearStoredToken()
          setToken(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null)
    try {
      const data = await api.post<{ token: string }>('/auth/login', {
        json: { email, password },
      })
      setStoredToken(data.token)
      setToken(data.token)
    } catch (e) {
      if (e instanceof ApiError) {
        setLoginError(getApiErrorMessage(e.body))
      } else {
        setLoginError('No se pudo iniciar sesion')
      }
      throw e
    }
  }, [])

  const logout = useCallback(async () => {
    const t = token ?? getStoredToken()
    try {
      if (t) await api.post('/auth/logout', { token: t })
    } catch {
      /* still clear local session */
    } finally {
      clearStoredToken()
      setToken(null)
      setProfile(null)
    }
  }, [token])

  const value = useMemo(
    () => ({
      token,
      profile,
      bootstrapping,
      loginError,
      login,
      logout,
      refreshProfile,
    }),
    [token, profile, bootstrapping, loginError, login, logout, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
