import type { Commitment, Connection } from '@solana/web3.js'

/**
 * Confirm a transaction using HTTP polling only (no WebSocket subscription).
 * Use this in the browser when `connection.confirmTransaction` hangs because
 * signature subscriptions are unavailable or unreliable on the RPC endpoint.
 */
export async function confirmSignatureWithPolling(
  connection: Connection,
  signature: string,
  opts?: {
    commitment?: Commitment
    timeoutMs?: number
    pollMs?: number
  },
): Promise<void> {
  const commitment = opts?.commitment ?? 'confirmed'
  const timeoutMs = opts?.timeoutMs ?? 45_000
  const pollMs = opts?.pollMs ?? 750
  const start = Date.now()
  const txCommitment: 'confirmed' | 'finalized' =
    commitment === 'finalized' || commitment === 'max' || commitment === 'root'
      ? 'finalized'
      : 'confirmed'

  const satisfiesCommitment = (
    confirmationStatus: string | undefined,
    confirmations: number | null | undefined,
  ): boolean => {
    // Some RPC responses omit confirmationStatus but still include confirmations.
    if (!confirmationStatus && confirmations == null) return true
    if (!confirmationStatus) return false
    switch (commitment) {
      case 'processed':
      case 'recent':
        return (
          confirmationStatus === 'processed' ||
          confirmationStatus === 'confirmed' ||
          confirmationStatus === 'finalized'
        )
      case 'confirmed':
      case 'single':
      case 'singleGossip':
        return confirmationStatus === 'confirmed' || confirmationStatus === 'finalized'
      case 'finalized':
      case 'max':
      case 'root':
        return confirmationStatus === 'finalized'
      default:
        return confirmationStatus === 'confirmed' || confirmationStatus === 'finalized'
    }
  }

  while (Date.now() - start < timeoutMs) {
    const res = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    })
    const status = res.value[0]
    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`)
    }
    if (status && satisfiesCommitment(status.confirmationStatus, status.confirmations)) {
      return
    }

    // Some providers lag on status indexing; transaction lookup can appear first.
    const tx = await connection.getTransaction(signature, {
      commitment: txCommitment,
      maxSupportedTransactionVersion: 0,
    })
    if (tx?.meta?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(tx.meta.err)}`)
    }
    if (tx) return

    await new Promise((r) => setTimeout(r, pollMs))
  }

  throw new Error(
    `RPC did not confirm this signature after ${Math.round(timeoutMs / 1000)}s: ${signature}`,
  )
}
