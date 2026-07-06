import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  HiArrowPath,
  HiBuildingOffice2,
  HiPlusCircle,
  HiPower,
  HiUserPlus,
  HiGlobeAlt,
} from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import { INSTITUTION_CRYPTO_WALLETS_LABELS, INSTITUTION_STATUS_LABELS } from '../../i18n/es'

type InstitutionRow = {
  id: number
  name: string
  code: string
  status: 'draft' | 'active' | 'inactive'
  cryptoWalletsEnabled: boolean
}

type InstitutionCreditPool = {
  institutionId: number
  allocatedCredits: number
  utilizedCredits: number
  remainingCredits: number
}

type NgoRow = {
  id: number
  name: string
  code: string
  status: boolean
}

export function SuperHome() {
  const { token } = useAuth()
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([])
  const [ngos, setNgos] = useState<NgoRow[]>([])
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

  // NGO states
  const [ngoName, setNgoName] = useState('')
  const [ngoCode, setNgoCode] = useState('')

  // NGO Admin Bootstrap states
  const [bootstrapNgoId, setBootstrapNgoId] = useState('')
  const [ngoAdminName, setNgoAdminName] = useState('')
  const [ngoAdminEmail, setNgoAdminEmail] = useState('')
  const [ngoAdminPassword, setNgoAdminPassword] = useState('')

  // NGO Admin Assign states
  const [assignNgoUserId, setAssignNgoUserId] = useState('')
  const [assignNgoId, setAssignNgoId] = useState('')

  const [allocateInstId, setAllocateInstId] = useState('')
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocateNotes, setAllocateNotes] = useState('')
  const [poolPreview, setPoolPreview] = useState<InstitutionCreditPool | null>(null)

  const loadAllData = useCallback(async (showLoadingSpinner = false) => {
    if (!token) return
    if (showLoadingSpinner) {
      setLoading(true)
    }
    try {
      const [insts, orgs] = await Promise.all([
        api.get<InstitutionRow[]>('/institutions', { token }),
        api.get<NgoRow[]>('/ngo-institutions', { token }),
      ])
      setInstitutions(Array.isArray(insts) ? insts : [])
      setNgos(Array.isArray(orgs) ? orgs : [])
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData()
  }, [loadAllData])

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
      await loadAllData()
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
      await loadAllData()
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
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function createNgo(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      const data = await api.post<{ id: number; code: string }>('/ngo-institutions', {
        json: { name: ngoName.trim(), code: ngoCode.trim(), status: true },
        token,
      })
      setMsg(`ONG creada: ID ${data.id}, codigo ${data.code}.`)
      setNgoName('')
      setNgoCode('')
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function patchNgoStatus(id: number, currentStatus: boolean) {
    if (!token) return
    setMsg(null)
    try {
      await api.patch(`/ngo-institutions/${id}/status`, {
        json: { status: !currentStatus },
        token,
      })
      setMsg(`Estado de ONG ${id} actualizado.`)
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function patchCryptoWallets(id: number, currentEnabled: boolean) {
    if (!token) return
    setMsg(null)
    try {
      const data = await api.patch<{ cryptoWalletsEnabled: boolean; walletsBackfilled?: number }>(
        `/institutions/${id}/crypto-wallets`,
        {
          json: { enabled: !currentEnabled },
          token,
        }
      )
      const backfilled = data.walletsBackfilled ?? 0
      setMsg(
        backfilled > 0
          ? `Wallets de institucion ${id} habilitados. ${backfilled} estudiante(s) provisionados.`
          : `Wallets de institucion ${id} actualizados.`
      )
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function bootstrapNgoAdmin(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const id = Number(bootstrapNgoId)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID de ONG invalido')
      return
    }
    try {
      await api.post(`/ngo-institutions/${id}/bootstrap-ngo-admin`, {
        json: {
          fullName: ngoAdminName.trim(),
          email: ngoAdminEmail.trim(),
          password: ngoAdminPassword,
        },
        token,
      })
      setMsg(`Admin de ONG creado para la ONG ${id}.`)
      setBootstrapNgoId('')
      setNgoAdminName('')
      setNgoAdminEmail('')
      setNgoAdminPassword('')
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function allocateCredits(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const id = Number(allocateInstId)
    const amount = Number(allocateAmount)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID de institución inválido')
      return
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setMsg('Cantidad de créditos inválida')
      return
    }
    try {
      const data = await api.post<InstitutionCreditPool & { allocatedAmount: number }>(
        `/institutions/${id}/credit-pool/allocate`,
        {
          json: {
            amount,
            notes: allocateNotes.trim() || undefined,
          },
          token,
        }
      )
      setPoolPreview(data)
      setMsg(
        `Asignados ${amount} créditos a institución ${id}. Disponibles: ${data.remainingCredits}.`
      )
      setAllocateAmount('')
      setAllocateNotes('')
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function loadPoolPreview() {
    if (!token) return
    const id = Number(allocateInstId)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID de institución inválido')
      return
    }
    setMsg(null)
    try {
      const data = await api.get<InstitutionCreditPool>(`/institutions/${id}/credit-pool`, { token })
      setPoolPreview(data)
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function assignNgoAdmin(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const nid = Number(assignNgoId)
    const uid = Number(assignNgoUserId)
    if (!Number.isInteger(nid) || nid <= 0) {
      setMsg('ID de ONG invalido')
      return
    }
    if (!Number.isInteger(uid) || uid <= 0) {
      setMsg('ID de usuario invalido')
      return
    }
    try {
      await api.patch(`/ngo-institutions/${nid}/assign-user`, {
        json: { userId: uid },
        token,
      })
      setMsg(`Usuario ${uid} asignado como administrador de la ONG ${nid}.`)
      setAssignNgoId('')
      setAssignNgoUserId('')
      await loadAllData()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel super admin"
        title="Gobernanza multi-institucion"
        subtitle="Configura instituciones y ONGs, habilita operacion y asegura arranque de cada sede."
      />
      <KpiStrip
        items={[
          { label: 'Instituciones', value: formatId(institutions.length), hint: 'Total registradas' },
          {
            label: 'Inst. Activas',
            value: formatId(institutions.filter((institution) => institution.status === 'active').length),
            hint: 'Operativas actualmente',
          },
          {
            label: 'ONGs registradas',
            value: formatId(ngos.length),
            hint: 'Organizaciones cargadas',
          },
        ]}
      />
      {msg && <div className="alert alert-info text-sm">{msg}</div>}

      <SectionCard
        title="Instituciones"
        subtitle="Visibilidad ejecutiva del estado operativo por sede."
        actions={
          <button type="button" className="btn btn-outline btn-sm gap-1" onClick={() => void loadAllData(true)}>
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
        titleIcon={<HiBuildingOffice2 aria-hidden />}
      >
        {loading ? (
          <div className="flex min-h-16 items-center">
            <span className="loading loading-spinner loading-sm" aria-label="Cargando" />
          </div>
        ) : institutions.length === 0 ? (
          <EmptyState title="Sin instituciones." detail="Crea una institucion para comenzar el despliegue." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Codigo</th>
                  <th>Estado</th>
                  <th>Wallets</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) => (
                  <tr key={institution.id}>
                    <th>{formatId(institution.id)}</th>
                    <td>{institution.name}</td>
                    <td>{institution.code}</td>
                    <td>
                      <span className={`badge badge-sm ${institution.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {INSTITUTION_STATUS_LABELS[institution.status] ?? institution.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${institution.cryptoWalletsEnabled ? 'badge-success' : 'badge-neutral'}`}
                      >
                        {institution.cryptoWalletsEnabled
                          ? INSTITUTION_CRYPTO_WALLETS_LABELS.enabled
                          : INSTITUTION_CRYPTO_WALLETS_LABELS.disabled}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-xs ${institution.cryptoWalletsEnabled ? 'btn-neutral' : 'btn-primary'}`}
                        onClick={() => void patchCryptoWallets(institution.id, institution.cryptoWalletsEnabled)}
                      >
                        {institution.cryptoWalletsEnabled ? 'Deshabilitar wallets' : 'Habilitar wallets'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="ONGs"
        subtitle="Visibilidad de las organizaciones no gubernamentales registradas."
        actions={
          <button type="button" className="btn btn-outline btn-sm gap-1" onClick={() => void loadAllData(true)}>
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
        titleIcon={<HiGlobeAlt aria-hidden />}
      >
        {loading ? (
          <div className="flex min-h-16 items-center">
            <span className="loading loading-spinner loading-sm" aria-label="Cargando" />
          </div>
        ) : ngos.length === 0 ? (
          <EmptyState title="Sin ONGs registradas." detail="Crea una ONG para habilitar su administración." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Codigo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ngos.map((ngo) => (
                  <tr key={ngo.id}>
                    <th>{formatId(ngo.id)}</th>
                    <td>{ngo.name}</td>
                    <td>{ngo.code}</td>
                    <td>
                      <span className={`badge badge-sm ${ngo.status ? 'badge-success' : 'badge-neutral'}`}>
                        {ngo.status ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-xs ${ngo.status ? 'btn-neutral' : 'btn-primary'}`}
                        onClick={() => void patchNgoStatus(ngo.id, ngo.status)}
                      >
                        {ngo.status ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Crear institucion (draft)"
          subtitle="Da de alta nuevas sedes con codigo unico para control de despliegue."
          titleIcon={<HiPlusCircle aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={createInstitution}>
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
        </SectionCard>

        <SectionCard
          title="Crear ONG"
          subtitle="Da de alta una nueva organización no gubernamental."
          titleIcon={<HiPlusCircle aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={createNgo}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre</span>
              </div>
              <input
                value={ngoName}
                onChange={(e) => setNgoName(e.target.value)}
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
                value={ngoCode}
                onChange={(e) => setNgoCode(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Asignar presupuesto de créditos"
          subtitle="Provisiona el pool institucional para que los admins distribuyan recompensas."
          titleIcon={<HiPlusCircle aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={allocateCredits}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID institución</span>
              </div>
              <input
                value={allocateInstId}
                onChange={(e) => setAllocateInstId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Créditos a asignar</span>
              </div>
              <input
                type="number"
                min={1}
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Notas (opcional)</span>
              </div>
              <input
                value={allocateNotes}
                onChange={(e) => setAllocateNotes(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">
                Asignar créditos
              </button>
              <button type="button" className="btn btn-outline" onClick={() => void loadPoolPreview()}>
                Ver pool
              </button>
            </div>
          </form>
          {poolPreview ? (
            <p className="mt-4 text-sm text-base-content/75">
              Pool institución {formatId(poolPreview.institutionId)}:{' '}
              <span className="font-medium text-secondary">
                {poolPreview.remainingCredits} disponibles
              </span>{' '}
              de {poolPreview.allocatedCredits} asignados ({poolPreview.utilizedCredits} utilizados).
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Activar / desactivar institucion"
          subtitle="Controla disponibilidad operativa y riesgo de cambios."
          titleIcon={<HiPower aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={patchStatus}>
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
        </SectionCard>

        <SectionCard
          title="Asociar Administrador de ONG"
          subtitle="Asocia un Administrador de ONG existente ingresando su ID de usuario."
          titleIcon={<HiUserPlus aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={assignNgoAdmin}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID de ONG</span>
              </div>
              <input
                value={assignNgoId}
                onChange={(e) => setAssignNgoId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID de Usuario</span>
              </div>
              <input
                value={assignNgoUserId}
                onChange={(e) => setAssignNgoUserId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-outline btn-primary w-fit">
              Asociar Admin
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Bootstrap primer admin escolar"
          subtitle="Asigna custodio inicial para habilitar operacion local segura."
          titleIcon={<HiUserPlus aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={bootstrap}>
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
        </SectionCard>

        <SectionCard
          title="Bootstrap Administrador de ONG"
          subtitle="Crea y bootstrap un nuevo administrador de la ONG."
          titleIcon={<HiUserPlus aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={bootstrapNgoAdmin}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID de ONG</span>
              </div>
              <input
                value={bootstrapNgoId}
                onChange={(e) => setBootstrapNgoId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre completo</span>
              </div>
              <input
                value={ngoAdminName}
                onChange={(e) => setNgoAdminName(e.target.value)}
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
                value={ngoAdminEmail}
                onChange={(e) => setNgoAdminEmail(e.target.value)}
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
                value={ngoAdminPassword}
                onChange={(e) => setNgoAdminPassword(e.target.value)}
                required
                minLength={8}
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear admin
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  )
}
