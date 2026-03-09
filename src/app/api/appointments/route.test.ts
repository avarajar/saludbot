import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase chainable query builder mock
// Every method returns the same chain object so optional filters work
function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'in', 'gte', 'single', 'insert', 'maybeSingle', 'or'];
  for (const m of methods) {
    (chain as Record<string, ReturnType<typeof vi.fn>>)[m] = vi.fn().mockReturnValue(chain);
  }
  chain.data = resolvedData.data;
  chain.error = resolvedData.error;
  // Allow await on the chain (thenable)
  (chain as Record<string, unknown>).then = function (resolve: (v: unknown) => void) {
    resolve({ data: resolvedData.data, error: resolvedData.error });
    return chain;
  };
  return chain;
}

const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

vi.mock('@/lib/calendar/google', () => ({
  createEvent: vi.fn().mockResolvedValue('google-event-123'),
}));

vi.mock('twilio', () => {
  const mockCreate = vi.fn().mockResolvedValue({ sid: 'SM123' });
  return {
    default: vi.fn(() => ({
      messages: { create: mockCreate },
    })),
  };
});

vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
vi.stubEnv('TWILIO_AUTH_TOKEN', 'auth_test');
vi.stubEnv('TWILIO_WHATSAPP_NUMBER', '+14155238886');

import { GET, POST } from './route';

function makeGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/appointments');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when clinic_id is missing', async () => {
    const request = makeGetRequest({});
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('clinic_id is required');
  });

  it('returns appointments for a given clinic_id', async () => {
    const appointmentsList = [
      {
        id: 'appt-001',
        clinic_id: 'clinic-001',
        date: '2026-03-10',
        start_time: '10:00',
        service: 'Limpieza',
        status: 'scheduled',
        patients: { name: 'Maria', phone: '+573009876543' },
      },
    ];

    const chain = createChain({ data: appointmentsList, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointments).toEqual(appointmentsList);
  });

  it('filters by date when provided', async () => {
    const chain = createChain({ data: [], error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001', date: '2026-03-10' });
    await GET(request);

    expect(chain.eq).toHaveBeenCalledWith('date', '2026-03-10');
  });

  it('filters by status when provided', async () => {
    const chain = createChain({ data: [], error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001', status: 'confirmed' });
    await GET(request);

    expect(chain.eq).toHaveBeenCalledWith('status', 'confirmed');
  });

  it('returns 500 when Supabase query fails', async () => {
    const chain = createChain({ data: null, error: { message: 'Connection refused' } });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Connection refused');
  });
});

describe('POST /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    clinic_id: '550e8400-e29b-41d4-a716-446655440000',
    patient_id: '550e8400-e29b-41d4-a716-446655440001',
    date: '2026-03-10',
    start_time: '10:00',
    duration_minutes: 30,
    service: 'Limpieza dental',
  };

  it('returns 400 when required fields are missing', async () => {
    const request = makePostRequest({ clinic_id: 'not-a-uuid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 when date format is invalid', async () => {
    const request = makePostRequest({
      ...validBody,
      date: 'March 10, 2026',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when start_time format is invalid', async () => {
    const request = makePostRequest({
      ...validBody,
      start_time: '10:00 AM',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when duration_minutes is out of range', async () => {
    const request = makePostRequest({
      ...validBody,
      duration_minutes: 5,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 404 when clinic is not found', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') {
        return createChain({ data: null, error: { message: 'Not found' } });
      }
      return createChain({
        data: { id: validBody.patient_id, name: 'Maria', phone: '+573009876543', email: null },
        error: null,
      });
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Clinic not found');
  });

  it('returns 404 when patient is not found', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') {
        return createChain({
          data: { id: validBody.clinic_id, name: 'Clinica Dental', google_calendar_id: 'cal-123' },
          error: null,
        });
      }
      return createChain({ data: null, error: { message: 'Not found' } });
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Patient not found');
  });

  it('returns 201 when appointment is created successfully', async () => {
    const clinicData = {
      id: validBody.clinic_id,
      name: 'Clinica Dental Sonrisa',
      google_calendar_id: 'cal-123',
      timezone: 'America/Bogota',
      phone: '+573001234567',
    };
    const patientData = {
      id: validBody.patient_id,
      name: 'Maria Lopez',
      phone: '+573009876543',
      email: null,
    };
    const appointmentData = {
      id: 'appt-new',
      ...validBody,
      end_time: '10:30',
      status: 'scheduled',
    };

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') {
        return createChain({ data: clinicData, error: null });
      }
      if (table === 'patients') {
        return createChain({ data: patientData, error: null });
      }
      // appointments
      return createChain({ data: appointmentData, error: null });
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.appointment).toBeDefined();
  });

  it('returns 500 when appointment insert fails', async () => {
    const clinicData = {
      id: validBody.clinic_id,
      name: 'Clinica Dental',
      google_calendar_id: 'cal-123',
      timezone: 'America/Bogota',
    };
    const patientData = {
      id: validBody.patient_id,
      name: 'Maria',
      phone: '+573009876543',
      email: null,
    };

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') {
        return createChain({ data: clinicData, error: null });
      }
      if (table === 'patients') {
        return createChain({ data: patientData, error: null });
      }
      // appointments - insert fails
      return createChain({
        data: null,
        error: { message: 'Unique constraint violation' },
      });
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to create appointment');
  });
});
