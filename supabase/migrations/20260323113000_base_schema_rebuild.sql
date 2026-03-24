-- Rebuild base schema after accidental table deletion.
-- This migration is ordered to satisfy foreign keys and can be pushed to Supabase cloud.

create extension if not exists pgcrypto;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  city text,
  type text check (type = any (array['school', 'university', 'academy', 'other'])),
  status text not null default 'active' check (status = any (array['active', 'inactive'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_email text,
  status text not null default 'active' check (status = any (array['active', 'inactive'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  action_type text not null check (
    action_type = any (array[
      'assignment_completed',
      'quiz_passed',
      'attendance_recorded',
      'monthly_streak',
      'milestone_completed',
      'exam_passed',
      'manual_reward_event'
    ])
  ),
  reward_type text not null check (reward_type = any (array['points', 'token', 'badge'])),
  points_amount integer not null default 0 check (points_amount >= 0),
  token_amount numeric,
  badge_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.benefits (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  title text not null,
  description text,
  cost_points integer check (cost_points is null or cost_points >= 0),
  cost_tokens numeric,
  stock integer check (stock is null or stock >= 0),
  status text not null default 'active' check (status = any (array['active', 'inactive', 'sold_out'])),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  wallet_address text not null unique,
  role text not null default 'student' check (role = any (array['student', 'teacher', 'admin', 'partner'])),
  full_name text,
  email text,
  institution_id uuid references public.institutions(id),
  status text not null default 'active' check (status = any (array['active', 'inactive', 'suspended'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  reward_token_amount text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  institution_id uuid not null references public.institutions(id),
  action_type text not null check (
    action_type = any (array[
      'assignment_completed',
      'quiz_passed',
      'attendance_recorded',
      'monthly_streak',
      'milestone_completed',
      'exam_passed',
      'manual_reward_event'
    ])
  ),
  title text not null,
  description text,
  source text not null check (source = any (array['manual', 'classroom', 'csv', 'api'])),
  source_reference text,
  status text not null default 'pending' check (status = any (array['pending', 'verified', 'rejected'])),
  metadata jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_evidences (
  id uuid primary key default gen_random_uuid(),
  academic_action_id uuid not null references public.academic_actions(id),
  evidence_type text not null check (evidence_type = any (array['url', 'file', 'hash', 'manual_note'])),
  evidence_value text not null,
  verified_by_user_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  academic_action_id uuid references public.academic_actions(id),
  reward_rule_id uuid references public.reward_rules(id),
  reward_type text not null check (reward_type = any (array['points', 'token', 'badge'])),
  points_amount integer not null default 0 check (points_amount >= 0),
  token_amount numeric,
  badge_code text,
  status text not null default 'granted' check (
    status = any (array['granted', 'pending_mint', 'minted', 'redeemed', 'cancelled'])
  ),
  tx_signature text,
  mint_address text,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_reward_id uuid not null references public.user_rewards(id),
  wallet_address text not null,
  transaction_type text not null check (transaction_type = any (array['mint', 'transfer'])),
  network text not null check (network = any (array['devnet', 'testnet', 'mainnet-beta'])),
  tx_signature text not null,
  token_mint_address text,
  amount numeric,
  status text not null default 'confirmed' check (status = any (array['pending', 'confirmed', 'failed'])),
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  benefit_id uuid not null references public.benefits(id),
  user_reward_id uuid references public.user_rewards(id),
  points_spent integer not null default 0 check (points_spent >= 0),
  tokens_spent numeric,
  status text not null default 'pending' check (status = any (array['pending', 'approved', 'completed', 'rejected'])),
  redemption_code text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_institution_id_idx on public.tasks(institution_id);
create index if not exists academic_actions_user_id_idx on public.academic_actions(user_id);
create index if not exists academic_actions_source_reference_idx on public.academic_actions(source_reference);
create index if not exists user_rewards_user_id_idx on public.user_rewards(user_id);
create index if not exists user_rewards_status_idx on public.user_rewards(status);
create index if not exists reward_wallet_transactions_user_reward_id_idx on public.reward_wallet_transactions(user_reward_id);
