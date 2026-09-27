-- The presentation has its own creation endpoint/table. Keep academic packages
-- under the same ADMIN-only write permissions as the existing admin interface.
begin;
drop policy if exists shipments_create_owner_or_admin on public.shipments;
create policy shipments_create_admin on public.shipments for insert to authenticated
  with check ((select public.current_app_role()) = 'ADMIN');
commit;
