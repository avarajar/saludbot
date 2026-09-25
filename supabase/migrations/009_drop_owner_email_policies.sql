-- ============================================================================
-- 009_drop_owner_email_policies.sql
-- Limpieza de políticas de `clinics` creadas a mano (fuera de las migraciones)
-- que daban acceso por `owner_email = auth.jwt()->>'email'`. El acceso de
-- usuarios autenticados es solo por membresía (`clinic_users`, ver 006).
-- ============================================================================

drop policy if exists "Users can insert own clinic" on clinics;
drop policy if exists "Users can read own clinic" on clinics;
drop policy if exists "Users can update own clinic" on clinics;

-- Backfill: clínicas sin miembros quedan como owner del usuario cuyo correo
-- coincide con owner_email, para no perder acceso desde el dashboard.
insert into clinic_users (user_id, clinic_id, role)
select u.id, c.id, 'owner'
from clinics c
join auth.users u on lower(u.email) = lower(c.owner_email)
where not exists (select 1 from clinic_users cu where cu.clinic_id = c.id)
on conflict do nothing;
