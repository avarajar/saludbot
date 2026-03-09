import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';

// ── GET /api/services ────────────────────────────────────────────────────────

/**
 * Lists services for a clinic.
 *
 * Query params:
 *  - clinic_id (required)
 *  - active    (optional, "true" or "false")
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clinicId = searchParams.get('clinic_id');
  const active = searchParams.get('active');

  if (!clinicId) {
    return NextResponse.json(
      { error: 'clinic_id is required' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  let query = supabase
    .from('clinic_services')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true });

  if (active !== null) {
    query = query.eq('active', active === 'true');
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ services: data });
}

// ── POST /api/services ───────────────────────────────────────────────────────

const createServiceSchema = z.object({
  clinic_id: z.string().uuid(),
  name: z.string().min(1, 'name is required'),
  duration_minutes: z.number().int().min(1),
  price: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  const { data: service, error } = await supabase
    .from('clinic_services')
    .insert({
      clinic_id: parsed.data.clinic_id,
      name: parsed.data.name,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? null,
      description: parsed.data.description ?? null,
      active: parsed.data.active,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to create service: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ service }, { status: 201 });
}

// ── PATCH /api/services ──────────────────────────────────────────────────────

const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  duration_minutes: z.number().int().min(1).optional(),
  price: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const parsed = updateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, ...updates } = parsed.data;

  const supabase = getSupabase();

  const { data: service, error } = await supabase
    .from('clinic_services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to update service: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ service });
}

// ── DELETE /api/services ─────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id is required' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  const { error } = await supabase
    .from('clinic_services')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: `Failed to delete service: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
