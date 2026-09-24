-- KAN-11, KAN-14, KAN-18, KAN-19, KAN-23, KAN-24, KAN-38, KAN-58.
-- Apply through Supabase migrations before deploying the Edge Function.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default 'Usuario',
  role text not null default 'USER' check (role in ('ADMIN', 'USER')),
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'Trusted application role. Only database administrators or the service role can change it.';

create or replace function public.handle_auth_user_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_inserted on auth.users;
create trigger on_auth_user_inserted
after insert on auth.users
for each row execute function public.handle_auth_user_insert();

create or replace function public.handle_auth_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, '')
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.handle_auth_user_email_update();

insert into public.profiles (id, email, display_name)
select
  id,
  coalesce(email, ''),
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(email, ''), '@', 1), ''),
    'Usuario'
  )
from auth.users
on conflict (id) do nothing;

create sequence if not exists public.shipment_guide_seq as bigint start with 1;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  guide text not null unique check (guide ~ '^ME-[0-9]{4}-[0-9]{8,}$'),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  recipient text not null check (length(btrim(recipient)) between 1 and 160),
  address text not null check (length(btrim(address)) between 1 and 240),
  city text not null check (length(btrim(city)) between 1 and 120),
  description text not null check (length(btrim(description)) between 1 and 2000),
  status text not null default 'Registrado' check (status = 'Registrado'),
  created_at timestamptz not null default now()
);

create index if not exists shipments_owner_created_idx
  on public.shipments (owner_id, created_at desc);
create index if not exists shipments_created_idx
  on public.shipments (created_at desc);

-- The trigger ignores any guide/status supplied by the caller. nextval is atomic,
-- and the unique constraint is the final protection against a collision.
create or replace function public.assign_shipment_guide()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  guide_number bigint;
  number_text text;
begin
  guide_number := nextval('public.shipment_guide_seq'::regclass);
  number_text := guide_number::text;
  if length(number_text) < 8 then
    number_text := lpad(number_text, 8, '0');
  end if;
  new.guide := format('ME-%s-%s', to_char(now() at time zone 'UTC', 'YYYY'), number_text);
  new.status := 'Registrado';
  return new;
end;
$$;

drop trigger if exists assign_shipment_guide_before_insert on public.shipments;
create trigger assign_shipment_guide_before_insert
before insert on public.shipments
for each row execute function public.assign_shipment_guide();

-- SECURITY DEFINER avoids a recursive profiles policy lookup. auth.uid() still
-- identifies the verified caller; no client-supplied role or user id is trusted.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;
revoke all on function public.assign_shipment_guide() from public;
revoke all on function public.handle_auth_user_insert() from public;
revoke all on function public.handle_auth_user_email_update() from public;
revoke all on sequence public.shipment_guide_seq from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.shipments enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.shipments from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.shipments to authenticated;

drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin
on public.profiles for select to authenticated
using (id = auth.uid() or public.current_app_role() = 'ADMIN');

drop policy if exists shipments_read_own_or_admin on public.shipments;
create policy shipments_read_own_or_admin
on public.shipments for select to authenticated
using (owner_id = auth.uid() or public.current_app_role() = 'ADMIN');

drop policy if exists shipments_create_admin on public.shipments;
create policy shipments_create_admin
on public.shipments for insert to authenticated
with check (public.current_app_role() = 'ADMIN');

commit;
