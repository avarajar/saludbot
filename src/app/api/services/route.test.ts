import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'maybeSingle'];
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

import { GET, POST, PATCH, DELETE } from './route';

const MEMBER_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440000';
const SERVICE_ID = '550e8400-e29b-41d4-a716-446655440099';

function mockAuthenticated(userId = 'user-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}
function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

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

/**
 * PATCH/DELETE resolve clinic_id from the existing row before checking
 * membership, so `clinic_services` is queried twice: once to fetch
 * `clinic_id`, once to apply the mutation.
 */
function mockMutateService(options: {
  existingClinicId?: string | null;
  membership?: { clinic_id: string } | null;
  mutateResult?: { data: unknown; error: unknown };
}) {
  const {
    existingClinicId = MEMBER_CLINIC_ID,
    membership = { clinic_id: MEMBER_CLINIC_ID },
    mutateResult = { data: { id: SERVICE_ID }, error: null },
  } = options;

  const clinicUsersChain = createChain({ data: membership, error: null });
  const fetchChain = createChain(
    existingClinicId
      ? { data: { clinic_id: existingClinicId }, error: null }
      : { data: null, error: { message: 'not found' } },
  );
  const mutateChain = createChain(mutateResult);

  let servicesCallCount = 0;
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'clinic_users') return clinicUsersChain;
    if (table === 'clinic_services') {
      servicesCallCount++;
      return servicesCallCount === 1 ? fetchChain : mutateChain;
    }
    return createChain();
  });

  return { clinicUsersChain, fetchChain, mutateChain };
}

function makeGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/services');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/services', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/services', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/services');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url, { method: 'DELETE' });
}

describe('GET /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 400 when clinic_id is missing', async () => {
    const response = await GET(makeGetRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockTables();
    const response = await GET(makeGetRequest({ clinic_id: MEMBER_CLINIC_ID }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the clinic', async () => {
    mockTables({ clinic_users: { data: null, error: null } });
    const response = await GET(makeGetRequest({ clinic_id: MEMBER_CLINIC_ID }));
    expect(response.status).toBe(403);
  });

  it('returns services for a given clinic_id when the user is a member', async () => {
    const servicesList = [{ id: 's-001', clinic_id: MEMBER_CLINIC_ID, name: 'Limpieza' }];
    mockTables({ clinic_services: { data: servicesList, error: null } });

    const response = await GET(makeGetRequest({ clinic_id: MEMBER_CLINIC_ID }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.services).toEqual(servicesList);
  });
});

describe('POST /api/services', () => {
  const validBody = {
    clinic_id: MEMBER_CLINIC_ID,
    name: 'Limpieza dental',
    duration_minutes: 60,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockTables();
    const response = await POST(makePostRequest(validBody));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the clinic', async () => {
    mockTables({ clinic_users: { data: null, error: null } });
    const response = await POST(makePostRequest(validBody));
    expect(response.status).toBe(403);
  });

  it('returns 201 when the service is created successfully', async () => {
    const newService = { id: 'service-new', ...validBody, active: true };
    mockTables({ clinic_services: { data: newService, error: null } });

    const response = await POST(makePostRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.service).toEqual(newService);
  });
});

describe('PATCH /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockMutateService({});
    const response = await PATCH(makePatchRequest({ id: SERVICE_ID, name: 'Nuevo nombre' }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the service does not exist', async () => {
    mockMutateService({ existingClinicId: null });
    const response = await PATCH(makePatchRequest({ id: SERVICE_ID, name: 'Nuevo nombre' }));
    expect(response.status).toBe(404);
  });

  it('returns 403 when the user is not a member of the owning clinic', async () => {
    mockMutateService({ membership: null });
    const response = await PATCH(makePatchRequest({ id: SERVICE_ID, name: 'Nuevo nombre' }));
    expect(response.status).toBe(403);
  });

  it('returns 200 when the update succeeds for a member', async () => {
    mockMutateService({ mutateResult: { data: { id: SERVICE_ID, name: 'Nuevo nombre' }, error: null } });
    const response = await PATCH(makePatchRequest({ id: SERVICE_ID, name: 'Nuevo nombre' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.service.name).toBe('Nuevo nombre');
  });
});

describe('DELETE /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it('returns 400 when id is missing', async () => {
    const response = await DELETE(makeDeleteRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated();
    mockMutateService({});
    const response = await DELETE(makeDeleteRequest({ id: SERVICE_ID }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the user is not a member of the owning clinic', async () => {
    mockMutateService({ membership: null });
    const response = await DELETE(makeDeleteRequest({ id: SERVICE_ID }));
    expect(response.status).toBe(403);
  });

  it('returns 200 when the delete succeeds for a member', async () => {
    mockMutateService({ mutateResult: { data: null, error: null } });
    const response = await DELETE(makeDeleteRequest({ id: SERVICE_ID }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
