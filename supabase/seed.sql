-- One-run bootstrap seed:
-- - creates institution
-- - creates teacher + student auth users (if missing)
-- - creates profiles
-- - creates one 10 SCHOL task, completion, and pending reward
--
-- Default credentials created by this seed:
--   teacher@test.com / Test1234!
--   student@test.com / Test1234!
--
-- Run with: supabase db reset

do $$
declare
  teacher_email text := 'teacher@test.com';
  student_email text := 'student@test.com';
  seed_password text := 'Test1234!';
  teacher_wallet text := 'TeacherWallet1111111111111111111111111111111';
  student_wallet text := 'StudentWallet1111111111111111111111111111111';

  seed_institution_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  teacher_id uuid := '11111111-1111-1111-1111-111111111111';
  student_id uuid := '22222222-2222-2222-2222-222222222222';
  flow_task_id uuid := '33333333-3333-3333-3333-333333333333';
  completion_action_id uuid := '44444444-4444-4444-4444-444444444444';
  reward_id uuid := '55555555-5555-5555-5555-555555555555';
begin
  -- Institution
  insert into public.institutions (id, name, status)
  values (seed_institution_id, 'ScholarFi Test School', 'active')
  on conflict (id) do update
    set name = excluded.name,
        status = excluded.status;

  -- Auth users (idempotent by id)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      teacher_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      teacher_email,
      crypt(seed_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      student_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      student_email,
      crypt(seed_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    )
  on conflict (id) do update
    set email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        updated_at = now();

  -- Profiles
  insert into public.profiles (
    id,
    wallet_address,
    role,
    full_name,
    email,
    institution_id,
    status
  )
  values
    (
      teacher_id,
      teacher_wallet,
      'teacher',
      'Teacher Test',
      teacher_email,
      seed_institution_id,
      'active'
    ),
    (
      student_id,
      student_wallet,
      'student',
      'Student Test',
      student_email,
      seed_institution_id,
      'active'
    )
  on conflict (id) do update
    set wallet_address = excluded.wallet_address,
        role = excluded.role,
        full_name = excluded.full_name,
        email = excluded.email,
        institution_id = excluded.institution_id,
        status = excluded.status;

  -- Repeatable cleanup of flow rows
  delete from public.user_rewards where id = reward_id;
  delete from public.academic_actions where id = completion_action_id;
  delete from public.tasks where id = flow_task_id;

  -- Teacher task: 10 SCHOL
  insert into public.tasks (
    id,
    institution_id,
    created_by,
    title,
    description,
    reward_token_amount
  )
  values (
    flow_task_id,
    seed_institution_id,
    teacher_id,
    'Seed: Chapter 3 summary',
    'Write and submit a one-page summary for chapter 3.',
    '10'
  );

  -- Student completion action
  insert into public.academic_actions (
    id,
    user_id,
    institution_id,
    action_type,
    title,
    description,
    source,
    source_reference,
    status,
    metadata,
    occurred_at
  )
  values (
    completion_action_id,
    student_id,
    seed_institution_id,
    'assignment_completed',
    'Seed: Chapter 3 summary',
    'Seeded completion for task payout flow.',
    'classroom',
    flow_task_id::text,
    'verified',
    jsonb_build_object('seeded', true, 'task_id', flow_task_id::text),
    now()
  );

  -- Pending payout row
  insert into public.user_rewards (
    id,
    user_id,
    academic_action_id,
    reward_rule_id,
    reward_type,
    points_amount,
    token_amount,
    badge_code,
    status
  )
  values (
    reward_id,
    student_id,
    completion_action_id,
    null,
    'token',
    0,
    '10',
    null,
    'pending_mint'
  );
end $$;
