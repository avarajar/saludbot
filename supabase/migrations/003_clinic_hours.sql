-- ============================================================================
-- 003_clinic_hours.sql
-- Add dynamic business hours (JSONB) to clinics table
-- ============================================================================

alter table clinics
  add column business_hours jsonb not null default '{
    "monday":    {"open": "08:00", "close": "18:00"},
    "tuesday":   {"open": "08:00", "close": "18:00"},
    "wednesday": {"open": "08:00", "close": "18:00"},
    "thursday":  {"open": "08:00", "close": "18:00"},
    "friday":    {"open": "08:00", "close": "18:00"},
    "saturday":  {"open": "08:00", "close": "13:00"},
    "sunday":    null
  }'::jsonb;
