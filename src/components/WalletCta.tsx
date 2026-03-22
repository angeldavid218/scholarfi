import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { truncateAddress } from '../utils/truncateAddress.ts'

type WalletCtaProps = {
  size?: 'sm' | 'lg'
}

export function WalletCta({ size = 'sm' }: WalletCtaProps) {
  const { connected, publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  const sizeClass = size === 'lg' ? 'btn-lg' : 'btn-sm'

  if (connected && publicKey) {
    const label = truncateAddress(publicKey.toBase58())
    return (
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className={`btn btn-primary ${sizeClass} normal-case`}
        >
          {label}
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu z-50 mt-2 w-52 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
        >
          <li>
            <button
              type="button"
              className="w-full"
              onClick={() => void disconnect()}
            >
              Disconnect
            </button>
          </li>
        </ul>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-primary ${sizeClass}`}
      disabled={connecting}
      onClick={() => setVisible(true)}
    >
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
