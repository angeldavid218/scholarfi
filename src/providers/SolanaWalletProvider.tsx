import { clusterApiUrl } from '@solana/web3.js'
import type { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

const endpoint = clusterApiUrl('devnet')

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [walletError, setWalletError] = useState<string | null>(null)

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  useEffect(() => {
    if (!walletError) return
    const t = window.setTimeout(() => setWalletError(null), 4200)
    return () => window.clearTimeout(t)
  }, [walletError])

  const handleError = (error: WalletError) => {
    console.error(error)
    setWalletError(error.message)
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={handleError}>
        <WalletModalProvider>
          {walletError && (
            <div
              className="toast toast-top toast-end z-100"
              role="alert"
              aria-live="assertive"
            >
              <div className="alert alert-error shadow-lg">
                <span>{walletError}</span>
              </div>
            </div>
          )}
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
