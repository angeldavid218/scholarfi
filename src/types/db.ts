/**
 * Row shapes aligned with public.* tables (ScholarFi Supabase schema).
 * Expand as you add tables or generate types via: supabase gen types typescript --project-id <ref>
 */

export type ProfileRole = 'student' | 'teacher' | 'admin' | 'partner'
export type ProfileStatus = 'active' | 'inactive' | 'suspended'

export interface ProfileRow {
  id: string
  wallet_address: string
  role: ProfileRole
  full_name: string | null
  email: string | null
  institution_id: string | null
  status: ProfileStatus
  created_at: string
  updated_at: string
}

export type AcademicActionType =
  | 'assignment_completed'
  | 'quiz_passed'
  | 'attendance_recorded'
  | 'monthly_streak'
  | 'milestone_completed'
  | 'exam_passed'
  | 'manual_reward_event'

export type AcademicActionSource = 'manual' | 'classroom' | 'csv' | 'api'
export type AcademicActionStatus = 'pending' | 'verified' | 'rejected'

export interface AcademicActionRow {
  id: string
  user_id: string
  institution_id: string
  action_type: AcademicActionType
  title: string
  description: string | null
  source: AcademicActionSource
  source_reference: string | null
  status: AcademicActionStatus
  metadata: Record<string, unknown> | null
  occurred_at: string
  created_at: string
  updated_at: string
}

export type UserRewardType = 'points' | 'token' | 'badge'
export type UserRewardStatus =
  | 'granted'
  | 'pending_mint'
  | 'minted'
  | 'redeemed'
  | 'cancelled'

export interface UserRewardRow {
  id: string
  user_id: string
  academic_action_id: string | null
  reward_rule_id: string | null
  reward_type: UserRewardType
  points_amount: number
  token_amount: string | null
  badge_code: string | null
  status: UserRewardStatus
  tx_signature: string | null
  mint_address: string | null
  granted_at: string
  created_at: string
  updated_at: string
}

/** Teacher-authored tasks; completions link via academic_actions.source_reference = tasks.id */
export interface TaskRow {
  id: string
  institution_id: string
  created_by: string
  title: string
  description: string | null
  reward_token_amount: string
  created_at: string
  updated_at: string
}
