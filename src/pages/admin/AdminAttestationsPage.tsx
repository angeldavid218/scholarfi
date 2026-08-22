import { useCallback, useEffect, useState } from 'react'
import { HiArrowPath, HiArrowTopRightOnSquare, HiCheckBadge } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatId } from '../../i18n/format'
import { solscanTxUrl } from '../../utils/solanaExplorer'

type MilestoneCandidate = {
  studentId: number
  displayName: string
  rewardedCount: number
  status: 'eligible' | 'attested' | 'failed' | 'pending'
  attestationPda: string | null
  attestationSignature: string | null
  explorerUrl: string | null
}

type Preview = {
  institutionId: number
  sasEnabled: boolean
  onChainEnabled: boolean
  milestoneTitle: string
  threshold: number
  achievementKey: string
  summary: {
    eligible: number
    attested: number
    failed: number
    pending: number
    total: number
  }
  candidates: MilestoneCandidate[]
}

type AttestResult = {
  studentId: number
  institutionId: number
  achievementKey: string
  title: string
  rewardedCount: number
  status: 'attested' | 'already_attested' | 'skipped' | 'failed'
  attestationPda?: string
  attestationSignature?: string | null
  errorMessage?: string
  explorerUrl: string | null
  txExplorerUrl: string | null
}

type RunResponse = {
  results: AttestResult[]
  summary: {
    attested: number
    alreadyAttested: number
    skipped: number
    failed: number
  }
}

function statusBadge(status: MilestoneCandidate['status'] | AttestResult['status']) {
  switch (status) {
    case 'attested':
    case 'already_attested':
      return <span className="badge badge-success badge-sm">Attestado</span>
    case 'eligible':
      return <span className="badge badge-primary badge-sm">Elegible</span>
    case 'failed':
      return <span className="badge badge-error badge-sm">Fallido</span>
    case 'pending':
      return <span className="badge badge-warning badge-sm">Pendiente</span>
    case 'skipped':
      return <span className="badge badge-ghost badge-sm">Omitido</span>
    default:
      return <span className="badge badge-ghost badge-sm">{status}</span>
  }
}

function resultLabel(status: AttestResult['status']) {
  switch (status) {
    case 'attested':
      return 'Attestación emitida'
    case 'already_attested':
      return 'Ya attestado'
    case 'skipped':
      return 'Omitido'
    case 'failed':
      return 'Falló'
    default:
      return status
  }
}

function formatRunSuccessMessage(summary: RunResponse['summary']) {
  const parts: string[] = []
  if (summary.attested > 0) {
    parts.push(
      summary.attested === 1
        ? '1 attestación emitida'
        : `${summary.attested} attestaciones emitidas`
    )
  }
  if (summary.alreadyAttested > 0) {
    parts.push(
      summary.alreadyAttested === 1
        ? '1 ya existía'
        : `${summary.alreadyAttested} ya existían`
    )
  }
  if (summary.failed > 0) {
    parts.push(
      summary.failed === 1 ? '1 fallida' : `${summary.failed} fallidas`
    )
  }
  if (parts.length === 0) {
    return 'No había estudiantes pendientes de attestar.'
  }
  return `Listo: ${parts.join(', ')}.`
}

/**
 * School admin: preview eligible students and batch-issue milestone SAS attestations.
 */
