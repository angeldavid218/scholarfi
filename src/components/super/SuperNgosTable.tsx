import { HiArrowPath, HiGlobeAlt } from 'react-icons/hi2'
import { formatId } from '../../i18n/format'
import { EmptyState, SectionCard } from '../ui/executive'
import { StatusBadge } from '../ui/StatusBadge'
import { TableShell } from '../ui/TableShell'
import type { NgoRow } from './types'

interface SuperNgosTableProps {
  ngos: NgoRow[]
  loading: boolean
  onRefresh: () => void
  onToggleStatus: (id: number, currentStatus: boolean) => void
}

export const SuperNgosTable = ({ ngos, loading, onRefresh, onToggleStatus }: SuperNgosTableProps) => {
  return (
    <SectionCard
      title="ONGs"
      subtitle="Visibilidad de las organizaciones no gubernamentales registradas."
      actions={
        <button type="button" className="btn btn-outline btn-sm gap-1" onClick={onRefresh}>
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
        <TableShell compact>
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
                  <StatusBadge tone={ngo.status ? 'success' : 'neutral'}>
                    {ngo.status ? 'Activa' : 'Inactiva'}
                  </StatusBadge>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-xs ${ngo.status ? 'btn-neutral' : 'btn-primary'}`}
                    onClick={() => onToggleStatus(ngo.id, ngo.status)}
                  >
                    {ngo.status ? 'Desactivar' : 'Activar'}
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
