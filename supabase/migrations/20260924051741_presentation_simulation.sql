-- Presentation-only data. It never changes the academic shipments contract.
begin;

create table public.presentation_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.presentation_shipments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.presentation_runs(id) on delete cascade,
  origin_country text not null check (origin_country ~ '^[A-Z]{2}$'),
  destination_country text not null check (destination_country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  constraint presentation_countries_differ check (origin_country <> destination_country)
);

create index presentation_shipments_run_created_idx
  on public.presentation_shipments (run_id, created_at, id);

alter table public.presentation_runs enable row level security;
alter table public.presentation_shipments enable row level security;

revoke all on public.presentation_runs from public, anon, authenticated;
revoke all on public.presentation_shipments from public, anon, authenticated;

-- Projection uses only fictional country pairs. Creation goes through the
-- Edge Function, which verifies an ADMIN account before using the service role.
grant select on public.presentation_shipments to anon, authenticated;
create policy presentation_shipments_read
  on public.presentation_shipments for select to anon, authenticated
  using (true);

-- Postgres Changes delivers new lines to the projector. A fresh GET remains
-- the source of truth after reconnecting or reloading the projector.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'presentation_shipments'
     ) then
    alter publication supabase_realtime add table public.presentation_shipments;
  end if;
end;
$$;

commit;
