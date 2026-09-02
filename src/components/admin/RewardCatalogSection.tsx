import { type FormEvent } from 'react'
import { HiCheck, HiGift, HiPencilSquare, HiXMark } from 'react-icons/hi2'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'
import type { PaginatedMeta } from '../../types'
import { EmptyState, SectionCard } from '../ui/executive'
import { FormField } from '../ui/FormField'
import { Modal } from '../ui/Modal'
import { StatusBadge } from '../ui/StatusBadge'
import { redemptionStatusTone } from '../ui/statusTones'
import { TablePagination } from '../ui/TablePagination'
import { TableShell } from '../ui/TableShell'

export interface CatalogReward {
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

export interface RedemptionRow {
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

export interface EditDraft {
  id: number
  title: string
  description: string
  creditCost: string
}

const statusLabelEs = (status: string): string => {
  if (status === 'pending') return 'Pendiente'
  if (status === 'completed') return 'Completado'
  if (status === 'rejected') return 'Rechazado'
  if (status === 'failed') return 'Fallido'
  return status
}

interface RewardCatalogSectionProps {
  catalog: CatalogReward[]
  title: string
  description: string
  creditCost: string
  busy: boolean
  editDraft: EditDraft | null
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCreditCostChange: (value: string) => void
  onCreate: (e: FormEvent) => void
  onEdit: (e: FormEvent) => void
  onToggleActive: (row: CatalogReward) => void
  onEditDraftChange: (draft: EditDraft | null) => void
}

export const RewardCatalogSection = ({
  catalog,
  title,
  description,
  creditCost,
  busy,
  editDraft,
  onTitleChange,
  onDescriptionChange,
  onCreditCostChange,
  onCreate,
  onEdit,
  onToggleActive,
  onEditDraftChange,
}: RewardCatalogSectionProps) => {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Nueva recompensa"
          subtitle="Titulo, descripcion opcional y costo en Credit."
          titleIcon={<HiGift aria-hidden />}
        >
          <form className="mt-2 grid gap-4" onSubmit={onCreate}>
            <FormField label="Titulo">
              <input
                className="input input-bordered w-full"
                required
                maxLength={200}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Ej. Pase a biblioteca"
              />
            </FormField>
            <FormField label="Descripcion (opcional)">
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </FormField>
            <FormField label="Costo en creditos">
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={creditCost}
                onChange={(e) => onCreditCostChange(e.target.value)}
              />
            </FormField>
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
            <TableShell>
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
                        <p className="mt-0.5 line-clamp-2 text-xs text-base-content/65">{row.description}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap">{formatCreditsWithUnit(row.creditCost)}</td>
                    <td>
                      <StatusBadge tone={row.isActive ? 'success' : 'ghost'}>
                        {row.isActive ? 'Activa' : 'Inactiva'}
                      </StatusBadge>
                    </td>
                    <td className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() =>
                          onEditDraftChange({
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
                        onClick={() => onToggleActive(row)}
                      >
                        {row.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </SectionCard>
      </div>

      <Modal
        open={editDraft !== null}
        onClose={() => onEditDraftChange(null)}
        title={editDraft ? `Editar recompensa #${editDraft.id}` : ''}
      >
        {editDraft ? (
          <form className="flex flex-col gap-4" onSubmit={onEdit}>
            <FormField label="Titulo">
              <input
                className="input input-bordered w-full"
                required
                maxLength={200}
                value={editDraft.title}
                onChange={(e) => onEditDraftChange({ ...editDraft, title: e.target.value })}
              />
            </FormField>
            <FormField label="Descripcion">
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                maxLength={2000}
                value={editDraft.description}
                onChange={(e) => onEditDraftChange({ ...editDraft, description: e.target.value })}
              />
            </FormField>
            <FormField label="Costo en creditos">
              <input
                type="number"
                min={1}
                required
                className="input input-bordered w-full"
                value={editDraft.creditCost}
                onChange={(e) => onEditDraftChange({ ...editDraft, creditCost: e.target.value })}
              />
            </FormField>
            <div className="modal-action mt-0 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => onEditDraftChange(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Guardar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  )
}

interface RedemptionsQueueSectionProps {
  redemptions: RedemptionRow[]
  redemptionMeta: PaginatedMeta | null
  page: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export const RedemptionsQueueSection = ({
  redemptions,
  redemptionMeta,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  onApprove,
  onReject,
}: RedemptionsQueueSectionProps) => {
  return (
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
          <TableShell>
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
                    <StatusBadge tone={redemptionStatusTone(r.status)}>{statusLabelEs(r.status)}</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap text-sm text-base-content/70">
                    <span title={r.createdAt}>{formatRelativeDate(new Date(r.createdAt))}</span>
                  </td>
                  <td className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm gap-1"
                      onClick={() => onApprove(r.id)}
                    >
                      <HiCheck className="h-4 w-4" aria-hidden />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-error btn-sm gap-1"
                      onClick={() => onReject(r.id)}
                    >
                      <HiXMark className="h-4 w-4" aria-hidden />
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <TablePagination
            page={redemptionMeta?.currentPage ?? page}
            perPage={redemptionMeta?.perPage ?? perPage}
            total={redemptionMeta?.total ?? redemptions.length}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </div>
      )}
    </SectionCard>
  )
}
