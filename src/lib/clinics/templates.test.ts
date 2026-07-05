import { describe, it, expect } from 'vitest';
import { SPECIALTIES, SERVICE_TEMPLATES, DEFAULT_BUSINESS_HOURS } from './templates';

describe('clinic templates', () => {
  it('cada especialidad tiene al menos un servicio de plantilla', () => {
    for (const sp of SPECIALTIES) {
      expect(SERVICE_TEMPLATES[sp.value].length).toBeGreaterThan(0);
    }
  });

  it('el horario por defecto abre lunes a sabado y cierra domingo', () => {
    expect(DEFAULT_BUSINESS_HOURS.monday).toEqual({ open: '08:00', close: '18:00' });
    expect(DEFAULT_BUSINESS_HOURS.saturday).toEqual({ open: '08:00', close: '13:00' });
    expect(DEFAULT_BUSINESS_HOURS.sunday).toBeNull();
  });
});
