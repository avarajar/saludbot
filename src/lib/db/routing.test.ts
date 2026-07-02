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
});
