import type { ReactNode } from 'react'
import { HiInbox } from 'react-icons/hi2'

type HeroProps = {
  eyebrow?: string
  title: string
  subtitle: string
  actions?: ReactNode
  /** Optional icon beside the hero title block (e.g. product mark). */
  leadingIcon?: ReactNode
}

type KpiItem = {
  label: string
  value: string
  hint?: string
}

type KpiStripProps = {
  items: KpiItem[]
  className?: string
}

type SectionCardProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  titleIcon?: ReactNode
  children: ReactNode
}

export function ExecutiveHero({ eyebrow, title, subtitle, actions, leadingIcon }: HeroProps) {
  return (
    <section className="sf-hero">
      <div>
        {leadingIcon ? (
          <div className="mb-3 text-primary [&>svg]:h-8 [&>svg]:w-8 [&_img]:max-h-10 [&_img]:w-auto [&_img]:object-contain [&_img]:object-left">
            {leadingIcon}
          </div>
        ) : null}
        {eyebrow ? <p className="sf-eyebrow">{eyebrow}</p> : null}
        <h1 className="sf-title">{title}</h1>
        <p className="sf-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="sf-hero-actions">{actions}</div> : null}
    </section>
  )
}

export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <section className={`sf-kpi-strip ${className}`} aria-label="Indicadores clave">
      {items.map((item) => (
        <article key={item.label} className="sf-kpi-item">
          <p className="sf-kpi-label">{item.label}</p>
          <p className="sf-kpi-value">{item.value}</p>
          {item.hint ? <p className="sf-kpi-hint">{item.hint}</p> : null}
        </article>
      ))}
    </section>
  )
}

export function SectionCard({ title, subtitle, actions, titleIcon, children }: SectionCardProps) {
  return (
    <section className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="card-title flex items-start gap-2 text-lg">
              {titleIcon ? (
                <span className="mt-0.5 shrink-0 text-primary [&>svg]:h-6 [&>svg]:w-6">{titleIcon}</span>
              ) : null}
              <span>{title}</span>
            </h2>
            {subtitle ? <p className="text-sm text-base-content/70">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}

export function EmptyState({ title, detail, className }: { title: string; detail?: string; className?: string }) {
  return (
    <div className={`rounded-box border border-dashed border-base-300 bg-base-200/60 p-4 text-sm ${className}`}>
      <div className="flex gap-3">
        <HiInbox className="mt-0.5 h-6 w-6 shrink-0 text-base-content/40" aria-hidden />
        <div>
          <p className="font-medium text-base-content">{title}</p>
          {detail ? <p className="mt-1 text-base-content/70">{detail}</p> : null}
        </div>
      </div>
    </div>
  )
}
