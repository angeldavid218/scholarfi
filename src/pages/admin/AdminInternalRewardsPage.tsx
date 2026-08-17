import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { HiCheck, HiGift, HiPencilSquare, HiXMark } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { Modal } from '../../components/ui/Modal'
import { TablePagination } from '../../components/ui/TablePagination'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

type CatalogReward = {
  id: number
  institutionId: number
  title: string
  description: string | null
  creditCost: number
  isActive: boolean
  source: string
  createdAt: string
  updatedAt: string | null
}

type RedemptionRow = {
  id: number
  institutionId: number
  userId: number
  studentName: string | null
  rewardId: number
  rewardTitle: string | null
  amount: number
  status: string
  transactionSignature: string | null
  createdAt: string
  updatedAt: string | null
}

type EditDraft = {
  id: number
  title: string
  description: string
  creditCost: string
}

function statusBadgeClass(status: string): string {
  if (status === 'pending') return 'badge badge-warning badge-sm'
  if (status === 'completed') return 'badge badge-success badge-sm'
  if (status === 'rejected') return 'badge badge-error badge-sm'
  if (status === 'failed') return 'badge badge-error badge-sm'
  return 'badge badge-ghost badge-sm'
}

function statusLabelEs(status: string): string {
  if (status === 'pending') return 'Pendiente'
  if (status === 'completed') return 'Completado'
  if (status === 'rejected') return 'Rechazado'
  if (status === 'failed') return 'Fallido'
  return status
}

