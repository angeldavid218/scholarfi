import { useState } from 'react'
import { HiArrowPath, HiBuildingOffice2 } from 'react-icons/hi2'
import { INSTITUTION_CRYPTO_WALLETS_LABELS, INSTITUTION_STATUS_LABELS } from '../../i18n/es'
import { formatId } from '../../i18n/format'
import { EmptyState, SectionCard } from '../ui/executive'
import { StatusBadge } from '../ui/StatusBadge'
import { TableShell } from '../ui/TableShell'
import type { InstitutionRow } from './types'

interface SuperInstitutionsTableProps {
  institutions: InstitutionRow[]
  loading: boolean
  onRefresh: () => void
  onToggleWallets: (id: number, currentEnabled: boolean) => void
  onSaveNftBaseImage: (id: number, url: string | null) => Promise<void> | void
}

export const SuperInstitutionsTable = ({
  institutions,
  loading,
  onRefresh,
  onToggleWallets,
  onSaveNftBaseImage,
}: SuperInstitutionsTableProps) => {
  const [draftUrls, setDraftUrls] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const draftFor = (institution: InstitutionRow) =>
    draftUrls[institution.id] ?? institution.nftBaseImageUrl ?? ''

  const saveUrl = async (institution: InstitutionRow) => {
    const raw = draftFor(institution).trim()
    setSavingId(institution.id)
    try {
      await onSaveNftBaseImage(institution.id, raw === '' ? null : raw)
      setDraftUrls((prev) => {
        const next = { ...prev }
        delete next[institution.id]
        return next
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <SectionCard
      title="Instituciones"
      subtitle="Visibilidad ejecutiva del estado operativo por sede."
      actions={
        <button type="button" className="btn btn-outline btn-sm gap-1" onClick={onRefresh}>
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
        <TableShell compact>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Codigo</th>
              <th>Estado</th>
              <th>Wallets</th>
              <th>NFT base image URL</th>
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
                  <StatusBadge tone={institution.status === 'active' ? 'success' : 'neutral'}>
                    {INSTITUTION_STATUS_LABELS[institution.status] ?? institution.status}
                  </StatusBadge>
                </td>
                <td>
                  <StatusBadge tone={institution.cryptoWalletsEnabled ? 'success' : 'neutral'}>
                    {institution.cryptoWalletsEnabled
                      ? INSTITUTION_CRYPTO_WALLETS_LABELS.enabled
                      : INSTITUTION_CRYPTO_WALLETS_LABELS.disabled}
                  </StatusBadge>
                </td>
                <td className="min-w-64">
                  <div className="flex flex-col gap-1">
                    <input
                      type="url"
                      className="input input-bordered input-xs w-full"
                      placeholder="https://…/school-brand.png"
                      value={draftFor(institution)}
                      onChange={(e) =>
                        setDraftUrls((prev) => ({ ...prev, [institution.id]: e.target.value }))
                      }
                      aria-label={`NFT base image URL para ${institution.name}`}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        disabled={savingId === institution.id}
                        onClick={() => void saveUrl(institution)}
                      >
                        {savingId === institution.id ? 'Guardando…' : 'Guardar arte'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        disabled={savingId === institution.id || !institution.nftBaseImageUrl}
                        onClick={() => {
                          setDraftUrls((prev) => ({ ...prev, [institution.id]: '' }))
                          void onSaveNftBaseImage(institution.id, null)
                        }}
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-xs ${institution.cryptoWalletsEnabled ? 'btn-neutral' : 'btn-primary'}`}
                    onClick={() => onToggleWallets(institution.id, institution.cryptoWalletsEnabled)}
                  >
                    {institution.cryptoWalletsEnabled ? 'Deshabilitar wallets' : 'Habilitar wallets'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </SectionCard>
  )
}
