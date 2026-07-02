-- ============================================================================
-- 006_auth_multitenancy.sql
-- Membresías de clínica, RLS para usuarios autenticados del dashboard y
-- sesiones de enrutamiento para números de WhatsApp compartidos.
-- ============================================================================

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
