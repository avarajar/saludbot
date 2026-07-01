import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn();
const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  upsert: mockUpsert,
  delete: vi.fn(() => ({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })),
};
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: () => ({ from: vi.fn(() => chain) }),
}));

import { getActiveSession, setSession } from './sessions';

describe('sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna null cuando no hay sesion vigente', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getActiveSession('c1', 'p1')).toBeNull();
  });

  it('retorna la sesion cuando existe y no expiro', async () => {
    const session = { id: 's1', state: 'awaiting_slot', context: {} };
    mockMaybeSingle.mockResolvedValue({ data: session, error: null });
    expect(await getActiveSession('c1', 'p1')).toEqual(session);
  });

  it('setSession hace upsert con expires_at futuro', async () => {
    await setSession('c1', 'p1', 'awaiting_slot', { flow: 'schedule' });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_slot' }),
      { onConflict: 'clinic_id,patient_id' },
    );
  });
});
