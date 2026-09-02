import { useState, type FormEvent } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  SuperAllocateCreditsForm,
  SuperAssignNgoAdminForm,
  SuperBootstrapNgoAdminForm,
  SuperBootstrapSchoolAdminForm,
  SuperCreateInstitutionForm,
  SuperCreateNgoForm,
  SuperPatchStatusForm,
} from '../../components/super/SuperAdminForms'
import { SuperInstitutionsTable } from '../../components/super/SuperInstitutionsTable'
import { SuperNgosTable } from '../../components/super/SuperNgosTable'
import type { InstitutionCreditPool, InstitutionRow, NgoRow } from '../../components/super/types'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero, KpiStrip } from '../../components/ui/executive'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatId } from '../../i18n/format'

interface SuperDashboardData {
  institutions: InstitutionRow[]
  ngos: NgoRow[]
}

const mutationError = (err: unknown) =>
  err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error'

export const SuperHome = () => {
  const { token } = useAuth()
  const { data, loading, error, reload, setError } = useTokenResource<SuperDashboardData>({
    load: async (authToken) => {
      const [insts, orgs] = await Promise.all([
        api.get<InstitutionRow[]>('/institutions', { token: authToken }),
        api.get<NgoRow[]>('/ngo-institutions', { token: authToken }),
      ])
      return {
        institutions: Array.isArray(insts) ? insts : [],
        ngos: Array.isArray(orgs) ? orgs : [],
      }
    },
    fallbackMessage: 'Error al cargar datos',
  })

  const institutions = data?.institutions ?? []
  const ngos = data?.ngos ?? []
  const [msg, setMsg] = useState<string | null>(null)

  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')
  const [statusId, setStatusId] = useState('')
  const [statusValue, setStatusValue] = useState<'active' | 'inactive'>('active')
  const [bootstrapInstId, setBootstrapInstId] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [ngoName, setNgoName] = useState('')
  const [ngoCode, setNgoCode] = useState('')
  const [bootstrapNgoId, setBootstrapNgoId] = useState('')
  const [ngoAdminName, setNgoAdminName] = useState('')
  const [ngoAdminEmail, setNgoAdminEmail] = useState('')
  const [ngoAdminPassword, setNgoAdminPassword] = useState('')
  const [assignNgoUserId, setAssignNgoUserId] = useState('')
  const [assignNgoId, setAssignNgoId] = useState('')
  const [allocateInstId, setAllocateInstId] = useState('')
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocateNotes, setAllocateNotes] = useState('')
  const [poolPreview, setPoolPreview] = useState<InstitutionCreditPool | null>(null)

  const refreshQuiet = () => reload(false)

  const createInstitution = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    setError(null)
    try {
      const created = await api.post<{ id: number; code: string }>('/institutions', {
        json: { name: instName.trim(), code: instCode.trim() },
        token,
      })
      setMsg(`Institucion creada: ID ${created.id}, codigo ${created.code} (estado draft).`)
      setInstName('')
      setInstCode('')
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const patchStatus = async (e: FormEvent) => {
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
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const bootstrap = async (e: FormEvent) => {
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
        json: { fullName: adminName.trim(), email: adminEmail.trim(), password: adminPassword },
        token,
      })
      setMsg(`Admin escolar creado para institucion ${id}.`)
      setBootstrapInstId('')
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const createNgo = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      const created = await api.post<{ id: number; code: string }>('/ngo-institutions', {
        json: { name: ngoName.trim(), code: ngoCode.trim(), status: true },
        token,
      })
      setMsg(`ONG creada: ID ${created.id}, codigo ${created.code}.`)
      setNgoName('')
      setNgoCode('')
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const patchNgoStatus = async (id: number, currentStatus: boolean) => {
    if (!token) return
    setMsg(null)
    try {
      await api.patch(`/ngo-institutions/${id}/status`, { json: { status: !currentStatus }, token })
      setMsg(`Estado de ONG ${id} actualizado.`)
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const patchCryptoWallets = async (id: number, currentEnabled: boolean) => {
    if (!token) return
    setMsg(null)
    try {
      const result = await api.patch<{ cryptoWalletsEnabled: boolean; walletsBackfilled?: number }>(
        `/institutions/${id}/crypto-wallets`,
        { json: { enabled: !currentEnabled }, token }
      )
      const backfilled = result.walletsBackfilled ?? 0
      setMsg(
        backfilled > 0
          ? `Wallets de institucion ${id} habilitados. ${backfilled} estudiante(s) provisionados.`
          : `Wallets de institucion ${id} actualizados.`
      )
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const bootstrapNgoAdmin = async (e: FormEvent) => {
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
        json: { fullName: ngoAdminName.trim(), email: ngoAdminEmail.trim(), password: ngoAdminPassword },
        token,
      })
      setMsg(`Admin de ONG creado para la ONG ${id}.`)
      setBootstrapNgoId('')
      setNgoAdminName('')
      setNgoAdminEmail('')
      setNgoAdminPassword('')
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const allocateCredits = async (e: FormEvent) => {
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
      const result = await api.post<InstitutionCreditPool & { allocatedAmount: number }>(
        `/institutions/${id}/credit-pool/allocate`,
        { json: { amount, notes: allocateNotes.trim() || undefined }, token }
      )
      setPoolPreview(result)
      setMsg(`Asignados ${amount} créditos a institución ${id}. Disponibles: ${result.remainingCredits}.`)
      setAllocateAmount('')
      setAllocateNotes('')
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const loadPoolPreview = async () => {
    if (!token) return
    const id = Number(allocateInstId)
    if (!Number.isInteger(id) || id <= 0) {
      setMsg('ID de institución inválido')
      return
    }
    setMsg(null)
    try {
      const result = await api.get<InstitutionCreditPool>(`/institutions/${id}/credit-pool`, { token })
      setPoolPreview(result)
    } catch (err) {
      setMsg(mutationError(err))
    }
  }

  const assignNgoAdmin = async (e: FormEvent) => {
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
      await api.patch(`/ngo-institutions/${nid}/assign-user`, { json: { userId: uid }, token })
      setMsg(`Usuario ${uid} asignado como administrador de la ONG ${nid}.`)
      setAssignNgoId('')
      setAssignNgoUserId('')
      await refreshQuiet()
    } catch (err) {
      setMsg(mutationError(err))
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
          { label: 'ONGs registradas', value: formatId(ngos.length), hint: 'Organizaciones cargadas' },
        ]}
      />
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {msg ? <AlertBanner tone="info">{msg}</AlertBanner> : null}

      <SuperInstitutionsTable
        institutions={institutions}
        loading={loading}
        onRefresh={() => void reload(true)}
        onToggleWallets={(id, enabled) => void patchCryptoWallets(id, enabled)}
      />
      <SuperNgosTable
        ngos={ngos}
        loading={loading}
        onRefresh={() => void reload(true)}
        onToggleStatus={(id, status) => void patchNgoStatus(id, status)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SuperCreateInstitutionForm
          name={instName}
          code={instCode}
          onNameChange={setInstName}
          onCodeChange={setInstCode}
          onSubmit={(e) => void createInstitution(e)}
        />
        <SuperCreateNgoForm
          name={ngoName}
          code={ngoCode}
          onNameChange={setNgoName}
          onCodeChange={setNgoCode}
          onSubmit={(e) => void createNgo(e)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SuperAllocateCreditsForm
          institutionId={allocateInstId}
          amount={allocateAmount}
          notes={allocateNotes}
          poolPreview={poolPreview}
          onInstitutionIdChange={setAllocateInstId}
          onAmountChange={setAllocateAmount}
          onNotesChange={setAllocateNotes}
          onSubmit={(e) => void allocateCredits(e)}
          onPreview={() => void loadPoolPreview()}
        />
        <SuperPatchStatusForm
          institutionId={statusId}
          status={statusValue}
          onInstitutionIdChange={setStatusId}
          onStatusChange={setStatusValue}
          onSubmit={(e) => void patchStatus(e)}
        />
        <SuperAssignNgoAdminForm
          ngoId={assignNgoId}
          userId={assignNgoUserId}
          onNgoIdChange={setAssignNgoId}
          onUserIdChange={setAssignNgoUserId}
          onSubmit={(e) => void assignNgoAdmin(e)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SuperBootstrapSchoolAdminForm
          institutionId={bootstrapInstId}
          fullName={adminName}
          email={adminEmail}
          password={adminPassword}
          onInstitutionIdChange={setBootstrapInstId}
          onFullNameChange={setAdminName}
          onEmailChange={setAdminEmail}
          onPasswordChange={setAdminPassword}
          onSubmit={(e) => void bootstrap(e)}
        />
        <SuperBootstrapNgoAdminForm
          ngoId={bootstrapNgoId}
          fullName={ngoAdminName}
          email={ngoAdminEmail}
          password={ngoAdminPassword}
          onNgoIdChange={setBootstrapNgoId}
          onFullNameChange={setNgoAdminName}
          onEmailChange={setNgoAdminEmail}
          onPasswordChange={setNgoAdminPassword}
          onSubmit={(e) => void bootstrapNgoAdmin(e)}
        />
      </div>
    </div>
  )
}
