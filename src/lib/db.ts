import { supabase } from './supabaseClient.ts'
import type {
  AcademicActionRow,
  AcademicActionSource,
  AcademicActionType,
  ProfileRow,
  TaskRow,
  UserRewardRow,
} from '../types/db.ts'

const PROFILE_ROLES = new Set<ProfileRow['role']>([
  'student',
  'teacher',
  'admin',
  'partner',
])

const DEMO_DEFAULT_INSTITUTION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

function resolveDefaultInstitutionId(): string {
  const raw = import.meta.env.VITE_DEFAULT_INSTITUTION_ID
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim()
  }
  return DEMO_DEFAULT_INSTITUTION_ID
}

function parseProfileRole(raw: unknown): ProfileRow['role'] {
  if (typeof raw !== 'string') return 'student'
  return PROFILE_ROLES.has(raw as ProfileRow['role'])
    ? (raw as ProfileRow['role'])
    : 'student'
}

function isDuplicateAssignmentCompletionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybe = error as { code?: string; message?: string; details?: string }
  return (
    maybe.code === '23505' &&
    ((maybe.message?.includes('academic_actions_unique_assignment_task_idx') ??
      false) ||
      (maybe.details?.includes('academic_actions_unique_assignment_task_idx') ??
        false))
  )
}

/**
 * Read a profile by wallet (public key string). Works if RLS allows (e.g. own row or policy on wallet lookup).
 */
export async function getProfileByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress.trim())
    .maybeSingle()

  return { data: data as ProfileRow | null, error }
}

/**
 * Current user's profile (requires Supabase Auth session; profiles.id = auth.users.id).
 */
export async function getMyProfile() {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle()
  return { data: data as ProfileRow | null, error }
}

