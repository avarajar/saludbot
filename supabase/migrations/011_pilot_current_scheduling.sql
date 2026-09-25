-- ============================================================================
-- 011_pilot_current_scheduling.sql
-- Pregunta opcional del formulario del piloto: "¿Cómo agendan hoy?".
-- Sirve para saber si la clínica ya paga un software con WhatsApp incluido.
-- ============================================================================

alter table pilot_applications
  add column current_scheduling text
  check (current_scheduling in (
    'whatsapp_manual', 'excel', 'google_calendar', 'dentalink', 'doctoralia', 'otro_software'
  ));

grant insert (current_scheduling) on pilot_applications to anon, authenticated;
