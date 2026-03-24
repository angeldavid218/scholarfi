-- Demo-only convenience:
-- 1) Ensure a default institution exists.
-- 2) Auto-link new auth users to that institution when metadata is missing.
-- 3) Backfill existing profiles that have null institution_id.

do $$
declare
  demo_institution_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.institutions (id, name, status)
  values (demo_institution_id, 'ScholarFi Demo School', 'active')
  on conflict (id) do update
    set name = excluded.name,
        status = excluded.status;
end
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_institution_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'student'));
  meta_wallet text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'wallet_address', '')), '');
  meta_full_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  meta_institution_raw text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'institution_id', '')), '');
  meta_institution uuid := null;
  final_wallet text;
begin
  if meta_role not in ('student', 'teacher', 'admin', 'partner') then
    meta_role := 'student';
  end if;

  if meta_institution_raw is not null
     and meta_institution_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    meta_institution := meta_institution_raw::uuid;
  else
    meta_institution := demo_institution_id;
  end if;

  if meta_wallet is not null and exists (
    select 1 from public.profiles p where p.wallet_address = meta_wallet and p.id <> new.id
  ) then
    final_wallet := 'pending:' || new.id::text;
  else
    final_wallet := coalesce(meta_wallet, 'pending:' || new.id::text);
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
    final_wallet,
    meta_role,
    coalesce(meta_full_name, split_part(coalesce(new.email, ''), '@', 1), 'user'),
    new.email,
    meta_institution,
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        role = coalesce(public.profiles.role, excluded.role),
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        institution_id = coalesce(public.profiles.institution_id, excluded.institution_id),
        updated_at = now();

  return new;
end;
$$;

update public.profiles
set institution_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    updated_at = now()
where institution_id is null;
