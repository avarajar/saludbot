-- ============================================================================
-- 002_multi_country.sql
-- Add multi-country support: country, currency, and locale columns to clinics
-- ============================================================================

alter table clinics
  add column country varchar(5) not null default 'CO',
  add column currency varchar(5) not null default 'COP',
  add column locale varchar(10) not null default 'es-CO';

-- Update existing rows (they already have the defaults, but be explicit)
update clinics
  set country = 'CO',
      currency = 'COP',
      locale = 'es-CO'
  where country is null or currency is null or locale is null;
