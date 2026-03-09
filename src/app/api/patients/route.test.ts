import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
  });

  it('returns 400 when clinic_id is missing', async () => {
    const request = makeGetRequest({});
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('clinic_id is required');
  });

  it('returns patients for a given clinic_id', async () => {
    const patientsList = [
      { id: 'p-001', name: 'Maria Lopez', phone: '+573009876543' },
      { id: 'p-002', name: 'Carlos Garcia', phone: '+573001112233' },
    ];

    const chain = createChain({ data: patientsList, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patients).toEqual(patientsList);
    expect(chain.eq).toHaveBeenCalledWith('clinic_id', 'clinic-001');
  });

  it('applies search filter when provided', async () => {
    const chain = createChain({ data: [], error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001', search: 'Maria' });
    await GET(request);

    expect(chain.or).toHaveBeenCalledWith(
      expect.stringContaining('Maria'),
    );
  });

  it('returns 500 when Supabase query fails', async () => {
    const chain = createChain({
      data: null,
      error: { message: 'Connection failed' },
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Connection failed');
  });

  it('returns empty array when no patients match', async () => {
    const chain = createChain({ data: [], error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const request = makeGetRequest({ clinic_id: 'clinic-001' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patients).toEqual([]);
  });
});

describe('POST /api/patients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    clinic_id: '550e8400-e29b-41d4-a716-446655440000',
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
    const clinicChain = createChain({ data: null, error: { message: 'Not found' } });
    mockSupabaseFrom.mockReturnValue(clinicChain);

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Clinic not found');
  });

  it('returns 409 when a patient with the same phone already exists', async () => {
    let fromCallIndex = 0;
    mockSupabaseFrom.mockImplementation(() => {
      fromCallIndex++;
      if (fromCallIndex === 1) {
        // clinics lookup
        return createChain({ data: { id: validBody.clinic_id }, error: null });
      }
      // duplicate check - patient exists
      return createChain({ data: { id: 'existing-patient-id' }, error: null });
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

    let fromCallIndex = 0;
    mockSupabaseFrom.mockImplementation(() => {
      fromCallIndex++;
      if (fromCallIndex === 1) {
        return createChain({ data: { id: validBody.clinic_id }, error: null });
      }
      if (fromCallIndex === 2) {
        // duplicate check - no match
        return createChain({ data: null, error: null });
      }
      // insert
      return createChain({ data: newPatient, error: null });
    });

    const request = makePostRequest(validBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.patient).toEqual(newPatient);
  });

  it('returns 500 when patient insert fails', async () => {
    let fromCallIndex = 0;
    mockSupabaseFrom.mockImplementation(() => {
      fromCallIndex++;
      if (fromCallIndex === 1) {
        return createChain({ data: { id: validBody.clinic_id }, error: null });
      }
      if (fromCallIndex === 2) {
        return createChain({ data: null, error: null });
      }
      // insert fails
      return createChain({ data: null, error: { message: 'Insert failed' } });
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

    let fromCallIndex = 0;
    mockSupabaseFrom.mockImplementation(() => {
      fromCallIndex++;
      if (fromCallIndex === 1) {
        return createChain({ data: { id: validBody.clinic_id }, error: null });
      }
      if (fromCallIndex === 2) {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: { id: 'patient-new', ...bodyWithOptionals }, error: null });
    });

    const request = makePostRequest(bodyWithOptionals);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.patient.email).toBe('maria@example.com');
    expect(data.patient.document_id).toBe('1234567890');
  });
});