export async function syncMyProfileWithWallet(walletAddress: string) {
  const wallet = walletAddress.trim()
  if (!wallet) {
    return { data: null, error: new Error('Wallet address is required.') }
  }
  const defaultInstitutionId = resolveDefaultInstitutionId()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  const user = userData.user
  const uid = user?.id
  if (!uid) {
    return {
      data: null,
      error: authError ?? new Error('Not signed in with Supabase.'),
    }
  }

  const role = parseProfileRole(user.user_metadata?.role)
  const fullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null
  const institutionId =
    typeof user.user_metadata?.institution_id === 'string'
      ? user.user_metadata.institution_id
      : null

  const { data: existingProfile, error: existingErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (existingErr) return { data: null, error: existingErr }

  const { data: conflict, error: conflictErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet_address', wallet)
    .neq('id', uid)
    .maybeSingle()

  if (conflictErr) return { data: null, error: conflictErr }
  if (conflict) {
    return {
      data: null,
      error: new Error('This wallet is already linked to another profile.'),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: uid,
        wallet_address: wallet,
        role: existingProfile?.role ?? role,
        full_name: existingProfile?.full_name ?? fullName,
        email: user.email ?? null,
        institution_id:
          existingProfile?.institution_id ?? institutionId ?? defaultInstitutionId,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  return { data: data as ProfileRow | null, error }
}

/**
 * Academic actions for the signed-in user (RLS: auth.uid() = user_id).
 */
export async function listMyAcademicActions(limit = 50) {
  const { data, error } = await supabase
    .from('academic_actions')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  return { data: (data ?? []) as AcademicActionRow[], error }
}

export type InsertAcademicActionInput = {
  userId: string
  institutionId: string
  actionType: AcademicActionType
  title: string
  description?: string | null
  source?: AcademicActionSource
  sourceReference?: string | null
  status?: AcademicActionRow['status']
  metadata?: Record<string, unknown> | null
  occurredAt?: string
}

/**
 * Insert an academic action row.
 * Requires an RLS policy allowing INSERT for this role (your starter SQL only had SELECT on own rows).
 */
export async function insertAcademicAction(input: InsertAcademicActionInput) {
  const occurredAt = input.occurredAt ?? new Date().toISOString()
  const { data, error } = await supabase
    .from('academic_actions')
    .insert({
      user_id: input.userId,
      institution_id: input.institutionId,
      action_type: input.actionType,
      title: input.title,
      description: input.description ?? null,
      source: input.source ?? 'manual',
      source_reference: input.sourceReference ?? null,
      status: input.status ?? 'pending',
      metadata: input.metadata ?? null,
      occurred_at: occurredAt,
    })
    .select()
    .single()

  return { data: data as AcademicActionRow | null, error }
}

/**
 * Same as insertAcademicAction but sets userId from the current Supabase session.
 */
export async function insertMyAcademicAction(
  input: Omit<InsertAcademicActionInput, 'userId'>,
) {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) {
    return {
      data: null,
      error: authError ?? new Error('Not signed in with Supabase.'),
    }
  }
  return insertAcademicAction({ ...input, userId: uid })
}

/**
 * Rewards for the signed-in user (RLS: auth.uid() = user_id).
 */
export async function listMyUserRewards(limit = 50) {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('*')
    .order('granted_at', { ascending: false })
    .limit(limit)

  return { data: (data ?? []) as UserRewardRow[], error }
}

export type PatchUserRewardTxInput = {
  rewardId: string
  txSignature: string
  status?: UserRewardRow['status']
  mintAddress?: string | null
}

/**
 * After an on-chain SPL transfer, persist the tx signature on the reward row.
 * Requires RLS UPDATE policy for the user (or run via Edge Function with service role).
 */
export async function patchUserRewardTxSignature(input: PatchUserRewardTxInput) {
  const { data, error } = await supabase
    .from('user_rewards')
    .update({
      tx_signature: input.txSignature,
      status: input.status ?? 'minted',
      mint_address: input.mintAddress ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.rewardId)
    .select()
    .single()

  return { data: data as UserRewardRow | null, error }
}

export type InsertUserRewardInput = {
  userId: string
  academicActionId: string
  tokenAmount: string
  status?: UserRewardRow['status']
}

export async function insertUserReward(input: InsertUserRewardInput) {
  const { data, error } = await supabase
    .from('user_rewards')
    .insert({
      user_id: input.userId,
      academic_action_id: input.academicActionId,
      reward_rule_id: null,
      reward_type: 'token',
      points_amount: 0,
      token_amount: input.tokenAmount,
      badge_code: null,
      status: input.status ?? 'pending_mint',
    })
    .select()
    .single()

  return { data: data as UserRewardRow | null, error }
}

export async function listTasksForInstitution(institutionId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })

  return { data: (data ?? []) as TaskRow[], error }
}

export type InsertTaskInput = {
  institutionId: string
  createdBy: string
  title: string
  description?: string | null
  rewardTokenAmount: string
}

export async function insertTask(input: InsertTaskInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      institution_id: input.institutionId,
      created_by: input.createdBy,
      title: input.title,
      description: input.description ?? null,
      reward_token_amount: input.rewardTokenAmount,
    })
    .select()
    .single()

  return { data: data as TaskRow | null, error }
}

/**
 * Task ids the current user has already completed (assignment_completed + source_reference).
 */
export async function listMyCompletedTaskIds() {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) {
    return { data: [] as string[], error: authError ?? new Error('Not signed in with Supabase.') }
  }
  const { data, error } = await supabase
    .from('academic_actions')
    .select('source_reference')
    .eq('user_id', uid)
    .eq('action_type', 'assignment_completed')
    .not('source_reference', 'is', null)

  if (error) return { data: [] as string[], error }
  const ids = (data ?? [])
    .map((r) => r.source_reference)
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
  return { data: ids, error: null }
}

export type PendingTokenRewardRow = UserRewardRow & {
  student_wallet_address: string
  task_title: string
}

export type InsertRewardWalletTransactionInput = {
  userRewardId: string
  walletAddress: string
  transactionType: 'mint' | 'transfer'
  network: 'devnet' | 'testnet' | 'mainnet-beta'
  txSignature: string
  tokenMintAddress?: string | null
  amount?: string | null
  status?: 'pending' | 'confirmed' | 'failed'
}

/**
 * Pending SPL rewards for learners in the same institution (teacher fulfills on-chain).
 */
