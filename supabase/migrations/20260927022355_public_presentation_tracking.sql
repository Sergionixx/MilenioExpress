-- Preserve legacy four-digit guides; all new guides are assigned by the server.
-- Public tracking uses a narrow Edge endpoint. Table and phone lists stay private.
begin;
alter table public.presentation_shipments
  drop constraint presentation_tracking_code_digits,
  add constraint presentation_tracking_code_format
    check (tracking_code is null or tracking_code ~ '^([0-9]{4}|[A-Z2-9]{6})$');
create index presentation_runs_latest_idx on public.presentation_runs (created_at desc, id desc);
commit;
