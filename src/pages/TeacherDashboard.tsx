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
  insertRewardWalletTransaction,
  insertTask,
  listPendingTokenRewardsForInstitution,
  listTasksForInstitution,
  patchUserRewardTxSignature,
  type PendingTokenRewardRow,
} from '../lib/db.ts'
import { explorerAddress, explorerTx } from '../lib/solanaExplorer.ts'
import { confirmSignatureWithPolling } from '../lib/confirmSignature.ts'
import {
  buildApproveDelegateTransaction,
  buildDelegateSendTransaction,
  buildTeacherSendTransaction,
  fetchTokenDelegateInfo,
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
  const [delegateAddr, setDelegateAddr] = useState('')
  const [delegateAllowanceUi, setDelegateAllowanceUi] = useState('1000')
  const [delegateBusy, setDelegateBusy] = useState(false)
  const [delegateOnChain, setDelegateOnChain] = useState<PublicKey | null>(null)
  const [delegateAllowanceRaw, setDelegateAllowanceRaw] = useState<bigint>(0n)

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

  const refreshDelegateInfo = useCallback(async () => {
    if (!mint || !treasury || token.status !== 'ready') {
      setDelegateOnChain(null)
      setDelegateAllowanceRaw(0n)
      return
    }
    try {
      const info = await fetchTokenDelegateInfo({
        connection,
        mint,
        owner: treasury,
        tokenProgramId: token.tokenProgramId,
      })
      setDelegateOnChain(info.delegate)
      setDelegateAllowanceRaw(info.delegatedAmountRaw)
    } catch (e) {
      console.error(e)
    }
  }, [connection, mint, token, treasury])

  useEffect(() => {
    void refreshDelegateInfo()
  }, [refreshDelegateInfo])

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
      setErr('Link your profile to a school before creating tasks.')
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
        setErr('Connect your wallet first.')
        return
      }
      if (!treasury) {
        setErr('Treasury wallet is not configured in the app yet.')
        return
      }
      if (!mint || token.status !== 'ready') {
        setErr('Reward token is not ready yet.')
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
      const treasuryBal = await fetchTokenBalanceRaw(
        connection,
        treasury,
        mint,
        token.tokenProgramId,
      )
      if (raw > treasuryBal) {
        setErr('Amount exceeds treasury token balance.')
        return
      }

      setSendingRewardId(reward.id)
      try {
        const tx = isTreasuryWallet
          ? await buildTeacherSendTransaction({
              connection,
              mint,
              tokenProgramId: token.tokenProgramId,
              teacher: treasury,
              student: studentPk,
              amountRaw: raw,
            })
          : await (async () => {
              const info = await fetchTokenDelegateInfo({
                connection,
                mint,
                owner: treasury,
                tokenProgramId: token.tokenProgramId,
              })
              if (!info.delegate || !info.delegate.equals(publicKey)) {
                throw new Error(
                  'Connected wallet is not the approved treasury delegate. Connect treasury wallet to authorize it.',
                )
              }
              if (raw > info.delegatedAmountRaw) {
                throw new Error(
                  `Amount exceeds remaining delegate allowance (${rawToUi(
                    info.delegatedAmountRaw,
                    token.decimals,
                  )} ${symbol}).`,
                )
              }
              return buildDelegateSendTransaction({
                connection,
                mint,
                tokenProgramId: token.tokenProgramId,
                treasury,
                delegate: publicKey,
                student: studentPk,
                amountRaw: raw,
              })
            })()
        const sig = await sendTransaction(tx, connection, {
          preflightCommitment: 'confirmed',
          maxRetries: 5,
        })
        await confirmSignatureWithPolling(connection, sig, { commitment: 'confirmed' })
        const { error: patchErr } = await patchUserRewardTxSignature({
          rewardId: reward.id,
          txSignature: sig,
          status: 'minted',
          mintAddress: mint.toBase58(),
        })
        const { error: txLogErr } = await insertRewardWalletTransaction({
          userRewardId: reward.id,
          walletAddress: reward.student_wallet_address,
          transactionType: 'transfer',
          network: 'devnet',
          txSignature: sig,
          tokenMintAddress: mint.toBase58(),
          amount: reward.token_amount,
          status: 'confirmed',
        })
        if (patchErr || txLogErr) {
          const details = [patchErr?.message, txLogErr?.message]
            .filter((m): m is string => typeof m === 'string' && m.length > 0)
            .join(' | ')
          setErr(`Tokens sent but database sync is partial: ${details}`)
        }
        const list = appendActivity({
          kind: 'transfer',
          message: `Task reward “${reward.task_title}” → ${truncateAddress(studentPk.toBase58(), 6, 4)}.`,
          signature: sig,
        })
        setActivity(list)
        await refreshTreasuryBalance()
        await refreshDelegateInfo()
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
      symbol,
      treasury,
      refreshDelegateInfo,
    ],
  )

  const handleAuthorizeDelegate = useCallback(async () => {
    setErr(null)
    if (!connected || !publicKey) {
      setErr('Connect treasury wallet first.')
      return
    }
    if (!isTreasuryWallet) {
      setErr('Only the treasury wallet can approve a delegate.')
      return
    }
    if (!mint || !treasury || token.status !== 'ready') {
      setErr('Reward token is not ready yet.')
      return
    }
    let delegatePk: PublicKey
    try {
      delegatePk = new PublicKey(delegateAddr.trim())
    } catch {
      setErr('Enter a valid delegate wallet address.')
      return
    }
    if (delegatePk.equals(treasury)) {
      setErr('Delegate must be different from treasury.')
      return
    }
    const raw = uiToRaw(Number(delegateAllowanceUi), token.decimals)
    if (raw <= 0n) {
      setErr('Enter a positive delegate allowance.')
      return
    }

    setDelegateBusy(true)
    try {
      const tx = await buildApproveDelegateTransaction({
        connection,
        mint,
        tokenProgramId: token.tokenProgramId,
        treasury,
        delegate: delegatePk,
        amountRaw: raw,
      })
      const sig = await sendTransaction(tx, connection, {
        preflightCommitment: 'confirmed',
        maxRetries: 5,
      })
      await confirmSignatureWithPolling(connection, sig, { commitment: 'confirmed' })
      const list = appendActivity({
        kind: 'transfer',
        message: `Approved delegate ${truncateAddress(delegatePk.toBase58(), 6, 4)} for ~${delegateAllowanceUi} ${symbol}.`,
        signature: sig,
      })
      setActivity(list)
      await refreshDelegateInfo()
    } catch (e) {
      console.error(e)
      setErr(e instanceof Error ? e.message : 'Delegate approval failed')
    } finally {
      setDelegateBusy(false)
    }
  }, [
    connected,
    publicKey,
    isTreasuryWallet,
    mint,
    treasury,
    token,
    delegateAddr,
    delegateAllowanceUi,
    connection,
    sendTransaction,
    symbol,
    refreshDelegateInfo,
  ])

  const handleSendReward = useCallback(async () => {
    setErr(null)
    if (!connected || !publicKey) {
      setErr('Connect your wallet first.')
      return
    }
    if (!treasury) {
      setErr('Treasury wallet is not configured in the app yet.')
      return
    }
    if (!mint) {
      setErr('Reward token mint is not configured in the app yet.')
      return
    }
    if (token.status !== 'ready') {
      setErr(
        'Reward token is not loading correctly. Check your connection and app configuration.',
      )
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
    const treasuryBal = await fetchTokenBalanceRaw(
      connection,
      treasury,
      mint,
      token.tokenProgramId,
    )
    if (raw > treasuryBal) {
      setErr('Amount exceeds treasury token balance.')
      return
    }

    setBusy(true)
    try {
      const tx = isTreasuryWallet
        ? await buildTeacherSendTransaction({
            connection,
            mint,
            tokenProgramId: token.tokenProgramId,
            teacher: treasury,
            student: studentPk,
            amountRaw: raw,
          })
        : await (async () => {
            const info = await fetchTokenDelegateInfo({
              connection,
              mint,
              owner: treasury,
              tokenProgramId: token.tokenProgramId,
            })
            if (!info.delegate || !info.delegate.equals(publicKey)) {
              throw new Error(
                'Connected wallet is not the approved treasury delegate. Connect treasury wallet to authorize it.',
              )
            }
            if (raw > info.delegatedAmountRaw) {
              throw new Error(
                `Amount exceeds remaining delegate allowance (${rawToUi(
                  info.delegatedAmountRaw,
                  token.decimals,
                )} ${symbol}).`,
              )
            }
            return buildDelegateSendTransaction({
              connection,
              mint,
              tokenProgramId: token.tokenProgramId,
              treasury,
              delegate: publicKey,
              student: studentPk,
              amountRaw: raw,
            })
          })()
      const sig = await sendTransaction(tx, connection, {
        preflightCommitment: 'confirmed',
        maxRetries: 5,
      })
      await confirmSignatureWithPolling(connection, sig, { commitment: 'confirmed' })
      const list = appendActivity({
        kind: 'transfer',
        message: `Sent ~${sendUi} ${symbol} to ${truncateAddress(studentPk.toBase58(), 6, 4)}.`,
        signature: sig,
      })
      setActivity(list)
      await refreshTreasuryBalance()
      await refreshDelegateInfo()
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
    refreshDelegateInfo,
    refreshTreasuryBalance,
    sendTransaction,
    sendUi,
    studentAddr,
    symbol,
    token,
    treasury,
  ])

  const treasuryLabel =
    token.status === 'ready'
      ? rawToUi(treasuryBalance, token.decimals)
      : token.status === 'loading'
        ? '…'
        : '—'

  const supplyLabel =
    token.status === 'ready' ? rawToUi(token.supply, token.decimals) : '—'
  const connectedWallet = publicKey?.toBase58() ?? null
  const isConnectedDelegate = Boolean(
    connected && publicKey && delegateOnChain && publicKey.equals(delegateOnChain),
  )
  const profileWalletPending = Boolean(
    session && profile?.wallet_address?.startsWith('pending:'),
  )
  const profileWalletMismatch = Boolean(
    session &&
      profile?.wallet_address &&
      connectedWallet &&
      !profile.wallet_address.startsWith('pending:') &&
      profile.wallet_address !== connectedWallet,
  )

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Teacher dashboard</h1>
        <p className="mt-2 text-base-content/80">
          Devnet setup: treasury balance, sending {symbol} rewards to students, and payout tools.
        </p>
        {session && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-xs">
            <span className="font-semibold">Institution:</span>
            <span className={profile?.institution_id ? undefined : 'text-warning'}>
              {profile?.institution_id ? 'Linked to an institution' : 'Not linked yet'}
            </span>
          </div>
        )}
      </div>

      {mint && treasury && token.status === 'ready' && (
        <div className="alert alert-success mb-6">
          <span>
            Reward token <strong>{truncateAddress(mint.toBase58(), 6, 6)}</strong> · Treasury{' '}
            <strong>{truncateAddress(treasury.toBase58(), 6, 6)}</strong> · Total supply: {supplyLabel}{' '}
            {symbol} · Decimals: {token.decimals}.
          </span>
        </div>
      )}

      {token.status === 'error' && mint && (
        <div className="alert alert-warning mb-6" role="alert">
          <span>{token.message}</span>
        </div>
      )}

      {(!mint || !treasury) && (
        <div className="alert alert-warning mb-6" role="status">
          <span>
            Configure the reward token mint and treasury wallet in your environment file, restart the
            dev server, and keep Phantom on <strong>devnet</strong> so balances load correctly.
          </span>
        </div>
      )}

      {err && (
        <div className="alert alert-error mb-6" role="alert">
          <span>{err}</span>
        </div>
      )}

      {(profileWalletPending || profileWalletMismatch) && (
        <div className="alert alert-warning mb-6" role="status">
          <span>
            Your auth profile wallet is not linked to this connected wallet yet. Connect the intended
            wallet and send a new magic link so ScholarFi can link your profile automatically.
          </span>
        </div>
      )}

      {!session && (
        <div className="alert alert-info mb-6">
          <div className="w-full">
            <h3 className="font-semibold">Supabase sign-in</h3>
            <SupabaseMagicLink
              walletAddress={publicKey?.toBase58() ?? null}
              roleHint="teacher"
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Network &amp; token setup</h2>
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-base-content/60">Cluster</dt>
                <dd className="font-medium">Devnet</dd>
              </div>
              <div>
                <dt className="text-base-content/60">Connected wallet</dt>
                <dd className="flex flex-col gap-0.5">
                  {connected && publicKey ? (
                    <>
                      <span className="font-mono" title={publicKey.toBase58()}>
                        {truncateAddress(publicKey.toBase58(), 8, 8)}
                      </span>
                      {treasury ? (
                        isTreasuryWallet ? (
                          <span className="text-success text-xs">Connected as treasury wallet</span>
                        ) : isConnectedDelegate ? (
                          <span className="text-info text-xs">
                            Connected as approved delegate — you can send pending payouts.
                          </span>
                        ) : (
                          <span className="text-warning text-xs">
                            Not the treasury or delegate wallet — connect one of those to send rewards.
                          </span>
                        )
                      ) : null}
                    </>
                  ) : (
                    <span className="text-base-content/60">Not connected — use Phantom on devnet</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-base-content/60">Reward token (mint)</dt>
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
                    <span className="text-warning">Not configured</span>
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
                    <span className="text-warning">Not configured</span>
                  )}
                </dd>
              </div>
              {token.status === 'ready' && (
                <>
                  <div>
                    <dt className="text-base-content/60">Decimals</dt>
                    <dd className="tabular-nums">{token.decimals}</dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Token program</dt>
                    <dd>
                      {token.tokenProgramId.equals(TOKEN_2022_PROGRAM_ID)
                        ? 'Token-2022'
                        : 'SPL Token'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Total token supply</dt>
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
              SPL balance of the treasury wallet&apos;s ATA for {symbol}. This is separate from
              native SOL: sending rewards spends {symbol} tokens, not lamports (SOL only pays network
              fees).
            </p>
            {token.status === 'ready' && treasuryBalance === 0n && treasury && mint && (
              <div className="alert alert-warning text-sm" role="status">
                <span>
                  Treasury has <strong>0</strong> {symbol} in its token account. Fund it by minting
                  to the treasury or transferring {symbol} to the treasury address on devnet — holding
                  SOL alone will not enable payouts.
                </span>
              </div>
            )}
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

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Delegate payouts</h2>
            <p className="text-sm text-base-content/70">
              Treasury can authorize one delegate wallet to send payouts without reconnecting treasury.
            </p>
            <div className="rounded-md border border-base-content/10 bg-base-200 p-3 text-xs">
              <div>
                Current delegate:{' '}
                {delegateOnChain ? (
                  <span className="font-mono">{truncateAddress(delegateOnChain.toBase58(), 8, 6)}</span>
                ) : (
                  <span>None</span>
                )}
              </div>
              <div>
                Remaining allowance:{' '}
                {token.status === 'ready'
                  ? `${rawToUi(delegateAllowanceRaw, token.decimals)} ${symbol}`
                  : '—'}
              </div>
            </div>
            {isTreasuryWallet ? (
              <>
                <label className="form-control w-full">
                  <span className="label-text">Delegate wallet</span>
                  <input
                    type="text"
                    className="input input-bordered font-mono text-sm"
                    placeholder="Teacher wallet to authorize"
                    value={delegateAddr}
                    onChange={(e) => setDelegateAddr(e.target.value)}
                  />
                </label>
                <label className="form-control w-full max-w-xs">
                  <span className="label-text">Allowance ({symbol}, UI)</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input input-bordered"
                    value={delegateAllowanceUi}
                    onChange={(e) => setDelegateAllowanceUi(e.target.value)}
                  />
                </label>
                <div className="card-actions justify-end">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={delegateBusy || token.status !== 'ready' || !mint || !treasury}
                    onClick={() => void handleAuthorizeDelegate()}
                  >
                    {delegateBusy ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      'Approve delegate'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-base-content/60">
                Connect treasury wallet to set or update delegate allowance.
              </p>
            )}
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
                This account is not set up as a teacher. Only teacher accounts can create tasks here.
              </p>
            ) : !profile?.institution_id ? (
              <p className="text-sm text-warning">
                Link your profile to a school so tasks are scoped to the right institution.
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
                Students who completed a task appear here. Send using treasury wallet or the approved
                delegate wallet.
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
                              disabled={sendingRewardId === r.id}
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

        {(isTreasuryWallet || isConnectedDelegate) && mint && treasury && token.status === 'ready' && (
          <section className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body">
              <h2 className="card-title">Send test reward</h2>
              <p className="text-sm text-base-content/80">
                {isTreasuryWallet
                  ? `You are connected as treasury. Transfer ${symbol} from treasury ATA to a student wallet.`
                  : `You are connected as approved delegate. Transfer ${symbol} from treasury ATA using delegated allowance.`}
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

        {!isTreasuryWallet && !isConnectedDelegate && treasury && connected && (
          <div className="alert alert-warning md:col-span-2">
            <span>
              Send test rewards only as treasury or approved delegate. Treasury:{' '}
              {truncateAddress(treasury.toBase58(), 6, 4)}
              {delegateOnChain
                ? ` · Delegate: ${truncateAddress(delegateOnChain.toBase58(), 6, 4)}.`
                : '.'}
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
