import { useWallet } from '@solana/wallet-adapter-react'
import { WalletCta } from '../components/WalletCta.tsx'
import { truncateAddress } from '../utils/truncateAddress.ts'

export function LandingPage() {
  const { connected, publicKey } = useWallet()

  return (
    <>
      <section
        className="hero min-h-[calc(100svh-4rem)] bg-base-200 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-base-200 to-base-200"
        aria-labelledby="hero-heading"
      >
        <div className="hero-content px-4 text-center">
          <div className="max-w-2xl">
            <img
              src="/sholarfi.png"
              alt=""
              width={160}
              height={160}
              className="mx-auto mb-6 h-28 w-28 object-contain md:h-36 md:w-36"
              decoding="async"
            />
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight md:text-6xl"
            >
              Scholarfi
            </h1>
            <p className="py-6 text-lg text-base-content/80 md:text-xl">
              Turn academic effort into real on-chain rewards.
            </p>
            <WalletCta size="lg" />
            {connected && publicKey && (
              <p
                className="mt-4 font-mono text-sm text-success"
                title={publicKey.toBase58()}
              >
                Connected: {truncateAddress(publicKey.toBase58(), 8, 8)}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-base-100 px-4 py-16" aria-labelledby="how-heading">
        <div className="mx-auto max-w-4xl">
          <h2
            id="how-heading"
            className="mb-10 text-center text-2xl font-semibold md:text-3xl"
          >
            How it works
          </h2>
          <ul className="steps steps-vertical w-full md:steps-horizontal">
            <li className="step step-primary after:w-full!">Connect wallet</li>
            <li className="step step-primary after:w-full!">Complete a task</li>
            <li className="step step-primary after:w-full!">Earn SPL rewards</li>
            <li className="step step-primary">Redeem</li>
          </ul>
        </div>
      </section>

      <section className="bg-base-200 px-4 py-16" aria-labelledby="pillars-heading">
        <div className="mx-auto max-w-5xl">
          <h2
            id="pillars-heading"
            className="mb-10 text-center text-2xl font-semibold md:text-3xl"
          >
            Built for verifiable academic value
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Wallet as identity</h3>
                <p className="text-base-content/80">
                  Your public key is your account — no separate login to manage.
                </p>
              </div>
            </article>
            <article className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">SPL token rewards</h3>
                <p className="text-base-content/80">
                  Achievements settle as tokens you truly own on-chain.
                </p>
              </div>
            </article>
            <article className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Redeem loop</h3>
                <p className="text-base-content/80">
                  Spend tokens to redeem rewards and close the effort → value
                  cycle.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}
