-- ============================================================================
-- 007_followups.sql
-- Seguimiento post-visita (agradecimiento) y recall periódico por servicio.
-- ============================================================================

-- Intervalo de recall por servicio (dias); null = sin recall.
alter table clinic_services add column follow_up_days integer;

create table followup_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  service_id uuid references clinic_services(id) on delete set null,
  type text not null check (type in ('post_visit', 'recall')),
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  created_at timestamptz not null default now()
);

alter table followup_logs enable row level security;
create policy "Service role full access on followup_logs"
  on followup_logs for all to service_role using (true) with check (true);
create policy "Members read own followup_logs" on followup_logs
  for select to authenticated using (clinic_id in (select user_clinic_ids()));

-- Un solo post_visit por cita (claim por índice único).
create unique index followup_post_visit_unique
  on followup_logs (appointment_id) where type = 'post_visit';

-- Dedup atómico de recall por paciente/servicio/día (zona horaria Bogotá).
-- El check-then-act de getPatientsDueForRecall (SELECT ventana de envíos
-- recientes seguido de INSERT) no es atómico: dos corridas concurrentes del
-- cron pueden pasar el SELECT antes de que cualquiera inserte, y ambas
-- terminan enviando el recall al mismo paciente el mismo día. Este índice
-- único parcial cierra la ventana de carrera: ambas corridas calculan la
-- misma clave (patient_id, service_id, día-Bogotá) y solo el primer INSERT
-- tiene éxito; el segundo recibe 23505 (unique_violation), que
-- insertFollowupLog ya traduce a { duplicate: true } para omitir el envío.
create unique index followup_recall_daily_unique
  on followup_logs (patient_id, service_id, ((sent_at at time zone 'America/Bogota')::date))
  where type = 'recall';
