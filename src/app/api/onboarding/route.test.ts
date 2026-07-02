import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

const insertedRows: Record<string, unknown[]> = {};
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: () => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn((row: unknown) => {
        insertedRows[table] = [...(insertedRows[table] ?? []), ...(Array.isArray(row) ? row : [row])];
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'clinic-new', slug: 'clinica-x', ...(row as object) },
              error: null,
            }),
          }),
        };
      }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

import { POST } from './route';

const validBody = {
  name: 'Clinica X', phone: '+573001111111', address: 'Calle 1', city: 'Bogota',
  specialty: 'dental',
  business_hours: {
    monday: { open: '08:00', close: '18:00' }, tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' }, thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' }, saturday: null, sunday: null,
  },
  services: [{ name: 'Limpieza dental', duration_minutes: 60, price: 90000 }],
};

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('https://example.com/api/onboarding', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(insertedRows)) delete insertedRows[k];
  });

  it('rechaza sin autenticacion', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('crea clinica, membresia y servicios', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(201);
    expect(insertedRows['clinics']?.[0]).toMatchObject({ name: 'Clinica X', owner_email: 'dr@x.com', active: true });
    expect(insertedRows['clinic_users']?.[0]).toMatchObject({ user_id: 'u1', role: 'owner' });
    expect(insertedRows['clinic_services']).toHaveLength(1);
    const json = await res.json();
    expect(json.whatsapp_link).toContain('wa.me');
  });

  it('valida el body con zod', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(jsonRequest({ name: '' }));
    expect(res.status).toBe(400);
  });
});
