import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'

interface UseTokenResourceOptions<T> {
  load: (token: string) => Promise<T>
  deps?: unknown[]
  fallbackMessage?: string
}

interface UseTokenResourceResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: (showLoadingSpinner?: boolean) => Promise<void>
  setData: (next: T | ((prev: T | null) => T | null)) => void
  setError: (next: string | null) => void
}

export const useTokenResource = <T,>({
  load,
  deps = [],
  fallbackMessage = 'Error al cargar',
}: UseTokenResourceOptions<T>): UseTokenResourceResult<T> => {
  const { token } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  const depKey = JSON.stringify(deps)

  useEffect(() => {
    loadRef.current = load
  })

  const reload = useCallback(
    async (showLoadingSpinner = true) => {
      if (!token) return
      if (showLoadingSpinner) setLoading(true)
      setError(null)
      try {
        const result = await loadRef.current(token)
        setData(result)
      } catch (e) {
        setError(e instanceof ApiError ? getApiErrorMessage(e.body) : fallbackMessage)
      } finally {
        setLoading(false)
      }
    },
    [token, fallbackMessage]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on token/deps change
    void reload()
  }, [reload, depKey])

  return { data, loading, error, reload, setData, setError }
}
