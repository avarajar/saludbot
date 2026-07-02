import { supabaseAdmin as getAdmin } from './supabase';
import type { Clinic } from '@/types';

export interface RoutingSession {
  phone: string;
  candidate_clinic_ids: string[];
  expires_at: string;
}

export async function getActiveClinicsByNumber(whatsappNumber: string): Promise<Clinic[]> {
  const { data, error } = await getAdmin()
    .from('clinics').select('*')
    .eq('whatsapp_number', whatsappNumber).eq('active', true);
  if (error) throw new Error(`getActiveClinicsByNumber failed: ${error.message}`);
  return data ?? [];
}

export async function getClinicsForPatientPhone(phone: string): Promise<Clinic[]> {
  const { data, error } = await getAdmin()
    .from('patients').select('clinics(*)').eq('phone', phone);
  if (error) throw new Error(`getClinicsForPatientPhone failed: ${error.message}`);
  const clinics = (data ?? [])
    .map((row) => row.clinics as unknown as Clinic)
    .filter((c): c is Clinic => Boolean(c && c.active));
  return [...new Map(clinics.map((c) => [c.id, c])).values()];
}

export async function getActiveClinicBySlug(slug: string): Promise<Clinic | null> {
  const { data, error } = await getAdmin()
    .from('clinics').select('*')
    .eq('slug', slug).eq('active', true).maybeSingle();
  if (error) throw new Error(`getActiveClinicBySlug failed: ${error.message}`);
  return data;
}

export async function getClinicsByIds(ids: string[]): Promise<Clinic[]> {
  const { data, error } = await getAdmin()
    .from('clinics').select('*').in('id', ids).eq('active', true);
  if (error) throw new Error(`getClinicsByIds failed: ${error.message}`);
  return data ?? [];
}

export async function getRoutingSession(phone: string): Promise<RoutingSession | null> {
  const { data, error } = await getAdmin()
    .from('clinic_routing_sessions').select('*')
    .eq('phone', phone).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw new Error(`getRoutingSession failed: ${error.message}`);
  return data;
}

export async function upsertRoutingSession(phone: string, candidateClinicIds: string[]): Promise<void> {
  const { error } = await getAdmin().from('clinic_routing_sessions').upsert({
    phone,
    candidate_clinic_ids: candidateClinicIds,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error(`upsertRoutingSession failed: ${error.message}`);
}

export async function deleteRoutingSession(phone: string): Promise<void> {
  const { error } = await getAdmin()
    .from('clinic_routing_sessions').delete().eq('phone', phone);
  if (error) throw new Error(`deleteRoutingSession failed: ${error.message}`);
}
