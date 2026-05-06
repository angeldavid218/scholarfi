import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { HiMagnifyingGlass, HiUserGroup, HiUserPlus, HiUsers } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { TablePagination } from '../../components/ui/TablePagination'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

type HistorySummary = {
  transactionCount: number
  creditsTotal: number
}

type RosterRow = {
  id: number
  email: string
  fullName: string | null
  roles: string[]
}

function formatRolesEs(roles: string[]): string {
  const map: Record<string, string> = {
    student: 'Estudiante',
    teacher: 'Docente',
    school_admin: 'Admin escolar',
  }
  if (!roles.length) return '—'
  return roles.map((r) => map[r] ?? r.replace(/_/g, ' ')).join(', ')
}

export function AdminHome() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roster, setRoster] = useState<RosterRow[]>([])
  const [rosterMeta, setRosterMeta] = useState<PaginatedMeta | null>(null)
  const [rosterPage, setRosterPage] = useState(1)
  const [rosterPerPage, setRosterPerPage] = useState(10)
  const [tableBusy, setTableBusy] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const firstLoadDone = useRef(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')

  const [assignUserId, setAssignUserId] = useState('')
  const [assignRole, setAssignRole] = useState<'teacher' | 'student' | 'school_admin'>('teacher')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setRosterPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    firstLoadDone.current = false
    setRefreshNonce(0)
  }, [token])

  useEffect(() => {
    if (!token) {
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
          page: String(rosterPage),
          perPage: String(rosterPerPage),
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
  }, [token, rosterPage, rosterPerPage, debouncedSearch, refreshNonce])

  const bumpRoster = useCallback(() => setRefreshNonce((n) => n + 1), [])

  async function provisionUser(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      await api.post('/institutions/users', {
        json: {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        },
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

  async function assignRoleSubmit(e: FormEvent) {
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  const txCount = summary?.transactionCount ?? 0
  const creditsTotal = summary?.creditsTotal ?? 0

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel de administracion"
        title="Control institucional"
        subtitle="Supervisa decisiones finales, gestiona talento escolar y monitorea el flujo de Credit hacia las cuentas estudiantiles."
      />
      <KpiStrip
        items={[
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

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info text-sm">{msg}</div>}



      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard
          title="Alta de usuario"
          subtitle="Incorpora nuevos perfiles operativos dentro de tu institucion."
          titleIcon={<HiUserPlus aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={provisionUser}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre</span>
              </div>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Correo</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Contrasena</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Rol</span>
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                className="select select-bordered w-full"
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Reasignar rol"
          subtitle="Ajusta la responsabilidad operativa manteniendo control institucional."
          titleIcon={<HiUserGroup aria-hidden />}
        >
          <p className="text-sm text-base-content/70">Reemplaza los roles del usuario.</p>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={assignRoleSubmit}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID usuario</span>
              </div>
              <input
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Rol</span>
              </div>
              <select
                value={assignRole}
                onChange={(e) =>
                  setAssignRole(e.target.value as 'teacher' | 'student' | 'school_admin')
                }
                className="select select-bordered w-full"
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
                <option value="school_admin">Admin escolar</option>
              </select>
            </label>
            <button type="submit" className="btn btn-outline btn-primary w-fit">
              Guardar
            </button>
          </form>
        </SectionCard>
      </div>
      <SectionCard
        title="Usuarios de la institución"
        subtitle="Consulta ID, correo, nombre y rol para apoyar la reasignación de permisos."
        titleIcon={<HiUsers aria-hidden />}
      >
        <div className="relative mt-2 space-y-4">
          {tableBusy ? (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-base-100/65 pt-10">
              <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
            </div>
          ) : null}
          <label className="form-control w-full max-w-md">
            <div className="label pt-0">
              <span className="label-text flex items-center gap-2">
                <HiMagnifyingGlass className="h-4 w-4 opacity-70" aria-hidden />
                Buscar por nombre
              </span>
            </div>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ej. María García"
              className="input input-bordered input-sm w-full"
              autoComplete="off"
            />
          </label>

          {(rosterMeta?.total ?? 0) === 0 ? (
            <EmptyState
              title="Sin usuarios que coincidan."
              detail={
                debouncedSearch
                  ? 'Prueba con otro nombre o borra el filtro.'
                  : 'Aún no hay usuarios en esta institución.'
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Correo</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((u) => (
                      <tr key={u.id}>
                        <th className="tabular-nums">{formatId(u.id)}</th>
                        <td className="max-w-[14rem] truncate" title={u.email}>
                          {u.email}
                        </td>
                        <td className="max-w-[12rem] truncate" title={u.fullName ?? undefined}>
                          {u.fullName ?? '—'}
                        </td>
                        <td className="text-sm">{formatRolesEs(u.roles)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={rosterMeta?.currentPage ?? rosterPage}
                perPage={rosterMeta?.perPage ?? rosterPerPage}
                total={rosterMeta?.total ?? roster.length}
                onPageChange={(nextPage) => setRosterPage(nextPage)}
                onPerPageChange={(nextPerPage) => {
                  setRosterPerPage(nextPerPage)
                  setRosterPage(1)
                }}
              />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
