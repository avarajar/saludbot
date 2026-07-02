import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { supabaseAdmin as getAdmin } from '@/lib/db/supabase';

export type AuthenticatedUser = { id: string };

export type AuthCheck =
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Requires a logged-in Supabase user (via the session cookie). Mirrors the
 * pattern used in /api/onboarding/route.ts. Returns a 401 NextResponse when
 * there is no authenticated session.
 */
export async function requireAuthenticatedUser(): Promise<AuthCheck> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    };
  }

  return { user: { id: user.id }, error: null };
}

/**
 * Verifies that `userId` belongs to `clinicId` via the clinic_users table.
 * Returns a 403 NextResponse when there is no membership row, or `null` when
 * the user is authorized to act on that clinic's data.
 */
export async function requireClinicMembership(
  userId: string,
  clinicId: string,
): Promise<NextResponse | null> {
  const admin = getAdmin();
  const { data: membership } = await admin
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', userId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'No autorizado para esta clinica' },
      { status: 403 },
    );
  }

  return null;
}
