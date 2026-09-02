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
}

export const SuperInstitutionsTable = ({
  institutions,
  loading,
  onRefresh,
  onToggleWallets,
}: SuperInstitutionsTableProps) => {
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
