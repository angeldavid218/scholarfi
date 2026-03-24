-- Harden task completion -> reward payout data integrity and authorization.

-- 1) Keep reward token amount as text for backward compatibility, but enforce
--    numeric-positive values at the DB level.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_reward_token_amount_positive_numeric_chk'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_reward_token_amount_positive_numeric_chk
      check (
        reward_token_amount ~ '^[0-9]+(\.[0-9]+)?$'
        and reward_token_amount::numeric > 0
      );
  end if;
end
$$;

-- 2) Prevent duplicate "assignment_completed" rows for the same user+task.
create unique index if not exists academic_actions_unique_assignment_task_idx
  on public.academic_actions (user_id, source_reference)
  where action_type = 'assignment_completed' and source_reference is not null;

-- 3) Enable RLS and add minimum policies for student/teacher workflows.
alter table public.academic_actions enable row level security;
alter table public.user_rewards enable row level security;
alter table public.reward_wallet_transactions enable row level security;

-- academic_actions policies
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'academic_actions'
      and policyname = 'academic_actions_select_owner_or_teacher_same_institution'
  ) then
    create policy "academic_actions_select_owner_or_teacher_same_institution"
      on public.academic_actions
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.profiles teacher
          join public.profiles student on student.id = academic_actions.user_id
          where teacher.id = auth.uid()
            and teacher.role in ('teacher', 'admin')
            and teacher.institution_id is not null
            and teacher.institution_id = student.institution_id
            and student.institution_id = academic_actions.institution_id
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'academic_actions'
      and policyname = 'academic_actions_insert_self_same_institution'
  ) then
    create policy "academic_actions_insert_self_same_institution"
      on public.academic_actions
      for insert
      with check (
        user_id = auth.uid()
        and exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.institution_id is not null
            and p.institution_id = academic_actions.institution_id
        )
      );
  end if;
end
$$;

-- user_rewards policies
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_rewards'
      and policyname = 'user_rewards_select_owner_or_teacher_same_institution'
  ) then
    create policy "user_rewards_select_owner_or_teacher_same_institution"
      on public.user_rewards
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.profiles teacher
          join public.profiles student on student.id = user_rewards.user_id
          where teacher.id = auth.uid()
            and teacher.role in ('teacher', 'admin')
            and teacher.institution_id is not null
            and teacher.institution_id = student.institution_id
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_rewards'
      and policyname = 'user_rewards_insert_self_only'
  ) then
    create policy "user_rewards_insert_self_only"
      on public.user_rewards
      for insert
      with check (
        user_id = auth.uid()
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_rewards'
      and policyname = 'user_rewards_update_owner_or_teacher_same_institution'
  ) then
    create policy "user_rewards_update_owner_or_teacher_same_institution"
      on public.user_rewards
      for update
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.profiles teacher
          join public.profiles student on student.id = user_rewards.user_id
          where teacher.id = auth.uid()
            and teacher.role in ('teacher', 'admin')
            and teacher.institution_id is not null
            and teacher.institution_id = student.institution_id
        )
      )
      with check (
        user_id = auth.uid()
        or exists (
          select 1
          from public.profiles teacher
          join public.profiles student on student.id = user_rewards.user_id
          where teacher.id = auth.uid()
            and teacher.role in ('teacher', 'admin')
            and teacher.institution_id is not null
            and teacher.institution_id = student.institution_id
        )
      );
  end if;
end
$$;

-- reward_wallet_transactions policies
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reward_wallet_transactions'
      and policyname = 'reward_wallet_transactions_select_owner_or_teacher_same_institution'
  ) then
    create policy "reward_wallet_transactions_select_owner_or_teacher_same_institution"
      on public.reward_wallet_transactions
      for select
      using (
        exists (
          select 1
          from public.user_rewards ur
          join public.profiles student on student.id = ur.user_id
          left join public.profiles teacher on teacher.id = auth.uid()
          where ur.id = reward_wallet_transactions.user_reward_id
            and (
              ur.user_id = auth.uid()
              or (
                teacher.role in ('teacher', 'admin')
                and teacher.institution_id is not null
                and teacher.institution_id = student.institution_id
              )
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reward_wallet_transactions'
      and policyname = 'reward_wallet_transactions_insert_teacher_same_institution'
  ) then
    create policy "reward_wallet_transactions_insert_teacher_same_institution"
      on public.reward_wallet_transactions
      for insert
      with check (
        exists (
          select 1
          from public.user_rewards ur
          join public.profiles student on student.id = ur.user_id
          join public.profiles teacher on teacher.id = auth.uid()
          where ur.id = reward_wallet_transactions.user_reward_id
            and teacher.role in ('teacher', 'admin')
            and teacher.institution_id is not null
            and teacher.institution_id = student.institution_id
        )
      );
  end if;
end
$$;
