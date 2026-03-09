import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';
import type { ClinicSpecialty, PackageType } from '@/types';

// ── GET /api/clinics ───────────────────────────────────────────────────────

/**
 * Retrieves a clinic by its UUID (id) or by its slug.
 *
 * Query params (provide one):
 *  - id   (UUID)
 *  - slug (URL-friendly identifier)
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
  google_calendar_id: z.string().email('google_calendar_id must be a valid calendar ID'),
  whatsapp_number: z.string().min(7),
  owner_name: z.string().min(1),
  owner_email: z.string().email(),
  package_type: z.enum(PACKAGE_TYPES),
});

/**
 * Registers a new clinic.
 */
export async function POST(request: NextRequest) {
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

  const { id, ...updates } = parsed.data;

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
