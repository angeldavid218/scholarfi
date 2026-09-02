import { useState, type FormEvent } from 'react'
import { HiGift } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  RewardCatalogSection,
  RedemptionsQueueSection,
  type CatalogReward,
  type EditDraft,
  type RedemptionRow,
} from '../../components/admin/RewardCatalogSection'
import { RejectReasonModal } from '../../components/submissions/RejectReasonModal'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { ExecutiveHero, KpiStrip } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { usePagination } from '../../hooks/usePagination'
import { useTokenResource } from '../../hooks/useTokenResource'
import { formatId } from '../../i18n/format'
import type { PaginatedPayload } from '../../types'

interface RewardsPageData {
  catalog: CatalogReward[]
  redemptions: RedemptionRow[]
  redemptionMeta: PaginatedPayload<RedemptionRow>['meta'] | null
}

export const AdminInternalRewardsPage = () => {
  const { token } = useAuth()
  const { page, perPage, onPageChange, onPerPageChange } = usePagination()
  const { data, loading, error, reload } = useTokenResource<RewardsPageData>({
    load: async (authToken) => {
      const [catalog, payload] = await Promise.all([
        api.get<CatalogReward[]>('/rewards/catalog', { token: authToken }),
        api.get<PaginatedPayload<RedemptionRow>>(
          `/redemptions?page=${page}&perPage=${perPage}&status=pending`,
          { token: authToken }
        ),
      ])
      return {
        catalog: Array.isArray(catalog) ? catalog : [],
        redemptions: Array.isArray(payload?.items) ? payload.items : [],
        redemptionMeta: payload?.meta ?? null,
      }
    },
    deps: [page, perPage],
  })

  const catalog = data?.catalog ?? []
  const redemptions = data?.redemptions ?? []
  const redemptionMeta = data?.redemptionMeta ?? null
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creditCost, setCreditCost] = useState('')
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadCatalogAndQueue = () => reload(false)

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    setBusy(true)
    try {
      await api.post<CatalogReward>('/rewards/catalog', {
        token,
        json: {
          title: title.trim(),
          description: description.trim() || undefined,
          creditCost: Number(creditCost),
        },
      })
      setTitle('')
      setDescription('')
      setCreditCost('')
      setMsg('Recompensa interna creada.')
      await loadCatalogAndQueue()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !editDraft) return
    setMsg(null)
    setBusy(true)
    try {
      await api.patch<CatalogReward>(`/rewards/catalog/${editDraft.id}`, {
        token,
        json: {
          title: editDraft.title.trim(),
          description: editDraft.description.trim() || null,
          creditCost: Number(editDraft.creditCost),
        },
      })
      setEditDraft(null)
      setMsg('Recompensa actualizada.')
      await loadCatalogAndQueue()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo actualizar')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (row: CatalogReward) => {
    if (!token) return
    setMsg(null)
    setBusy(true)
    try {
      await api.patch<CatalogReward>(`/rewards/catalog/${row.id}`, {
        token,
        json: { isActive: !row.isActive },
      })
      setMsg(row.isActive ? 'Recompensa desactivada.' : 'Recompensa activada.')
      await loadCatalogAndQueue()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cambiar el estado')
    } finally {
      setBusy(false)
    }
  }

  const approveRedemption = async (id: number) => {
    if (!token) return
    setMsg(null)
    try {
      await api.patch(`/redemptions/${id}/approve`, { token, json: {} })
      setMsg(`Canje #${id} aprobado. Creditos debitados.`)
      await loadCatalogAndQueue()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo aprobar')
    }
  }

  const submitReject = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || rejectId === null) return
    setMsg(null)
    try {
      await api.patch(`/redemptions/${rejectId}/reject`, {
        token,
        json: { reason: rejectReason.trim() || undefined },
      })
      setMsg(`Canje #${rejectId} rechazado.`)
      setRejectId(null)
      setRejectReason('')
      await loadCatalogAndQueue()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo rechazar')
    }
  }

  if (loading) return <PageSpinner />

  const activeCount = catalog.filter((r) => r.isActive).length
  const pendingCount = redemptionMeta?.total ?? redemptions.length

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Validacion temporal"
        title="Recompensas internas"
        subtitle="Crea recompensas del colegio con costo en creditos. Los estudiantes solicitan canje; tu apruebas o rechazas. Esta seccion es temporal antes de recompensas ONG."
        leadingIcon={<HiGift aria-hidden />}
      />
      <KpiStrip
        items={[
          { label: 'En catalogo', value: formatId(catalog.length), hint: 'Internas de la institucion' },
          { label: 'Activas', value: formatId(activeCount), hint: 'Visibles para estudiantes' },
          { label: 'Canjes pendientes', value: formatId(pendingCount), hint: 'Por decidir' },
        ]}
      />
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {msg ? <AlertBanner tone="info">{msg}</AlertBanner> : null}

      <RewardCatalogSection
        catalog={catalog}
        title={title}
        description={description}
        creditCost={creditCost}
        busy={busy}
        editDraft={editDraft}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onCreditCostChange={setCreditCost}
        onCreate={(e) => void submitCreate(e)}
        onEdit={(e) => void submitEdit(e)}
        onToggleActive={(row) => void toggleActive(row)}
        onEditDraftChange={setEditDraft}
      />
      <RedemptionsQueueSection
        redemptions={redemptions}
        redemptionMeta={redemptionMeta}
        page={page}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        onApprove={(id) => void approveRedemption(id)}
        onReject={setRejectId}
      />
      <RejectReasonModal
        open={rejectId !== null}
        title={rejectId !== null ? <span className="text-error">Rechazar canje #{rejectId}</span> : ''}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectId(null)
          setRejectReason('')
        }}
        onSubmit={(e) => void submitReject(e)}
        reasonLabel="Razon (opcional)"
        placeholder="Motivo del rechazo…"
        required={false}
        maxLength={500}
      />
    </div>
  )
}