export async function listPendingTokenRewardsForInstitution(
  institutionId: string,
): Promise<{ data: PendingTokenRewardRow[]; error: Error | null }> {
  const { data: rewards, error: rErr } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('status', 'pending_mint')
    .eq('reward_type', 'token')

  if (rErr) return { data: [], error: rErr }

  const list = (rewards ?? []) as UserRewardRow[]
  if (list.length === 0) return { data: [], error: null }

  const userIds = [...new Set(list.map((r) => r.user_id))]
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (pErr) return { data: [], error: pErr }

  const profileById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? [])
  const inInstitution = list.filter(
    (r) => profileById.get(r.user_id)?.institution_id === institutionId,
  )

  const actionIds = inInstitution
    .map((r) => r.academic_action_id)
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
  if (actionIds.length === 0) return { data: [], error: null }

  const { data: actions, error: aErr } = await supabase
    .from('academic_actions')
    .select('*')
    .in('id', actionIds)

  if (aErr) return { data: [], error: aErr }

  const actionById = new Map((actions as AcademicActionRow[] | null)?.map((a) => [a.id, a]) ?? [])

  const out: PendingTokenRewardRow[] = []
  for (const r of inInstitution) {
    const p = profileById.get(r.user_id)
    const aa = r.academic_action_id ? actionById.get(r.academic_action_id) : undefined
    if (!p?.wallet_address || !aa) continue
    out.push({
      ...r,
      student_wallet_address: p.wallet_address,
      task_title: aa.title,
    })
  }

  return { data: out, error: null }
}

export async function insertRewardWalletTransaction(
  input: InsertRewardWalletTransactionInput,
) {
  const { data, error } = await supabase
    .from('reward_wallet_transactions')
    .insert({
      user_reward_id: input.userRewardId,
      wallet_address: input.walletAddress,
      transaction_type: input.transactionType,
      network: input.network,
      tx_signature: input.txSignature,
      token_mint_address: input.tokenMintAddress ?? null,
      amount: input.amount ?? null,
      status: input.status ?? 'confirmed',
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Student marks a task complete: verified academic_action + pending_mint user_reward.
 */
export async function completeTaskForCurrentUser(taskId: string) {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  const studentId = userData.user?.id
  if (!studentId) {
    return {
      data: null,
      error: authError ?? new Error('Not signed in with Supabase.'),
    }
  }

  const { data: existing } = await supabase
    .from('academic_actions')
    .select('id')
    .eq('user_id', studentId)
    .eq('source_reference', taskId)
    .maybeSingle()

  if (existing) {
    return { data: null, error: new Error('You already completed this task.') }
  }

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle()

  if (taskErr || !task) {
    return { data: null, error: taskErr ?? new Error('Task not found.') }
  }

  const taskRow = task as TaskRow

  const { data: profile } = await supabase.from('profiles').select('institution_id').eq('id', studentId).maybeSingle()

  const inst = profile as Pick<ProfileRow, 'institution_id'> | null
  if (!inst?.institution_id || inst.institution_id !== taskRow.institution_id) {
    return {
      data: null,
      error: new Error('Your profile institution does not match this task.'),
    }
  }

  const { data: action, error: aErr } = await insertAcademicAction({
    userId: studentId,
    institutionId: taskRow.institution_id,
    actionType: 'assignment_completed',
    title: taskRow.title,
    description: taskRow.description,
    source: 'classroom',
    sourceReference: taskId,
    status: 'verified',
    metadata: { task_id: taskId },
  })

  if (isDuplicateAssignmentCompletionError(aErr)) {
    return { data: null, error: new Error('You already completed this task.') }
  }
  if (aErr || !action) {
    return { data: null, error: aErr ?? new Error('Could not record completion.') }
  }

  const { data: reward, error: rwErr } = await insertUserReward({
    userId: studentId,
    academicActionId: action.id,
    tokenAmount: taskRow.reward_token_amount,
    status: 'pending_mint',
  })

  if (rwErr || !reward) {
    return { data: null, error: rwErr ?? new Error('Could not create reward row.') }
  }

  return { data: { action, reward, task: taskRow }, error: null }
}
