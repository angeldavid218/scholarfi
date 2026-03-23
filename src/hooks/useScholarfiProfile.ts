import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { getProfileByWallet } from '../lib/db.ts'
import type { ProfileRow } from '../types/db.ts'

export function useScholarfiProfile() {
  const { publicKey } = useWallet()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!publicKey) {
      setProfile(null)
      return
    }
    let cancelled = false
    setLoading(true)
    void getProfileByWallet(publicKey.toBase58()).then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error(error)
      setProfile(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [publicKey])

  return { profile, loading }
}
