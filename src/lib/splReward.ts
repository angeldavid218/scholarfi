import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token'
import {
  PublicKey,
  Transaction,
  type Connection,
} from '@solana/web3.js'

export function parseRewardMint(): PublicKey | null {
  const raw = import.meta.env.VITE_REWARD_MINT
  if (!raw || typeof raw !== 'string') return null
  try {
    return new PublicKey(raw.trim())
  } catch {
    return null
  }
}

/** Optional display name in the UI (e.g. `SCHOL`). */
export function rewardTokenSymbol(): string {
  const s = import.meta.env.VITE_REWARD_TOKEN_SYMBOL
  return typeof s === 'string' && s.trim() ? s.trim() : 'Reward'
}

export function parseTreasuryPubkey(): PublicKey | null {
  const raw = import.meta.env.VITE_TREASURY_PUBKEY
  if (!raw || typeof raw !== 'string') return null
  try {
    return new PublicKey(raw.trim())
  } catch {
    return null
  }
}

export async function fetchMintInfo(
  connection: Connection,
  mint: PublicKey,
): Promise<{ decimals: number; supply: bigint; tokenProgramId: PublicKey }> {
  const acc = await connection.getAccountInfo(mint, 'confirmed')
  if (!acc) {
    throw new Error(
      'Mint account not found on this cluster. Check VITE_REWARD_MINT and that Phantom uses Devnet.',
    )
  }
  let tokenProgramId: PublicKey
  if (acc.owner.equals(TOKEN_PROGRAM_ID)) {
    tokenProgramId = TOKEN_PROGRAM_ID
  } else if (acc.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    tokenProgramId = TOKEN_2022_PROGRAM_ID
  } else {
    throw new Error('VITE_REWARD_MINT is not an SPL token mint.')
  }
  const mintInfo = await getMint(connection, mint, 'confirmed', tokenProgramId)
  return {
    decimals: mintInfo.decimals,
    supply: mintInfo.supply,
    tokenProgramId,
  }
}

/** @deprecated Prefer fetchMintInfo for program id */
export async function fetchMintDecimals(
  connection: Connection,
  mint: PublicKey,
): Promise<number> {
  const { decimals } = await fetchMintInfo(connection, mint)
  return decimals
}

/** Raw token amount (smallest units), or 0n if no ATA. */
export async function fetchTokenBalanceRaw(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
): Promise<bigint> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
  try {
    const acc = await getAccount(connection, ata, 'confirmed', tokenProgramId)
    return acc.amount
  } catch {
    return 0n
  }
}

export function uiToRaw(amountUi: number, decimals: number): bigint {
  if (!Number.isFinite(amountUi) || amountUi < 0) return 0n
  const factor = 10 ** decimals
  return BigInt(Math.floor(amountUi * factor + 1e-9))
}

export function rawToUi(amount: bigint, decimals: number): string {
  const d = decimals
  if (d === 0) return amount.toString()
  const base = 10n ** BigInt(d)
  const whole = amount / base
  const frac = amount % base
  const fracStr = frac.toString().padStart(d, '0').replace(/0+$/, '')
  return fracStr.length ? `${whole}.${fracStr}` : `${whole}`
}

/**
 * User redeems: transfer from user's ATA to treasury ATA (user signs, pays fees).
 */
export async function buildRedeemTransaction(params: {
  connection: Connection
  mint: PublicKey
  tokenProgramId: PublicKey
  user: PublicKey
  treasury: PublicKey
  amountRaw: bigint
}): Promise<Transaction> {
  const { connection, mint, tokenProgramId, user, treasury, amountRaw } = params

  const userAta = getAssociatedTokenAddressSync(
    mint,
    user,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
  const treasuryAta = getAssociatedTokenAddressSync(
    mint,
    treasury,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  const tx = new Transaction()

  let treasuryAtaExists = true
  try {
    await getAccount(connection, treasuryAta, 'confirmed', tokenProgramId)
  } catch {
    treasuryAtaExists = false
  }

  if (!treasuryAtaExists) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstructionWithDerivation(
        user,
        treasury,
        mint,
        false,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )
  }

  tx.add(
    createTransferInstruction(
      userAta,
      treasuryAta,
      user,
      amountRaw,
      [],
      tokenProgramId,
    ),
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
    'confirmed',
  )
  tx.recentBlockhash = blockhash
  tx.lastValidBlockHeight = lastValidBlockHeight
  tx.feePayer = user

  return tx
}

/**
 * Teacher sends reward tokens to a student (teacher signs).
 */
export async function buildTeacherSendTransaction(params: {
  connection: Connection
  mint: PublicKey
  tokenProgramId: PublicKey
  teacher: PublicKey
  student: PublicKey
  amountRaw: bigint
}): Promise<Transaction> {
  const { connection, mint, tokenProgramId, teacher, student, amountRaw } = params

  const source = getAssociatedTokenAddressSync(
    mint,
    teacher,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
  const dest = getAssociatedTokenAddressSync(
    mint,
    student,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  const tx = new Transaction()

  let destExists = true
  try {
    await getAccount(connection, dest, 'confirmed', tokenProgramId)
  } catch {
    destExists = false
  }

  if (!destExists) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstructionWithDerivation(
        teacher,
        student,
        mint,
        false,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )
  }

  tx.add(
    createTransferInstruction(
      source,
      dest,
      teacher,
      amountRaw,
      [],
      tokenProgramId,
    ),
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
    'confirmed',
  )
  tx.recentBlockhash = blockhash
  tx.lastValidBlockHeight = lastValidBlockHeight
  tx.feePayer = teacher

  return tx
}
