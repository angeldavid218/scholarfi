import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SupabaseMagicLink } from '../components/SupabaseMagicLink.tsx'
import {
  appendActivity,
  loadActivity,
  type ActivityEntry,
} from '../lib/activityStorage.ts'
import { useScholarfiProfile } from '../hooks/useScholarfiProfile.ts'
import { useSupabaseSession } from '../hooks/useSupabaseSession.ts'
import {
  completeTaskForCurrentUser,
  listMyCompletedTaskIds,
  listTasksForInstitution,
} from '../lib/db.ts'
import { explorerAddress, explorerTx } from '../lib/solanaExplorer.ts'
import {
  buildRedeemTransaction,
  fetchTokenBalanceRaw,
  parseRewardMint,
  parseTreasuryPubkey,
  rawToUi,
  rewardTokenSymbol,
  uiToRaw,
} from '../lib/splReward.ts'
import { useRewardToken } from '../hooks/useRewardToken.ts'
import type { TaskRow } from '../types/db.ts'
import { truncateAddress } from '../utils/truncateAddress.ts'

export function StudentDashboard() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const session = useSupabaseSession()
  const { profile, loading: profileLoading } = useScholarfiProfile()
  const mint = useMemo(() => parseRewardMint(), [])
  const treasury = useMemo(() => parseTreasuryPubkey(), [])
  const { token, refresh: refreshMintInfo } = useRewardToken(mint)
  const symbol = rewardTokenSymbol()

  const [balanceRaw, setBalanceRaw] = useState<bigint>(0n)
  const [activity, setActivity] = useState<ActivityEntry[]>(() => loadActivity())
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [redeemUi, setRedeemUi] = useState('1')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const refreshBalance = useCallback(async () => {
    if (!mint || !publicKey || token.status !== 'ready') {
      setBalanceRaw(0n)
      return
    }
    try {
      const raw = await fetchTokenBalanceRaw(
        connection,
        publicKey,
        mint,
        token.tokenProgramId,
      )
      setBalanceRaw(raw)
    } catch (e) {
      console.error(e)
      setErr(e instanceof Error ? e.message : 'Failed to read token balance')
    }
  }, [connection, mint, publicKey, token])

  useEffect(() => {
    void refreshBalance()
  }, [refreshBalance])

  const refreshTasks = useCallback(async () => {
    const institutionId = profile?.institution_id
    if (!institutionId || !session) {
      setTasks([])
      setCompletedTaskIds([])
      return
    }
    setTasksLoading(true)
    try {
      const [t, c] = await Promise.all([
        listTasksForInstitution(institutionId),
        listMyCompletedTaskIds(),
      ])
      if (t.error) console.error(t.error)
      if (c.error) console.error(c.error)
      setTasks(t.data ?? [])
      setCompletedTaskIds(c.data ?? [])
    } finally {
      setTasksLoading(false)
    }
  }, [profile?.institution_id, session])

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  const copyAddress = useCallback(async () => {
    if (!publicKey) return
    try {
      await navigator.clipboard.writeText(publicKey.toBase58())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setErr('Could not copy to clipboard.')
    }
  }, [publicKey])

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      setErr(null)
      setCompletingTaskId(taskId)
      try {
        const { data, error } = await completeTaskForCurrentUser(taskId)
        if (error) {
          setErr(error.message)
          return
        }
        if (data) {
          const list = appendActivity({
            kind: 'task',
            message: `Completed task “${data.task.title}”. Your teacher can send ${data.task.reward_token_amount} ${symbol} from the treasury.`,
          })
          setActivity(list)
        }
        await refreshTasks()
      } finally {
        setCompletingTaskId(null)
      }
    },
    [refreshTasks, symbol],
  )

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
    if (token.status !== 'ready') {
      setErr('Reward mint is not loaded yet or failed validation.')
      return
    }
    const raw = uiToRaw(Number(redeemUi), token.decimals)
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
        tokenProgramId: token.tokenProgramId,
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
        message: `Redeemed ~${redeemUi} ${symbol} to treasury.`,
        signature: sig,
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
    mint,
    publicKey,
    redeemUi,
    refreshBalance,
    sendTransaction,
    symbol,
    token,
    treasury,
  ])

  const balanceLabel =
    token.status === 'ready'
      ? rawToUi(balanceRaw, token.decimals)
      : token.status === 'loading'
        ? '…'
        : '—'

  const configReady =
    mint &&
    treasury &&
    token.status === 'ready'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Student dashboard</h1>
        <p className="mt-2 text-base-content/80">
          Wallet identity, tasks, SPL balance, redemption, and local activity history.
        </p>
      </div>

      {configReady && (
        <div className="alert alert-success mb-6">
          <span>
            Reward token <strong>{symbol}</strong> is live on devnet. Balances and redemptions use your
            configured mint and treasury.
          </span>
        </div>
      )}

      {token.status === 'error' && mint && (
        <div className="alert alert-warning mb-6" role="alert">
          <span>{token.message}</span>
        </div>
      )}

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

      {!session && (
        <div className="alert alert-info mb-6">
          <div className="w-full">
            <h3 className="mb-1 font-semibold">Sign in to load and complete tasks</h3>
            <SupabaseMagicLink />
          </div>
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
              <>
                <p className="font-mono text-sm" title={publicKey.toBase58()}>
                  {truncateAddress(publicKey.toBase58(), 10, 10)}
                </p>
                <div className="card-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => void copyAddress()}>
                    {copied ? 'Copied' : 'Copy address'}
                  </button>
                </div>
              </>
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
                href={explorerAddress(mint.toBase58())}
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
            {token.status === 'ready' && (
              <p className="mt-2 text-xs text-base-content/60">
                Decimals: {token.decimals} · Program:{' '}
                {token.tokenProgramId.equals(TOKEN_2022_PROGRAM_ID) ? 'Token-2022' : 'SPL Token'}
              </p>
            )}
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body gap-4">
            <h2 className="card-title">Tasks from your teacher</h2>
            <p className="text-sm text-base-content/80">
              Completing a task creates an <code className="text-xs">academic_actions</code> row (
              <code className="text-xs">assignment_completed</code>) and a{' '}
              <code className="text-xs">user_rewards</code> row. Your teacher sends {symbol} from
              the treasury when the payout shows as pending.
            </p>
            {profileLoading || tasksLoading ? (
              <p className="text-sm text-base-content/60">Loading tasks…</p>
            ) : !profile?.institution_id ? (
              <p className="text-sm text-warning">
                Your profile needs an <code className="text-xs">institution_id</code> that matches
                your teacher&apos;s tasks.
              </p>
            ) : !session ? (
              <p className="text-sm text-base-content/60">Sign in with Supabase to see tasks.</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-base-content/60">No tasks yet. Your teacher will post some here.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {tasks.map((t) => {
                  const done = completedTaskIds.includes(t.id)
                  return (
                    <li
                      key={t.id}
                      className="flex flex-col gap-2 rounded-lg border border-base-content/10 bg-base-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{t.title}</p>
                        {t.description && (
                          <p className="text-sm text-base-content/70">{t.description}</p>
                        )}
                        <p className="mt-1 text-xs text-base-content/50">
                          Reward {t.reward_token_amount} {symbol} (on-chain after teacher sends)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm shrink-0"
                        disabled={done || completingTaskId === t.id}
                        onClick={() => void handleCompleteTask(t.id)}
                      >
                        {done
                          ? 'Completed'
                          : completingTaskId === t.id
                            ? <span className="loading loading-spinner loading-xs" />
                            : 'Mark complete'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void refreshTasks()}
                disabled={!session || !profile?.institution_id}
              >
                Refresh tasks
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Token balance</h2>
            <p className="text-3xl font-semibold tabular-nums">{balanceLabel}</p>
            <p className="text-sm text-base-content/70">
              {symbol} ({token.status === 'ready' ? 'devnet' : '—'})
            </p>
            <div className="card-actions gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void refreshBalance()}
                disabled={token.status !== 'ready'}
              >
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  refreshMintInfo()
                }}
                disabled={!mint}
              >
                Reload mint
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Redeem</h2>
            <p className="text-sm text-base-content/80">
              Spend {symbol} by transferring to the program treasury (on-chain). Requires{' '}
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
                disabled={
                  busy !== null || !mint || !treasury || !connected || token.status !== 'ready'
                }
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
                      {a.signature && (
                        <a
                          href={explorerTx(a.signature)}
                          target="_blank"
                          rel="noreferrer"
                          className="link link-primary text-xs"
                        >
                          View transaction
                        </a>
                      )}
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
