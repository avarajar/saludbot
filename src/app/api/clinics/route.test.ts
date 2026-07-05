import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'insert', 'update', 'single', 'maybeSingle'];
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

import { GET, POST, PATCH } from './route';

const MEMBER_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440000';

function mockAuthenticated(userId = 'user-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}
function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

function makeGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/clinics');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/clinics', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/clinics', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/clinics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 400 when neither id nor slug is provided', async () => {
    const response = await GET(makeGetRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    const response = await GET(makeGetRequest({ id: MEMBER_CLINIC_ID }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the resolved clinic is not one of the user memberships', async () => {
    const clinicChain = createChain({ data: { id: MEMBER_CLINIC_ID, name: 'Clinica X' }, error: null });
    const membershipChain = createChain({ data: null, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') return clinicChain;
      if (table === 'clinic_users') return membershipChain;
      return createChain();
    });

    const response = await GET(makeGetRequest({ id: MEMBER_CLINIC_ID }));
    expect(response.status).toBe(403);
  });

  it('returns 404 when the clinic does not exist', async () => {
    mockSupabaseFrom.mockReturnValue(createChain({ data: null, error: { message: 'Not found' } }));
    const response = await GET(makeGetRequest({ id: MEMBER_CLINIC_ID }));
    expect(response.status).toBe(404);
  });

  it('returns 200 with the clinic when the user is a member (lookup by id)', async () => {
    const clinicData = { id: MEMBER_CLINIC_ID, name: 'Clinica X', slug: 'clinica-x' };
    const clinicChain = createChain({ data: clinicData, error: null });
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') return clinicChain;
      if (table === 'clinic_users') return membershipChain;
      return createChain();
    });

    const response = await GET(makeGetRequest({ id: MEMBER_CLINIC_ID }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clinic).toEqual(clinicData);
  });

  it('returns 200 with the clinic when the user is a member (lookup by slug)', async () => {
    const clinicData = { id: MEMBER_CLINIC_ID, name: 'Clinica X', slug: 'clinica-x' };
    const clinicChain = createChain({ data: clinicData, error: null });
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') return clinicChain;
      if (table === 'clinic_users') return membershipChain;
      return createChain();
    });

    const response = await GET(makeGetRequest({ slug: 'clinica-x' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clinic).toEqual(clinicData);
  });
});

describe('POST /api/clinics', () => {
  const validBody = {
    name: 'Clinica X',
    slug: 'clinica-x',
    phone: '+573001111111',
    address: 'Calle 1',
    city: 'Bogota',
    specialty: 'dental',
    whatsapp_number: '+573001111111',
    owner_name: 'Dr X',
    owner_email: 'dr@x.com',
    package_type: 'basico',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    const response = await POST(makePostRequest(validBody));
    expect(response.status).toBe(401);
  });

  it('returns 400 when the body is invalid', async () => {
    const response = await POST(makePostRequest({ name: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 201 when the clinic is created by an authenticated user', async () => {
    const clinicData = { id: 'clinic-new', ...validBody };
    const slugCheckChain = createChain({ data: null, error: null });
    const insertChain = createChain({ data: clinicData, error: null });
    let clinicsCallCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinics') {
        clinicsCallCount++;
        return clinicsCallCount === 1 ? slugCheckChain : insertChain;
      }
      return createChain();
    });

    const response = await POST(makePostRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.clinic).toEqual(clinicData);
  });
});

describe('PATCH /api/clinics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, name: 'Nuevo nombre' }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the clinic', async () => {
    mockSupabaseFrom.mockReturnValue(createChain({ data: null, error: null }));
    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, name: 'Nuevo nombre' }));
    expect(response.status).toBe(403);
  });

  it('returns 200 when the update succeeds for a member', async () => {
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const updateChain = createChain({ data: { id: MEMBER_CLINIC_ID, name: 'Nuevo nombre' }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return membershipChain;
      if (table === 'clinics') return updateChain;
      return createChain();
    });

    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, name: 'Nuevo nombre' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clinic.name).toBe('Nuevo nombre');
  });

  it('returns 400 for an unsupported country', async () => {
    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, country: 'XX' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when business_hours has open after close', async () => {
    const response = await PATCH(makePatchRequest({
      id: MEMBER_CLINIC_ID,
      business_hours: {
        monday: { open: '18:00', close: '08:00' }, tuesday: null, wednesday: null,
        thursday: null, friday: null, saturday: null, sunday: null,
      },
    }));
    expect(response.status).toBe(400);
  });

  it('derives currency, locale and timezone when country changes', async () => {
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const updateChain = createChain({ data: { id: MEMBER_CLINIC_ID, country: 'MX' }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return membershipChain;
      if (table === 'clinics') return updateChain;
      return createChain();
    });

    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, country: 'MX' }));
    expect(response.status).toBe(200);
    const updateSpy = updateChain['update'] as ReturnType<typeof vi.fn>;
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      country: 'MX', currency: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City',
    }));
  });

  it('keeps an explicit timezone over the country default', async () => {
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const updateChain = createChain({ data: { id: MEMBER_CLINIC_ID }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return membershipChain;
      if (table === 'clinics') return updateChain;
      return createChain();
    });

    const response = await PATCH(makePatchRequest({
      id: MEMBER_CLINIC_ID, country: 'MX', timezone: 'America/Bogota',
    }));
    expect(response.status).toBe(200);
    const updateSpy = updateChain['update'] as ReturnType<typeof vi.fn>;
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      country: 'MX', currency: 'MXN', locale: 'es-MX', timezone: 'America/Bogota',
    }));
  });

  it('accepts a specialty update', async () => {
    const membershipChain = createChain({ data: { clinic_id: MEMBER_CLINIC_ID }, error: null });
    const updateChain = createChain({ data: { id: MEMBER_CLINIC_ID, specialty: 'veterinary' }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clinic_users') return membershipChain;
      if (table === 'clinics') return updateChain;
      return createChain();
    });

    const response = await PATCH(makePatchRequest({ id: MEMBER_CLINIC_ID, specialty: 'veterinary' }));
    expect(response.status).toBe(200);
  });
});
