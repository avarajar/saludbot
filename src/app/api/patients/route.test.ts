import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

// Supabase chainable query builder mock
function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'or', 'order', 'single', 'maybeSingle', 'insert'];
  for (const m of methods) {
    (chain as Record<string, ReturnType<typeof vi.fn>>)[m] = vi.fn().mockReturnValue(chain);
  }
  chain.data = resolvedData.data;
  chain.error = resolvedData.error;
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

import { GET, POST } from './route';

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
  const url = new URL('http://localhost:3000/api/patients');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/patients', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/patients', () => {
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

  it('returns patients for a given clinic_id', async () => {
    const patientsList = [
      { id: 'p-001', name: 'Maria Lopez', phone: '+573009876543' },
      { id: 'p-002', name: 'Carlos Garcia', phone: '+573001112233' },
    ];

    const chains = mockTables({ patients: { data: patientsList, error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patients).toEqual(patientsList);
    expect(chains.patients.eq).toHaveBeenCalledWith('clinic_id', MEMBER_CLINIC_ID);
  });

  it('applies search filter when provided', async () => {
    const chains = mockTables({ patients: { data: [], error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID, search: 'Maria' });
    await GET(request);

    expect(chains.patients.or).toHaveBeenCalledWith(
      expect.stringContaining('Maria'),
    );
  });

  it('returns 500 when Supabase query fails', async () => {
    mockTables({ patients: { data: null, error: { message: 'Connection failed' } } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Connection failed');
  });

  it('returns empty array when no patients match', async () => {
    mockTables({ patients: { data: [], error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patients).toEqual([]);
  });
});

describe('POST /api/patients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  const validBody = {
    clinic_id: MEMBER_CLINIC_ID,
    name: 'Maria Lopez',
    phone: '+573009876543',
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

  it('returns 400 when name is empty', async () => {
    const request = makePostRequest({ ...validBody, name: '' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when phone is too short', async () => {
    const request = makePostRequest({ ...validBody, phone: '123' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const request = makePostRequest({ ...validBody, email: 'not-an-email' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 404 when clinic does not exist', async () => {
    mockTables({ clinics: { data: null, error: { message: 'Not found' } } });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Clinic not found');
  });

  it('returns 409 when a patient with the same phone already exists', async () => {
    mockTables({
      clinics: { data: { id: validBody.clinic_id }, error: null },
      patients: { data: { id: 'existing-patient-id' }, error: null },
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already exists');
  });

  it('returns 201 when patient is created successfully', async () => {
    const newPatient = {
      id: 'patient-new',
      clinic_id: validBody.clinic_id,
      name: 'Maria Lopez',
      phone: '+573009876543',
      email: null,
      document_id: null,
      notes: null,
    };

    let patientsCallCount = 0;
    const clinicUsersChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const clinicsChain = createChain({ data: { id: validBody.clinic_id }, error: null });
    const duplicateCheckChain = createChain({ data: null, error: null });
    const insertChain = createChain({ data: newPatient, error: null });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return clinicUsersChain;
      if (table === 'clinics') return clinicsChain;
      if (table === 'patients') {
        patientsCallCount++;
        return patientsCallCount === 1 ? duplicateCheckChain : insertChain;
      }
      return createChain();
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.patient).toEqual(newPatient);
  });

  it('returns 500 when patient insert fails', async () => {
    let patientsCallCount = 0;
    const clinicUsersChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const clinicsChain = createChain({ data: { id: validBody.clinic_id }, error: null });
    const duplicateCheckChain = createChain({ data: null, error: null });
    const insertChain = createChain({ data: null, error: { message: 'Insert failed' } });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return clinicUsersChain;
      if (table === 'clinics') return clinicsChain;
      if (table === 'patients') {
        patientsCallCount++;
        return patientsCallCount === 1 ? duplicateCheckChain : insertChain;
      }
      return createChain();
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to create patient');
  });

  it('accepts optional fields like email and document_id', async () => {
    const bodyWithOptionals = {
      ...validBody,
      email: 'maria@example.com',
      document_id: '1234567890',
      notes: 'Paciente nueva',
    };

    let patientsCallCount = 0;
    const clinicUsersChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const clinicsChain = createChain({ data: { id: validBody.clinic_id }, error: null });
    const duplicateCheckChain = createChain({ data: null, error: null });
    const insertChain = createChain({ data: { id: 'patient-new', ...bodyWithOptionals }, error: null });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return clinicUsersChain;
      if (table === 'clinics') return clinicsChain;
      if (table === 'patients') {
        patientsCallCount++;
        return patientsCallCount === 1 ? duplicateCheckChain : insertChain;
      }
      return createChain();
    });

    const request = makePostRequest(bodyWithOptionals);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.patient.email).toBe('maria@example.com');
    expect(data.patient.document_id).toBe('1234567890');
  });
});
