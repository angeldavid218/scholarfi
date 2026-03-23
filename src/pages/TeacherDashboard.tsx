import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SupabaseMagicLink } from '../components/SupabaseMagicLink.tsx'
import {
  appendActivity,
  loadActivity,
  type ActivityEntry,
} from '../lib/activityStorage.ts'
import { useRewardToken } from '../hooks/useRewardToken.ts'
import { useScholarfiProfile } from '../hooks/useScholarfiProfile.ts'
import { useSupabaseSession } from '../hooks/useSupabaseSession.ts'
import {
  insertTask,
  listPendingTokenRewardsForInstitution,
  listTasksForInstitution,
  patchUserRewardTxSignature,
  type PendingTokenRewardRow,
} from '../lib/db.ts'
import { explorerAddress, explorerTx } from '../lib/solanaExplorer.ts'
import {
  buildTeacherSendTransaction,
  fetchTokenBalanceRaw,
  parseRewardMint,
  parseTreasuryPubkey,
  rawToUi,
  rewardTokenSymbol,
  uiToRaw,
} from '../lib/splReward.ts'
import type { TaskRow } from '../types/db.ts'
import { truncateAddress } from '../utils/truncateAddress.ts'

export function TeacherDashboard() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const session = useSupabaseSession()
  const { profile, loading: profileLoading } = useScholarfiProfile()
  const mint = useMemo(() => parseRewardMint(), [])
  const treasury = useMemo(() => parseTreasuryPubkey(), [])
  const { token, refresh: refreshMintInfo } = useRewardToken(mint)
  const symbol = rewardTokenSymbol()

  const isTreasuryWallet =
    treasury && publicKey ? publicKey.equals(treasury) : false

  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(0n)
  const [studentAddr, setStudentAddr] = useState('')
  const [sendUi, setSendUi] = useState('10')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>(() => loadActivity())

  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [pendingRewards, setPendingRewards] = useState<PendingTokenRewardRow[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskRewardUi, setNewTaskRewardUi] = useState('1')
  const [tasksBusy, setTasksBusy] = useState(false)
  const [sendingRewardId, setSendingRewardId] = useState<string | null>(null)

  const refreshTreasuryBalance = useCallback(async () => {
    if (!mint || !treasury || token.status !== 'ready') {
      setTreasuryBalance(0n)
      return
    }
    try {
      const raw = await fetchTokenBalanceRaw(
        connection,
        treasury,
        mint,
        token.tokenProgramId,
      )
      setTreasuryBalance(raw)
    } catch (e) {
      console.error(e)
    }
  }, [connection, mint, treasury, token])

  useEffect(() => {
    void refreshTreasuryBalance()
  }, [refreshTreasuryBalance])

  const refreshTasksAndPending = useCallback(async () => {
    const institutionId = profile?.institution_id
    if (!institutionId || !session) {
      setTasks([])
      setPendingRewards([])
      return
    }
    const [t, p] = await Promise.all([
      listTasksForInstitution(institutionId),
      listPendingTokenRewardsForInstitution(institutionId),
    ])
    if (t.error) console.error(t.error)
    if (p.error) console.error(p.error)
    setTasks(t.data ?? [])
    setPendingRewards(p.data ?? [])
  }, [profile?.institution_id, session])

  useEffect(() => {
    void refreshTasksAndPending()
  }, [refreshTasksAndPending])

  const handleCreateTask = useCallback(async () => {
    setErr(null)
    if (!session) {
      setErr('Sign in with Supabase to create tasks.')
      return
    }
    if (!profile?.institution_id) {
      setErr('Your profile needs an institution_id to create tasks.')
      return
    }
    if (profile.role !== 'teacher') {
      setErr('Only teacher profiles can create tasks.')
      return
    }
    const title = newTaskTitle.trim()
    if (!title) {
      setErr('Enter a task title.')
      return
    }
    const amt = Number(newTaskRewardUi)
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr('Enter a positive reward amount.')
      return
    }
    setTasksBusy(true)
    try {
      const { error } = await insertTask({
        institutionId: profile.institution_id,
        createdBy: profile.id,
        title,
        description: newTaskDesc.trim() || null,
        rewardTokenAmount: String(amt),
      })
      if (error) {
        setErr(error.message)
        return
      }
      setNewTaskTitle('')
      setNewTaskDesc('')
      setNewTaskRewardUi('1')
      await refreshTasksAndPending()
    } finally {
      setTasksBusy(false)
    }
  }, [
    newTaskDesc,
    newTaskRewardUi,
    newTaskTitle,
    profile,
    refreshTasksAndPending,
    session,
  ])

  const handleSendPendingReward = useCallback(
    async (reward: PendingTokenRewardRow) => {
      setErr(null)
      if (!connected || !publicKey) {
        setErr('Connect the treasury wallet first.')
        return
      }
      if (!isTreasuryWallet) {
        setErr('Connect the wallet that matches VITE_TREASURY_PUBKEY to send rewards.')
        return
      }
      if (!mint || token.status !== 'ready') {
        setErr('Reward mint is not ready.')
        return
      }
      let studentPk: PublicKey
      try {
        studentPk = new PublicKey(reward.student_wallet_address.trim())
      } catch {
        setErr('Student profile has an invalid wallet address.')
        return
      }
      const raw = uiToRaw(Number(reward.token_amount), token.decimals)
      if (raw <= 0n) {
        setErr('Invalid reward amount on this row.')
        return
      }
      const teacherBal = await fetchTokenBalanceRaw(
        connection,
        publicKey,
        mint,
        token.tokenProgramId,
      )
      if (raw > teacherBal) {
        setErr('Amount exceeds your treasury token balance.')
        return
      }

      setSendingRewardId(reward.id)
      try {
        const tx = await buildTeacherSendTransaction({
          connection,
          mint,
          tokenProgramId: token.tokenProgramId,
          teacher: publicKey,
          student: studentPk,
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
        const { error: patchErr } = await patchUserRewardTxSignature({
          rewardId: reward.id,
          txSignature: sig,
          status: 'minted',
          mintAddress: mint.toBase58(),
        })
        if (patchErr) {
          setErr(
            `Tokens sent but could not update the database: ${patchErr.message}`,
          )
        }
        const list = appendActivity({
          kind: 'transfer',
          message: `Task reward “${reward.task_title}” → ${truncateAddress(studentPk.toBase58(), 6, 4)}.`,
          signature: sig,
        })
        setActivity(list)
        await refreshTreasuryBalance()
        await refreshTasksAndPending()
      } catch (e) {
        console.error(e)
        setErr(e instanceof Error ? e.message : 'Transfer failed')
      } finally {
        setSendingRewardId(null)
      }
    },
    [
      connected,
      connection,
      isTreasuryWallet,
      mint,
      publicKey,
      refreshTasksAndPending,
      refreshTreasuryBalance,
      sendTransaction,
      token,
    ],
  )

  const handleSendReward = useCallback(async () => {
    setErr(null)
    if (!connected || !publicKey) {
      setErr('Connect the treasury wallet first.')
      return
    }
    if (!isTreasuryWallet) {
      setErr('Connect the wallet that matches VITE_TREASURY_PUBKEY to send rewards.')
      return
    }
    if (!mint) {
      setErr('Set VITE_REWARD_MINT.')
      return
    }
    if (token.status !== 'ready') {
      setErr('Reward mint is not loaded yet or failed validation.')
      return
    }
    let studentPk: PublicKey
    try {
      studentPk = new PublicKey(studentAddr.trim())
    } catch {
      setErr('Invalid student wallet address.')
      return
    }
    if (studentPk.equals(publicKey)) {
      setErr('Choose a different student address.')
      return
    }

    const raw = uiToRaw(Number(sendUi), token.decimals)
    if (raw <= 0n) {
      setErr('Enter a positive amount.')
      return
    }
    const teacherBal = await fetchTokenBalanceRaw(
      connection,
      publicKey,
      mint,
      token.tokenProgramId,
    )
    if (raw > teacherBal) {
      setErr('Amount exceeds your treasury token balance.')
      return
    }

    setBusy(true)
    try {
      const tx = await buildTeacherSendTransaction({
        connection,
        mint,
        tokenProgramId: token.tokenProgramId,
        teacher: publicKey,
        student: studentPk,
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
        kind: 'transfer',
        message: `Sent ~${sendUi} ${symbol} to ${truncateAddress(studentPk.toBase58(), 6, 4)}.`,
        signature: sig,
      })
      setActivity(list)
      await refreshTreasuryBalance()
    } catch (e) {
      console.error(e)
      setErr(e instanceof Error ? e.message : 'Transfer failed')
    } finally {
      setBusy(false)
    }
  }, [
    connected,
    connection,
    isTreasuryWallet,
    mint,
    publicKey,
    refreshTreasuryBalance,
    sendTransaction,
    sendUi,
    studentAddr,
    symbol,
    token,
  ])

  const treasuryLabel =
    token.status === 'ready'
      ? rawToUi(treasuryBalance, token.decimals)
      : token.status === 'loading'
        ? '…'
        : '—'

  const supplyLabel =
    token.status === 'ready' ? rawToUi(token.supply, token.decimals) : '—'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Teacher dashboard</h1>
        <p className="mt-2 text-base-content/80">
          Program context on devnet, treasury balance, and SPL transfers to students ({symbol}).
        </p>
      </div>

      {mint && treasury && token.status === 'ready' && (
        <div className="alert alert-success mb-6">
          <span>
            Using mint <strong>{truncateAddress(mint.toBase58(), 6, 6)}</strong> and treasury{' '}
            <strong>{truncateAddress(treasury.toBase58(), 6, 6)}</strong>. Circulating supply (mint):{' '}
            {supplyLabel} {symbol}.
          </span>
        </div>
      )}

      {token.status === 'error' && mint && (
        <div className="alert alert-warning mb-6" role="alert">
          <span>{token.message}</span>
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
            <h3 className="font-semibold">Supabase sign-in</h3>
            <SupabaseMagicLink />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Program</h2>
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-base-content/60">Cluster</dt>
                <dd className="font-medium">Devnet</dd>
              </div>
              <div>
                <dt className="text-base-content/60">Reward mint</dt>
                <dd>
                  {mint ? (
                    <a
                      href={explorerAddress(mint.toBase58())}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary font-mono"
                    >
                      {truncateAddress(mint.toBase58(), 8, 8)}
                    </a>
                  ) : (
                    <span className="text-warning">Set VITE_REWARD_MINT</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-base-content/60">Treasury wallet</dt>
                <dd>
                  {treasury ? (
                    <a
                      href={explorerAddress(treasury.toBase58())}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary font-mono"
                    >
                      {truncateAddress(treasury.toBase58(), 8, 8)}
                    </a>
                  ) : (
                    <span className="text-warning">Set VITE_TREASURY_PUBKEY</span>
                  )}
                </dd>
              </div>
              {token.status === 'ready' && (
                <>
                  <div>
                    <dt className="text-base-content/60">Token program</dt>
                    <dd>
                      {token.tokenProgramId.equals(TOKEN_2022_PROGRAM_ID)
                        ? 'Token-2022'
                        : 'SPL Token'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Minted supply</dt>
                    <dd className="tabular-nums">
                      {supplyLabel} {symbol}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Treasury token balance</h2>
            <p className="text-3xl font-semibold tabular-nums">{treasuryLabel}</p>
            <p className="text-sm text-base-content/70">
              SPL balance of the treasury wallet&apos;s ATA for {symbol}.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void refreshTreasuryBalance()}
                disabled={token.status !== 'ready'}
              >
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => refreshMintInfo()}
                disabled={!mint}
              >
                Reload mint
              </button>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body gap-4">
            <h2 className="card-title">Tasks</h2>
            <p className="text-sm text-base-content/80">
              Create tasks for your institution. When a student marks a task complete, a{' '}
              <code className="text-xs">user_rewards</code> row is created (
              <code className="text-xs">pending_mint</code>). Send SPL from the treasury to fulfill
              each payout.
            </p>
            {profileLoading ? (
              <p className="text-sm text-base-content/60">Loading profile…</p>
            ) : profile && profile.role !== 'teacher' ? (
              <p className="text-sm text-warning">
                Your profile role is not <code className="text-xs">teacher</code>. Tasks are
                created with the teacher role in <code className="text-xs">profiles</code>.
              </p>
            ) : !profile?.institution_id ? (
              <p className="text-sm text-warning">
                Set <code className="text-xs">institution_id</code> on your profile so tasks are
                scoped to your school.
              </p>
            ) : !session ? (
              <p className="text-sm text-base-content/60">Sign in with Supabase to manage tasks.</p>
            ) : (
              <div className="flex flex-col gap-4 border-t border-base-content/10 pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="form-control w-full">
                    <span className="label-text">Title</span>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Read chapter 3"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text">Reward ({symbol}, UI)</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered"
                      value={newTaskRewardUi}
                      onChange={(e) => setNewTaskRewardUi(e.target.value)}
                    />
                  </label>
                </div>
                <label className="form-control w-full">
                  <span className="label-text">Description (optional)</span>
                  <textarea
                    className="textarea textarea-bordered min-h-20"
                    placeholder="Instructions for students"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={tasksBusy || profile.role !== 'teacher'}
                    onClick={() => void handleCreateTask()}
                  >
                    {tasksBusy ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      'Create task'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void refreshTasksAndPending()}
                  >
                    Refresh list
                  </button>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Open tasks</h3>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-base-content/60">No tasks yet.</p>
                  ) : (
                    <ul className="menu rounded-box bg-base-200">
                      {tasks.map((t) => (
                        <li key={t.id} className="w-full">
                          <div className="flex w-full flex-col items-start gap-1 py-2 text-left">
                            <span className="font-medium">{t.title}</span>
                            {t.description && (
                              <span className="text-xs text-base-content/70">{t.description}</span>
                            )}
                            <span className="text-xs text-base-content/50">
                              Reward {t.reward_token_amount} {symbol} · id {t.id.slice(0, 8)}…
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {session && profile?.institution_id && (
          <section className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body gap-3">
              <h2 className="card-title">Pending token rewards</h2>
              <p className="text-sm text-base-content/80">
                Students who completed a task appear here. Connect as the treasury wallet and send
                the listed amount for each row.
              </p>
              {pendingRewards.length === 0 ? (
                <p className="text-sm text-base-content/60">No pending payouts.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Student wallet</th>
                        <th className="text-end">Amount</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRewards.map((r) => (
                        <tr key={r.id}>
                          <td className="max-w-48 truncate">{r.task_title}</td>
                          <td className="font-mono text-xs">
                            {truncateAddress(r.student_wallet_address, 8, 6)}
                          </td>
                          <td className="text-end tabular-nums">
                            {r.token_amount} {symbol}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              disabled={
                                sendingRewardId === r.id ||
                                !isTreasuryWallet ||
                                token.status !== 'ready' ||
                                !mint
                              }
                              onClick={() => void handleSendPendingReward(r)}
                            >
                              {sendingRewardId === r.id ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                'Send'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="card border border-dashed border-base-content/20 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content/70">Class analytics</h2>
            <p className="text-sm text-base-content/60">
              Aggregate metrics across learners need a server or indexer. This MVP shows only
              local browser activity.
            </p>
          </div>
        </section>

        <section className="card border border-dashed border-base-content/20 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content/70">Review submissions</h2>
            <p className="text-sm text-base-content/60">
              Submission review workflows are not modeled in the wallet-only MVP. Add a
              backend to attach off-chain artifacts to wallet identities.
            </p>
          </div>
        </section>

        {isTreasuryWallet && mint && treasury && token.status === 'ready' && (
          <section className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body">
              <h2 className="card-title">Send test reward</h2>
              <p className="text-sm text-base-content/80">
                You are connected as the treasury wallet. Transfer {symbol} from your
                associated token account to a student wallet (you sign, devnet).
              </p>
              <div className="flex flex-col gap-4 md:flex-row">
                <label className="form-control w-full flex-1">
                  <span className="label-text">Student wallet</span>
                  <input
                    type="text"
                    className="input input-bordered font-mono text-sm"
                    placeholder="Solana address"
                    value={studentAddr}
                    onChange={(e) => setStudentAddr(e.target.value)}
                  />
                </label>
                <label className="form-control w-full max-w-xs">
                  <span className="label-text">Amount (UI)</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input input-bordered"
                    value={sendUi}
                    onChange={(e) => setSendUi(e.target.value)}
                  />
                </label>
              </div>
              <div className="card-actions justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !connected}
                  onClick={() => void handleSendReward()}
                >
                  {busy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    `Send ${symbol}`
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {!isTreasuryWallet && treasury && connected && (
          <div className="alert alert-warning md:col-span-2">
            <span>
              Send test rewards only when your connected wallet matches{' '}
              <code className="text-xs">VITE_TREASURY_PUBKEY</code>. Treasury:{' '}
              {truncateAddress(treasury.toBase58(), 6, 4)}.
            </span>
          </div>
        )}

        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Recent actions (this browser)</h2>
            <ul className="menu max-h-48 overflow-y-auto rounded-box bg-base-200">
              {activity.filter((a) => a.kind === 'transfer').length === 0 ? (
                <li className="disabled px-4 py-2 text-sm">No outbound transfers logged yet.</li>
              ) : (
                activity
                  .filter((a) => a.kind === 'transfer')
                  .map((a) => (
                    <li key={a.id} className="w-full">
                      <div className="flex flex-col gap-1 py-1">
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
