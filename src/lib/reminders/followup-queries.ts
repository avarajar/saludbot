import { TZDate } from '@date-fns/tz';
import { format, subDays } from 'date-fns';
import { supabaseAdmin as getAdmin } from '@/lib/db/supabase';
import type { Appointment, Clinic, ClinicService, Patient } from '@/types';

const TIMEZONE = 'America/Bogota';

export async function getCompletedAppointmentsForDate(date: string): Promise<Appointment[]> {
  const { data, error } = await getAdmin()
    .from('appointments').select('*')
    .eq('status', 'completed').eq('date', date);
  if (error) throw new Error(`getCompletedAppointmentsForDate failed: ${error.message}`);
  return data ?? [];
}

export async function getRecallServices(): Promise<ClinicService[]> {
  const { data, error } = await getAdmin()
    .from('clinic_services').select('*')
    .eq('active', true).not('follow_up_days', 'is', null);
  if (error) throw new Error(`getRecallServices failed: ${error.message}`);
  return data ?? [];
}

/**
 * Pacientes cuya ULTIMA cita completada de este servicio fue hace más de
 * follow_up_days días y sin recall registrado en ese mismo período.
 */
export async function getPatientsDueForRecall(service: ClinicService): Promise<Patient[]> {
  const admin = getAdmin();
  const cutoff = subDays(TZDate.tz(TIMEZONE), service.follow_up_days ?? 0);
  const cutoffDate = format(cutoff, 'yyyy-MM-dd');

  const { data: completed, error } = await admin
    .from('appointments')
    .select('patient_id, date')
    .eq('clinic_id', service.clinic_id)
    .eq('service', service.name)
    .eq('status', 'completed')
    .order('date', { ascending: false });
  if (error) throw new Error(`getPatientsDueForRecall failed: ${error.message}`);

  const latestByPatient = new Map<string, string>();
  for (const a of completed ?? []) {
    if (!latestByPatient.has(a.patient_id)) latestByPatient.set(a.patient_id, a.date);
  }
  const dueIds = [...latestByPatient.entries()]
    .filter(([, date]) => date < cutoffDate)
    .map(([patientId]) => patientId);
  if (dueIds.length === 0) return [];

  const { data: recentRecalls, error: logError } = await admin
    .from('followup_logs')
    .select('patient_id')
    .eq('type', 'recall')
    .eq('service_id', service.id)
    .gte('sent_at', cutoff.toISOString());
  if (logError) throw new Error(`getPatientsDueForRecall logs failed: ${logError.message}`);
  const alreadySent = new Set((recentRecalls ?? []).map((r) => r.patient_id));

  const pendingIds = dueIds.filter((id) => !alreadySent.has(id));
  if (pendingIds.length === 0) return [];

  const { data: patients, error: patientError } = await admin
    .from('patients').select('*').in('id', pendingIds);
  if (patientError) throw new Error(`getPatientsDueForRecall patients failed: ${patientError.message}`);
  return patients ?? [];
}

export async function insertFollowupLog(log: {
  clinic_id: string; patient_id: string; appointment_id?: string | null;
  service_id?: string | null; type: 'post_visit' | 'recall';
}): Promise<{ duplicate: boolean; id?: string }> {
  const { data, error } = await getAdmin().from('followup_logs').insert(log).select('id').single();
  if (error) {
    if (error.code === '23505') return { duplicate: true };
    throw new Error(`insertFollowupLog failed: ${error.message}`);
  }
  return { duplicate: false, id: data.id };
}

export async function markFollowupFailed(logId: string): Promise<void> {
  const { error } = await getAdmin().from('followup_logs')
    .update({ status: 'failed' })
    .eq('id', logId);
  if (error) console.error(`markFollowupFailed: ${error.message}`);
}

export async function updatePatientLastVisit(patientId: string, isoDate: string): Promise<void> {
  const { error } = await getAdmin()
    .from('patients').update({ last_visit_at: isoDate }).eq('id', patientId);
  if (error) throw new Error(`updatePatientLastVisit failed: ${error.message}`);
}

export async function getClinicsByIds(ids: string[]): Promise<Clinic[]> {
  const { data, error } = await getAdmin().from('clinics').select('*').in('id', ids);
  if (error) throw new Error(`getClinicsByIds failed: ${error.message}`);
  return data ?? [];
}

export async function getPatientsByIds(ids: string[]): Promise<Patient[]> {
  const { data, error } = await getAdmin().from('patients').select('*').in('id', ids);
  if (error) throw new Error(`getPatientsByIds failed: ${error.message}`);
  return data ?? [];
}
