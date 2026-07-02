-- ============================================================================
-- 004_reliability.sql
-- Idempotencia: un mensaje entrante de Twilio se procesa una sola vez.
-- ============================================================================

create unique index if not exists conversations_inbound_message_unique
  on conversations (whatsapp_message_id)
  where direction = 'inbound' and whatsapp_message_id <> '';
