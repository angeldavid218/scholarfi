import { useCallback, useEffect, useState } from 'react'
import { HiAcademicCap, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { DiplomaCertificatePreview } from '../../components/diploma/DiplomaCertificatePreview'
import { AlertBanner } from '../../components/ui/AlertBanner'
import { EmptyState, ExecutiveHero, SectionCard } from '../../components/ui/executive'
import { PageSpinner } from '../../components/ui/PageSpinner'
import { achievementLabel, DIPLOMA_CATEGORY_HINTS } from '../../constants/diplomaAchievements'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'
import { solscanAddressUrl, solscanTxUrl } from '../../utils/solanaExplorer'

type DiplomaView = {
  id: number
  kind: string
  achievementType: string
  achievementLabel: string
  academicPeriod: string
  recognitionId: string
  issueDate: string
  institutionName: string
  studentId: number
  displayName: string
  points: number
  rank: number
  assetId: string | null
  signature: string | null
  imageUri: string | null
  status: string
  explorerUrl: string | null
  assetExplorerUrl: string | null
  mintedAt: string | null
  errorMessage: string | null
}

type PreviewBest = {
  onChainEnabled: boolean
  treeConfigured: boolean
  institutionName: string
  academicPeriod: string
  achievementType: string
  achievementLabel: string
  currentBest: {
    studentId: number
    displayName: string
    points: number
    rank: number
    contributionCount: number
    walletPublicKey: string | null
  } | null
  existingDiploma: DiplomaView | null
}

type MintResult = {
  diploma: DiplomaView
  alreadyMinted: boolean
}

function explorerHref(diploma: DiplomaView): string | null {
  if (diploma.explorerUrl) return diploma.explorerUrl
  if (diploma.signature) return solscanTxUrl(diploma.signature)
  if (diploma.assetId) return solscanAddressUrl(diploma.assetId)
  return diploma.assetExplorerUrl
}

/**
 * School admin: preview ranking #1 and mint a cNFT academic credential.
 */
export function AdminDiplomaPage() {
  const { token } = useAuth()
  const [preview, setPreview] = useState<PreviewBest | null>(null)
  const [loading, setLoading] = useState(true)
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const data = await api.get<PreviewBest>('/diplomas/preview-best', { token })
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

  async function mint() {
    if (!token) return
    setMinting(true)
    setError(null)
    setMsg(null)
    try {
      const result = await api.post<MintResult>('/diplomas/mint-best', { token })
      setPreview((prev) =>
        prev ? { ...prev, existingDiploma: result.diploma } : prev
      )
      setMsg(
        result.alreadyMinted
          ? 'Este estudiante ya tiene un reconocimiento NFT.'
          : 'Credencial NFT emitida al estudiante destacado.'
      )
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'No se pudo emitir el reconocimiento')
    } finally {
      setMinting(false)
    }
  }

  if (loading) return <PageSpinner />

  const best = preview?.currentBest ?? null
  const diploma = preview?.existingDiploma ?? null
  const confirmed = diploma?.status === 'confirmed'
  const canMint =
    Boolean(best) &&
    Boolean(preview?.onChainEnabled) &&
    Boolean(preview?.treeConfigured) &&
    !confirmed &&
    !minting

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Credencial académica verificada"
        title="Reconocimiento al mérito académico"
        subtitle="Emite un cNFT de Excelencia Académica al estudiante #1 del ranking. La credencial incluye categoría, período e identificador verificable — sin exponer calificaciones en metadatos públicos."
        leadingIcon={<HiAcademicCap />}
      />

      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {msg ? <AlertBanner tone="success">{msg}</AlertBanner> : null}

      {!preview?.onChainEnabled ? (
        <div role="status" className="alert alert-info text-sm">
          Los reconocimientos NFT requieren TOKEN_MODE=solana y wallets cripto habilitadas en la institución.
        </div>
      ) : null}
      {preview?.onChainEnabled && !preview.treeConfigured ? (
        <div role="status" className="alert alert-warning text-sm">
          Falta configurar el árbol Merkle. Ejecuta <code>node ace cnft:setup-tree</code> y guarda{' '}
          <code>CNFT_MERKLE_TREE</code> en el backend.
        </div>
      ) : null}

      <SectionCard
        title="Categorías de reconocimiento"
        subtitle="MVP: Excelencia Académica para el estudiante #1. Las demás categorías quedan listas para futuras emisiones."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {DIPLOMA_CATEGORY_HINTS.map((item) => (
            <li
              key={item.key}
              className={[
                'rounded-xl border px-3 py-2 text-sm',
                item.key === preview?.achievementType
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-base-300 bg-base-100',
              ].join(' ')}
            >
              <span className="font-semibold text-base-content">
                {preview?.achievementType === item.key ? '● ' : ''}
                {achievementLabel(item.key)}
              </span>
              <p className="mt-0.5 text-xs text-base-content/65">{item.description}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Estudiante #1 actual"
        subtitle="El ranking usa créditos confirmados de actividades recompensadas."
        titleIcon={<HiAcademicCap />}
      >
        {!best ? (
          <EmptyState
            title="Aún no hay ranking."
            detail="Cuando se recompensen actividades, el estudiante con más créditos aparecerá aquí."
          />
        ) : (
          <div className="space-y-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/55">Estudiante</dt>
                <dd className="text-base font-semibold">{best.displayName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/55">Categoría</dt>
                <dd className="text-base font-semibold">{preview?.achievementLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/55">Período</dt>
                <dd className="text-base font-semibold">{preview?.academicPeriod}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/55">Puesto / créditos</dt>
                <dd className="text-base font-semibold tabular-nums">
                  #{formatId(best.rank)} · {formatCreditsWithUnit(best.points)}
                </dd>
              </div>
            </dl>

            <DiplomaCertificatePreview
              achievementType={preview?.achievementType ?? 'excelencia_academica'}
              studentName={best.displayName}
              institutionName={preview?.institutionName ?? 'Institución'}
              academicPeriod={preview?.academicPeriod ?? ''}
              recognitionId={diploma?.recognitionId ?? undefined}
              issueDate={diploma?.issueDate ?? undefined}
            />

            <button type="button" className="btn btn-primary" disabled={!canMint} onClick={mint}>
              {minting ? (
                <span className="loading loading-spinner loading-sm" aria-label="Emitiendo" />
              ) : confirmed ? (
                'Reconocimiento ya emitido'
              ) : (
                'Emitir credencial NFT'
              )}
            </button>
          </div>
        )}
      </SectionCard>

      {diploma ? <DiplomaProofCard diploma={diploma} /> : null}
    </div>
  )
}

function DiplomaProofCard({ diploma }: { diploma: DiplomaView }) {
  const href = explorerHref(diploma)
  return (
    <SectionCard title="Credencial emitida" subtitle="Comprobante on-chain del cNFT.">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-base-content/55">Estado</dt>
          <dd className="text-sm font-medium">{diploma.status}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-base-content/55">Identificador</dt>
          <dd className="font-mono text-xs">{diploma.recognitionId}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-base-content/55">Asset ID</dt>
          <dd className="truncate font-mono text-xs">{diploma.assetId ?? '—'}</dd>
        </div>
      </dl>
      {diploma.errorMessage ? (
        <p className="mt-3 text-sm text-error">{diploma.errorMessage}</p>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
        >
          Ver en Solscan
          <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </SectionCard>
  )
}
