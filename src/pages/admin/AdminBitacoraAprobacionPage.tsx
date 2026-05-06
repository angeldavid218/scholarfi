import { useCallback, useEffect, useState } from 'react'
import { HiArrowPath, HiBanknotes } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { TablePagination } from '../../components/ui/TablePagination'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import { formatRelativeDate } from '../../utils/dates'
import type { PaginatedMeta, PaginatedPayload } from '../../types'

type RewardRow = {
  id: number
  submissionId: number
  studentId: number
  studentName: string
  amount: number
  postedAt: string | null
}

type RewardsHistorySummary = {
  transactionCount: number
  creditsTotal: number
}

/**
 * School admin approval ledger: Credit posted after final admin approval.
 */
export function AdminBitacoraAprobacionPage() {
  const { token } = useAuth()
  const [history, setHistory] = useState<RewardRow[]>([])
  const [historyMeta, setHistoryMeta] = useState<PaginatedMeta | null>(null)
  const [summary, setSummary] = useState<RewardsHistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPerPage, setHistoryPerPage] = useState(10)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [h, s] = await Promise.all([
        api.get<PaginatedPayload<RewardRow>>(
          `/rewards/history?page=${historyPage}&perPage=${historyPerPage}`,
          { token }
        ),
        api.get<RewardsHistorySummary>('/rewards/history/summary', { token }),
      ])
      setHistory(Array.isArray(h?.items) ? h.items : [])
      setHistoryMeta(h?.meta ?? null)
      setSummary(s)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [historyPage, historyPerPage, token])

  useEffect(() => {
    load()
  }, [load])

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
        eyebrow="Administración escolar"
        title="Bitácora de aprobación"
        subtitle="Registro institucional de Credit acreditado cuando un envío alcanza la aprobación final."
      />

      {error && <div className="alert alert-error">{error}</div>}

      <SectionCard
        title="Historial de créditos"
        subtitle="Movimientos publicados por envío y estudiante, con fecha de publicación."
        actions={
          <button type="button" className="btn btn-outline btn-sm gap-1" onClick={() => load()}>
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
        titleIcon={<HiBanknotes aria-hidden />}
      >
        <div className="mb-4 flex w-full flex-wrap items-baseline gap-2 border-b border-base-300 pb-3">
          <p className="text-sm text-base-content/70">Total de Crédito distribuido en la institución</p>
          <p className="ml-auto shrink-0 text-right text-lg font-semibold tabular-nums text-secondary">
            {formatCreditsWithUnit(summary?.creditsTotal ?? 0)}
          </p>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="Sin movimientos."
            detail="Las aprobaciones que liberan Credit aparecerán en esta bitácora."
          />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Envio</th>
                    <th>Estudiante</th>
                    <th>Créditos</th>
                    <th>Publicado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id}>
                      <th>{formatId(r.id)}</th>
                      <td>{formatId(r.submissionId)}</td>
                      <td>{r.studentName}</td>
                      <td className="font-medium tabular-nums text-secondary">
                        {formatCreditsWithUnit(r.amount)}
                      </td>
                      <td className="text-xs text-base-content/70">
                        <span title={r.postedAt ?? undefined}>
                          {r.postedAt ? formatRelativeDate(new Date(r.postedAt)) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={historyMeta?.currentPage ?? historyPage}
              perPage={historyMeta?.perPage ?? historyPerPage}
              total={historyMeta?.total ?? history.length}
              onPageChange={(nextPage) => setHistoryPage(nextPage)}
              onPerPageChange={(nextPerPage) => {
                setHistoryPerPage(nextPerPage)
                setHistoryPage(1)
              }}
            />
          </div>
        )}
      </SectionCard>
    </div>
  )
}
