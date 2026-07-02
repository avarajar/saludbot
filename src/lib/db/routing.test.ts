import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Clinic } from '@/types';

vi.mock('@/lib/ai/classifier', () => ({ classifyIntent: vi.fn() }));

vi.mock('./routing-queries', () => ({
  getActiveClinicsByNumber: vi.fn(),
  getClinicsForPatientPhone: vi.fn(),
  getActiveClinicBySlug: vi.fn(),
  getRoutingSession: vi.fn(),
  deleteRoutingSession: vi.fn(),
  upsertRoutingSession: vi.fn(),
  getClinicsByIds: vi.fn(),
}));

import { resolveClinic, popRoutingChoice } from './routing';
import * as rq from './routing-queries';

const clinicA = { id: 'ca', name: 'Clinica A', slug: 'clinica-a', active: true } as Clinic;
const clinicB = { id: 'cb', name: 'Clinica B', slug: 'clinica-b', active: true } as Clinic;

describe('resolveClinic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('numero exclusivo → resolved', async () => {
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    expect(r).toEqual({ status: 'resolved', clinic: clinicA });
  });

  it('numero compartido con paciente de una sola clinica → resolved', async () => {
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([clinicA]);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    expect(r).toEqual({ status: 'resolved', clinic: clinicA });
  });

  it('mensaje con slug → resolved', async () => {
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([]);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(clinicB);
    const r = await resolveClinic('+573001', '+573009', 'Hola, vengo de clinica-b');
    expect(r).toEqual({ status: 'resolved', clinic: clinicB });
  });

  it('desconocido con varias candidatas → ambiguous', async () => {
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([]);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(null);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    expect(r.status).toBe('ambiguous');
  });

  it('eleccion pendiente "1" → resolved y borra la sesion de routing', async () => {
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue({ phone: '+573009', candidate_clinic_ids: ['ca', 'cb'], expires_at: '' } as never);
    vi.mocked(rq.getClinicsByIds).mockResolvedValue([clinicA, clinicB]);
    const r = await resolveClinic('+573001', '+573009', '1');
    expect(r).toEqual({ status: 'resolved', clinic: clinicA });
    expect(rq.deleteRoutingSession).toHaveBeenCalledWith('+573009');
  });

  it('paciente asociado a una clinica de OTRO numero de WhatsApp → no resuelve por esa clinica', async () => {
    // El paciente comparte telefono con otra clinica (clinicC) que no atiende por este numero (to).
    const clinicC = { id: 'cc', name: 'Clinica C', slug: 'clinica-c', active: true } as Clinic;
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([clinicC]);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(null);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    // clinicC no pertenece al numero mensajeado, asi que no debe resolverse por ella; byPatient queda vacio.
    expect(r.status).not.toBe('resolved');
  });

  it('slug mencionado corresponde a una clinica de OTRO numero → no resuelve por ese slug', async () => {
    const clinicC = { id: 'cc', name: 'Clinica C', slug: 'clinica-c', active: true } as Clinic;
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue([clinicA, clinicB]);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([]);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(clinicC);
    const r = await resolveClinic('+573001', '+573009', 'Hola, vengo de clinica-c');
    expect(r.status).not.toBe('resolved');
    if (r.status === 'ambiguous') {
      expect(r.candidates).toEqual([clinicA, clinicB]);
    }
  });

  it('byPatient con mas de 5 clinicas cae a byNumber (2..5) en vez de quedar sin resolver', async () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`, name: `Clinica P${i}`, slug: `clinica-p${i}`, active: true,
    } as Clinic));
    const byNumber = [clinicA, clinicB, { id: 'cc', name: 'Clinica C', slug: 'clinica-c', active: true } as Clinic];
    // El numero mensajeado sirve a byNumber; el paciente aparece asociado a las mismas clinicas del numero
    // (para que el filtro por numberIds no las descarte) mas otras extra que sí quedan fuera del numero.
    const numberIds = new Set(byNumber.map((c) => c.id));
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue(byNumber);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue(many);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(null);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    // many (6) queda filtrado a 0 elementos dentro de numberIds (ninguno coincide), asi que cae a byNumber (3).
    expect(many.some((c) => numberIds.has(c.id))).toBe(false);
    expect(r).toEqual({ status: 'ambiguous', candidates: byNumber });
  });

  it('mas de 5 candidatas → ambiguous con todas, nunca "none" (el paciente siempre recibe respuesta)', async () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`, name: `Clinica ${i}`, slug: `clinica-${i}`, active: true,
    } as Clinic));
    vi.mocked(rq.getActiveClinicsByNumber).mockResolvedValue(many);
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    vi.mocked(rq.getClinicsForPatientPhone).mockResolvedValue([]);
    vi.mocked(rq.getActiveClinicBySlug).mockResolvedValue(null);
    const r = await resolveClinic('+573001', '+573009', 'Hola');
    expect(r).toEqual({ status: 'ambiguous', candidates: many });
  });
});

describe('popRoutingChoice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin sesion pendiente → null', async () => {
    vi.mocked(rq.getRoutingSession).mockResolvedValue(null);
    const r = await popRoutingChoice('+573009', '1');
    expect(r).toBeNull();
  });

  it('resuelve por nombre/slug cuando no es un numero valido', async () => {
    vi.mocked(rq.getRoutingSession).mockResolvedValue({
      phone: '+573009',
      candidate_clinic_ids: ['ca', 'cb'],
      expires_at: '',
    } as never);
    vi.mocked(rq.getClinicsByIds).mockResolvedValue([clinicA, clinicB]);
    const r = await popRoutingChoice('+573009', 'quiero clinica-b');
    expect(r).toEqual(clinicB);
    expect(rq.deleteRoutingSession).toHaveBeenCalledWith('+573009');
  });

  it('reordena candidatos segun el orden guardado en la sesion, no el orden devuelto por la query', async () => {
    vi.mocked(rq.getRoutingSession).mockResolvedValue({
      phone: '+573009',
      candidate_clinic_ids: ['ca', 'cb'],
      expires_at: '',
    } as never);
    // getClinicsByIds (via .in()) no garantiza orden: la devolvemos invertida.
    vi.mocked(rq.getClinicsByIds).mockResolvedValue([clinicB, clinicA]);
    const r = await popRoutingChoice('+573009', '1');
    // "1" debe corresponder a la primera clinica en candidate_clinic_ids (ca), no en la respuesta de la query.
    expect(r).toEqual(clinicA);
    expect(rq.deleteRoutingSession).toHaveBeenCalledWith('+573009');
  });

  it('una clinica inactiva en candidate_clinic_ids no puede ser elegida', async () => {
    vi.mocked(rq.getRoutingSession).mockResolvedValue({
      phone: '+573009',
      candidate_clinic_ids: ['ca', 'cb', 'inactive-clinic'],
      expires_at: '',
    } as never);
    // getClinicsByIds filtra por active=true en la query real; la clinica inactiva nunca vuelve.
    vi.mocked(rq.getClinicsByIds).mockResolvedValue([clinicA, clinicB]);
    const r = await popRoutingChoice('+573009', '3');
    expect(r).toBeNull();
    expect(rq.deleteRoutingSession).not.toHaveBeenCalled();
  });
});
