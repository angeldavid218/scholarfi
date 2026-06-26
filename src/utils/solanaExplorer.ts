/**
 * Solscan transaction URL.
 * Set `VITE_SOLANA_CLUSTER=devnet` (or `mainnet-beta`) so links match your RPC/mint cluster.
 */
export function solscanTxUrl(signature: string): string {
  const cluster = (import.meta.env.VITE_SOLANA_CLUSTER as string | undefined)?.trim()
  const base = `https://solscan.io/tx/${encodeURIComponent(signature)}`
  if (cluster && cluster !== 'mainnet-beta' && cluster !== 'mainnet') {
    return `${base}?cluster=${encodeURIComponent(cluster)}`
  }
  return base
}
