import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';

// ── GET /api/conversations ───────────────────────────────────────────────────

/**
 * Lists conversations for a clinic, optionally filtered by patient_id and date.
 *
 * Query params:
 *  - clinic_id   (required)
 *  - patient_id  (optional)
 *  - date        (optional, YYYY-MM-DD — filters by day)
 *  - limit       (optional, default 100)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clinicId = searchParams.get('clinic_id');
  const patientId = searchParams.get('patient_id');
  const date = searchParams.get('date');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  if (!clinicId) {
    return NextResponse.json(
      { error: 'clinic_id is required' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  let query = supabase
    .from('conversations')
    .select('*, patients(name, phone)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  if (date) {
    // Filter by day: created_at between start and end of day
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ conversations: data });
}
