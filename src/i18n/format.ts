import { CREDITS_COPY } from './es'

const integerFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
})

const amountFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatId(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return integerFormatter.format(value)
}

export function formatAmount(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return amountFormatter.format(value)
}

/** Numeric amount with the Credit token label in Spanish (e.g. `12 créditos`). */
export function formatCreditsWithUnit(value: number | null | undefined): string {
  const n = formatAmount(value)
  if (n === '—') return '—'
  return `${n} ${CREDITS_COPY.unitLower}`
}
