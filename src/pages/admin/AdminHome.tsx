import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { AdminRosterTable, type RosterRow } from '../../components/admin/AdminRosterTable'
import { AdminAssignRoleForm, AdminCreateUserForm } from '../../components/admin/AdminUserForms'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero, KpiStrip } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { usePagination } from '../../hooks/usePagination'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

interface HistorySummary {
  transactionCount: number
  creditsTotal: number
  creditPool?: {
    institutionId: number
    allocatedCredits: number
    utilizedCredits: number
    remainingCredits: number
  } | null
}

export const AdminHome = () => {
  const { token } = useAuth()
  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roster, setRoster] = useState<RosterRow[]>([])
  const [rosterMeta, setRosterMeta] = useState<PaginatedMeta | null>(null)
  const { page, perPage, setPage, onPageChange, onPerPageChange } = usePagination()
  const [tableBusy, setTableBusy] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const firstLoadDone = useRef(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student' | 'school_admin'>('student')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignRole, setAssignRole] = useState<'teacher' | 'student' | 'school_admin'>('teacher')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, setPage])

  useEffect(() => {
    firstLoadDone.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRefreshNonce(0)
  }, [token])

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      setSummary(null)
      setRoster([])
      setRosterMeta(null)
      return
    }
    let cancelled = false
    const run = async () => {
      const showFullSpinner = !firstLoadDone.current
      if (showFullSpinner) setLoading(true)
      else setTableBusy(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: String(page),
          perPage: String(perPage),
        })
        if (debouncedSearch) params.set('search', debouncedSearch)
        const [s, r] = await Promise.all([
          api.get<HistorySummary>('/rewards/history/summary', { token }),
          api.get<PaginatedPayload<RosterRow>>(`/institutions/users?${params}`, { token }),
        ])
        if (cancelled) return
        setSummary(s)
        setRoster(r.items)
        setRosterMeta(r.meta)
        firstLoadDone.current = true
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setTableBusy(false)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token, page, perPage, debouncedSearch, refreshNonce])

  const bumpRoster = useCallback(() => setRefreshNonce((n) => n + 1), [])

  const provisionUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      await api.post('/institutions/users', {
        json: { fullName: fullName.trim(), email: email.trim(), password, role },
        token,
      })
      setMsg('Usuario creado.')
      setFullName('')
      setEmail('')
      setPassword('')
      bumpRoster()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  const assignRoleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const uid = Number(assignUserId)
    if (!Number.isInteger(uid) || uid <= 0) {
      setMsg('ID de usuario invalido')
      return
    }
    try {
      await api.patch(`/institutions/users/${uid}/role`, { json: { role: assignRole }, token })
      setMsg(`Rol actualizado para usuario ${uid}.`)
      bumpRoster()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  if (loading) return <PageSpinner />

  const txCount = summary?.transactionCount ?? 0
  const creditsTotal = summary?.creditsTotal ?? 0
  const poolRemaining = summary?.creditPool?.remainingCredits ?? 0
  const poolAllocated = summary?.creditPool?.allocatedCredits ?? 0

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel de administracion"
        title="Control institucional"
        subtitle="Supervisa decisiones finales, gestiona talento escolar y monitorea el flujo de Credit hacia las cuentas estudiantiles."
      />
      <KpiStrip
        items={[
          {
            label: 'Presupuesto disponible',
            value: formatCreditsWithUnit(poolRemaining),
            hint: `De ${formatCreditsWithUnit(poolAllocated)} asignados por ScholarFi`,
          },
          { label: 'Cola aprobacion', value: 'Ver modulo', hint: 'Seccion dedicada en sidebar' },
          {
            label: 'Movimientos',
            value: formatId(txCount),
            hint: 'Transacciones en la bitácora de aprobación',
          },
          {
            label: 'Créditos acumulados',
            value: formatCreditsWithUnit(creditsTotal),
            hint: 'Total de Credit publicado en la institución',
          },
        ]}
      />
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {msg ? <AlertBanner tone="info">{msg}</AlertBanner> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AdminCreateUserForm
          fullName={fullName}
          email={email}
          password={password}
          role={role}
          onFullNameChange={setFullName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRoleChange={setRole}
          onSubmit={(e) => void provisionUser(e)}
        />
        <AdminAssignRoleForm
          userId={assignUserId}
          role={assignRole}
          onUserIdChange={setAssignUserId}
          onRoleChange={setAssignRole}
          onSubmit={(e) => void assignRoleSubmit(e)}
        />
      </div>
      <AdminRosterTable
        roster={roster}
        rosterMeta={rosterMeta}
        page={page}
        perPage={perPage}
        searchInput={searchInput}
        debouncedSearch={debouncedSearch}
        tableBusy={tableBusy}
        onSearchChange={setSearchInput}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  )
}
