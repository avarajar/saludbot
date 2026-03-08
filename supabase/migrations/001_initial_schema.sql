-- ============================================================================
-- 001_initial_schema.sql
-- WhatsApp Healthcare Chatbot — initial database schema
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already available
create extension if not exists "pgcrypto";

-- ── Specialty & package enums ───────────────────────────────────────────────

create type clinic_specialty as enum (
  'dental',
  'veterinary',
  'aesthetic',
  'psychology',
  'dermatology',
  'physiotherapy',
  'other'
);

create type package_type as enum (
  'basico',
  'autopilot',
  'marketing'
);

create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

create type message_direction as enum (
  'inbound',
  'outbound'
);

create type conversation_intent as enum (
  'schedule',
  'reschedule',
  'cancel',
  'confirm',
  'info_services',
  'info_hours',
  'info_location',
  'greeting',
  'escalate',
  'other'
);

create type reminder_type as enum (
  '48h',
  '24h',
  '2h'
);

create type reminder_status as enum (
  'sent',
  'failed'
);

-- ── Clinics ─────────────────────────────────────────────────────────────────

create table clinics (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  phone           text not null,
  address         text not null,
  city            text not null,
  specialty       clinic_specialty not null,
  google_calendar_id text not null,
  timezone        text not null default 'America/Bogota',
  whatsapp_number text not null unique,
  owner_name      text not null,
  owner_email     text not null,
  package_type    package_type not null default 'basico',
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_clinics_phone on clinics (phone);
create index idx_clinics_whatsapp_number on clinics (whatsapp_number);
create index idx_clinics_slug on clinics (slug);
create index idx_clinics_active on clinics (active);

-- ── Patients ────────────────────────────────────────────────────────────────

create table patients (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  name            text not null,
  phone           text not null,
  email           text,
  document_id     text,  -- cedula
  notes           text,
  last_visit_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (clinic_id, phone)
);

create index idx_patients_clinic_id on patients (clinic_id);
create index idx_patients_phone on patients (phone);
create index idx_patients_last_visit_at on patients (last_visit_at);

-- ── Appointments ────────────────────────────────────────────────────────────

create table appointments (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics (id) on delete cascade,
  patient_id          uuid not null references patients (id) on delete cascade,
  google_event_id     text,
  date                date not null,
  start_time          time not null,
  end_time            time not null,
  service             text not null,
  status              appointment_status not null default 'scheduled',
  reminder_48h_sent   boolean not null default false,
  reminder_24h_sent   boolean not null default false,
  reminder_2h_sent    boolean not null default false,
  patient_confirmed   boolean not null default false,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint chk_time_order check (end_time > start_time)
);

create index idx_appointments_clinic_id on appointments (clinic_id);
create index idx_appointments_patient_id on appointments (patient_id);
create index idx_appointments_date on appointments (date);
create index idx_appointments_status on appointments (status);
create index idx_appointments_clinic_date on appointments (clinic_id, date);
create index idx_appointments_reminders on appointments (date, status)
  where status in ('scheduled', 'confirmed');

-- ── Conversations ───────────────────────────────────────────────────────────

create table conversations (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics (id) on delete cascade,
  patient_id          uuid not null references patients (id) on delete cascade,
  whatsapp_message_id text not null,
  direction           message_direction not null,
  message             text not null,
  intent              conversation_intent,
  created_at          timestamptz not null default now()
);

create index idx_conversations_clinic_id on conversations (clinic_id);
create index idx_conversations_patient_id on conversations (patient_id);
create index idx_conversations_created_at on conversations (created_at);

-- ── Clinic Services ─────────────────────────────────────────────────────────

create table clinic_services (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics (id) on delete cascade,
  name              text not null,
  duration_minutes  integer not null,
  price             numeric(10, 2),
  description       text,
  active            boolean not null default true,

  constraint chk_duration_positive check (duration_minutes > 0),
  constraint chk_price_non_negative check (price is null or price >= 0)
);

create index idx_clinic_services_clinic_id on clinic_services (clinic_id);
create index idx_clinic_services_active on clinic_services (clinic_id, active);

-- ── Reminder Logs ───────────────────────────────────────────────────────────

create table reminder_logs (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references appointments (id) on delete cascade,
  type            reminder_type not null,
  sent_at         timestamptz not null default now(),
  status          reminder_status not null,

  unique (appointment_id, type)
);

create index idx_reminder_logs_appointment_id on reminder_logs (appointment_id);

-- ── Row-Level Security ──────────────────────────────────────────────────────

alter table clinics enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table conversations enable row level security;
alter table clinic_services enable row level security;
alter table reminder_logs enable row level security;

-- Service-role bypass policies (the service role key bypasses RLS by default
-- in Supabase, but we create explicit policies so the tables are not
-- completely locked for authenticated users in the future).

create policy "Service role full access on clinics"
  on clinics for all
  using (true)
  with check (true);

create policy "Service role full access on patients"
  on patients for all
  using (true)
  with check (true);

create policy "Service role full access on appointments"
  on appointments for all
  using (true)
  with check (true);

create policy "Service role full access on conversations"
  on conversations for all
  using (true)
  with check (true);

create policy "Service role full access on clinic_services"
  on clinic_services for all
  using (true)
  with check (true);

create policy "Service role full access on reminder_logs"
  on reminder_logs for all
  using (true)
  with check (true);

-- ── Updated-at trigger ──────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clinics_updated_at
  before update on clinics
  for each row execute function set_updated_at();

create trigger trg_patients_updated_at
  before update on patients
  for each row execute function set_updated_at();

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();
