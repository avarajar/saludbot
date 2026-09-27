-- ============================================================================
-- 014_pilot_notify.sql
-- Aviso por correo (Resend) cada vez que llega una postulación al piloto.
-- La llave y el destinatario viven en Supabase Vault, nunca en el repo:
--   select vault.create_secret('re_...', 'resend_api_key');
--   select vault.create_secret('tu@correo.com', 'pilot_notify_email');
-- Si falta alguno o Resend falla, la postulación se guarda igual.
-- ============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function private.notify_pilot_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  api_key   text;
  recipient text;
begin
  select decrypted_secret into api_key from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into recipient from vault.decrypted_secrets where name = 'pilot_notify_email';
  if api_key is null or recipient is null then
    return new;
  end if;

  -- Solo texto plano: los campos vienen del formulario público.
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'SaludBot <onboarding@resend.dev>',
      'to', jsonb_build_array(recipient),
      'subject', 'Nueva postulación: ' || new.clinic_name || ' (' || new.city || ')',
      'text', concat_ws(e'\n',
        'Nueva postulación al piloto, pendiente de validación.',
        '',
        'Clínica: ' || new.clinic_name,
        'Especialidad: ' || new.specialty,
        'Ciudad: ' || new.city || ', ' || new.country,
        'Contacto: ' || new.contact_name,
        'WhatsApp: ' || new.whatsapp,
        'Correo: ' || coalesce(new.email, '(no dio)'),
        'Cómo agenda hoy: ' || coalesce(new.current_scheduling, '(no dijo)'),
        'Mostrar en la página: ' || case when new.show_publicly then 'sí' else 'no' end,
        'Origen: ' || coalesce(new.utm_source, '(sin utm)') || ' · ' || coalesce(new.landing_page, ''),
        '',
        'Revisar y aprobar (columna status):',
        'https://supabase.com/dashboard/project/txrevckvhxaaywtjsmjg/editor'
      )
    )
  );
  return new;
exception when others then
  -- Nunca bloquear una postulación por el aviso.
  return new;
end;
$$;

revoke all on function private.notify_pilot_application() from public;

create trigger pilot_applications_notify
  after insert on pilot_applications
  for each row execute function private.notify_pilot_application();
