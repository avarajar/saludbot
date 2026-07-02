import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'limit', 'gte', 'lte', 'maybeSingle'];
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

import { GET } from './route';

const MEMBER_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440000';

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

function makeGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/conversations');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/conversations', () => {
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

  it('returns conversations for a given clinic_id when the user is a member', async () => {
    const conversationsList = [
      { id: 'c-001', clinic_id: MEMBER_CLINIC_ID, message: 'Hola', direction: 'inbound' },
    ];
    mockTables({ conversations: { data: conversationsList, error: null } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversations).toEqual(conversationsList);
  });

  it('returns 500 when Supabase query fails', async () => {
    mockTables({ conversations: { data: null, error: { message: 'Connection failed' } } });

    const request = makeGetRequest({ clinic_id: MEMBER_CLINIC_ID });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Connection failed');
  });
});
