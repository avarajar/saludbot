-- ============================================================================
-- 005_conversation_sessions.sql
-- Almacenamiento de sesiones de conversación (estado del flujo por paciente)
-- y prevención de doble reserva a nivel de base de datos.
-- ============================================================================

create table conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  state text not null default 'idle',
  context jsonb not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, patient_id)
);

alter table conversation_sessions enable row level security;
create policy "Service role full access on conversation_sessions"
  on conversation_sessions for all to service_role using (true) with check (true);

-- Doble reserva imposible a nivel de DB para citas activas.
create unique index appointments_slot_unique
  on appointments (clinic_id, date, start_time)
  where status in ('scheduled', 'confirmed');
