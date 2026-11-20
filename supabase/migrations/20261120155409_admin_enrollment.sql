-- Owner-approved addresses stay private; no addresses or credentials are committed here.
create table wordle_private.admin_enrollment (
  email text primary key check (email = lower(btrim(email)))
);
alter table wordle_private.admin_enrollment enable row level security;
revoke all on wordle_private.admin_enrollment from public, anon, authenticated;

create function wordle_private.enroll_verified_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='UPDATE' and exists(select 1 from wordle_private.admin_enrollment where email=lower(old.email))
     and (new.email is distinct from old.email or new.email_confirmed_at is null or new.is_anonymous) then
    delete from wordle_private.admins where user_id=new.id;
  end if;
  if new.email_confirmed_at is not null and not coalesce(new.is_anonymous,false)
     and exists(select 1 from wordle_private.admin_enrollment where email=lower(new.email)) then
    insert into wordle_private.admins(user_id) values(new.id) on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function wordle_private.enroll_verified_admin() from public, anon, authenticated;
create trigger enroll_verified_wordle_admin
  after insert or update of email,email_confirmed_at,is_anonymous on auth.users
  for each row execute function wordle_private.enroll_verified_admin();

-- Supabase's automatic RLS event trigger is internal and needs no client EXECUTE grant.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
