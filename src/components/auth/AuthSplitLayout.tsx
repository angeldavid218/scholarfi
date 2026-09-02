import type { ReactNode } from 'react'
import { ScholarFiWordmark, SolanaMark } from '../BrandLogos'

interface AuthSplitLayoutProps {
  asideTitle: string
  asideBody: string
  asideCalloutTitle: string
  asideCalloutBody: string
  children: ReactNode
}

export const AuthSplitLayout = ({
  asideTitle,
  asideBody,
  asideCalloutTitle,
  asideCalloutBody,
  children,
}: AuthSplitLayoutProps) => {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="relative flex min-h-[46vh] flex-col justify-center overflow-hidden border-b border-white/10 bg-primary px-8 py-10 text-primary-content sm:px-10 lg:min-h-svh lg:border-b-0 lg:border-r lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <ScholarFiWordmark className="absolute left-1/2 top-1/2 h-[min(78vh,32rem)] w-auto max-w-[min(145vw,52rem)] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.14] brightness-0 invert" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-base-content/20 via-transparent to-base-content/15"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {asideTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-content/95">{asideBody}</p>
            <div className="mt-6 rounded-box border border-white/15 bg-base-content/10 p-4 backdrop-blur-[2px]">
              <p className="text-sm font-semibold">{asideCalloutTitle}</p>
              <p className="mt-1 text-sm text-primary-content/90">{asideCalloutBody}</p>
            </div>

            <div
              className="mt-6 inline-flex max-w-full items-center gap-3 rounded-xl border border-white/15 bg-base-content/10 px-3 py-2.5 backdrop-blur-[2px]"
              role="img"
              aria-label="Powered by Solana. Verified ecosystem."
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0a1628]/90 ring-1 ring-white/10">
                <SolanaMark className="h-7 w-7" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-bold leading-tight text-white">Powered by Solana</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-content/65">
                  VERIFIED ECOSYSTEM
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center bg-base-200 p-6">
        <div className="w-full max-w-md space-y-4">{children}</div>
      </div>
    </div>
  )
}
