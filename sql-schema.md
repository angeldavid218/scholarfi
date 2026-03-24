-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academic_actions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
institution_id uuid NOT NULL,
action_type text NOT NULL CHECK (action_type = ANY (ARRAY['assignment_completed'::text, 'quiz_passed'::text, 'attendance_recorded'::text, 'monthly_streak'::text, 'milestone_completed'::text, 'exam_passed'::text, 'manual_reward_event'::text])),
title text NOT NULL,
description text,
source text NOT NULL CHECK (source = ANY (ARRAY['manual'::text, 'classroom'::text, 'csv'::text, 'api'::text])),
source_reference text,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
metadata jsonb,
occurred_at timestamp with time zone NOT NULL,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT academic_actions_pkey PRIMARY KEY (id),
CONSTRAINT academic_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
CONSTRAINT academic_actions_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id)
);
CREATE TABLE public.action_evidences (
id uuid NOT NULL DEFAULT gen_random_uuid(),
academic_action_id uuid NOT NULL,
evidence_type text NOT NULL CHECK (evidence_type = ANY (ARRAY['url'::text, 'file'::text, 'hash'::text, 'manual_note'::text])),
evidence_value text NOT NULL,
verified_by_user_id uuid,
notes text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT action_evidences_pkey PRIMARY KEY (id),
CONSTRAINT action_evidences_academic_action_id_fkey FOREIGN KEY (academic_action_id) REFERENCES public.academic_actions(id),
CONSTRAINT action_evidences_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.benefits (
id uuid NOT NULL DEFAULT gen_random_uuid(),
partner_id uuid NOT NULL,
title text NOT NULL,
description text,
cost_points integer CHECK (cost_points IS NULL OR cost_points >= 0),
cost_tokens numeric,
stock integer CHECK (stock IS NULL OR stock >= 0),
status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'sold_out'::text])),
metadata jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT benefits_pkey PRIMARY KEY (id),
CONSTRAINT benefits_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.institutions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text NOT NULL,
country text,
city text,
type text CHECK (type = ANY (ARRAY['school'::text, 'university'::text, 'academy'::text, 'other'::text])),
status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT institutions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.partners (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text NOT NULL,
category text,
contact_email text,
status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT partners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
id uuid NOT NULL,
wallet_address text NOT NULL UNIQUE,
role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text, 'partner'::text])),
full_name text,
email text,
institution_id uuid,
status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT profiles_pkey PRIMARY KEY (id),
CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
CONSTRAINT profiles_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id)
);
CREATE TABLE public.redemptions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
benefit_id uuid NOT NULL,
user_reward_id uuid,
points_spent integer NOT NULL DEFAULT 0 CHECK (points_spent >= 0),
tokens_spent numeric,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'completed'::text, 'rejected'::text])),
redemption_code text,
redeemed_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT redemptions_pkey PRIMARY KEY (id),
CONSTRAINT redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
CONSTRAINT redemptions_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.benefits(id),
CONSTRAINT redemptions_user_reward_id_fkey FOREIGN KEY (user_reward_id) REFERENCES public.user_rewards(id)
);
CREATE TABLE public.reward_rules (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text NOT NULL,
action_type text NOT NULL CHECK (action_type = ANY (ARRAY['assignment_completed'::text, 'quiz_passed'::text, 'attendance_recorded'::text, 'monthly_streak'::text, 'milestone_completed'::text, 'exam_passed'::text, 'manual_reward_event'::text])),
reward_type text NOT NULL CHECK (reward_type = ANY (ARRAY['points'::text, 'token'::text, 'badge'::text])),
points_amount integer NOT NULL DEFAULT 0 CHECK (points_amount >= 0),
token_amount numeric,
badge_code text,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT reward_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reward_wallet_transactions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_reward_id uuid NOT NULL,
wallet_address text NOT NULL,
transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['mint'::text, 'transfer'::text])),
network text NOT NULL CHECK (network = ANY (ARRAY['devnet'::text, 'testnet'::text, 'mainnet-beta'::text])),
tx_signature text NOT NULL,
token_mint_address text,
amount numeric,
status text NOT NULL DEFAULT 'confirmed'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text])),
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT reward_wallet_transactions_pkey PRIMARY KEY (id),
CONSTRAINT reward_wallet_transactions_user_reward_id_fkey FOREIGN KEY (user_reward_id) REFERENCES public.user_rewards(id)
);
CREATE TABLE public.tasks (
id uuid NOT NULL DEFAULT gen_random_uuid(),
institution_id uuid NOT NULL,
created_by uuid NOT NULL,
title text NOT NULL,
description text,
reward_token_amount text NOT NULL DEFAULT '1'::text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT tasks_pkey PRIMARY KEY (id),
CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_rewards (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
academic_action_id uuid,
reward_rule_id uuid,
reward_type text NOT NULL CHECK (reward_type = ANY (ARRAY['points'::text, 'token'::text, 'badge'::text])),
points_amount integer NOT NULL DEFAULT 0 CHECK (points_amount >= 0),
token_amount numeric,
badge_code text,
status text NOT NULL DEFAULT 'granted'::text CHECK (status = ANY (ARRAY['granted'::text, 'pending_mint'::text, 'minted'::text, 'redeemed'::text, 'cancelled'::text])),
tx_signature text,
mint_address text,
granted_at timestamp with time zone NOT NULL DEFAULT now(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT user_rewards_pkey PRIMARY KEY (id),
CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
CONSTRAINT user_rewards_academic_action_id_fkey FOREIGN KEY (academic_action_id) REFERENCES public.academic_actions(id),
CONSTRAINT user_rewards_reward_rule_id_fkey FOREIGN KEY (reward_rule_id) REFERENCES public.reward_rules(id)
);
CREATE TABLE public.wallet_nonces (
id uuid NOT NULL DEFAULT gen_random_uuid(),
wallet_address text NOT NULL,
nonce text NOT NULL,
expires_at timestamp with time zone NOT NULL,
used_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT wallet_nonces_pkey PRIMARY KEY (id)
);
