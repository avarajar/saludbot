-- ============================================================================
-- 006_auth_multitenancy.sql
-- Membresías de clínica, RLS para usuarios autenticados del dashboard y
-- sesiones de enrutamiento para números de WhatsApp compartidos.
-- ============================================================================

-- ── Corrección de seguridad: acotar políticas permisivas de 001 ────────────
-- Las seis políticas "Service role full access on <tabla>" creadas en
-- 001_initial_schema.sql se definieron con `for all using (true) with check
-- (true)` sin cláusula `to`, por lo que quedaron aplicadas a PUBLIC (todo rol,
-- incluidos `anon` y `authenticated`). Como las políticas permisivas de
-- Postgres se combinan con OR, esas seis políticas permitían acceso total a
-- cualquier cliente autenticado o anónimo y neutralizaban por completo el
-- aislamiento por clínica que introducen las políticas nuevas de esta
-- migración (cualquier usuario podía leer/escribir datos de cualquier
-- clínica). Se eliminan y se recrean acotadas a `service_role`, siguiendo el
-- mismo patrón ya usado correctamente en 005_conversation_sessions.sql.

drop policy "Service role full access on clinics" on clinics;
create policy "Service role full access on clinics"
  on clinics for all to service_role using (true) with check (true);

drop policy "Service role full access on patients" on patients;
create policy "Service role full access on patients"
  on patients for all to service_role using (true) with check (true);

drop policy "Service role full access on appointments" on appointments;
create policy "Service role full access on appointments"
  on appointments for all to service_role using (true) with check (true);

drop policy "Service role full access on conversations" on conversations;
create policy "Service role full access on conversations"
  on conversations for all to service_role using (true) with check (true);

drop policy "Service role full access on clinic_services" on clinic_services;
create policy "Service role full access on clinic_services"
  on clinic_services for all to service_role using (true) with check (true);

drop policy "Service role full access on reminder_logs" on reminder_logs;
create policy "Service role full access on reminder_logs"
  on reminder_logs for all to service_role using (true) with check (true);

-- ── Número de WhatsApp compartido entre clínicas ────────────────────────────
-- 001_initial_schema.sql declaró `whatsapp_number text not null unique`, lo
-- que impide que dos clínicas compartan el mismo número de WhatsApp Business
-- (TWILIO_WHATSAPP_NUMBER es un único número compartido por todas las
-- clínicas del onboarding, enrutado luego por `clinic_routing_sessions`).
-- Se elimina la restricción unique y se conserva un índice no único para que
-- las búsquedas por número sigan siendo rápidas.
alter table clinics drop constraint if exists clinics_whatsapp_number_key;
create index if not exists idx_clinics_whatsapp_number on clinics (whatsapp_number);

create table clinic_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, clinic_id)
);

alter table clinic_users enable row level security;

create policy "Users read own memberships" on clinic_users
  for select to authenticated using (user_id = auth.uid());
create policy "Service role full access on clinic_users" on clinic_users
  for all to service_role using (true) with check (true);

-- Helper: clínicas del usuario autenticado (security definer para evitar
-- recursión de RLS al usarse dentro de otras políticas).
create or replace function user_clinic_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select clinic_id from clinic_users where user_id = auth.uid()
$$;

-- Clínicas: los miembros leen y actualizan su clínica.
create policy "Members read own clinic" on clinics
  for select to authenticated using (id in (select user_clinic_ids()));
create policy "Members update own clinic" on clinics
  for update to authenticated using (id in (select user_clinic_ids()));

-- Tablas hijas: acceso completo del miembro, scoped por clinic_id.
create policy "Members access own patients" on patients
  for all to authenticated
  using (clinic_id in (select user_clinic_ids()))
  with check (clinic_id in (select user_clinic_ids()));

create policy "Members access own appointments" on appointments
  for all to authenticated
  using (clinic_id in (select user_clinic_ids()))
  with check (clinic_id in (select user_clinic_ids()));

create policy "Members read own conversations" on conversations
  for select to authenticated using (clinic_id in (select user_clinic_ids()));

create policy "Members access own services" on clinic_services
  for all to authenticated
  using (clinic_id in (select user_clinic_ids()))
  with check (clinic_id in (select user_clinic_ids()));

-- Enrutamiento en número compartido: elección de clínica pendiente
-- para pacientes aún no asociados a ninguna clínica.
create table clinic_routing_sessions (
  phone text primary key,
  candidate_clinic_ids jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table clinic_routing_sessions enable row level security;
create policy "Service role full access on clinic_routing_sessions"
  on clinic_routing_sessions for all to service_role using (true) with check (true);
