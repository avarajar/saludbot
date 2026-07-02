import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';
import { requireAuthenticatedUser, requireClinicMembership } from '@/lib/auth/authorize';

// ── GET /api/patients ──────────────────────────────────────────────────────

/**
 * Lists patients for a clinic, optionally filtered by a search term
 * that matches against name, phone, email, or document ID (cedula).
 *
 * Query params:
 *  - clinic_id (required)
 *  - search    (optional, text search)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clinicId = searchParams.get('clinic_id');
  const search = searchParams.get('search');

  if (!clinicId) {
    return NextResponse.json(
      { error: 'clinic_id is required' },
      { status: 400 },
    );
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) return auth.error;
  const forbidden = await requireClinicMembership(auth.user.id, clinicId);
  if (forbidden) return forbidden;

  const supabase = getSupabase();

  let query = supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true });

  if (search) {
    // Use Supabase ilike for case-insensitive partial matching across multiple fields
    query = query.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,document_id.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ patients: data });
}

// ── POST /api/patients ─────────────────────────────────────────────────────

const createPatientSchema = z.object({
  clinic_id: z.string().uuid(),
  name: z.string().min(1, 'name is required'),
  phone: z.string().min(7, 'phone must have at least 7 digits'),
  email: z.string().email().optional().nullable(),
  document_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Creates a new patient record for a clinic.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { clinic_id, name, phone, email, document_id, notes } = parsed.data;

  const auth = await requireAuthenticatedUser();
  if (!auth.user) return auth.error;
  const forbidden = await requireClinicMembership(auth.user.id, clinic_id);
  if (forbidden) return forbidden;

  const supabase = getSupabase();

  // Check that the clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', clinic_id)
    .single();

  if (clinicError || !clinic) {
    return NextResponse.json(
      { error: 'Clinic not found' },
      { status: 404 },
    );
  }

  // Check for duplicate phone within the same clinic
  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('clinic_id', clinic_id)
    .eq('phone', phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'A patient with this phone number already exists for this clinic' },
      { status: 409 },
    );
  }

  const { data: patient, error: insertError } = await supabase
    .from('patients')
    .insert({
      clinic_id,
      name,
      phone,
      email: email ?? null,
      document_id: document_id ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create patient: ${insertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ patient }, { status: 201 });
}