export function AdminAttestationsPage() {
  const { token } = useAuth()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<RunResponse | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const data = await api.get<Preview>('/attestations/milestones/preview', { token })
      setPreview(data)
    } catch (e) {
      setPreview(null)
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function runBatch() {
    if (!token) return
    setRunning(true)
    setError(null)
    setMsg(null)
    setRunResults(null)
    try {
      const result = await api.post<RunResponse>('/attestations/milestones/run', { token })
      setRunResults(result)
      setMsg(formatRunSuccessMessage(result.summary))
      await load()
    } catch (e) {
      setError(
        e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudieron emitir las attestaciones'
      )
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  const summary = preview?.summary
  const canRun =
    Boolean(preview?.sasEnabled) &&
    Boolean(preview?.onChainEnabled) &&
    (summary?.eligible ?? 0) > 0 &&
    !running

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Solana Attestation Service"
        title="Attestaciones SAS — Logro 5 primeras actividades"
        subtitle="Emite attestaciones on-chain para estudiantes con 5 o más actividades recompensadas. Equivalente a node ace sas:attest-milestones desde el panel."
        leadingIcon={<HiCheckBadge />}
      />

      {error ? (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      ) : null}
      {msg ? (
        <div role="status" className="alert alert-success">
          {msg}
        </div>
      ) : null}

      {!preview?.sasEnabled ? (
        <div role="status" className="alert alert-info text-sm">
          Las attestaciones SAS requieren <code>SAS_ENABLED=true</code> y credenciales configuradas en
          el backend. Ejecuta <code>node ace sas:setup</code> una vez si aún no lo hiciste.
        </div>
      ) : null}
      {preview?.sasEnabled && !preview.onChainEnabled ? (
        <div role="status" className="alert alert-warning text-sm">
          La institución no está en modo on-chain. Activa TOKEN_MODE=solana y wallets cripto para
          emitir attestaciones.
        </div>
      ) : null}

      {summary ? (
        <KpiStrip
          items={[
            { label: 'Elegibles', value: formatId(summary.eligible), hint: 'Listos para attestar' },
            { label: 'Attestados', value: formatId(summary.attested), hint: 'On-chain confirmados' },
            { label: 'Fallidos', value: formatId(summary.failed), hint: 'Reintentar desde aquí' },
            { label: 'Total candidatos', value: formatId(summary.total), hint: preview?.milestoneTitle },
          ]}
        />
      ) : null}

      <SectionCard
        title="Estudiantes elegibles"
        subtitle={`Milestone: ${preview?.milestoneTitle ?? '—'} (umbral: ${preview?.threshold ?? 5} actividades).`}
        titleIcon={<HiCheckBadge aria-hidden />}
        actions={
          <button type="button" className="btn btn-outline btn-sm gap-1" onClick={() => load()}>
            <HiArrowPath className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
      >
        {!preview?.candidates?.length ? (
          <EmptyState
            title="Sin candidatos elegibles."
            detail="Cuando un estudiante acumule 5 actividades recompensadas confirmadas, aparecerá aquí."
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Actividades</th>
                    <th>Estado</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.candidates.map((row) => (
                    <tr key={row.studentId}>
                      <td>
                        <span className="font-medium">{row.displayName}</span>
                        <span className="ml-2 text-xs text-base-content/55">#{formatId(row.studentId)}</span>
                      </td>
                      <td className="tabular-nums">{row.rewardedCount}</td>
                      <td>{statusBadge(row.status)}</td>
                      <td className="text-xs">
                        {row.explorerUrl ? (
                          <a
                            href={row.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                          >
                            Ver attestation
                            <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                          </a>
                        ) : row.attestationSignature && row.attestationSignature !== 'existing' ? (
                          <a
                            href={solscanTxUrl(row.attestationSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                          >
                            Ver tx
                            <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-base-content/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn btn-primary" disabled={!canRun} onClick={runBatch}>
              {running ? (
                <span className="loading loading-spinner loading-sm" aria-label="Emitiendo" />
              ) : (
                'Emitir attestaciones'
              )}
            </button>
            {!canRun && (summary?.eligible ?? 0) === 0 && preview?.sasEnabled && preview?.onChainEnabled ? (
              <p className="text-sm text-base-content/65">
                Todos los candidatos elegibles ya tienen attestation o no hay estudiantes pendientes.
              </p>
            ) : null}
          </div>
        )}
      </SectionCard>

      {runResults?.results?.length ? (
        <SectionCard title="Resultado de la emisión" subtitle="Detalle por estudiante procesado.">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Resultado</th>
                  <th>Detalle</th>
                  <th>Enlace</th>
                </tr>
              </thead>
              <tbody>
                {runResults.results.map((row) => (
                  <tr key={row.studentId}>
                    <td className="tabular-nums">#{formatId(row.studentId)}</td>
                    <td>{statusBadge(row.status)}</td>
                    <td className="text-sm">
                      {resultLabel(row.status)}
                      {row.errorMessage ? (
                        <span className="mt-0.5 block text-xs text-error">{row.errorMessage}</span>
                      ) : null}
                    </td>
                    <td className="text-xs">
                      {row.explorerUrl ? (
                        <a
                          href={row.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        >
                          Attestation
                          <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                        </a>
                      ) : row.txExplorerUrl ? (
                        <a
                          href={row.txExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        >
                          Tx
                          <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