export function AdminInternalRewardsPage() {
  const { token } = useAuth()
  const [catalog, setCatalog] = useState<CatalogReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creditCost, setCreditCost] = useState('')

  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)

  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [redemptionMeta, setRedemptionMeta] = useState<PaginatedMeta | null>(null)
  const [redemptionPage, setRedemptionPage] = useState(1)
  const [redemptionPerPage, setRedemptionPerPage] = useState(10)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const rejectInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (rejectId === null) return
    const t = window.setTimeout(() => {
      rejectInputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(t)
  }, [rejectId])

  const loadCatalog = useCallback(async () => {
    if (!token) return
    const rows = await api.get<CatalogReward[]>('/rewards/catalog', { token })
    setCatalog(Array.isArray(rows) ? rows : [])
  }, [token])

  const loadRedemptions = useCallback(async () => {
    if (!token) return
    const payload = await api.get<PaginatedPayload<RedemptionRow>>(
      `/redemptions?page=${redemptionPage}&perPage=${redemptionPerPage}&status=pending`,
      { token }
    )
    setRedemptions(Array.isArray(payload?.items) ? payload.items : [])
    setRedemptionMeta(payload?.meta ?? null)
  }, [token, redemptionPage, redemptionPerPage])

  const loadAll = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      await Promise.all([loadCatalog(), loadRedemptions()])
    } catch (err) {
      setError(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token, loadCatalog, loadRedemptions])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll()
  }, [loadAll])

  const activeCount = useMemo(() => catalog.filter((r) => r.isActive).length, [catalog])
  const pendingCount = redemptionMeta?.total ?? redemptions.length

  async function submitCreate(e: FormEvent) {
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
      await loadCatalog()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  async function submitEdit(e: FormEvent) {
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
      await loadCatalog()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo actualizar')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(row: CatalogReward) {
    if (!token) return
    setMsg(null)
    setBusy(true)
    try {
      await api.patch<CatalogReward>(`/rewards/catalog/${row.id}`, {
        token,
        json: { isActive: !row.isActive },
      })
      setMsg(row.isActive ? 'Recompensa desactivada.' : 'Recompensa activada.')
      await loadCatalog()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cambiar el estado')
    } finally {
      setBusy(false)
    }
  }

  async function approveRedemption(id: number) {
    if (!token) return
    setMsg(null)
    try {
      await api.patch(`/redemptions/${id}/approve`, { token, json: {} })
      setMsg(`Canje #${id} aprobado. Creditos debitados.`)
      await loadRedemptions()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo aprobar')
    }
  }

  async function submitReject(e: FormEvent) {
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
      await loadRedemptions()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo rechazar')
    }
  }

  function closeRejectModal() {
    setRejectId(null)
    setRejectReason('')
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

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
          {
            label: 'En catalogo',
            value: formatId(catalog.length),
            hint: 'Internas de la institucion',
          },
          {
            label: 'Activas',
            value: formatId(activeCount),
            hint: 'Visibles para estudiantes',
          },
          {
            label: 'Canjes pendientes',
            value: formatId(pendingCount),
            hint: 'Por decidir',
          },
        ]}
      />

      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}
      {msg && (
        <div role="status" className="alert alert-info text-sm">
          {msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Nueva recompensa"
          subtitle="Titulo, descripcion opcional y costo en Credit."
          titleIcon={<HiGift aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={submitCreate}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Titulo</span>
              </div>
              <input
                className="input input-bordered w-full"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Pase a biblioteca"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Descripcion (opcional)</span>
              </div>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Costo en creditos</span>
              </div>
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={creditCost}
                onChange={(e) => setCreditCost(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary w-fit" disabled={busy}>
              Crear recompensa
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Catalogo interno"
          subtitle="Edita costo o desactiva sin borrar historial de canjes."
          titleIcon={<HiPencilSquare aria-hidden />}
        >
          {catalog.length === 0 ? (
            <EmptyState
              title="Sin recompensas internas."
              detail="Crea la primera para que los estudiantes la vean en el marketplace."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Titulo</th>
                    <th>Costo</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="font-medium">{row.title}</p>
                        {row.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-base-content/65">
                            {row.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap">{formatCreditsWithUnit(row.creditCost)}</td>
                      <td>
                        <span
                          className={
                            row.isActive ? 'badge badge-success badge-sm' : 'badge badge-ghost badge-sm'
                          }
                        >
                          {row.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() =>
                            setEditDraft({
                              id: row.id,
                              title: row.title,
                              description: row.description ?? '',
                              creditCost: String(row.creditCost),
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busy}
                          onClick={() => toggleActive(row)}
                        >
                          {row.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Solicitudes de canje"
        subtitle="Aprueba para debitar creditos del estudiante o rechaza con motivo."
        titleIcon={<HiCheck aria-hidden />}
      >
        {(redemptionMeta?.total ?? 0) === 0 ? (
          <EmptyState
            title="Sin canjes pendientes."
            detail="Cuando un estudiante solicite una recompensa interna, aparecera aqui."
          />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Estudiante</th>
                    <th>Recompensa</th>
                    <th>Costo</th>
                    <th>Estado</th>
                    <th>Solicitado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id}>
                      <th>{formatId(r.id)}</th>
                      <td title={`ID: ${formatId(r.userId)}`}>
                        {r.studentName?.trim() ? r.studentName : formatId(r.userId)}
                      </td>
                      <td>{r.rewardTitle ?? formatId(r.rewardId)}</td>
                      <td className="whitespace-nowrap">{formatCreditsWithUnit(r.amount)}</td>
                      <td>
                        <span className={statusBadgeClass(r.status)}>{statusLabelEs(r.status)}</span>
                      </td>
                      <td className="whitespace-nowrap text-sm text-base-content/70">
                        <span title={r.createdAt}>
                          {formatRelativeDate(new Date(r.createdAt))}
                        </span>
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm gap-1"
                          onClick={() => approveRedemption(r.id)}
                        >
                          <HiCheck className="h-4 w-4" aria-hidden />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-error btn-sm gap-1"
                          onClick={() => setRejectId(r.id)}
                        >
                          <HiXMark className="h-4 w-4" aria-hidden />
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={redemptionMeta?.currentPage ?? redemptionPage}
              perPage={redemptionMeta?.perPage ?? redemptionPerPage}
              total={redemptionMeta?.total ?? redemptions.length}
              onPageChange={(nextPage) => setRedemptionPage(nextPage)}
              onPerPageChange={(nextPerPage) => {
                setRedemptionPerPage(nextPerPage)
                setRedemptionPage(1)
              }}
            />
          </div>
        )}
      </SectionCard>

      <Modal
        open={editDraft !== null}
        onClose={() => setEditDraft(null)}
        title={editDraft ? `Editar recompensa #${editDraft.id}` : ''}
      >
        {editDraft ? (
          <form className="flex flex-col gap-4" onSubmit={submitEdit}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Titulo</span>
              </div>
              <input
                className="input input-bordered w-full"
                required
                maxLength={200}
                value={editDraft.title}
                onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Descripcion</span>
              </div>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                maxLength={2000}
                value={editDraft.description}
                onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Costo en creditos</span>
              </div>
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={editDraft.creditCost}
                onChange={(e) => setEditDraft({ ...editDraft, creditCost: e.target.value })}
              />
            </label>
            <div className="modal-action mt-0 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditDraft(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Guardar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={rejectId !== null}
        onClose={closeRejectModal}
        title={
          rejectId !== null ? (
            <span className="text-error">Rechazar canje #{rejectId}</span>
          ) : (
            ''
          )
        }
      >
        <form className="flex flex-col gap-4" onSubmit={submitReject}>
          <label className="form-control w-full">
            <div className="label pt-0">
              <span className="label-text">Razon (opcional)</span>
            </div>
            <textarea
              ref={rejectInputRef}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="textarea textarea-bordered w-full"
              placeholder="Motivo del rechazo…"
            />
          </label>
          <div className="modal-action mt-0 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={closeRejectModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-error gap-1">
              <HiXMark className="h-4 w-4" aria-hidden />
              Confirmar rechazo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
