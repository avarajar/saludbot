-- ============================================================================
-- 013_pilot_status_enum.sql
-- Estado de la postulación como enum en español: el Table Editor de Supabase
-- lo muestra como desplegable. Toda postulación nueva entra como
-- 'pendiente de validación' y ya ocupa su cupo en la landing como
-- "En validación" (sin nombre ni logo hasta aprobarla).
-- ============================================================================

create type pilot_status as enum ('pendiente de validación', 'aprobada', 'rechazada');

-- El cambio de tipo exige quitar lo que depende de la columna.
drop trigger pilot_applications_guard on pilot_applications;
drop index pilot_applications_active_idx;
drop index pilot_applications_whatsapp_unique;
alter table pilot_applications drop constraint pilot_applications_status_check;
alter table pilot_applications alter column status drop default;

alter table pilot_applications
  alter column status type pilot_status using (case status
    when 'pending'  then 'pendiente de validación'
    when 'approved' then 'aprobada'
    when 'rejected' then 'rechazada'
  end)::pilot_status,
  alter column status set default 'pendiente de validación';

create index pilot_applications_active_idx
  on pilot_applications (created_at) where status <> 'rechazada';
create unique index pilot_applications_whatsapp_unique
  on pilot_applications (whatsapp_digits) where status <> 'rechazada';

-- ── Reglas de cupos y anti-spam (mismas de 010, con los estados nuevos) ────
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

  select count(*) into approved from public.pilot_applications where status = 'aprobada';

  if tg_op = 'INSERT' then
    if approved >= 10 then
      raise exception 'pilot_full' using errcode = 'P0001';
    end if;
    if (select count(*) from public.pilot_applications where status = 'pendiente de validación') >= 30 then
      raise exception 'pilot_queue_full' using errcode = 'P0001';
    end if;
    if (select count(*) from public.pilot_applications where created_at > now() - interval '1 hour') >= 20 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- UPDATE: aprobar no puede pasarse de 10; cualquier cambio de estado se fecha.
  if new.status = 'aprobada' and old.status <> 'aprobada' and approved >= 10 then
    raise exception 'pilot_full' using errcode = 'P0001';
  end if;
  if new.status <> old.status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger pilot_applications_guard
  before insert or update of status on pilot_applications
  for each row execute function private.pilot_applications_guard();

-- ── Cupos públicos para la landing ──────────────────────────────────────────
-- Aprobadas primero y luego las pendientes. De las pendientes solo se publican
-- especialidad y ciudad; nombre y logo, solo aprobadas y con permiso.
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
      'estado', case when a.status = 'aprobada' then 'aprobada' else 'en_validacion' end,
      'especialidad', a.specialty,
      'ciudad', a.city,
      'nombre', case when a.status = 'aprobada' and a.show_publicly then a.clinic_name end,
      'logo', case when a.status = 'aprobada' and a.show_publicly then a.logo_path end
    )) order by a.status = 'aprobada' desc, a.reviewed_at, a.created_at), '[]'::json)
  )
  from public.pilot_applications a
  where a.status <> 'rechazada';
$$;

create or replace function private.is_public_pilot_logo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pilot_applications
    where logo_path = object_name and status = 'aprobada' and show_publicly
  );
$$;
