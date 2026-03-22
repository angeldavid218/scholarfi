import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  appendActivity,
  loadActivity,
  type ActivityEntry,
} from '../lib/activityStorage.ts'
import {
  buildRedeemTransaction,
  fetchMintDecimals,
  fetchTokenBalanceRaw,
  parseRewardMint,
  parseTreasuryPubkey,
  rawToUi,
  uiToRaw,
} from '../lib/splReward.ts'
import { truncateAddress } from '../utils/truncateAddress.ts'

const EXPLORER = 'https://explorer.solana.com'

export function StudentDashboard() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const mint = useMemo(() => parseRewardMint(), [])
  const treasury = useMemo(() => parseTreasuryPubkey(), [])

  const [decimals, setDecimals] = useState<number | null>(null)
  const [balanceRaw, setBalanceRaw] = useState<bigint>(0n)
  const [activity, setActivity] = useState<ActivityEntry[]>(() => loadActivity())
  const [taskDone, setTaskDone] = useState(false)
  const [redeemUi, setRedeemUi] = useState('1')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const refreshBalance = useCallback(async () => {
    if (!mint || !publicKey) {
      setBalanceRaw(0n)
      setDecimals(null)
      return
    }
    try {
      const d = await fetchMintDecimals(connection, mint)
      setDecimals(d)
      const raw = await fetchTokenBalanceRaw(connection, publicKey, mint)
      setBalanceRaw(raw)
    } catch (e) {
      console.error(e)
      setErr(e instanceof Error ? e.message : 'Failed to read token balance')
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    void refreshBalance()
  }, [refreshBalance])

  const handleCompleteTask = useCallback(() => {
    setTaskDone(true)
    const list = appendActivity({
      kind: 'task',
      message:
        'Completed simulated academic task (off-chain). On-chain rewards arrive when a teacher sends SPL tokens to your wallet.',
    })
    setActivity(list)
  }, [])

  const handleRedeem = useCallback(async () => {
    setErr(null)
    if (!connected || !publicKey) {
      setErr('Connect your wallet first.')
      return
    }
    if (!mint) {
      setErr('Set VITE_REWARD_MINT in your environment to use SPL redeem.')
      return
    }
    if (!treasury) {
      setErr('Set VITE_TREASURY_PUBKEY (treasury wallet) for redemption transfers.')
      return
    }
    const dec = decimals ?? (await fetchMintDecimals(connection, mint))
    const raw = uiToRaw(Number(redeemUi), dec)
    if (raw <= 0n) {
      setErr('Enter a positive redeem amount.')
      return
    }
    if (raw > balanceRaw) {
      setErr('Amount exceeds your token balance.')
      return
    }

    setBusy('redeem')
    try {
      const tx = await buildRedeemTransaction({
        connection,
        mint,
        user: publicKey,
        treasury,
        amountRaw: raw,
      })
      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: tx.recentBlockhash!,
          lastValidBlockHeight: tx.lastValidBlockHeight!,
        },
        'confirmed',
      )
      const list = appendActivity({
        kind: 'redeem',
        message: `Redeemed ~${redeemUi} tokens to treasury. Signature ${sig.slice(0, 8)}…`,
      })
      setActivity(list)
      await refreshBalance()
    } catch (e) {
      console.error(e)
      setErr(e instanceof Error ? e.message : 'Redeem failed')
    } finally {
      setBusy(null)
    }
  }, [
    balanceRaw,
    connected,
    connection,
    decimals,
    mint,
    publicKey,
    redeemUi,
    refreshBalance,
    sendTransaction,
    treasury,
  ])

  const balanceLabel =
    mint && decimals !== null ? rawToUi(balanceRaw, decimals) : '—'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Student dashboard</h1>
        <p className="mt-2 text-base-content/80">
          Wallet identity, tasks, SPL balance, redemption, and local activity history.
        </p>
      </div>

      {!connected && (
        <div className="alert alert-info mb-6">
          <span>
            Connect a wallet to see balances and redeem. New here?{' '}
            <Link className="link link-primary" to="/">
              Back to home
            </Link>
            .
          </span>
        </div>
      )}

      {err && (
        <div className="alert alert-error mb-6" role="alert">
          <span>{err}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Wallet</h2>
            <p className="text-sm text-base-content/80">
              Your public key is your account on this MVP.
            </p>
            {publicKey ? (
              <p className="font-mono text-sm" title={publicKey.toBase58()}>
                {truncateAddress(publicKey.toBase58(), 10, 10)}
              </p>
            ) : (
              <p className="text-base-content/60">Not connected</p>
            )}
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Reward mint</h2>
            {mint ? (
              <a
                href={`${EXPLORER}/address/${mint.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="link link-primary break-all font-mono text-sm"
              >
                {truncateAddress(mint.toBase58(), 8, 8)}
              </a>
            ) : (
              <p className="text-sm text-warning">
                Set <code className="text-xs">VITE_REWARD_MINT</code> for live reads.
              </p>
            )}
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Simulated task</h2>
            <p className="text-base-content/80">
              Complete a sample academic task. This step is recorded locally; SPL rewards are
              issued when a teacher wallet sends tokens to your address.
            </p>
            <div className="card-actions justify-end">
              <button
                type="button"
                className="btn btn-primary"
                disabled={taskDone}
                onClick={handleCompleteTask}
              >
                {taskDone ? 'Task completed' : 'Complete simulated task'}
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Token balance</h2>
            <p className="text-3xl font-semibold tabular-nums">{balanceLabel}</p>
            <p className="text-sm text-base-content/70">Reward token (devnet)</p>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void refreshBalance()}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Redeem</h2>
            <p className="text-sm text-base-content/80">
              Spend tokens by transferring to the program treasury (on-chain). Requires{' '}
              <code className="text-xs">VITE_TREASURY_PUBKEY</code>.
            </p>
            <label className="form-control w-full max-w-xs">
              <span className="label-text">Amount (UI)</span>
              <input
                type="number"
                min="0"
                step="any"
                className="input input-bordered"
                value={redeemUi}
                onChange={(e) => setRedeemUi(e.target.value)}
              />
            </label>
            <div className="card-actions justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy !== null || !mint || !treasury || !connected}
                onClick={() => void handleRedeem()}
              >
                {busy === 'redeem' ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Redeem to treasury'
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Activity history</h2>
            <p className="text-sm text-base-content/70">
              Stored in this browser only (localStorage).
            </p>
            <ul className="menu max-h-64 flex-nowrap overflow-y-auto rounded-box bg-base-200">
              {activity.length === 0 ? (
                <li className="disabled px-4 py-2 text-sm">No events yet.</li>
              ) : (
                activity.map((a) => (
                  <li key={a.id} className="w-full border-b border-base-content/5 last:border-0">
                    <div className="flex flex-col items-start gap-1 py-2">
                      <span className="text-xs text-base-content/50">
                        {new Date(a.at).toLocaleString()} · {a.kind}
                      </span>
                      <span className="text-sm">{a.message}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
