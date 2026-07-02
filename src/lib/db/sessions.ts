import { supabaseAdmin as getAdmin } from './supabase';
import type { ConversationSession, SessionContext, SessionState } from '@/types';

const DEFAULT_TTL_MINUTES = 30;

export async function getActiveSession(
  clinicId: string,
  patientId: string,
): Promise<ConversationSession | null> {
  const { data, error } = await getAdmin()
    .from('conversation_sessions')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`getActiveSession failed: ${error.message}`);
  }
  return data;
}

export async function setSession(
  clinicId: string,
  patientId: string,
  state: SessionState,
  context: SessionContext,
  ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const { error } = await getAdmin()
    .from('conversation_sessions')
    .upsert(
      {
        clinic_id: clinicId,
        patient_id: patientId,
        state,
        context,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clinic_id,patient_id' },
    );
  if (error) {
    throw new Error(`setSession failed: ${error.message}`);
  }
}

export async function clearSession(
  clinicId: string,
  patientId: string,
): Promise<void> {
  const { error } = await getAdmin()
    .from('conversation_sessions')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId);
  if (error) {
    throw new Error(`clearSession failed: ${error.message}`);
  }
}
