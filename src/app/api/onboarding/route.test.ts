import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

type TableConfig = {
  insertError?: { message: string };
  maybeSingle?: { data: unknown; error: unknown };
};

const tableConfig: Record<string, TableConfig> = {};
const insertedRows: Record<string, unknown[]> = {};
const deletedIds: Record<string, unknown[]> = {};

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: () => ({
    from: vi.fn((table: string) => {
      const cfg = tableConfig[table] ?? {};
      return {
        insert: vi.fn((row: unknown) => {
          insertedRows[table] = [...(insertedRows[table] ?? []), ...(Array.isArray(row) ? row : [row])];
          const error = cfg.insertError ?? null;
          return {
            error,
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(
                error
                  ? { data: null, error }
                  : { data: { id: 'clinic-new', slug: 'clinica-x', ...(row as object) }, error: null }
              ),
            }),
          };
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(cfg.maybeSingle ?? { data: null, error: null }),
        delete: vi.fn(() => ({
          eq: vi.fn((_col: string, val: unknown) => {
            deletedIds[table] = [...(deletedIds[table] ?? []), val];
            return Promise.resolve({ error: null });
          }),
        })),
      };
    }),
  }),
}));

import { POST } from './route';

const validBody = {
  name: 'Clinica X', phone: '+573001111111', address: 'Calle 1', city: 'Bogota',
  country: 'CO',
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

function rawRequest(body: string): NextRequest {
  return new NextRequest('https://example.com/api/onboarding', {
    method: 'POST', body,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(insertedRows)) delete insertedRows[k];
    for (const k of Object.keys(deletedIds)) delete deletedIds[k];
    for (const k of Object.keys(tableConfig)) delete tableConfig[k];
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

  it('rechaza JSON malformado con 400', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(rawRequest('{not-json'));
    expect(res.status).toBe(400);
  });

  it('rechaza con 409 si el usuario ya tiene una clinica', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    tableConfig['clinic_users'] = { maybeSingle: { data: { clinic_id: 'clinic-existing' }, error: null } };
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('Ya tiene una clinica registrada');
    expect(insertedRows['clinics']).toBeUndefined();
  });

  it('limpia la clinica creada si falla la insercion de clinic_users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    tableConfig['clinic_users'] = { insertError: { message: 'insert failed' } };
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('insert failed');
    expect(deletedIds['clinics']).toEqual(['clinic-new']);
  });

  it('rechaza un pais no soportado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(jsonRequest({ ...validBody, country: 'XX' }));
    expect(res.status).toBe(400);
  });

  it('rechaza si falta el pais', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const { country: _country, ...noCountry } = validBody;
    const res = await POST(jsonRequest(noCountry));
    expect(res.status).toBe(400);
  });

  it('deriva moneda, locale y timezone del pais en el servidor', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(jsonRequest({ ...validBody, country: 'MX' }));
    expect(res.status).toBe(201);
    expect(insertedRows['clinics']?.[0]).toMatchObject({
      country: 'MX', currency: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City',
    });
  });

  it('rechaza horario con apertura posterior al cierre', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'dr@x.com' } } });
    const res = await POST(jsonRequest({
      ...validBody,
      business_hours: { ...validBody.business_hours, monday: { open: '18:00', close: '08:00' } },
    }));
    expect(res.status).toBe(400);
  });
});
