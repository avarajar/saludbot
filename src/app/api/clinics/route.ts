import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';
import { requireAuthenticatedUser, requireClinicMembership } from '@/lib/auth/authorize';
import { getCountry } from '@/lib/clinics/countries';
import { businessHoursSchema, countryCodeSchema } from '@/lib/clinics/schemas';
import type { ClinicSpecialty, PackageType } from '@/types';

// ── GET /api/clinics ───────────────────────────────────────────────────────

/**
 * Retrieves a clinic by its UUID (id) or by its slug.
 *
 * Query params (provide one):
 *  - id   (UUID)
 *  - slug (URL-friendly identifier)
 *
 * There is no public/unauthenticated variant of this lookup: the dashboard
 * loads the current user's clinic directly via the browser Supabase client
 * (RLS-scoped), and nothing today calls this route for a public landing
 * page. So both the id and slug paths require the caller to be a member of
 * the resolved clinic, returning the full row only in that case.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  if (!id && !slug) {
    return NextResponse.json(
      { error: 'Either id or slug query parameter is required' },
      { status: 400 },
    );
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) return auth.error;

  const supabase = getSupabase();

  let query = supabase.from('clinics').select('*');

  if (id) {
    query = query.eq('id', id);
  } else if (slug) {
    query = query.eq('slug', slug);
  }

  const { data: clinic, error } = await query.single();

  if (error || !clinic) {
    return NextResponse.json(
      { error: 'Clinic not found' },
      { status: 404 },
    );
  }

  const forbidden = await requireClinicMembership(auth.user.id, clinic.id);
  if (forbidden) return forbidden;

  return NextResponse.json({ clinic });
}

// ── POST /api/clinics ──────────────────────────────────────────────────────

const CLINIC_SPECIALTIES: [ClinicSpecialty, ...ClinicSpecialty[]] = [
  'dental',
  'veterinary',
  'aesthetic',
  'psychology',
  'dermatology',
  'physiotherapy',
  'other',
];

const PACKAGE_TYPES: [PackageType, ...PackageType[]] = [
  'basico',
  'autopilot',
  'marketing',
];

const createClinicSchema = z.object({
  name: z.string().min(1, 'name is required'),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'slug must be lowercase alphanumeric with hyphens',
    ),
  phone: z.string().min(7),
  address: z.string().min(1),
  city: z.string().min(1),
  specialty: z.enum(CLINIC_SPECIALTIES),
  google_calendar_id: z.string().email('google_calendar_id must be a valid calendar ID').optional(),
  whatsapp_number: z.string().min(7),
  owner_name: z.string().min(1),
  owner_email: z.string().email(),
  package_type: z.enum(PACKAGE_TYPES),
  country: z.string().length(2).optional(),
  currency: z.string().min(3).max(3).optional(),
  locale: z.string().min(2).optional(),
});

/**
 * Registers a new clinic. Only requires an authenticated caller — there is
 * no existing clinic to check membership against yet (that's what
 * /api/onboarding does for the primary signup flow; this route additionally
 * lets an already-authenticated owner register a further clinic from the
 * dashboard).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return auth.error;

  const body = await request.json();

  const parsed = createClinicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // Ensure slug uniqueness
  const { data: existingSlug } = await supabase
    .from('clinics')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json(
      { error: 'A clinic with this slug already exists' },
      { status: 409 },
    );
  }

  const { data: clinic, error: insertError } = await supabase
    .from('clinics')
    .insert({
      ...parsed.data,
      timezone: 'America/Bogota',
      active: true,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create clinic: ${insertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ clinic }, { status: 201 });
}

// ── PATCH /api/clinics ─────────────────────────────────────────────────────

const updateClinicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().min(7).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  whatsapp_number: z.string().min(7).optional(),
  timezone: z.string().optional(),
  owner_name: z.string().min(1).optional(),
  owner_email: z.string().email().optional(),
  specialty: z.enum(CLINIC_SPECIALTIES).optional(),
  country: countryCodeSchema.optional(),
  business_hours: businessHoursSchema.optional(),
});

/**
 * Updates an existing clinic's information.
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const parsed = updateClinicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, country, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (country) {
    // El país es la fuente de verdad de moneda/locale; el timezone explícito
    // del request gana sobre el default del país.
    const countryInfo = getCountry(country);
    updates.country = countryInfo.code;
    updates.currency = countryInfo.currency;
    updates.locale = countryInfo.locale;
    if (parsed.data.timezone === undefined) {
      updates.timezone = countryInfo.timezone;
    }
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) return auth.error;
  const forbidden = await requireClinicMembership(auth.user.id, id);
  if (forbidden) return forbidden;

  const supabase = getSupabase();

  const { data: clinic, error } = await supabase
    .from('clinics')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to update clinic: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ clinic });
}
