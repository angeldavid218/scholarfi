import { useConnection } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import { fetchMintInfo } from '../lib/splReward.ts'

export type RewardTokenState =
  | { status: 'idle' | 'no_mint' }
  | { status: 'loading' }
  | {
      status: 'ready'
      decimals: number
      supply: bigint
      tokenProgramId: PublicKey
    }
  | { status: 'error'; message: string }

type FetchState = Exclude<RewardTokenState, { status: 'no_mint' }>

export function useRewardToken(mint: PublicKey | null): {
  token: RewardTokenState
  refresh: () => void
} {
  const { connection } = useConnection()
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => {
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!mint) return

    let cancelled = false

    ;(async () => {
      setFetchState({ status: 'loading' })
      try {
        const info = await fetchMintInfo(connection, mint)
        if (cancelled) return
        setFetchState({
          status: 'ready',
          decimals: info.decimals,
          supply: info.supply,
          tokenProgramId: info.tokenProgramId,
        })
      } catch (e) {
        if (cancelled) return
        setFetchState({
          status: 'error',
          message:
            e instanceof Error
              ? e.message
              : 'Could not load reward mint from the network.',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [connection, mint, tick])

  const token: RewardTokenState = !mint
    ? { status: 'no_mint' }
    : fetchState.status === 'idle'
      ? { status: 'loading' }
      : fetchState

  return { token, refresh }
}
