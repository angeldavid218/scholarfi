import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { getProfileByWallet, syncMyProfileWithWallet } from '../lib/db.ts'
import { useSupabaseSession } from './useSupabaseSession.ts'
import type { ProfileRow } from '../types/db.ts'

export function useScholarfiProfile() {
  const { publicKey } = useWallet()
  const session = useSupabaseSession()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!publicKey) {
      setProfile(null)
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const wallet = publicKey.toBase58()
        if (session) {
          const { data, error } = await syncMyProfileWithWallet(wallet)
          if (!cancelled) {
            if (error) console.error(error)
            setProfile(data)
          }
          return
        }

        const { data, error } = await getProfileByWallet(wallet)
        if (!cancelled) {
          if (error) console.error(error)
          setProfile(data)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publicKey, session])

  return { profile, loading }
}
