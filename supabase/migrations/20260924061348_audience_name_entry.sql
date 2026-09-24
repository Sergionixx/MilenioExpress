-- Guests receive separate Supabase Auth identities without an email or password.
-- Existing presentation rows remain valid with both participant fields null.
begin;

alter table public.presentation_shipments
  add column participant_id uuid,
  add column participant_name text,
  add constraint presentation_participant_fields_match
    check ((participant_id is null) = (participant_name is null)),
  add constraint presentation_participant_name_length
    check (participant_name is null or length(btrim(participant_name)) between 1 and 40);

-- A guest may register a package only for the identity issued to that phone.
drop policy if exists shipments_create_admin on public.shipments;
create policy shipments_create_owner_or_admin
  on public.shipments for insert to authenticated
  with check (owner_id = (select auth.uid()) or (select public.current_app_role()) = 'ADMIN');

commit;
