import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  appendActivity,
  loadActivity,
  type ActivityEntry,
} from '../lib/activityStorage.ts'
import {
  buildTeacherSendTransaction,
  fetchMintDecimals,
  fetchTokenBalanceRaw,
  parseRewardMint,
  parseTreasuryPubkey,
  rawToUi,
  uiToRaw,
} from '../lib/splReward.ts'
import { truncateAddress } from '../utils/truncateAddress.ts'

const EXPLORER = 'https://explorer.solana.com'

export function TeacherDashboard() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const mint = useMemo(() => parseRewardMint(), [])
  const treasury = useMemo(() => parseTreasuryPubkey(), [])

  const isTreasuryWallet =
    treasury && publicKey ? publicKey.equals(treasury) : false

  const [decimals, setDecimals] = useState<number | null>(null)
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(0n)
  const [studentAddr, setStudentAddr] = useState('')
  const [sendUi, setSendUi] = useState('10')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>(() => loadActivity())

  const refreshTreasuryBalance = useCallback(async () => {
    if (!mint || !treasury) {
      setTreasuryBalance(0n)
      setDecimals(null)
      return
    }
    try {
      const d = await fetchMintDecimals(connection, mint)
      setDecimals(d)
      const raw = await fetchTokenBalanceRaw(connection, treasury, mint)
      setTreasuryBalance(raw)
    } catch (e) {
      console.error(e)
    }
  }, [connection, mint, treasury])

  useEffect(() => {
    void refreshTreasuryBalance()
  }, [refreshTreasuryBalance])

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

    const dec = decimals ?? (await fetchMintDecimals(connection, mint))
    const raw = uiToRaw(Number(sendUi), dec)
    if (raw <= 0n) {
      setErr('Enter a positive amount.')
      return
    }
    const teacherBal = await fetchTokenBalanceRaw(connection, publicKey, mint)
    if (raw > teacherBal) {
      setErr('Amount exceeds your treasury token balance.')
      return
    }

    setBusy(true)
    try {
      const tx = await buildTeacherSendTransaction({
        connection,
        mint,
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
        message: `Sent ~${sendUi} reward tokens to ${truncateAddress(studentPk.toBase58(), 6, 4)}. Sig ${sig.slice(0, 8)}…`,
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
    decimals,
    isTreasuryWallet,
    mint,
    publicKey,
    refreshTreasuryBalance,
    sendTransaction,
    sendUi,
    studentAddr,
  ])

  const treasuryLabel =
    mint && decimals !== null ? rawToUi(treasuryBalance, decimals) : '—'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Teacher dashboard</h1>
        <p className="mt-2 text-base-content/80">
          Program context on devnet, treasury balance, and optional SPL transfers to students.
        </p>
      </div>

      {err && (
        <div className="alert alert-error mb-6" role="alert">
          <span>{err}</span>
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
                      href={`${EXPLORER}/address/${mint.toBase58()}?cluster=devnet`}
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
                      href={`${EXPLORER}/address/${treasury.toBase58()}?cluster=devnet`}
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
            </dl>
          </div>
        </section>

        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Treasury token balance</h2>
            <p className="text-3xl font-semibold tabular-nums">{treasuryLabel}</p>
            <p className="text-sm text-base-content/70">
              Read-only: SPL balance of the treasury wallet for the reward mint.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void refreshTreasuryBalance()}
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="card border border-dashed border-base-content/20 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content/70">Assignments</h2>
            <p className="text-sm text-base-content/60">
              Creating and distributing coursework requires persistent data. Connect Supabase or
              another backend to store assignments per class.
            </p>
          </div>
        </section>

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

        {isTreasuryWallet && mint && treasury && (
          <section className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body">
              <h2 className="card-title">Send test reward</h2>
              <p className="text-sm text-base-content/80">
                You are connected as the treasury wallet. Transfer reward tokens from your
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
                    'Send SPL reward'
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
                      <span className="text-sm">{a.message}</span>
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
