-- ============================================================================
-- 010_pilot_review.sql
-- Revisión manual de postulaciones al piloto + filtros anti-spam.
--
-- - Solo las aprobadas ocupan cupo y se muestran en la landing.
-- - Aprobar = cambiar `status` a 'approved' en el Table Editor de Supabase.
-- - Filtros: un WhatsApp por postulación activa, tope de pendientes y de
--   envíos por hora.
-- - Logos en un bucket privado; solo se pueden leer los de clínicas aprobadas
--   que dieron permiso de mostrarlos.
-- ============================================================================

-- ── Duplicados por WhatsApp ─────────────────────────────────────────────────
alter table pilot_applications
  add column whatsapp_digits text generated always as (regexp_replace(whatsapp, '\D', '', 'g')) stored;

create unique index pilot_applications_whatsapp_unique
  on pilot_applications (whatsapp_digits) where status <> 'rejected';

-- El logo solo puede apuntar a un archivo con nombre aleatorio del bucket.
alter table pilot_applications
  add constraint pilot_applications_logo_path_format
  check (logo_path is null or logo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png|jpg)$');

-- ── Reglas de cupos y anti-spam ─────────────────────────────────────────────
drop trigger pilot_applications_slot_limit on pilot_applications;
drop function private.enforce_pilot_slot_limit();

create or replace function private.pilot_applications_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved int;
begin
  -- Serializa escrituras concurrentes para que los topes no se pasen.
  perform pg_advisory_xact_lock(hashtext('pilot_applications'));

  select count(*) into approved from public.pilot_applications where status = 'approved';

  if tg_op = 'INSERT' then
    if approved >= 10 then
      raise exception 'pilot_full' using errcode = 'P0001';
    end if;
    if (select count(*) from public.pilot_applications where status = 'pending') >= 30 then
      raise exception 'pilot_queue_full' using errcode = 'P0001';
    end if;
    if (select count(*) from public.pilot_applications where created_at > now() - interval '1 hour') >= 20 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- UPDATE: aprobar no puede pasarse de 10; cualquier cambio de estado se fecha.
  if new.status = 'approved' and old.status <> 'approved' and approved >= 10 then
    raise exception 'pilot_full' using errcode = 'P0001';
  end if;
  if new.status <> old.status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

revoke all on function private.pilot_applications_guard() from public;

create trigger pilot_applications_guard
  before insert or update of status on pilot_applications
  for each row execute function private.pilot_applications_guard();

-- ── Cupos públicos para la landing ──────────────────────────────────────────
-- Devuelve solo aprobadas y, de ellas, nombre y logo únicamente con permiso.
create or replace function public.pilot_slots()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'total', 10,
    'cupos', coalesce(json_agg(json_strip_nulls(json_build_object(
      'especialidad', a.specialty,
      'ciudad', a.city,
      'nombre', case when a.show_publicly then a.clinic_name end,
      'logo', case when a.show_publicly then a.logo_path end
    )) order by a.reviewed_at, a.created_at), '[]'::json)
  )
  from public.pilot_applications a
  where a.status = 'approved';
$$;

revoke all on function public.pilot_slots() from public;
grant execute on function public.pilot_slots() to anon, authenticated;

-- ── Logos ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pilot-logos', 'pilot-logos', false, 307200, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create or replace function private.is_public_pilot_logo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pilot_applications
    where logo_path = object_name and status = 'approved' and show_publicly
  );
$$;

revoke all on function private.is_public_pilot_logo(text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_public_pilot_logo(text) to anon, authenticated;

-- Subir: solo archivos nuevos con nombre aleatorio (sin update → no se pisan).
create policy "Public can upload pilot logos"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'pilot-logos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png|jpg)$'
  );

-- Leer: solo logos de clínicas aprobadas que dieron permiso.
create policy "Public can read approved pilot logos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'pilot-logos' and private.is_public_pilot_logo(name));
