-- ============================================================================
-- 008_pilot_applications.sql
-- Postulaciones al piloto de "Clínicas fundadoras" desde la landing estática.
-- La landing escribe con la llave pública (anon): solo puede insertar, nunca
-- leer, editar ni borrar. La revisión se hace con service_role.
-- ============================================================================

create table pilot_applications (
  id              uuid primary key default gen_random_uuid(),
  clinic_name     text not null check (length(btrim(clinic_name)) between 1 and 80),
  specialty       text not null check (length(btrim(specialty)) between 1 and 40),
  country         text not null check (length(btrim(country)) between 1 and 40),
  city            text not null check (length(btrim(city)) between 1 and 60),
  contact_name    text not null check (length(btrim(contact_name)) between 1 and 80),
  whatsapp        text not null check (
                    length(whatsapp) <= 20
                    and length(regexp_replace(whatsapp, '\D', '', 'g')) between 7 and 15
                  ),
  email           text check (
                    email is null
                    or (length(email) <= 120 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')
                  ),
  show_publicly   boolean not null default false,
  accepted_terms  boolean not null check (accepted_terms),
  logo_path       text check (logo_path is null or length(logo_path) <= 200),
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

create index pilot_applications_active_idx
  on pilot_applications (created_at) where status <> 'rejected';

alter table pilot_applications enable row level security;

create policy "Service role full access on pilot_applications"
  on pilot_applications for all to service_role using (true) with check (true);
create policy "Public can apply to the pilot"
  on pilot_applications for insert to anon, authenticated
  with check (accepted_terms);

-- Solo las columnas del formulario: id, status, created_at y reviewed_at
-- quedan siempre en sus valores por defecto para inserts públicos.
revoke all on pilot_applications from anon, authenticated;
grant insert (clinic_name, specialty, country, city, contact_name, whatsapp,
              email, show_publicly, accepted_terms, logo_path)
  on pilot_applications to anon, authenticated;

-- Tope de 10 cupos activos (pendientes + aprobadas). Corre como definer porque
-- anon no puede leer la tabla para contar; vive en un esquema no expuesto.
create schema if not exists private;

create or replace function private.enforce_pilot_slot_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serializa inserts concurrentes para que no se pasen del tope.
  perform pg_advisory_xact_lock(hashtext('pilot_applications_slots'));
  if (select count(*) from public.pilot_applications where status <> 'rejected') >= 10 then
    raise exception 'pilot_full' using errcode = 'P0001',
      hint = 'Los 10 cupos del piloto ya están tomados.';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_pilot_slot_limit() from public;

create trigger pilot_applications_slot_limit
  before insert on pilot_applications
  for each row execute function private.enforce_pilot_slot_limit();
