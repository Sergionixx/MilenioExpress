-- The audience only sees its own fictional orders. The projector reads through
-- the Edge Function with an organizer key that is never included in guest links.
begin;

alter table public.presentation_shipments
  add column package_name text,
  add column tracking_code text,
  add constraint presentation_package_name_length
    check (package_name is null or length(btrim(package_name)) between 1 and 40),
  add constraint presentation_tracking_code_digits
    check (tracking_code is null or tracking_code ~ '^[0-9]{4}$'),
  add constraint presentation_order_fields_match
    check ((package_name is null) = (tracking_code is null));

create unique index presentation_tracking_code_per_run_idx
  on public.presentation_shipments (run_id, tracking_code)
  where tracking_code is not null;

create index presentation_shipments_participant_run_idx
  on public.presentation_shipments (participant_id, run_id, created_at desc)
  where participant_id is not null;

drop policy if exists presentation_shipments_read on public.presentation_shipments;
revoke select on public.presentation_shipments from anon;
grant select on public.presentation_shipments to authenticated;
create policy presentation_shipments_read_own
  on public.presentation_shipments for select to authenticated
  using (participant_id = (select auth.uid()));

commit;
