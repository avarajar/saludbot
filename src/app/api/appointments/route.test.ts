import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

// Supabase chainable query builder mock
// Every method returns the same chain object so optional filters work
function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'in', 'gte', 'single', 'insert', 'update', 'maybeSingle', 'or'];
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

import { GET, POST, PATCH } from './route';

const MEMBER_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440000';

function mockAuthenticated(userId = 'user-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}
function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

/**
 * Routes `.from(table)` calls to stable per-table chains so assertions can
 * inspect a specific table's chain (e.g. `.eq` calls). `clinic_users`
 * defaults to an authorized membership unless overridden.
 */
function mockTables(overrides: Record<string, { data: unknown; error: unknown }> = {}) {
  const tables: Record<string, { data: unknown; error: unknown }> = {
    clinic_users: { data: { clinic_id: MEMBER_CLINIC_ID }, error: null },
    ...overrides,
  };
  const chains: Record<string, ReturnType<typeof createChain>> = {};
  for (const [table, resolved] of Object.entries(tables)) {
    chains[table] = createChain(resolved);
  }
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (!chains[table]) chains[table] = createChain();
    return chains[table];
  });
  return chains;
}

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
    mockAuthenticated();
  });

  it('returns 400 when clinic_id is missing', async () => {
    const request = makeGetRequest({});
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('clinic_id is required');
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockTables();
    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the clinic', async () => {
    mockTables({ clinic_users: { data: null, error: null } });
    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('returns appointments for a given clinic_id', async () => {
    const appointmentsList = [
      {
        id: 'appt-001',
        clinic_id: MEMBER_CLINIC_ID,
        date: '2026-03-10',
        start_time: '10:00',
        service: 'Limpieza',
        status: 'scheduled',
        patients: { name: 'Maria', phone: '+573009876543' },
      },
    ];

    mockTables({ appointments: { data: appointmentsList, error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointments).toEqual(appointmentsList);
  });

  it('filters by date when provided', async () => {
    const chains = mockTables({ appointments: { data: [], error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID, date: '2026-03-10' });
    await GET(request);

    expect(chains.appointments.eq).toHaveBeenCalledWith('date', '2026-03-10');
  });

  it('filters by status when provided', async () => {
    const chains = mockTables({ appointments: { data: [], error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID, status: 'confirmed' });
    await GET(request);

    expect(chains.appointments.eq).toHaveBeenCalledWith('status', 'confirmed');
  });

  it('returns 500 when Supabase query fails', async () => {
    mockTables({ appointments: { data: null, error: { message: 'Connection refused' } } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Connection refused');
  });
});

describe('POST /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  const validBody = {
    clinic_id: MEMBER_CLINIC_ID,
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

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockTables();
    const request = makePostRequest(validBody);
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the clinic', async () => {
    mockTables({ clinic_users: { data: null, error: null } });
    const request = makePostRequest(validBody);
    const response = await POST(request);

    expect(response.status).toBe(403);
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
    mockTables({
      clinics: { data: null, error: { message: 'Not found' } },
      patients: {
        data: { id: validBody.patient_id, name: 'Maria', phone: '+573009876543', email: null },
        error: null,
      },
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Clinic not found');
  });

  it('returns 404 when patient is not found', async () => {
    mockTables({
      clinics: {
        data: { id: validBody.clinic_id, name: 'Clinica Dental', google_calendar_id: 'cal-123' },
        error: null,
      },
      patients: { data: null, error: { message: 'Not found' } },
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

    mockTables({
      clinics: { data: clinicData, error: null },
      patients: { data: patientData, error: null },
      appointments: { data: appointmentData, error: null },
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

    mockTables({
      clinics: { data: clinicData, error: null },
      patients: { data: patientData, error: null },
      appointments: { data: null, error: { message: 'Unique constraint violation' } },
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to create appointment');
  });
});

describe('PATCH /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  const APPT_ID = '550e8400-e29b-41d4-a716-446655440099';

  /**
   * PATCH resolves clinic_id from the existing row before checking
   * membership, so `appointments` is queried twice: once to fetch
   * `clinic_id`, once to apply the update.
   */
  function mockPatchAppointments(options: {
    existingClinicId?: string | null;
    membership?: { clinic_id: string } | null;
    updateResult?: { data: unknown; error: unknown };
  }) {
    const {
      existingClinicId = MEMBER_CLINIC_ID,
      membership = { clinic_id: MEMBER_CLINIC_ID },
      updateResult = { data: { id: APPT_ID, status: 'completed' }, error: null },
    } = options;

    const clinicUsersChain = createChain({ data: membership, error: null });
    const fetchChain = createChain(
      existingClinicId
        ? { data: { clinic_id: existingClinicId }, error: null }
        : { data: null, error: { message: 'not found' } },
    );
    const updateChain = createChain(updateResult);

    let appointmentsCallCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return clinicUsersChain;
      if (table === 'appointments') {
        appointmentsCallCount++;
        return appointmentsCallCount === 1 ? fetchChain : updateChain;
      }
      return createChain();
    });

    return { clinicUsersChain, fetchChain, updateChain };
  }

  it('actualiza el estado de la cita', async () => {
    mockPatchAppointments({});

    const req = new NextRequest('https://example.com/api/appointments', {
      method: 'PATCH',
      body: JSON.stringify({ id: APPT_ID, status: 'completed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appointment.status).toBe('completed');
  });

  it('rechaza estados invalidos', async () => {
    const req = new NextRequest('https://example.com/api/appointments', {
      method: 'PATCH',
      body: JSON.stringify({ id: APPT_ID, status: 'volando' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 401 sin autenticacion', async () => {
    mockUnauthenticated();
    mockPatchAppointments({});

    const req = new NextRequest('https://example.com/api/appointments', {
      method: 'PATCH',
      body: JSON.stringify({ id: APPT_ID, status: 'completed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 403 cuando el usuario no pertenece a la clinica de la cita', async () => {
    mockPatchAppointments({ membership: null });

    const req = new NextRequest('https://example.com/api/appointments', {
      method: 'PATCH',
      body: JSON.stringify({ id: APPT_ID, status: 'completed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it('devuelve 404 cuando la cita no existe', async () => {
    mockPatchAppointments({ existingClinicId: null });

    const req = new NextRequest('https://example.com/api/appointments', {
      method: 'PATCH',
      body: JSON.stringify({ id: APPT_ID, status: 'completed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });
});
