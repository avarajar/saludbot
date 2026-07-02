import type { Clinic } from '@/types';
import { parseNumericChoice } from '@/lib/whatsapp/flow';
import {
  getActiveClinicsByNumber, getClinicsForPatientPhone, getActiveClinicBySlug,
  getClinicsByIds, getRoutingSession, upsertRoutingSession, deleteRoutingSession,
} from './routing-queries';

export type ClinicResolution =
  | { status: 'resolved'; clinic: Clinic }
  | { status: 'ambiguous'; candidates: Clinic[] }
  | { status: 'none' };

const SLUG_MENTION = /vengo de\s+([a-z0-9-]+)/i;

export async function popRoutingChoice(phone: string, message: string): Promise<Clinic | null> {
  const pending = await getRoutingSession(phone);
  if (!pending) return null;

  const clinics = await getClinicsByIds(pending.candidate_clinic_ids);
  const byId = new Map(clinics.map((c) => [c.id, c]));
  const candidates = pending.candidate_clinic_ids.map((id) => byId.get(id)).filter(Boolean) as Clinic[];
  const choice = parseNumericChoice(message, candidates.length);
  let chosen: Clinic | null = choice ? candidates[choice - 1] : null;
  if (!chosen) {
    const t = message.toLowerCase();
    chosen = candidates.find((c) => t.includes(c.name.toLowerCase()) || t.includes(c.slug)) ?? null;
  }
  if (chosen) {
    await deleteRoutingSession(phone);
  }
  return chosen;
}

export async function saveRoutingSession(phone: string, candidateClinicIds: string[]): Promise<void> {
  return upsertRoutingSession(phone, candidateClinicIds);
}

export async function resolveClinic(to: string, from: string, body: string): Promise<ClinicResolution> {
  const byNumber = await getActiveClinicsByNumber(to);
  if (byNumber.length === 1) {
    return { status: 'resolved', clinic: byNumber[0] };
  }
  if (byNumber.length === 0) {
    return { status: 'none' };
  }

  // Número compartido:
  const fromPending = await popRoutingChoice(from, body);
  if (fromPending) return { status: 'resolved', clinic: fromPending };

  const numberIds = new Set(byNumber.map((c) => c.id));
  const byPatientAll = await getClinicsForPatientPhone(from);
  const byPatient = byPatientAll.filter((c) => numberIds.has(c.id));
  if (byPatient.length === 1) return { status: 'resolved', clinic: byPatient[0] };

  const slugMatch = body.match(SLUG_MENTION);
  if (slugMatch) {
    const bySlug = await getActiveClinicBySlug(slugMatch[1].toLowerCase());
    if (bySlug && numberIds.has(bySlug.id)) return { status: 'resolved', clinic: bySlug };
  }

  // El paciente siempre recibe respuesta: aunque haya mas de 5 candidatas
  // (numero compartido por muchas clinicas) se devuelven todas como
  // "ambiguous" en vez de "none". El webhook decide como preguntarle al
  // paciente segun el tamano de la lista (numerada si es corta, o pidiendo
  // el nombre de la clinica si son demasiadas para listar).
  const candidates =
    byPatient.length >= 2
      ? byPatient
      : byNumber.length >= 2
        ? byNumber
        : [];
  if (candidates.length >= 2) {
    return { status: 'ambiguous', candidates };
  }
  return { status: 'none' };
}
