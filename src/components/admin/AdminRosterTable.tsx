import { HiMagnifyingGlass, HiUsers } from 'react-icons/hi2'
import { formatId } from '../../i18n/format'
import type { PaginatedMeta } from '../../types'
import { EmptyState, SectionCard } from '../ui/executive'
import { FormField } from '../ui/FormField'
import { TablePagination } from '../ui/TablePagination'
import { TableShell } from '../ui/TableShell'

export interface RosterRow {
  id: number
  email: string
  fullName: string | null
  roles: string[]
}

const formatRolesEs = (roles: string[]): string => {
  const map: Record<string, string> = {
    student: 'Estudiante',
    teacher: 'Docente',
    school_admin: 'Admin escolar',
  }
  if (!roles.length) return '—'
  return roles.map((r) => map[r] ?? r.replace(/_/g, ' ')).join(', ')
}

interface AdminRosterTableProps {
  roster: RosterRow[]
  rosterMeta: PaginatedMeta | null
  page: number
  perPage: number
  searchInput: string
  debouncedSearch: string
  tableBusy: boolean
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export const AdminRosterTable = ({
  roster,
  rosterMeta,
  page,
  perPage,
  searchInput,
  debouncedSearch,
  tableBusy,
  onSearchChange,
  onPageChange,
  onPerPageChange,
}: AdminRosterTableProps) => {
  return (
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
        <FormField
          label={
            <span className="flex items-center gap-2">
              <HiMagnifyingGlass className="h-4 w-4 opacity-70" aria-hidden />
              Buscar por nombre
            </span>
          }
          className="max-w-md"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ej. María García"
            className="input input-bordered input-sm w-full"
            autoComplete="off"
          />
        </FormField>

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
            <TableShell compact>
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
            </TableShell>
            <TablePagination
              page={rosterMeta?.currentPage ?? page}
              perPage={rosterMeta?.perPage ?? perPage}
              total={rosterMeta?.total ?? roster.length}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
