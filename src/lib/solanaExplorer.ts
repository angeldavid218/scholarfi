/** Must match SolanaWalletProvider RPC cluster. */
export const SOLANA_CLUSTER = 'devnet' as const

export function explorerAddress(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`
}

export function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`
}
