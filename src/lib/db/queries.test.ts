import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Clinic } from '@/types';

let bookedRows: { date: string; start_time: string; end_time: string }[] = [];
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: bookedRows, error: null }),
    })),
  }),
}));

import { getAvailableSlots } from './queries';

const clinic = {
  id: 'c1',
  timezone: 'America/Bogota',
  business_hours: {
    monday: { open: '09:00', close: '12:00' },
    tuesday: { open: '09:00', close: '12:00' },
    wednesday: { open: '09:00', close: '12:00' },
    thursday: { open: '09:00', close: '12:00' },
    friday: { open: '09:00', close: '12:00' },
    saturday: null,
    sunday: null,
  },
} as unknown as Clinic;

describe('getAvailableSlots v2', () => {
  beforeEach(() => {
    bookedRows = [];
    // Lunes 2026-07-06, 6:00 AM Bogota (11:00 UTC)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T11:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('genera slots dentro del horario del dia con la duracion pedida', async () => {
    const slots = await getAvailableSlots(clinic, { date: '2026-07-06', durationMinutes: 60 });
    const monday = slots.filter((s) => s.date === '2026-07-06').map((s) => s.time);
    expect(monday).toEqual(['09:00', '10:00', '11:00']);
  });

  it('excluye slots que se solapan con citas existentes', async () => {
    bookedRows = [{ date: '2026-07-06', start_time: '09:30', end_time: '10:30' }];
    const slots = await getAvailableSlots(clinic, { date: '2026-07-06', durationMinutes: 60 });
    const monday = slots.filter((s) => s.date === '2026-07-06').map((s) => s.time);
    expect(monday).toEqual(['11:00']);
  });

  it('excluye horas pasadas del dia actual', async () => {
    vi.setSystemTime(new Date('2026-07-06T15:30:00Z')); // 10:30 AM Bogota
    const slots = await getAvailableSlots(clinic, { date: '2026-07-06', durationMinutes: 60 });
    const monday = slots.filter((s) => s.date === '2026-07-06').map((s) => s.time);
    expect(monday).toEqual(['11:00']);
  });

  it('salta dias cerrados y busca hacia adelante', async () => {
    const slots = await getAvailableSlots(clinic, { date: '2026-07-11', durationMinutes: 60 }); // sabado cerrado
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].date).toBe('2026-07-13'); // lunes siguiente
  });
});
