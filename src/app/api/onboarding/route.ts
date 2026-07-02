import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { supabaseAdmin as getAdmin } from '@/lib/db/supabase';

// Limpieza best-effort de una clínica creada a medias: si un insert
// posterior (clinic_users, clinic_services) falla, borramos la clínica para
// no dejar un registro huérfano inalcanzable. Si la limpieza también falla,
// se ignora y se conserva el error original que provocó el 500.
async function cleanupOrphanedClinic(admin: ReturnType<typeof getAdmin>, clinicId: string): Promise<void> {
  try {
    await admin.from('clinics').delete().eq('id', clinicId);
  } catch {
    // best-effort: no ocultar el error original con uno de limpieza
  }
}

const dayHoursSchema = z.object({ open: z.string(), close: z.string() }).nullable();

const onboardingSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7),
  address: z.string().min(3),
  city: z.string().min(2),
  specialty: z.enum(['dental', 'veterinary', 'aesthetic', 'psychology', 'dermatology', 'physiotherapy', 'other']),
  business_hours: z.object({
    monday: dayHoursSchema, tuesday: dayHoursSchema, wednesday: dayHoursSchema,
    thursday: dayHoursSchema, friday: dayHoursSchema, saturday: dayHoursSchema,
    sunday: dayHoursSchema,
  }),
  services: z.array(z.object({
    name: z.string().min(2),
    duration_minutes: z.number().int().min(10).max(480),
    price: z.number().nullable().optional(),
  })).min(1),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const admin = getAdmin();

  // Idempotencia: un usuario solo puede registrar una clinica.
  const { data: membership } = await admin
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (membership) {
    return NextResponse.json({ error: 'Ya tiene una clinica registrada' }, { status: 409 });
  }

  // Slug único: sufijo aleatorio si ya existe.
  let slug = slugify(input.name);
  const { data: existing } = await admin
    .from('clinics').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const sharedNumber = (process.env.TWILIO_WHATSAPP_NUMBER ?? '').replace(/^whatsapp:/, '');

  const { data: clinic, error: clinicError } = await admin
    .from('clinics')
    .insert({
      name: input.name,
      slug,
      phone: input.phone,
      address: input.address,
      city: input.city,
      specialty: input.specialty,
      business_hours: input.business_hours,
      whatsapp_number: sharedNumber,
      owner_name: user.email ?? '',
      owner_email: user.email ?? '',
      google_calendar_id: '',
      active: true,
    })
    .select('*')
    .single();

  if (clinicError || !clinic) {
    return NextResponse.json({ error: clinicError?.message ?? 'No se pudo crear la clinica' }, { status: 500 });
  }

  const { error: memberError } = await admin
    .from('clinic_users')
    .insert({ user_id: user.id, clinic_id: clinic.id, role: 'owner' });
  if (memberError) {
    await cleanupOrphanedClinic(admin, clinic.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const { error: servicesError } = await admin
    .from('clinic_services')
    .insert(input.services.map((s) => ({
      clinic_id: clinic.id,
      name: s.name,
      duration_minutes: s.duration_minutes,
      price: s.price ?? null,
      active: true,
    })));
  if (servicesError) {
    await cleanupOrphanedClinic(admin, clinic.id);
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const waNumber = sharedNumber.replace(/[^0-9]/g, '');
  const whatsappLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola, vengo de ${clinic.slug}`)}`;

  return NextResponse.json({ clinic, whatsapp_link: whatsappLink }, { status: 201 });
}
