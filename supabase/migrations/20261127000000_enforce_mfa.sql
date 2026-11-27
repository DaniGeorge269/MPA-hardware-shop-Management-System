-- Enforce two-factor authentication at the database level.
--
-- The browser talks to Supabase directly with the anon key, so checks in
-- Next.js alone can't stop a password-only (AAL1) session from reading or
-- writing tables. These RESTRICTIVE policies are ANDed with whatever
-- permissive policies already exist: they never grant access, they only
-- add the rule "if you have 2FA enabled, this session must have passed it".
--
-- Users with no verified factor are unaffected (same as the app today).
--
-- IMPORTANT: policies only apply to tables with RLS enabled. Run the check
-- at the bottom first. A table with RLS disabled is fully open to anyone
-- holding the public anon key, 2FA or not.

-- 1. Helper: true when the current session satisfies 2FA.
create or replace function public.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1
      from auth.mfa_factors f
      where f.user_id = auth.uid()
        and f.status = 'verified'
    );
$$;

revoke all on function public.mfa_satisfied() from public, anon;
grant execute on function public.mfa_satisfied() to authenticated;

-- 2. Restrictive policy on every app table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'products',
    'sales',
    'sale_items',
    'purchases',
    'purchase_items',
    'finance_transactions'
  ]
  loop
    execute format(
      'drop policy if exists "Require MFA when enrolled" on public.%I', t
    );
    execute format(
      'create policy "Require MFA when enrolled" on public.%I
         as restrictive
         for all
         to authenticated
         using (public.mfa_satisfied())
         with check (public.mfa_satisfied())',
      t
    );
  end loop;
end
$$;

-- 3. Product image uploads (storage bucket "products").
-- Public image URLs keep working; this only gates API access.
drop policy if exists "Require MFA for product images" on storage.objects;
create policy "Require MFA for product images"
  on storage.objects
  as restrictive
  for all
  to authenticated
  using (bucket_id <> 'products' or public.mfa_satisfied())
  with check (bucket_id <> 'products' or public.mfa_satisfied());

-- 4. CHECK (run separately): any table listed here has RLS OFF and is open
-- to the world. Enable it ONLY after confirming it has permissive policies
-- for the app's normal use, or the app will stop seeing data:
--
--   select relname
--   from pg_class
--   where relnamespace = 'public'::regnamespace
--     and relkind = 'r'
--     and not relrowsecurity;
--
--   alter table public.<name> enable row level security;
