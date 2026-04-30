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
