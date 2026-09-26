-- ============================================================================
-- 012_pilot_attribution.sql
-- De dónde llegó cada postulación: parámetros UTM del link y página del
-- formulario. Los llena la landing; todos son opcionales.
-- ============================================================================

alter table pilot_applications
  add column utm_source   text check (length(utm_source) <= 100),
  add column utm_medium   text check (length(utm_medium) <= 100),
  add column utm_campaign text check (length(utm_campaign) <= 100),
  add column landing_page text check (length(landing_page) <= 200);

grant insert (utm_source, utm_medium, utm_campaign, landing_page)
  on pilot_applications to anon, authenticated;
