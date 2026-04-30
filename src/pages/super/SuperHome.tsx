import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { formatId } from '../../i18n/format'
import { INSTITUTION_STATUS_LABELS } from '../../i18n/es'

type InstitutionRow = {
  id: number
  name: string
  code: string
  status: 'draft' | 'active' | 'inactive'
}

export function SuperHome() {
  const { token } = useAuth()
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')

  const [statusId, setStatusId] = useState('')
  const [statusValue, setStatusValue] = useState<'active' | 'inactive'>('active')

  const [bootstrapInstId, setBootstrapInstId] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const loadInstitutions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const rows = await api.get<InstitutionRow[]>('/institutions', { token })
      setInstitutions(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al cargar instituciones')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  async function createInstitution(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      const data = await api.post<{ id: number; code: string }>('/institutions', {
        json: { name: instName.trim(), code: instCode.trim() },
        token,
      })
      setMsg(`Institucion creada: ID ${data.id}, codigo ${data.code} (estado draft).`)
      setInstName('')
      setInstCode('')
      await loadInstitutions()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function patchStatus(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const id = Number(statusId)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID invalido')
      return
    }
    try {
      await api.patch(`/institutions/${id}/status`, { json: { status: statusValue }, token })
      setMsg(`Institucion ${id} → ${statusValue}.`)
      await loadInstitutions()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function bootstrap(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const id = Number(bootstrapInstId)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID invalido')
      return
    }
    try {
      await api.post(`/institutions/${id}/bootstrap-school-admin`, {
        json: {
          fullName: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
        },
        token,
      })
      setMsg(`Admin escolar creado para institucion ${id}.`)
      setBootstrapInstId('')
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
      await loadInstitutions()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Super administrador</h1>
      {msg && <div className="alert alert-info text-sm">{msg}</div>}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="card-title text-lg">Instituciones</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => loadInstitutions()}>
              Actualizar
            </button>
          </div>
          {loading ? (
            <div className="flex min-h-16 items-center">
              <span className="loading loading-spinner loading-sm" aria-label="Cargando" />
            </div>
          ) : institutions.length === 0 ? (
            <p className="text-base-content/70">Sin instituciones.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Codigo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr key={institution.id}>
                      <th>{formatId(institution.id)}</th>
                      <td>{institution.name}</td>
                      <td>{institution.code}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {INSTITUTION_STATUS_LABELS[institution.status] ?? institution.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Crear institucion (draft)</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={createInstitution}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre</span>
              </div>
              <input
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Codigo unico</span>
              </div>
              <input
                value={instCode}
                onChange={(e) => setInstCode(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Activar / desactivar institucion</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={patchStatus}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID institucion</span>
              </div>
              <input
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Estado</span>
              </div>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as 'active' | 'inactive')}
                className="select select-bordered w-full"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </label>
            <button type="submit" className="btn btn-outline btn-primary w-fit">
              Guardar
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Bootstrap primer admin escolar</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={bootstrap}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID institucion</span>
              </div>
              <input
                value={bootstrapInstId}
                onChange={(e) => setBootstrapInstId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre completo</span>
              </div>
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Correo</span>
              </div>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
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
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={8}
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear admin
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
