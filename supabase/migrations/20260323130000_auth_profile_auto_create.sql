-- Auto-create public.profiles rows when new auth users sign up via OTP/magic link.
-- Metadata keys supported on signup:
--   - wallet_address: preferred wallet value
--   - role: student | teacher | admin | partner
--   - full_name: optional display name
--   - institution_id: optional UUID

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'student'));
  meta_wallet text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'wallet_address', '')), '');
  meta_full_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  meta_institution_raw text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'institution_id', '')), '');
  meta_institution uuid := null;
begin
  if meta_role not in ('student', 'teacher', 'admin', 'partner') then
    meta_role := 'student';
  end if;

  if meta_institution_raw is not null
     and meta_institution_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    meta_institution := meta_institution_raw::uuid;
  end if;

  insert into public.profiles (
    id,
    wallet_address,
    role,
    full_name,
    email,
    institution_id,
    status
  )
  values (
    new.id,
    coalesce(meta_wallet, 'pending:' || new.id::text),
    meta_role,
    coalesce(meta_full_name, split_part(coalesce(new.email, ''), '@', 1), 'user'),
    new.email,
    meta_institution,
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
