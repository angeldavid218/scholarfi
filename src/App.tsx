import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'
import { WalletCta } from './components/WalletCta.tsx'
import { truncateAddress } from './utils/truncateAddress.ts'
import './App.css'

type Theme = 'night' | 'light'

function App() {
  const { connected, publicKey } = useWallet()
  const [theme, setTheme] = useState<Theme>('night')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'night' ? 'light' : 'night'))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="navbar sticky top-0 z-50 border-b border-base-content/10 bg-base-100/80 backdrop-blur-md">
        <div className="navbar-start">
          <span className="btn btn-ghost text-xl font-bold normal-case">
            Scholarfi
          </span>
        </div>
        <div className="navbar-end gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={toggleTheme}
            aria-label={
              theme === 'night' ? 'Switch to light theme' : 'Switch to dark theme'
            }
          >
            {theme === 'night' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
          <WalletCta size="sm" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section
          className="hero min-h-[calc(100svh-4rem)] bg-base-200 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-base-200 to-base-200"
          aria-labelledby="hero-heading"
        >
          <div className="hero-content px-4 text-center">
            <div className="max-w-2xl">
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
                <p className="mt-4 font-mono text-sm text-success" title={publicKey.toBase58()}>
                  Connected: {truncateAddress(publicKey.toBase58(), 8, 8)}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="bg-base-100 px-4 py-16"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="how-heading"
              className="mb-10 text-center text-2xl font-semibold md:text-3xl"
            >
              How it works
            </h2>
            <ul className="steps steps-vertical w-full md:steps-horizontal">
              <li className="step step-primary after:w-full!">
                Connect wallet
              </li>
              <li className="step step-primary after:w-full!">
                Complete a task
              </li>
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
      </main>

      <footer className="footer footer-center bg-base-300 p-10 text-base-content">
        <aside className="gap-2">
          <p className="font-medium">
            © {new Date().getFullYear()} Scholarfi
          </p>
          <p className="text-sm opacity-70">Built on Solana</p>
        </aside>
      </footer>
    </div>
  )
}

export default App
