import { useCallback, useEffect, useState } from 'react'
import { HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { DiplomaCertificatePreview } from '../diploma/DiplomaCertificatePreview'
import { solscanAddressUrl, solscanTxUrl } from '../../utils/solanaExplorer'

export type StudentDiploma = {
  id: number
  kind: string
  achievementType: string
  achievementLabel: string
  academicPeriod: string
  recognitionId: string
  issueDate: string
  institutionName?: string
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
}

type DiplomasResponse = {
  diplomas: StudentDiploma[]
}

function explorerHref(diploma: StudentDiploma): string | null {
  if (diploma.explorerUrl) return diploma.explorerUrl
  if (diploma.signature) return solscanTxUrl(diploma.signature)
  if (diploma.assetId) return solscanAddressUrl(diploma.assetId)
  return diploma.assetExplorerUrl
}

/**
 * Shows the student's confirmed cNFT academic credentials on the home achievements surface.
 */
export function StudentDiplomaCard() {
  const { token, profile } = useAuth()
  const [diplomas, setDiplomas] = useState<StudentDiploma[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<DiplomasResponse>('/diplomas/me', { token })
      const confirmed = (res.diplomas ?? []).filter((item) => item.status === 'confirmed')
      setDiplomas(confirmed)
    } catch {
      setDiplomas([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading || diplomas.length === 0) return null

  const institutionNameFallback = profile?.institutionName || 'Tu institución educativa'

  return (
    <section className="space-y-6" aria-labelledby="student-diploma-heading">
      <h2 id="student-diploma-heading" className="sr-only">
        Reconocimientos académicos verificados
      </h2>
      {diplomas.map((diploma) => {
        const href = explorerHref(diploma)
        const institutionName = diploma.institutionName || institutionNameFallback
        return (
          <div key={diploma.id} className="space-y-3">
            <DiplomaCertificatePreview
              achievementType={diploma.achievementType}
              studentName={diploma.displayName}
              institutionName={institutionName}
              academicPeriod={diploma.academicPeriod}
              issueDate={diploma.issueDate}
              recognitionId={diploma.recognitionId}
            />
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Ver {diploma.achievementLabel} en Solscan
                <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
