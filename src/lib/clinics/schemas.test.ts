import { describe, it, expect } from 'vitest';
import { businessHoursSchema, countryCodeSchema } from './schemas';

const validHours = {
  monday: { open: '08:00', close: '18:00' }, tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' }, thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' }, saturday: null, sunday: null,
};

describe('businessHoursSchema', () => {
  it('acepta un horario valido con dias cerrados', () => {
    expect(businessHoursSchema.safeParse(validHours).success).toBe(true);
  });

  it('rechaza apertura igual o posterior al cierre', () => {
    const bad = { ...validHours, monday: { open: '18:00', close: '08:00' } };
    expect(businessHoursSchema.safeParse(bad).success).toBe(false);
    const equal = { ...validHours, monday: { open: '08:00', close: '08:00' } };
    expect(businessHoursSchema.safeParse(equal).success).toBe(false);
  });

  it('rechaza formato de hora invalido', () => {
    const bad = { ...validHours, monday: { open: '8am', close: '18:00' } };
    expect(businessHoursSchema.safeParse(bad).success).toBe(false);
  });
});

describe('countryCodeSchema', () => {
  it('acepta un codigo soportado', () => {
    expect(countryCodeSchema.safeParse('MX').success).toBe(true);
  });

  it('rechaza un codigo no soportado', () => {
    expect(countryCodeSchema.safeParse('XX').success).toBe(false);
    expect(countryCodeSchema.safeParse('col').success).toBe(false);
  });
});
