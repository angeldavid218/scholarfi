-- Task definitions for a class/institution. Completions use existing tables:
-- academic_actions (assignment_completed, source_reference = tasks.id) and
-- user_rewards (pending_mint until treasury sends SPL).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  reward_token_amount text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_institution_id_idx on public.tasks (institution_id);

alter table public.tasks enable row level security;

-- Example policies (adjust to your deployment). Assumes public.profiles.id = auth.uid().
create policy "tasks_select_same_institution"
  on public.tasks for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.institution_id is not null
        and p.institution_id = tasks.institution_id
    )
  );

create policy "tasks_insert_teacher"
  on public.tasks for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.institution_id = tasks.institution_id
    )
  );

create policy "tasks_update_creator"
  on public.tasks for update
  using (created_by = auth.uid());

-- You may still need RLS on academic_actions and user_rewards, for example:
--   academic_actions: INSERT where auth.uid() = user_id
--   user_rewards: INSERT where auth.uid() = user_id; SELECT/UPDATE for teachers
--   sharing an institution with the reward recipient (see Supabase docs).
